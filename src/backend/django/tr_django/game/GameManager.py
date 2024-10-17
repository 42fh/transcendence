import asyncio
import redis
from channels.layers import get_channel_layer


"""GameManager: 
This class must ensure that each game has only one GameManger. This GameManger must be shareable between all participants. 
 """

class GameManager:
    running_games = {}
    def __init__(self, game_id):
        self.game_id = game_id
        self.redis_conn = redis.Redis()
        self.channel_layer = get_channel_layer()
        self.game_state = self.load_game_state()
        self.redis_lock = asyncio.Lock()
        self.players = []  

    
#
     def init_game_state(self):
 """       
    # where come this from database or chache ?
    from django.core.cache import cache  ||  from .models import GameState
    game_state = cache.get(f'game_state_{self.game_id}') || game_state = GameState.objects.get(id=game_id)
    # how does a game_state look like ?  
    # dict -> json 
    game_state = {
            'ball_position': [xpostion, yposition, VelocityX, VelocityY, deltatime],
            'players': {
                'player1': {'paddle_position': 0, 'uuid':uuid, last_move:timestemp },
                'player2': {'paddle_position': 0, 'uuid':uuid, last_move:timestemp },
            },
            'score': [0, 0]
        }
    # pythonClass -> pickle -> attention pickle excecute code
    game_state = GameState(...)


    return game_state
"""
        return {
            'ball': {
                'x': 50,  # Initial ball position
                'y': 25,
                'velocity_x': 1,
                'velocity_y': 1,
            },
            'paddle_left': {'y': 20},
            'paddle_right': {'y': 20},
            'score': {'left': 0, 'right': 0},
            'game': {'width': 100, 'height': 50}
        }

    @classmethod
    def get_instance(cls, game_id):
        if game_id in running_games:
            return running_games[game_id]
        
        instance = cls(game_id)
        running_games[game_id] = instance
        return instance


    def decode_game_state(self, game_state_bytes):
        """Convert bytes from Redis into a Python dictionary."""
        if game_state_bytes:
            game_state_str = game_state_bytes.decode('utf-8')
            return json.loads(game_state_str)
        else:
            return self.init_game_state()  # Create a new game state if none exists

    def encode_game_state(self, game_state):
        """Convert a Python dictionary into bytes for storage in Redis."""
        game_state_str = json.dumps(game_state)
        return game_state_str.encode('utf-8')
   

    async def load_game_state(self):
        game_state_bytes = await self.redis_conn.get(f'game_state:{self.game_id}')
        return self.decode_game_state(game_state_bytes)

    async def save_game_state(self, game_state):
        game_state_bytes = self.encode_game_state(game_state)
        await self.redis_conn.set(f'game_state:{self.game_id}', game_state_bytes)
    
    async def initialize_game_state(self):
        game_state_bytes = await self.redis_conn.get(f'game_state:{self.game_id}')
        if game_state_bytes is None:
            initial_state = self.create_initial_game_state()
            await self.save_game_state(initial_state)


    # ? start game or  
    async def start_game(self):
        # what is the end of the game
        while len(self.players) > 0:
            game_over = await self.update_game()
            if game_over:
                break
            await asyncio.sleep(0.05)
        #load gamestate to datatbase
        del self.__class__.running_games[self.game_id]
         

    async def update_game(self):
        async with self.redis_lock:
            game_state_bytes = await self.redis_conn.get(f'game_state:{self.game_id}')
            current_state = self.decode_game_state(game_state_bytes)
            new_state, game_over = self.game_logic(current_state)
            await self.save_game_state(new_state)
            await self.channel_layer.group_send(self.game_id, {
            'type': 'game_update',
            'state': new_state
            })
            return game_over


    def game_logic(self, current_state):

        if current_state['score']['left'] >= 11 or current_state['score']['right'] >= 11:
            return current_state, True         
        
        ball_x = current_state['ball']['x']
        ball_y = current_state['ball']['y']
        ball_velocity_x = current_state['ball']['velocity_x']
        ball_velocity_y = current_state['ball']['velocity_y']
        paddle_left_y = current_state['paddle_left']['y']
        paddle_right_y = current_state['paddle_right']['y']
        score_left = current_state['score']['left']
        score_right = current_state['score']['right']
        game_width = current_state['game']['width']
        game_height = current_state['game']['height']
        paddle_height = current_state['paddle']['height']

        ball_x += ball_velocity_x
        ball_y += ball_velocity_y

        if ball_y <= 0 or ball_y >= game_height:

            if paddle_left_y <= ball_y <= paddle_left_y + paddle_height:
                ball_velocity_x *= -1
            else:
                score_right += 1
                ball_x, ball_y = game_width // 2, game_height // 2
                ball_velocity_x, ball_velocity_y = self.reset_ball_velocity()

            if paddle_right_y <= ball_y <= paddle_right_y + paddle_height:
                ball_velocity_x *= -1
            else:
                score_left += 1
                ball_x, ball_y = game_width // 2, game_height // 2
                ball_velocity_x, ball_velocity_y = self.reset_ball_velocity()

        new_state = {
            'ball': {
                'x': ball_x,
                'y': ball_y,
                'velocity_x': ball_velocity_x,
                'velocity_y': ball_velocity_y,
            },
            'paddle_left': {'y': paddle_left_y},
            'paddle_right': {'y': paddle_right_y},
            'score': {'left': score_left, 'right': score_right},
            'game': {
                'width': game_width,
                'height': game_height,
            }
        }

        return new_state, False

    def reset_ball_velocity(self):
        import random
        initial_velocity_x = random.choice([-1, 1]) * random.uniform(1.0, 1.5)
        initial_velocity_y = random.choice([-1, 1]) * random.uniform(0.5, 1.0)
        return initial_velocity_x, initial_velocity_y


    async def handle_disconnect(self, player):
        if player in self.players:
            self.players.remove(player)
        if len(self.players) == 0:
            print(f"Game {self.game_id} ended. No more players.")
            return

    async def player_disconnected(self, event):
        await self.handle_disconnect(event['player'])
