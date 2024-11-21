import redis.asyncio as redis
import msgpack
import time
from typing import List, Dict, Optional
import os
import uuid
import asyncio  

#os.getenv('REDIS_URL', 'redis://redis:6379/1')



class Game:
    def __init__(self):   
        # game health keys
        self.recordet_key =  f"game_recordet:{game_id}" # bool default False 
        self.running_key = f"game_running:{game_id}" # bool default False 
        self.finished_key = f"game_finished:{game_id}" # bool default False 
        
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
    """ creates new games and manages all waiting and running games """
    
    REDIS_URL = "redis://redis:6379/2"
    ALL_GAMES = "all_games"  # Set containing all game IDs
    LOCK_KEYS = {"game_id": "game_id"}



    def __init__(self):
        
        # redis
        self.redis_conn = None # set by initialize
        # each redis dervice its own index self.redis_url = os.getenv('REDIS_URL', 'redis://redis:6379') + "/2" 
        self.redis_url = "redis://redis:6379" + "/2"        
        
        # logic
        self.waiting_games_timeout = 300 # 5 min timeout only for waiting games tournament game stay open till the tournament close it. 

        # games_key 
        self.all_games_key = f"all_games" # Game creation timestamp
        self.waiting_tournament_games_key  = f"waiting_tournament_games" # tournament games has fixed players not pubblic 
        self.waiting_games_key = "waiting_games" 
        self.running_games_key = "running_games"
        self.running_tournament_games_key  = "running_tournament_game"  
        self.finished_games_key = "finised_games" 
        self.finished_tournament_games_key = "finished_tournament_games"
        self.recordet_games_key = "recordet_games"
        
        # performance logging
        self.total_users_key = "total_users" 
        self.total_spectators_key = "total_spectators"
        self.total_players_key = "total_players"

    @classmethod
    async def get_redis(cls) -> redis.Redis:
        return await redis.Redis.from_url(cls.REDIS_URL, decode_responses=True)


    # API from client

    # create_game
    @classmethod
    async def create_new_game(cls, settings:Dict=None) -> str:  
        """ """ 
        # calculate all data
        try:
            async with await cls.get_redis() as redis_conn:
                async with RedisLock(redis_conn, cls.LOCK_KEYS['game_id']):
                    game_id = await cls.generate_game_id(redis_conn)
                await cls.game_setup(redis_conn, settings, game_id)
            return game_id
        except Exception as e:
            print(f"Error in GameCordinator create_new game: {e}")       
            return False            

 
    @classmethod     
    async def generate_game_id(cls, redis_conn: redis.Redis):
        """Generate a unique game ID using UUID and verify it's unique in Redis"""
        async with await cls.get_redis() as redis_conn:
            while True:
                game_id = str(uuid.uuid4())
                # SADD returns 1 if the element was added, 0 if it already existed
                if await redis_conn.sadd(cls.ALL_GAMES, game_id):
                    return game_id

    
    @classmethod
    async def game_setup(cls, redis_conn: redis.Redis, settings:Dict, game_id):
        """ merge given settings with default settings """

        #          
        print(settings)
        game_settings = await cls.create_game_settings(redis_conn, settings, game_id)        
        pass

    @classmethod
    async def create_game_settings(cls, redis_conn: redis.Redis, settings:Dict, game_id):
        pass
 

    # view 
    
    @classmethod
    async def get_all_games(cls):
        """Get all game IDs"""
        async with await cls.get_redis() as redis_conn:
            return await redis_conn.smembers(cls.ALL_GAMES)  

 
    def get_waiting_games(self):
        pass
    def get_running_games(self):
        pass
    

    def get_detail_from_game(self, game_id:int):
        pass
    # from AGameManager with signals
    def join_game(self, game_id:int, player_id):
        pass
    def leave_game(self, game_id:int, player_id):
        pass


     
