import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .GameManager import GameManager 

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.player_id = self.scope['user'].id  
        self.group_name = f'game_{self.game_id}'
        
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        
        await self.accept()

        game_manager = GameManager.get_instance(self.game_id)

        if len(game_manager.players) == 0:
            await game_manager.initialize_game_state()  
            self.game_task = self.loop.create_task(game_manager.start_game()) 

        await game_manager.add_player(self.player_id, self)

    async def disconnect(self, close_code):
        game_manager = GameManager.get_instance(self.game_id)
        
        await game_manager.remove_player(self.player_id)
        
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
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

        return True

    async def game_update(self, event):
        game_state = event['game_state']

        # Send game state to WebSocket
        await self.send(text_data=json.dumps({
            'game_state': game_state
        }))

