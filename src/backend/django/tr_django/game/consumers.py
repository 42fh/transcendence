import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from .agame.AGameManager import AGameManager
import time
import msgpack
import redis.asyncio as redis


class PongConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.last_move_time = 0
        self.current_pos = 0.5  # should be updated if game is loaded

        self.player_values = {
            "move_cooldown": 0.1,
            "move_speed": 0.05,
            "move_speed_boost": 1.0,  # example for player own values
            "reverse_controls": False,  # example for player own values
            "paddle_size": 1.0,  # example for player own values
        }  # should come from the GameManager

    async def connect(self):
        self.game_id = self.scope["url_route"]["kwargs"]["game_id"]
        query_string = self.scope["query_string"].decode("utf-8")
        query_params = dict(param.split("=") for param in query_string.split("&"))
        self.player_id = query_params.get("player")
        game_type = query_params.get("type", "polygon")  # Default to polygon_pong
        print(query_params)
        self.game_group = f"game_{self.game_id}"
        channel_key = f"asgi:group:{self.game_group}"
        await self.channel_layer.group_add(self.game_group, self.channel_name)
        # redis_conn = await redis.Redis.from_url('redis://redis:6379', decode_responses=True)
        # await redis_conn.expire(channel_key, 30)
        try:
            # Try to get existing game or create new one with specified type
            self.game_manager = await AGameManager.get_instance(
                self.game_id,
                game_type=query_params.get("type", "polygon"),
                settings={
                    "num_players": int(query_params.get("players", "2")),
                    "num_balls": int(query_params.get("balls", "1")),
                    "min_players": int(query_params.get("players", "2")),
                    "sides": int(query_params.get("sides", "4")),
                },
            )

            # Check Redis for existing players
            player_count = await self.game_manager.redis_conn.scard(
                self.game_manager.players_key
            )

            # Initialize game if no players exist with provided settings -> notworking
            if player_count == 0:
                asyncio.create_task(self.game_manager.start_game())

            self.player_index = await self.game_manager.add_player(self.player_id)
            if isinstance(self.player_index, dict):  # If player_data is returned
                self.current_pos = self.player_index.get("position", 0.5)
                self.player_index = self.player_index.get("index", 0)

            print(
                f"Player {self.player_id} connected to game {self.game_id} as player {self.player_index}"
            )

            await self.accept()

            # Send initial game state
            try:
                state_data = await self.game_manager.redis_conn.get(
                    self.game_manager.state_key
                )
                if state_data:
                    current_state = msgpack.unpackb(state_data)
                    sanitized_state = self.sanitize_for_json(current_state)
                    vertices_data = await self.game_manager.redis_conn.get(
                        self.game_manager.vertices_key
                    )
                    vertices = msgpack.unpackb(vertices_data) if vertices_data else None
                    sanitized_vertices = self.sanitize_for_json(vertices)
                    await self.send(
                        text_data=json.dumps(
                            {
                                "type": "initial_state",
                                "game_state": sanitized_state,
                                "player_index": self.player_index,
                                "player_values": self.player_values,
                                "game_setup": {
                                    "type": game_type,
                                    "vertices": sanitized_vertices,
                                    #'settings': await self.game_manager.redis_conn.get(self.game_manager.settings_key)
                                },
                            }
                        )
                    )
            except Exception as e:
                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "error",
                            "message": f"Failed to load initial game state: {str(e)}",
                        }
                    )
                )

        except Exception as e:
            print(f"Error in connect: {e}")
            await self.close()

    # TODO: disconnect could not be called (browser crash etc. so we need a extra test if the client is there
    async def disconnect(self, close_code):
        await self.game_manager.remove_player(self.player_id)
        await self.channel_layer.group_discard(self.game_group, self.channel_name)
        print(f"Player {self.player_id} disconnected from game {self.game_id}")

    # TODO: What else do/ could we recieve from the client: 1.answer for PING, 2.want to use powerup etc ....
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get("action")

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
            print(f"Invalid JSON received: {text_data}")
        except Exception as e:
            print(f"Error processing message: {str(e)}")

    async def handle_paddle_move(self, direction, user_id):
        if user_id != self.player_id:  # this could go into a cheatlog
            return

        current_time = time.time()

        if current_time - self.last_move_time < self.player_values["move_cooldown"]:
            return  # could send back feedback that is too fast or and log it in cheatlog

        if self.is_valid_paddle_move(direction):
            await self.update_paddle_position(direction)
            self.last_move_time = current_time

    def is_valid_paddle_move(self, direction):
        # check if directions are right
        if direction not in ["left", "right"]:
            return False

        # check if paddle already at max or min
        if direction == "left" and self.current_pos <= 0:
            return False
        if direction == "right" and self.current_pos >= 1:
            return False

        return True

    async def update_paddle_position(self, direction):
        move_amount = (
            self.player_values["move_speed"] * self.player_values["move_speed_boost"]
        )

        if direction == "left":
            self.current_pos = max(0, self.current_pos - move_amount)
        elif direction == "right":
            self.current_pos = min(1, self.current_pos + move_amount)

        # Use player_index instead of index
        await self.game_manager.update_paddle(self.player_index, self.current_pos)

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
                self.player_values["paddle_size"] = effect_data.get(
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
        cycle = self.sanitize_for_json(event["cycle"])
        await self.send(
            text_data=json.dumps(
                {"type": "game_state", "game_state": sanitized_state, "cycle": cycle}
            )
        )

    async def game_finished(self, event):
        """Handle game finished events"""
        winner_index = event.get("winner")
        print(winner_index)
        is_winner = (
            self.player_index in winner_index if winner_index is not None else False
        )
        sanitized_state = self.sanitize_for_json(event["game_state"])
        await self.send(
            text_data=json.dumps(
                {
                    "type": "game_finished",
                    "game_state": sanitized_state,
                    "winner": "you" if is_winner else "other",
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
