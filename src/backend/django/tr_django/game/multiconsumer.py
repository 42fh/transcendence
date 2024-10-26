import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from .MultiGameManager import MultiGameManager
import time

class MPongConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.last_move_time = 0
        self.move_cooldown = 0.3  # cooldown of paddle moves

    async def connect(self):
        self.game_id = self.scope["url_route"]["kwargs"]["game_id"]
        query_string = self.scope["query_string"].decode("utf-8")
        query_params = dict(param.split("=") for param in query_string.split("&"))
        
        self.player_id = query_params.get("player")
        self.num_players = int(query_params.get("players", "3"))  # Default to 3 players
        self.num_balls = int(query_params.get("balls", "1"))  # Default to 1 ball

        self.game_group = f"game_{self.game_id}"
        await self.channel_layer.group_add(self.game_group, self.channel_name)

        self.game_manager = MultiGameManager.get_instance(self.game_id)

        # Initialize game if first player
        if len(self.game_manager.players) == 0:
            self.game_manager.num_balls = self.num_balls
            self.game_manager.num_players = self.num_players
            await self.game_manager.initialize()
            asyncio.create_task(self.game_manager.start_game())

        # Add player and get their index position in the circle
        player_index = await self.game_manager.add_player(self.player_id)
        self.player_index = player_index

        print(f"Player {self.player_id} connected to game {self.game_id} as player {player_index}")
        await self.accept()

        # Send initial game state after connection
        initial_state = await self.game_manager.load_game_state()
        await self.send(
            text_data=json.dumps({"type": "initial_state", "game_state": initial_state})
        )

    async def disconnect(self, close_code):
        await self.game_manager.remove_player(self.player_id)
        await self.channel_layer.group_discard(self.game_group, self.channel_name)
        print(f"Player {self.player_id} disconnected from game {self.game_id}")

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            action = text_data_json.get("action")
            
            if action == "move_paddle":
                direction = text_data_json.get("direction")
                user_id = text_data_json.get("user_id")
                
                if self.game_manager.running:
                    await self.handle_paddle_move(direction, user_id)
                else:   
                    print(f"Player {self.player_id} paddle move ignored - game {self.game_id} is not running")
        except json.JSONDecodeError:
            print(f"Invalid JSON received: {text_data}")
        except Exception as e:
            print(f"Error processing message: {str(e)}")

    async def handle_paddle_move(self, direction, user_id):
        current_time = time.time()
        if current_time - self.last_move_time < self.move_cooldown:
            print(f"Move cooldown in effect for player {user_id}")
            return

        if await self.is_valid_paddle_move(direction, user_id):
            await self.update_paddle_position(direction)
            self.last_move_time = current_time
        else:
            print(f"Invalid move attempt: direction={direction}, user_id={user_id}")

    async def is_valid_paddle_move(self, direction, user_id):
        if user_id != self.player_id:
            print(f"User ID mismatch. Expected: {self.player_id}, Received: {user_id}")
            return False

        game_state = await self.game_manager.load_game_state()
        current_pos = game_state['paddles'][self.player_index]['position']

        if direction not in ["left", "right"]:
            print(f"Invalid direction: {direction}")
            return False

        # Check position bounds (-1 to 1)
        if direction == "left" and current_pos <= -1:
            return False
        if direction == "right" and current_pos >= 1:
            return False
            
        return True

    async def update_paddle_position(self, direction):
        async with self.game_manager.redis_lock:
            game_state = await self.game_manager.load_game_state()
            
            move_amount = 0.05  # Adjust this value to change paddle movement speed
            current_pos = game_state['paddles'][self.player_index]['position']
            
            # Update paddle position within bounds (-1 to 1)
            if direction == "left":
                game_state['paddles'][self.player_index]['position'] = max(-1, current_pos - move_amount)
            elif direction == "right":
                game_state['paddles'][self.player_index]['position'] = min(1, current_pos + move_amount)
            
            await self.game_manager.save_game_state(game_state)

    async def game_state(self, event):
        await self.send(text_data=json.dumps({
            "type": "game_state",
            "game_state": event["game_state"]
        }))

    async def game_finished(self, event):
        winner_index = event.get("winner")
        is_winner = winner_index == self.player_index if winner_index is not None else False
        
        await self.send(text_data=json.dumps({
            "type": "game_finished",
            "game_state": event["game_state"],
            "winner": "you" if is_winner else "other"
        }))
