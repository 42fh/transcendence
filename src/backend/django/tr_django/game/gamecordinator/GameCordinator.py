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
    # KEYS for Redis
    ALL_GAMES = "all_games"
    WAITING_GAMES = "waiting_games"
    RUNNING_GAMES = "running_games"
    FINISHED_GAMES = "finished_games"
    # more possible key
    # waiting_tournament_games_key  = "waiting_tournament_games" # tournament games has fixed players not pubblic
    # running_tournament_games_key  = "running_tournament_game"
    # finished_tournament_games_key = "finished_tournament_games"
    # recorded_games_key = "recorde_games"

    # performance logging
    # total_users_key = "total_users"
    # total_spectators_key = "total_spectators"
    # total_players_key = "total_players"

    # KEYS for Redis Lock
    LOCK_KEYS = {"game_id": "game_id",
                "waiting": "waiting",
                "running": "running",
                "finished": "finised",       
    
    }
    

    # logic
    # self.waiting_games_timeout = 300 # 5 min timeout only for waiting games tournament game stay open till the tournament close it.

    # games_key

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
        async with await cls.get_redis(cls.REDIS_GAME_URL) as redis_conn:
            # Add game to appropriate sets
            pipeline = redis_conn.pipeline()
            
            # Boolean flags (using strings as Redis doesn't have boolean type)
            pipeline.set(f"game_recorded:{game_id}", "0")  # Not recorded
            pipeline.set(f"game_running:{game_id}", "0")   # Not running
            pipeline.set(f"game_finished:{game_id}", "0")  # Not finished
            pipeline.set(f"game_is_tournament:{game_id}", "0")  # Not tournament
            
            # String values
            pipeline.set(f"game_type:{game_id}", settings.get("type"))
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
            pipeline.set(f"game_state:{game_id}", msgpack.packb(settings.get("state"))) 
            
            pipeline.set(f"game_vertices:{game_id}", 
                        msgpack.packb(settings.get("vertices")))
            
            pipeline.set(f"game_normals:{game_id}", 
                        msgpack.packb(settings.get("normals")))
            
            pipeline.set(f"game_players_sides:{game_id}", 
                        msgpack.packb(settings.get("players_sides")))
            
            # Hash Operations (paddle positions)
            paddle_positions = {
                str(i): msgpack.packb({"position": 0.5})
                for i in range(settings.get("num_players"))
            }
            if paddle_positions:
                pipeline.hset(f"game_paddles:{game_id}", mapping=paddle_positions)
            
            # Initialize player values as msgpack
            pipeline.set(f"game_players_value:{game_id}",
                        msgpack.packb(settings.get("player_values")))
            
            await pipeline.execute()

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
    async def get_detail_from_game(cls, game_id) -> dict:
        async with await cls.get_redis_binary(cls.REDIS_GAME_URL) as redis_game:
            stored_values = await redis_game.get(f"game_settings:{game_id}")    
        return_value = msgpack.unpackb(stored_values)
        return return_value

    @classmethod
    async def is_player_playing(cls, user_id) -> bool:
       """check in booked tournament and single games if player is in there"""
    # check booekd player( plus delete old ones) and playeing players if in their return false else true     
    

    @classmethod
    async def join_game(cls, request, game_id) -> dict:
        session = request.session
        user = request.user
        # check if game is already full 
        # i would need from wettings number of players 
        # full: 
        # 1. persons in the reserv coocki list  are eqal to num_players
        # 2. persons in active waiting is full 
        # to 1. this needs a expiricion time so that then this reserved user is kicked out -> shoukd only be reserve in normal game to injured that if you joun the game that then nobody else can join if the gae is already full .. but if you have a crasch in betwenn youspot should be availible after reserbávtion time
    try:
        # Get game settings to check player limits
        async with await cls.get_redis_binary(cls.REDIS_GAME_URL) as redis_game:
            settings_data = await redis_game.get(f"game_settings:{game_id}")
            if not settings_data:
                return False
            settings = msgpack.unpackb(settings_data)
            max_players = settings.get("num_players", 0)

        async with await cls.get_redis(cls.REDIS_GAME_URL) as redis_conn:
            # Check active players
            current_players = await redis_conn.scard(f"game_players:{game_id}")
            
            # Check reserved spots
            reserved_players = await redis_conn.scard(f"game_booked_players:{game_id}")
            
            total_players = current_players + reserved_players
            
            if total_players >= max_players:
                return False
                
            # Create reservation for the player
            reservation_data = msgpack.packb({
                'user_id': request.user.id,
                'session_key': request.session.session_key,
                'timestamp': int(time.time())
            })
            
            # Set reservation with 5 minute expiry
            await redis_conn.setex(
                f"player_reservation:{request.user.id}:{game_id}",
                300,  # 5 minutes
                reservation_data
            )
            
            # Add to booked players set
            await redis_conn.sadd(f"game_booked_players:{game_id}", request.user.id)
            
            return {"available": True}
            
    except Exception as e:
        print(f"Error in join_game: {e}")
        return {"available": False, "message": f"Error in join_game: {e}", "status": 500 }


    # from AGameManager with signals
    @classmethod
    async def leave_game(cls, game_id, player_id):
        pass
    @classmethod
    async def set_to_waiting_game(cls, game_id):
        pass
    @classmethod
    async def set_to_running_game(cls, game_id):
        pass
    @classmethod
    async def set_to_finished_game(cls, game_id):
        pass
    

