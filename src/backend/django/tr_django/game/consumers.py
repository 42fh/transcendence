import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from .agame.AGameManager import AGameManager
from .gamecoordinator.GameCoordinator import GameCoordinator as GC
from .gamecoordinator.GameCoordinator import RedisLock 
import time
import msgpack
import redis.asyncio as redis
import logging
from django.core.serializers.json import DjangoJSONEncoder
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async

logger = logging.getLogger(__name__)


class PongConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.last_move_time = 0
        self.role = None
        # Healthcheck RFC 6455
        self.ping_interval = 5  # seconds
        self.ping_timeout = 5  # seconds
        self.last_pong = time.time()
        self.ping_task = None
        self.check_connection_task = None

    async def connect(self):
        print("hallo world")

        self.game_id = self.scope["url_route"]["kwargs"]["game_id"]
        self.user = self.scope["user"]
        self.player_id = str(self.user.id)
        # init channels
        self.game_group = f"game_{self.game_id}"
        channel_key = f"asgi:group:{self.game_group}"
        await self.channel_layer.group_add(self.game_group, self.channel_name)
        # get gametype
        async with await GC.get_redis(GC.REDIS_GAME_URL) as redis_game:
            game_type = await redis_game.get(f"game_type:{self.game_id}")
        try:
            # init game instance
            self.game_manager = await AGameManager.get_instance(self.game_id, game_type)
            
            async with RedisLock(redis_game, f"{self.game_id}_player_situation"):
                # Check Redis for existing players
                player_count = await self.game_manager.redis_conn.scard(
                    self.game_manager.players_key
                )
                print("a")
                player_index = await self.game_manager.add_player(self.player_id)
                print("b")
                if not player_index:
                    await self.close(code=1011)
                    logger.error("get instance: Error in add player")
                    return
                if player_count == 0:
                    asyncio.create_task(self.game_manager.start_game())
            #
            self.role = player_index["role"]
            # load player settings
            if self.role == "player":
                self.current_pos = player_index.get("position")
                self.player_index = player_index.get("index")
                self.paddle_index = player_index.get("paddle_index")
                self.player_values = player_index.get("settings")
                logger.info(
                    f"Player[{self.user.username}  /{self.player_id}] connected to game[{self.game_id}] as player: {self.paddle_index +1} index {self.player_index}"
                )
            else:
                logger.info(
                    f"Player[{self.player_id}] connected to game[{self.game_id}] as spectator"
                )
            await self.accept()
            # Healthcheck RFC 6455 -Start ping/pong mechanism after accepting connection
            # self.ping_task = asyncio.create_task(self.send_ping())
            # self.check_connection_task = asyncio.create_task(self.check_connection())
            if self.role == "player":
                await self.channel_layer.group_send(
                    self.game_group,
                    {
                        "type": "player_joined",
                        "player_id": self.player_id,
                        "player_name": self.user.username,    
                        "player_index": self.player_index,
                        "current_players": player_count + 1,
                    },
                )

            # Send initial game state
            try:

                player_names = await self.get_connected_players()
                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "initial_state",
                            "game_state": self.game_manager.settings["state"],
                            "role": self.role,
                            "player_index": (self.player_index if self.role == "player" else None),
                            "player_names" : player_names, 
                            "message": player_index.get("message", "no message given"),
                            "player_values": self.player_values,
                            "game_setup": {
                                "type": game_type,
                                "vertices": self.game_manager.vertices,
                            },
                        }
                    )
                )
            except Exception as e:
                logger.error(f"Failed to load initial game state: {str(e)}")
                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "error",
                            "message": f"Failed to load initial game state: {str(e)}",
                        }
                    )
                )

        except Exception as e:
            logger.error(f"Error in connect: {e}")
            await self.close(code=1011)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.game_group, self.channel_name)
        if self.ping_task:
            self.ping_task.cancel()
        if self.check_connection_task:
            self.check_connection_task.cancel()
        if self.role == "player":
            await self.game_manager.remove_player(self.player_id)
            logger.info(
                f"Player[{self.player_id}] disconnected from game[{self.game_id}]"
            )

    # Healthcheck RFC 6455
    async def send_ping(self):
        """Periodically send ping messages"""
        while True:
            try:
                await self.send(text_data="ping")
                await asyncio.sleep(self.ping_interval)
            except Exception as e:
                logger.error(f"Error sending ping: {str(e)}")
                break

    async def check_connection(self):
        """Check if we're receiving pongs within timeout period"""
        while True:
            try:
                await asyncio.sleep(self.ping_timeout)
                if (
                    time.time() - self.last_pong
                    > self.ping_interval + self.ping_timeout
                ):
                    logger.warning(f"Client {self.player_id} connection timed out")
                    await self.disconnect(code=1006)  # Properly disconnect
                    await self.close(code=1006)  # Connection closed abnormally
                    break
            except Exception as e:
                logger.error(f"Error checking connection: {str(e)}")
                await self.disconnect(code=1006)  # Properly disconnect
                await self.close(code=1006)  # Connection closed abnormally
                break

    async def receive(self, text_data):
        try:
            if text_data == "pong":
                self.last_pong = time.time()
                # logger.info("POOOOOOONG")
                return
            data = json.loads(text_data)
            action = data.get("action")

            if self.role == "spectator":
                await self.send(
                    text_data=json.dumps(
                        {"type": "error", "message": "Your are only allowed to watch"}
                    )
                )
                return

            # here we could decide what the client can set up during waiting
            if not await self.game_manager.running:
                await self.send(
                    text_data=json.dumps(
                        {"type": "error", "message": "Game is not running"}
                    )
                )
                return

            if action == "move_paddle":
                direction = data.get("direction")
                user_id = data.get("user_id")
                await self.handle_paddle_move(direction, user_id)

        except json.JSONDecodeError:
            logger.error(f"Invalid JSON received: {text_data}")
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")

    async def handle_paddle_move(self, direction, user_id):
        if user_id != self.player_id:  # this could go into a cheatlog
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "error",
                        "message": "Your are not allowed to move this player",
                    }
                )
            )
            return

        current_time = time.time()

        if current_time - self.last_move_time < self.player_values["move_cooldown"]:
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "message": "You are to fast"}
                )
            )
            return  # could send back feedback that is too fast or and log it in cheatlog

        if await self.is_valid_paddle_move(direction):
            await self.update_paddle_position(direction)
            self.last_move_time = current_time

    async def is_valid_paddle_move(self, direction):
        # check if directions are right
        if direction not in ["left", "right"]:
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "message": "wrong move key [left , right]"}
                )
            )
            return False

        # check if paddle already at max or min
        if (
            direction == "left"
            and self.current_pos < self.player_values["paddle_length"] / 2
        ):
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "message": "Your are reached beginning of paddle"}
                )
            )
            return False
        if (
            direction == "right"
            and self.current_pos > 1 - self.player_values["paddle_length"] / 2
        ):
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "message": "Your are reached end of paddle"}
                )
            )
            return False

        return True

    async def update_paddle_position(self, direction):
        move_amount = (
            self.player_values["move_speed"] * self.player_values["move_speed_boost"]
        )

        if direction == "left":
            self.current_pos = max(
                self.player_values["paddle_length"] / 2, self.current_pos - move_amount
            )
        elif direction == "right":
            self.current_pos = min(
                1 - self.player_values["paddle_length"] / 2,
                self.current_pos + move_amount,
            )

        # Use player_index instead of index
        await self.game_manager.update_paddle(self.paddle_index, self.current_pos)

    async def power_up_event(self, event):
        """Handle power-up events from GameManager"""
        power_up_type = event.get("power_up_type")
        target_player = event.get("target_player")
        effect_data = event.get("effect_data", {})

        # Only apply effects if this player is the target
        if target_player == self.player_index:
            if power_up_type == "speed_boost":
                self.player_values["move_speed"] = effect_data.get(
                    "speed_multiplier", 1.0
                )
            elif power_up_type == "reverse_controls":
                self.player_values["reverse_controls"] = effect_data.get(
                    "active", False
                )
            elif power_up_type == "resize_paddle":
                self.player_values["paddle_length"] = effect_data.get(
                    "size_multiplier", 1.0
                )

        # Forward the power-up event to the client
        await self.send(
            text_data=json.dumps(
                {
                    "type": "power_up",
                    "power_up_type": power_up_type,
                    "target_player": target_player,
                    "effect_data": effect_data,
                }
            )
        )

    async def game_state(self, event):
        """Handle game state update events"""
        sanitized_state = self.sanitize_for_json(event["game_state"])
        await self.send(
            text_data=json.dumps({"type": "game_state", "game_state": sanitized_state})
        )

    async def game_collision(self, event):
        collisions = event.get("data")
        logger.debug(f"collisons: {collisions}")
        for event in collisions:
            sanitized_event = self.sanitize_for_json(event)
            await self.send(
                text_data=json.dumps(
                    {"type": "game_event", "game_state": sanitized_event}
                )
            )

    async def player_joined(self, event):
        """Handle player join notifications"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "player_joined",
                    "player_id": event["player_id"],
                    "player_index": event["player_index"],
                    "current_players": event["current_players"],
                    "player_name": event["player_name"] 
                }
            )
        )

    async def player_disconnected(self, event):
        await self.send(
            text_data=json.dumps(
            {
                "type": "player_disconnected",
                "player_id": event["player_id"],                                                            
                "side_index":  event["side_index"],                                                          
                "converted_to_wall":  event["converted_to_wall"],                                             
                "game_over":  event["game_over"],                                                            
                "state":  event["state"]        
            }))

    async def game_finished(self, event):
        """Handle game finished events"""
        winner_index = event.get("winner")
        logger.debug(winner_index)
        is_winner = (
            self.player_index in winner_index if winner_index is not None else False
        )
        # sanitized_state = self.sanitize_for_json(event["game_state"])
        await self.send(
            text_data=json.dumps(
                {
                    "type": "game_finished",
                    "game_state": event["game_state"],
                    "winner": "you" if is_winner else "other",
                },
                cls=DjangoJSONEncoder,
            )
        )

    async def waiting(self, event):
        """Handle waiting state events"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "waiting",
                    "current_players": event.get("current_players", 0),
                    "required_players": event.get("required_players", 0),
                }
            )
        )

    async def error(self, event):
        # Create error message with all fields except 'type'
        error_data = {
            "type": "error",
            **{key: value for key, value in event.items() if key not in ["type"]},
        }
        await self.send(text_data=json.dumps(error_data))

    def sanitize_for_json(self, data):
        """Convert any non-JSON-serializable types to basic Python types"""
        if isinstance(data, dict):
            return {key: self.sanitize_for_json(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [self.sanitize_for_json(item) for item in data]
        elif isinstance(data, (bytes, bytearray)):
            return data.decode("utf-8")
        # Handle numpy/decimal types if present
        elif hasattr(data, "item"):  # numpy types
            return data.item()
        elif isinstance(data, (float, int, str, bool, type(None))):
            return data
        else:
            return str(data)  # Convert any other types to strings


    @sync_to_async
    def get_user_info(self, user_id):
        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
            return {
                'username': user.username,
            }
        except User.DoesNotExist:
            return None

    async def get_connected_players(self):
        player_data = []
        
        # Get all player IDs
        player_ids = await self.game_manager.redis_conn.smembers(self.game_manager.players_key)
        # Get index for each player
        for player_id in player_ids:
            index = await self.game_manager.redis_conn.get(f"{self.game_id}:player_side:{player_id.decode('utf-8')}")
            logger.info(f"{self.game_id}:player_side:{str(player_id)} //  {index}")
            if index:
                player_data.append({
                    'player_id': player_id.decode('utf-8'),
                    'index': int(index)  # Renamed from 'position' to 'index'
                })
        
        # Sort by index
        player_data.sort(key=lambda x: x['index'])
        
        # Fetch user info for each player
        for player in player_data:
            user_info = await self.get_user_info(player['player_id'])
            if user_info:
                player.update(user_info)
        
        return player_data

