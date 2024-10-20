import json
import asyncio
import redis.asyncio as redis
from channels.layers import get_channel_layer
import random

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
        self.min_players = 2

    """# gamestate data not final  
    def init_game_state(self):
        gamestate = {
            'ball': {
                'x': 0.5, 
                'y': 0.5,
                'velocity_x': 0.01,
                'velocity_y': 0.01,
            },
            'paddle_left': {'y': 0.5},
            'paddle_right': {'y': 0.5},
            'score': {'left': 0, 'right': 0}
        }

        return gamestate
    """

    def init_game_state(self):
        gamestate = {
            'ball': {
                'x': 0.5, 
                'y': 0.5,
                'velocity_x': 0.004,
                'velocity_y': 0.004,
                'size': 0.02,  # 2% of the field width/height
            },
            'paddle_left': {'y': 0.5},
            'paddle_right': {'y': 0.5},
            'score': {'left': 0, 'right': 0},
            'dimensions': {
                'paddle_height': 0.2,  # 20% of the field height
                'paddle_width': 0.02,  # 2% of the field width
            }
        }
        return gamestate


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


    @classmethod
    def get_instance(cls, game_id):
        if game_id in cls.running_games:
            return cls.running_games[game_id]
        instance = cls(game_id)
        cls.running_games[game_id] = instance
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
            initial_state = self.init_game_state()
            await self.save_game_state(initial_state)

    async def wait_for_players(self):
        # Wait until both players are connected
        while len(self.players) < self.min_players:
            print("Waiting for players to join...")
            await asyncio.sleep(1) 
        print("All players connected. Starting the game.")
        self.game_running = True


    # ? start game or  
    async def start_game(self):
        # what is the end of the game
        await self.wait_for_players()
        while len(self.players) > 0:
            game_over = await self.update_game()
            if game_over:
                print("Game over!")
                break
            await asyncio.sleep(0.05)
        #load gamestate to datatbase


    async def update_game(self):
        async with self.redis_lock:
            game_state_bytes = await self.redis_conn.get(f'game_state:{self.game_id}')
            current_state = self.decode_game_state(game_state_bytes)
            new_state, game_over = self.game_logic(current_state)
            await self.save_game_state(new_state)
            await self.channel_layer.group_send(f'game_{self.game_id}', {
                'type': 'game_state',
                'game_state': new_state
                })
        return game_over
   
    def game_logic(self, current_state):
        if current_state['score']['left'] >= 11 or current_state['score']['right'] >= 11:
            return current_state, True

        ball = current_state['ball']
        paddle_left_y = current_state['paddle_left']['y']
        paddle_right_y = current_state['paddle_right']['y']
        score_left = current_state['score']['left']
        score_right = current_state['score']['right']
        dimensions = current_state['dimensions']

        # Update ball position
        ball['x'] += ball['velocity_x']
        ball['y'] += ball['velocity_y']

        # Ball bouncing off top and bottom walls
        if ball['y'] <= 0 or ball['y'] + ball['size'] >= 1:
            ball['velocity_y'] *= -1
            # Adjust y-position to prevent sticking to the wall
            if ball['y'] <= 0:
                ball['y'] = 0
            elif ball['y'] + ball['size'] >= 1:
                ball['y'] = 1 - ball['size']

        # Ball hitting paddles or scoring
        if ball['x'] <= dimensions['paddle_width']:
            if paddle_left_y <= ball['y'] + ball['size'] / 2 <= paddle_left_y + dimensions['paddle_height']:
                ball['velocity_x'] *= -1
                # Adjust angle based on where the ball hits the paddle
                ball['velocity_y'] += (ball['y'] - (paddle_left_y + dimensions['paddle_height'] / 2)) * 0.02
            else:
                score_right += 1
                self.reset_ball(ball)

        if ball['x'] + ball['size'] >= 1 - dimensions['paddle_width']:
            if paddle_right_y <= ball['y'] + ball['size'] / 2 <= paddle_right_y + dimensions['paddle_height']:
                ball['velocity_x'] *= -1
                # Adjust angle based on where the ball hits the paddle
                ball['velocity_y'] += (ball['y'] - (paddle_right_y + dimensions['paddle_height'] / 2)) * 0.02
            else:
                score_left += 1
                self.reset_ball(ball)

        # Cap ball speed
        max_speed = 0.006
        speed = (ball['velocity_x']**2 + ball['velocity_y']**2)**0.5
        if speed > max_speed:
            factor = max_speed / speed
            ball['velocity_x'] *= factor
            ball['velocity_y'] *= factor

        current_state['ball'] = ball
        current_state['score']['left'] = score_left
        current_state['score']['right'] = score_right

        return current_state, False

    def reset_ball(self, ball):
        ball['x'] = 0.5
        ball['y'] = 0.5
        ball['velocity_x'] = random.choice([-1, 1]) * 0.002
        ball['velocity_y'] = random.choice([-1, 1]) * 0.002
    
    def reset_ball_velocity(self):
        initial_velocity_x = random.choice([-1, 1]) * random.uniform(0.01, 0.015)
        initial_velocity_y = random.uniform(-0.005, 0.005)
        return initial_velocity_x, initial_velocity_y

    async def add_player(self, player_id):
        """Add a player to the game if they are not already added."""
        if player_id not in self.players:
            self.players.append(player_id)
            print(f"Player {player_id} added to game {self.game_id}. Current players: {self.players}.")
            return True
        else:
            print(f"Player {player_id} is already in the game {self.game_id}.")
            return False
    
    async def remove_player(self, player_id):
        if player_id in self.players:
            self.players.remove(player_id)
            print(f"Player {player_id} removed from game {self.game_id}. Remaining players: {self.players}")
            
            if len(self.players) == 0:
                # If no players left, end the game and clean up
                print(f"Game {self.game_id} ended. No more players.")
                del self.__class__.running_games[self.game_id]
            elif len(self.players) == 1:
                # If only one player left, you might want to pause the game or take some action
                print(f"Only one player left in game {self.game_id}.")
                # You could implement a waiting state here if needed
        else:
            print(f"Player {player_id} not found in game {self.game_id}")
