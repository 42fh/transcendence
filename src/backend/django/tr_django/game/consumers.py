import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from .GameManager import GameManager 
import time


class PongConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.last_move_time = 0
        self.move_cooldown = 0.5 

    async def connect(self):
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.player_id = self.scope['query_string'].decode('utf-8').split('=')[1]
        #self.player_id = self.scope['user'].id  
        self.group_name = f'game_{self.game_id}'
        print(self.game_id, self.player_id)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        

        self.game_manager = GameManager.get_instance(self.game_id)

        if len(self.game_manager.players) == 0:
            await self.game_manager.initialize_game_state()  
            asyncio.create_task(self.game_manager.start_game())
        await self.game_manager.add_player(self.player_id)
        if len(self.game_manager.players) == 1:
            self.paddle='left'
        else :
            self.paddle='right'
        print(self.game_id, self.player_id, self.paddle)
        await self.accept()

    async def disconnect(self, close_code):
        game_manager = GameManager.get_instance(self.game_id)
        
        await game_manager.remove_player(self.player_id)
        
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        try:
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

    async def handle_paddle_move(self, direction, user_id):
        current_time = time.time()
        if current_time - self.last_move_time < self.move_cooldown:
            print(f"Invalid move attempt: to fast=(cooldown{self.move_cooldown}/your{current_time - self.last_move_time} , user_id={user_id}")
            return  # Ignore move if it's too soon after the last one

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
            move_amount = 0.05  # Adjust this value to change paddle speed
            
            if direction == 'up':
                game_state[f'paddle_{self.paddle}']['y'] = max(0, game_state[f'paddle_{self.paddle}']['y'] - move_amount)
            elif direction == 'down':
                game_state[f'paddle_{self.paddle}']['y'] = min(0.8, game_state[f'paddle_{self.paddle}']['y'] + move_amount)
            
            await self.game_manager.save_game_state(game_state)


    """async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json.get('action')

        if action == 'move_paddle':
            direction = text_data_json.get('direction')
            
            if await self.is_valid_paddle_move(self.player_id, direction):
                await self.update_paddle_position_in_redis(self.player_id, direction)
                
    async def update_paddle_position_in_redis(self, player_id, direction):
        game_manager = GameManager.get_instance(self.game_id)

        # Use Redis to update paddle movement directly
        async with game_manager.redis_lock():
            game_state = await game_manager.load_game_state()
            
            # Example logic to move the player's paddle
            if player_id == game_state['player1_id']:
                if direction == 'up':
                    game_state['player1_paddle'] = max(0, game_state['player1_paddle'] - 1)
                elif direction == 'down':
                    game_state['player1_paddle'] = min(game_state['max_height'], game_state['player1_paddle'] + 1)
            elif player_id == game_state['player2_id']:
                if direction == 'up':
                    game_state['player2_paddle'] = max(0, game_state['player2_paddle'] - 1)
                elif direction == 'down':
                    game_state['player2_paddle'] = min(game_state['max_height'], game_state['player2_paddle'] + 1)
            
            # Save the updated state back to Redis
            await game_manager.save_game_state(game_state)

    async def is_valid_paddle_move(self, player_id, direction):
        game_manager = GameManager.get_instance(self.game_id)
        game_state = await game_manager.load_game_state()

        if player_id == game_state['player1_id']:
            paddle_position = game_state['player1_paddle']
        elif player_id == game_state['player2_id']:
            paddle_position = game_state['player2_paddle']
        else:
            return False

        # Add logic to check if the move is valid (e.g., not moving out of bounds)
        if direction == 'up' and paddle_position == 0:
            return False
        if direction == 'down' and paddle_position == game_state['max_height']:
            return False

        return True"""

    async def game_state(self, event):
        game_state = event['game_state']

        # Send game state to WebSocket
        await self.send(text_data=json.dumps({
            'game_state': game_state
        }))

