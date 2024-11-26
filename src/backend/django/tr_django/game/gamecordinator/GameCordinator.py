import redis.asyncio as redis
import msgpack
import time
from typing import List, Dict, Optional
import os
import uuid
import asyncio
from .GameSettingsManager import GameSettingsManager
import math



# os.getenv('REDIS_URL', 'redis://redis:6379/1')


class Game:
    def __init__(self):
        # game health keys
        self.recordet_key = f"game_recordet:{game_id}"  # bool default False
        self.running_key = f"game_running:{game_id}"  # bool default False
        self.finished_key = f"game_finished:{game_id}"  # bool default False

        # setting keys
        self.state_key = f"game_state:{game_id}"
        self.paddles_key = f"game_paddles:{game_id}"
        self.vertices_key = f"game_vertices:{game_id}"  # New key for vertices

        # game_logic
        self.players_key = f"game_players:{game_id}"
        self.booked_players_key = f"game_booked_players:{game_id}"

        # key only for game
        self.lock_key = f"game_lock:{game_id}"
        self.type_key = f"game_type:{game_id}"


class RedisLock:
    def __init__(self, redis_conn: redis.Redis, lock_key: str, timeout: int = 10):
        self.redis_conn = redis_conn
        self.lock_key = f"lock:{lock_key}"
        self.timeout = timeout

    async def __aenter__(self):
        start_time = time.time()
        while True:
            if await self.redis_conn.set(self.lock_key, "1", nx=True, ex=self.timeout):
                return self
            if time.time() - start_time > self.timeout:
                raise TimeoutError(f"Could not acquire lock: {self.lock_key}")
            await asyncio.sleep(0.1)

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.redis_conn.delete(self.lock_key)


