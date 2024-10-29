import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from .GameManager import GameManager 
import time


class PongConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.last_move_time = 0
        self.move_cooldown = 0.01 #cooldown of paddle moves

    async def connect(self):
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.player_id = self.scope['query_string'].decode('utf-8').split('=')[1]
        self.game_group = f'game_{self.game_id}'
        await self.channel_layer.group_add(self.game_group, self.channel_name)
        

        self.game_manager = GameManager.get_instance(self.game_id)

        if len(self.game_manager.players) == 0:
            await self.game_manager.initialize()  
            asyncio.create_task(self.game_manager.start_game())
        await self.game_manager.add_player(self.player_id)
        self.paddle = 'left' if len(self.game_manager.players) == 1 else 'right'
        
        print(f"Player {self.player_id} connected to game {self.game_id} as {self.paddle} paddle")
        await self.accept()
        
        # Send initial game state after connection
        initial_state = await self.game_manager.load_game_state()
        await self.send(text_data=json.dumps({
            'type': 'initial_state',
            'game_state': initial_state
            }))


    async def disconnect(self, close_code):
        game_manager = GameManager.get_instance(self.game_id)
        await game_manager.remove_player(self.player_id)    
        await self.channel_layer.group_discard(self.game_group, self.channel_name)
        print(f"Player {self.player_id} disconnected from game {self.game_id}")
    
    async def receive(self, text_data):
        try:
            print(f"player:{self.player_id} get a message")
            text_data_json = json.loads(text_data)
            action = text_data_json.get('action')
            if action == 'move_paddle':
                direction = text_data_json.get('direction')
                user_id = text_data_json.get('user_id')
                await self.handle_paddle_move(direction, user_id)
        except json.JSONDecodeError:
            print(f"Invalid JSON received: {text_data}")
        except Exception as e:
            print(f"Error processing message: {str(e)}")

    async def paddle_move(self, event):
        await self.handle_paddle_move(event['direction'])

    async def handle_paddle_move(self, direction, user_id):
        current_time = time.time()
        if current_time - self.last_move_time < self.move_cooldown:
            print(f"Invalid move attempt: to fast=(cooldown{self.move_cooldown}/your{current_time - self.last_move_time} , user_id={user_id}")
            return  

        if await self.is_valid_paddle_move(direction, user_id):
            await self.update_paddle_position(direction)
            await self.game_manager.update_game()
            self.last_move_time = current_time
        else:
            print(f"Invalid move attempt: direction={direction}, user_id={user_id}")


    


    async def is_valid_paddle_move(self, direction, user_id):
        # Check if the user_id matches the current player's ID
        if user_id != self.player_id:
            print(f"User ID mismatch. Expected: {self.player_id}, Received: {user_id}")
            return False

        game_state = await self.game_manager.load_game_state()
        paddle_y = game_state[f'paddle_{self.paddle}']['y']
        
        if direction not in ['up', 'down']:
            print(f"Invalid direction: {direction}")
            return False

        if direction == 'up' and paddle_y <= 0:
            return False
        if direction == 'down' and paddle_y >= 0.8:  # Assuming paddle height is 0.2
            return False
        return True

    async def update_paddle_position(self, direction):
        async with self.game_manager.redis_lock:
            game_state = await self.game_manager.load_game_state()
            move_amount = 0.01  # Adjust this value to change paddle speed
            
            if direction == 'up':
                game_state[f'paddle_{self.paddle}']['y'] = max(0, game_state[f'paddle_{self.paddle}']['y'] - move_amount)
            elif direction == 'down':
                game_state[f'paddle_{self.paddle}']['y'] = min(1, game_state[f'paddle_{self.paddle}']['y'] + move_amount)
            
            await self.game_manager.save_game_state(game_state)

    async def game_finished(self, event):
        game_state = event['game_state']
        msg_type = event['type'] 
        winner = 'you' if event['winner'] == self.paddle else 'other' 
        
        await self.send(text_data=json.dumps({
            'type': msg_type,
            'game_state': game_state,
            'winner' : winner
        }))
        
        

    async def game_state(self, event):
        game_state = event['game_state']
        msg_type = event['type'] 

        await self.send(text_data=json.dumps({
            'type': msg_type,
            'game_state': game_state
        }))