class GameCordinator:
    """creates new games and manages all waiting and running games"""

    REDIS_URL = "redis://redis:6379/2"
    REDIS_GAME_URL = "redis://redis:6379/1"
    ALL_GAMES = "all_games"
    WAITING_GAMES = "waiting_games"
    RUNNING_GAMES = "running_games"
    FINISHED_GAMES = "finished_games"
    LOCK_KEYS = {"game_id": "game_id"}
    

    # logic
    # self.waiting_games_timeout = 300 # 5 min timeout only for waiting games tournament game stay open till the tournament close it.

    # games_key
    # self.all_games_key = f"all_games" # Game creation timestamp
    # self.waiting_tournament_games_key  = f"waiting_tournament_games" # tournament games has fixed players not pubblic
    # self.waiting_games_key = "waiting_games"
    # self.running_games_key = "running_games"
    # self.running_tournament_games_key  = "running_tournament_game"
    # self.finished_games_key = "finised_games"
    # self.finished_tournament_games_key = "finished_tournament_games"
    # self.recordet_games_key = "recordet_games"

    # performance logging
    # self.total_users_key = "total_users"
    # self.total_spectators_key = "total_spectators"
    # self.total_players_key = "total_players"

    @classmethod
    async def get_redis(cls, url: str) -> redis.Redis:
        """Get Redis connection for string operations"""
        return await redis.Redis.from_url(url, decode_responses=True)

    @classmethod
    async def get_redis_binary(cls, url: str) -> redis.Redis:
        """Get Redis connection for binary operations (msgpack)"""
        return await redis.Redis.from_url(url, decode_responses=False)

    # API from client

    # create_game
    # TODO:check if user play already a game  
    @classmethod
    async def create_new_game(cls, settings: Dict) -> str:
        """ """
        # calculate all datai
        game_id = None
        try:
            async with await cls.get_redis(cls.REDIS_URL) as redis_conn:
                async with RedisLock(redis_conn, cls.LOCK_KEYS["game_id"]):
                    game_id = await cls.generate_game_id(redis_conn)
                await cls.game_setup(redis_conn, settings, game_id)
            return game_id
        except Exception as e:
            print(f"Error in GameCordinator create_new game: {e}")
            return False

    @classmethod
    async def generate_game_id(cls, redis_conn: redis.Redis):
        """Generate a unique game ID using UUID and verify it's unique in Redis"""
        while True:
            game_id = str(uuid.uuid4())
            # SADD returns 1 if the element was added, 0 if it already existed
            if await redis_conn.sadd(cls.ALL_GAMES, game_id):
                return game_id

    @classmethod
    async def game_setup(cls, redis_conn: redis.Redis, client_settings: Dict, game_id):
        """merge given settings with default settings"""

        # step 1: generate game_settings
        settings = GameSettingsManager().create_game_settings(client_settings, game_id)
        # Step 2: Operations with redis_conn (String operations)
        async with await cls.get_redis(cls.REDIS_URL) as redis_conn:
            # Add game to appropriate sets
            pipeline = redis_conn.pipeline()
            
            # Boolean flags (using strings as Redis doesn't have boolean type)
            pipeline.set(f"game_recorded:{game_id}", "0")  # Not recorded
            pipeline.set(f"game_running:{game_id}", "0")   # Not running
            pipeline.set(f"game_finished:{game_id}", "0")  # Not finished
            pipeline.set(f"game_is_tournament:{game_id}", "0")  # Not tournament
            
            # String values
            pipeline.set(f"game_type:{game_id}", settings.get("type")
            pipeline.set(f"game_lock:{game_id}", "0")  # Initialize unlock state
            
            await pipeline.execute()

        # Step 3: Operations with redis_game (Binary/msgpack operations)
        async with await cls.get_redis_binary(cls.REDIS_GAME_URL) as redis_game:
            pipeline = redis_game.pipeline()
            
            # MsgPack encoded data (complex structures)
            # all_settins
            pipeline.set(f"game_settings:{game_id}", 
                        msgpack.packb(settings))
            # state
            initial_state = cls.create_initial_state(settings)
            pipeline.set(f"game_state:{game_id}", msgpack.packb(initial_state)) 
            
            pipeline.set(f"game_vertices:{game_id}", 
                        msgpack.packb(settings.get("vertices", [])))
            
            pipeline.set(f"game_normals:{game_id}", 
                        msgpack.packb(settings.get("normals", [])))
            
            pipeline.set(f"game_players_sides:{game_id}", 
                        msgpack.packb(settings.get("players_sides", [])))
            
            # Hash Operations (paddle positions)
            paddle_positions = {
                str(i): msgpack.packb({"position": 0.5})
                for i in range(settings.get("num_players", 2))
            }
            if paddle_positions:
                pipeline.hset(f"game_paddles:{game_id}", mapping=paddle_positions)
            
            # Initialize player values as msgpack
            pipeline.set(f"game_players_value:{game_id}",
                        msgpack.packb(settings.get("player_values", {})))
            
            await pipeline.execute()

        # Step 3: Initialize empty sets for player management
        async with await cls.get_redis(cls.REDIS_URL) as redis_conn:
            pipeline = redis_conn.pipeline()
            
            # Empty sets for players
            pipeline.delete(f"game_players:{game_id}")         # Active players
            pipeline.delete(f"game_booked_players:{game_id}")  # Booked players (for tournaments)
            
            await pipeline.execute()       






 
        # step 2: prepare redis for game
        async with await cls.get_redis_binary(cls.REDIS_GAME_URL) as redis_game:
            await redis_game.set(f"game_settings:{game_id}", msgpack.packb(game_settings))  # dict   
            # game health keys
            recorded_key = f"game_recorded:{game_id}"  # bool default False
            running_key = f"game_running:{game_id}"  # bool default False
            finished_key = f"game_finished:{game_id}"  # bool default False
            

            # setting keys
            state_key = f"game_state:{game_id}" # mspack
            paddles_key = f"game_paddles:{game_id}" # hashmap
            """ this is the loic from the paddle in the old version
                paddle_positions = {                                        
                 str(i): msgpack.packb({"position": 0.5})            
                  for i in range(self.settings["num_players"]) -> num_player is in settings
                  }       
                await self.redis_conn.hset(self.paddles_key, mapping=paddle_positions)   
            """
            vertices_key = f"game_vertices:{game_id}"  # list or dict
            normals_key  =  f"game_vertices:{game_id}"  # list or dict
            players_sides_key = f"game_vertices:{game_id}"  # list or dict



            # game_logic
            players_values = f"game_players_value:{game_id}" # dict 
            booked_players_key = f"game_booked_players:{game_id}" # set -> for tournaments
            is_tournament_key  = f"game_is_tournament:{game_id}" # bool

    
            # key only for game
            lock_key = f"game_lock:{game_id}" # bool
            type_key = f"game_type:{game_id}" # string
         

    @classmethod
    def create_initial_state(cls, settings: Dict) -> Dict:
        """Create initial game state based on settings"""
        try:
            scale = settings.get("scale")
            num_balls = settings.get("num_balls")
            ball_size = settings.get("ball_size") * scale
            initial_speed = settings.get("initial_ball_speed") * scale
            active_sides = settings.get("players_sides") 
            num_sides = settings.get("sides")

            # Initialize balls with random directions
            balls = []
            for _ in range(num_balls):
                angle = random.uniform(0, 2 * math.pi)
                balls.append({
                    "x": float(0),
                    "y": float(0),
                    "velocity_x": float(initial_speed * math.cos(angle)),
                    "velocity_y": float(initial_speed * math.sin(angle)),
                    "size": float(ball_size)
                })

            # Initialize paddles
            paddles = []
            for side_index in range(num_sides):
                paddles.append({
                    "position": float(0.5),
                    "active": side_index in active_sides,
                    "side_index": side_index
                })

            # Create complete state object
            state = {
                "balls": balls,
                "paddles": paddles,
                "scores": [int(0)] * len(active_sides),
                "dimensions": {
                    "paddle_length": float(settings.get("paddle_length", 0.3)) * scale,
                    "paddle_width": float(settings.get("paddle_width", 0.1)) * scale,
                },
                "game_type": settings.get("type", "polygon"),
                "game_time": 0,  # Add game time tracking
                "last_update": time.time()  # Add timestamp for game updates
            }

            return state

        except Exception as e:
            print(f"Error creating initial game state: {e}")
            raise




    # view

    @classmethod
    async def get_all_games(cls):
        """Get all game IDs"""
        async with await cls.get_redis(cls.REDIS_URL) as redis_conn:
            return await redis_conn.smembers(cls.ALL_GAMES)

    def get_waiting_games(self):
        pass

    def get_running_games(self):
        pass

    @classmethod
    async def get_detail_from_game(cls, game_id: str) -> dict:
        async with await cls.get_redis_binary(cls.REDIS_GAME_URL) as redis_game:
            stored_values = await redis_game.get(f"game_settings:{game_id}")    
        return_value = msgpack.unpackb(stored_values)
        print("hallo: ", return_value)
        return return_value

    # from AGameManager with signals
    def join_game(self, game_id: int, player_id):
        pass

    def leave_game(self, game_id: int, player_id):
        pass
