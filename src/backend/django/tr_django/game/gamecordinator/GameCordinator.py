import redis.asyncio as redis
import msgpack
import time
from typing import List, Dict, Optional
import os
import uuid
import asyncio
from .GameSettingsManager import GameSettingsManager
import math
import logging



logger = logging.getLogger(__name__)


class RedisLock:
    def __init__(self, redis_conn: redis.Redis, lock_key: str, timeout: int = 10):
        self.redis_conn = redis_conn
        self.lock_key = lock_key
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

    # Player Managment
    TOTAL_USERS = "total_users"  # all active users (PLAYING, RECORDED, SPECTATOR)
    PLAYING_USERS = "playing_users"
    BOOKED_USERS = "booked_users"

    # invidual Game
    NUM_PLAYERS_PREFIX = "num_players_"

    # invidual Player Managment
    BOOKED_USER_PREFIX = "booked_"
    PLAYING_USER_PREFIX = "playing_"

    # user online
    USER_ONLINE_PREFIX = "user_online_"
    USER_ONLINE_EXPIRY = 60

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
    LOCK_KEYS = {
        "game_id": "game_id",
        "waiting": "waiting",
        "running": "running",
        "finished": "finished",
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
    @classmethod
    async def create_new_game(cls, settings: Dict) -> str:
        """ """
        # calculate all data
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
            pipeline.set(f"game_running:{game_id}", "0")  # Not running
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
            pipeline.set(f"game_settings:{game_id}", msgpack.packb(settings))
            # state
            pipeline.set(f"game_state:{game_id}", msgpack.packb(settings.get("state")))

            pipeline.set(
                f"game_vertices:{game_id}", msgpack.packb(settings.get("vertices"))
            )

            pipeline.set(
                f"game_normals:{game_id}", msgpack.packb(settings.get("normals"))
            )

            pipeline.set(
                f"game_players_sides:{game_id}",
                msgpack.packb(settings.get("players_sides")),
            )

            # Hash Operations (paddle positions)
            paddle_positions = {
                str(i): msgpack.packb({"position": 0.5})
                for i in range(settings.get("num_players"))
            }
            if paddle_positions:
                pipeline.hset(f"game_paddles:{game_id}", mapping=paddle_positions)

            # Initialize player values as msgpack
            pipeline.set(
                f"game_player_settings:{game_id}",
                msgpack.packb(settings.get("player_settings")),
            )

            pipeline.set(
                f"{cls.NUM_PLAYERS_PREFIX}:{game_id}", str(settings.get("num_players"))
            )

            await pipeline.execute()

    # view
    #not in use   
    @classmethod
    async def get_all_games(cls):
        """Get all game IDs"""
        async with await cls.get_redis(cls.REDIS_URL) as redis_conn:
            return await redis_conn.smembers(cls.ALL_GAMES)

    @classmethod
    async def get_waiting_games(cls):
        """Get all game IDs"""
        async with await cls.get_redis(cls.REDIS_URL) as redis_conn:
            return await redis_conn.smembers(cls.WAITING_GAMES)
    
    @classmethod
    async def get_running_games(cls):
        """Get all running game IDs"""
        async with await cls.get_redis(cls.REDIS_URL) as redis_conn:
            return await redis_conn.smembers(cls.RUNNING_GAMES)


    @classmethod
    async def _get_games_detail(cls, game_ids: list) -> list:
        """
        Shared method to get detailed game information for a list of game IDs
        """
        try:
            # Early return if no games
            if not game_ids:
                return []
                
            # Get all game settings in batch
            async with await cls.get_redis_binary(cls.REDIS_GAME_URL) as redis_game:
                pipe = redis_game.pipeline()
                for game_id in game_ids:
                    pipe.get(f"game_settings:{game_id}")
                settings_results = await pipe.execute()
                
            # Get all player counts in batch
            async with await cls.get_redis(cls.REDIS_GAME_URL) as redis_conn:
                pipe = redis_conn.pipeline()
                for game_id in game_ids:
                    pipe.scard(f"game_players:{game_id}")
                    pipe.keys(f"{cls.BOOKED_USER_PREFIX}*:{game_id}")
                player_results = await pipe.execute()
                
            # Process results
            detailed_games = []
            for idx, game_id in enumerate(game_ids):
                try:
                    settings_data = settings_results[idx]
                    if not settings_data:
                        continue
                        
                    game_settings = msgpack.unpackb(settings_data)
                    current_players = player_results[idx * 2] or 0
                    reserved_players = len(player_results[idx * 2 + 1]) if player_results[idx * 2 + 1] else 0
                    
                    game_info = {
                        'game_id': game_id,
                        'mode': game_settings.get('mode'),
                        'type': game_settings.get('type'),
                        'sides': game_settings.get('sides'),
                        'score': game_settings.get('score'),
                        'num_players': game_settings.get('num_players'),
                        'min_players': game_settings.get('min_players'),
                        'initial_ball_speed': game_settings.get('initial_ball_speed'),
                        'paddle_length': game_settings.get('paddle_length'),
                        'paddle_width': game_settings.get('paddle_width'),
                        'ball_size': game_settings.get('ball_size'),
                        'players': {
                            'current': current_players,
                            'reserved': reserved_players,
                            'total_needed': game_settings.get('num_players', 0)
                        }
                    }
                    detailed_games.append(game_info)
                    
                except Exception as e:
                    print(f"Error processing game {game_id}: {e}")
                    continue
                    
            return detailed_games
                
        except Exception as e:
            print(f"Error getting games detail: {e}")
            return []

    @classmethod
    async def get_waiting_games_info(cls) -> list:
        """Get detailed information for all waiting games"""
        try:
            games = await cls.get_waiting_games()
            game_ids = [game_id.decode('utf-8') if isinstance(game_id, bytes) else game_id 
                       for game_id in games]
            return await cls._get_games_detail(game_ids)
        except Exception as e:
            print(f"Error getting waiting games info: {e}")
            return []

    @classmethod
    async def get_running_games_info(cls) -> list:
        """Get detailed information for all running games"""
        try:
            games = await cls.get_running_games()
            game_ids = [game_id.decode('utf-8') if isinstance(game_id, bytes) else game_id 
                       for game_id in games]
            return await cls._get_games_detail(game_ids)
        except Exception as e:
            print(f"Error getting running games info: {e}")
            return []



    
    @classmethod
    async def get_all_settings_from_game(cls, game_id) -> dict:
        async with await cls.get_redis_binary(cls.REDIS_GAME_URL) as redis_game:
            stored_values = await redis_game.get(f"game_settings:{game_id}")
        return_value = msgpack.unpackb(stored_values)
        return return_value

    @classmethod
    async def is_player_playing(cls, user_id) -> bool:
        """
        Check if a player is currently booked or playing in any game.
        Uses Redis EXISTS to check for presence of status keys.
        Returns True if player is playing/booked, False if they're available.
        """
        try:
            async with await cls.get_redis(cls.REDIS_GAME_URL) as redis_conn:
                # Check if either key exists using EXISTS command
                async for key in redis_conn.scan_iter(
                    f"{cls.BOOKED_USER_PREFIX}{user_id}:*"
                ):
                    print("player is booked: ", key)
                    return True

                # Check for playing status
                async for key in redis_conn.scan_iter(
                    f"{cls.PLAYING_USER_PREFIX}{user_id}:*"
                ):
                    print("player is playing: ", key)
                    return True

                return False

        except Exception as e:
            print(f"Error checking player status: {e}")
            return False

    @classmethod
    async def cleanup_invalid_bookings(cls, redis_conn: redis.Redis, game_id: str):
        """Cleanup invalid bookings using Redis commands"""
        try:
            async with RedisLock(redis_conn, f"{game_id}_cleanup_invalid_bookings"):
                # Store booked user IDs in a temporary set
                temp_set = f"temp_valid_bookings:{game_id}"
                pipe = redis_conn.pipeline()
                # Track if we found any booked users
                found_bookings = False
                # Get booked users using scan instead of keys
                async for key in redis_conn.scan_iter(
                    f"{cls.BOOKED_USER_PREFIX}*:{game_id}"
                ):
                    found_bookings = True
                    user_id = key.split(":")[0].replace(f"{cls.BOOKED_USER_PREFIX}", "")
                    pipe.sadd(temp_set, user_id)
                if not found_bookings:
                    return True
                # Use Redis SDIFF to find invalid users
                pipe.sdiff(f"game_booked_players:{game_id}", temp_set)
                pipe.delete(temp_set)

                results = await pipe.execute()
                invalid_users = results[-2]  # Get SDIFF result

                if invalid_users:
                    await redis_conn.srem(
                        f"game_booked_players:{game_id}", *invalid_users
                    )

                return True

        except Exception as e:
            print(f"Error cleaning up invalid bookings: {e}")
            raise

    @classmethod
    async def get_player_count_info(cls, game_id: str) -> dict:
        """Get player counts for frontend display - no locks needed"""
        try:
            async with await cls.get_redis(cls.REDIS_GAME_URL) as redis_conn:
                pipe = redis_conn.pipeline()
                pipe.scard(f"game_players:{game_id}")
                pipe.keys(f"{cls.BOOKED_USER_PREFIX}*:{game_id}")
                
                results = await pipe.execute()
                return {
                    "status": True,
                    "current_players": results[0] or 0,
                    "reserved_players": len(results[1]) if results[1] else 0
                }
        except Exception as e:
            print(f"Error getting player counts: {e}")
            return {"status": False, "current_players": 0, "reserved_players": 0}




    @classmethod
    async def player_situation(cls, game_id: str) -> dict:
        try:
            async with await cls.get_redis(cls.REDIS_GAME_URL) as redis_conn:
                async with RedisLock(redis_conn, f"{game_id}_player_situation"):
                    # await cls.cleanup_invalid_bookings(redis_conn, game_id)
                    current_players = await redis_conn.scard(f"game_players:{game_id}")
                    booking_count = 0
                    async for _ in redis_conn.scan_iter(
                        f"{cls.BOOKED_USER_PREFIX}*:{game_id}"
                    ):
                        booking_count += 1
                    return {
                        "status": True,
                        "current_players": current_players,
                        "reserved_players": booking_count,
                    }

        except Exception as e:
            print(f"Error player_situation: {e}")
            return {"status": False, "current_players": None, "reserved_players": None}

    @classmethod
    async def join_game(cls, user_id, game_id) -> dict:
        # session = request.session
        try:
            # Get game settings to check player limits
            async with await cls.get_redis(cls.REDIS_GAME_URL) as redis_conn:
                num_players = await redis_conn.get(
                    f"{cls.NUM_PLAYERS_PREFIX}:{game_id}"
                )
                if not num_players:
                    return {
                        "available": False,
                        "message": "Game not found",
                        "status": 404,
                    }
                async with RedisLock(redis_conn, f"{game_id}"):
                    player_situation = await cls.player_situation(game_id)
                    total_players = (
                        player_situation["current_players"]
                        + player_situation["reserved_players"]
                    )
                    if total_players >= int(num_players):
                        return {
                            "available": False,
                            "message": "No available slots in this game",
                            "status": 503,
                        }
                    async with RedisLock(redis_conn, f"{game_id}_player_situation"):
                        # create
                        await redis_conn.set(
                            f"{cls.BOOKED_USER_PREFIX}{user_id}:{game_id}",
                            "",
                            ex=5,  # 5 sec None if tournament
                        )
                print(f"KEY: {cls.BOOKED_USER_PREFIX}{user_id}:{game_id}")
                return {"available": True}

        except Exception as e:
            print(f"Error in join_game: {e}")
            return {
                "available": False,
                "message": f"Error in join_game: {e}",
                "status": 500,
            }

    # from AGameManager

    @classmethod
    async def set_to_waiting_game(cls, game_id):
        """"""
        async with await cls.get_redis(cls.REDIS_URL) as redis_conn:
            await redis_conn.sadd(cls.WAITING_GAMES, str(game_id))

    @classmethod
    async def set_to_running_game(cls, game_id):
        async with await cls.get_redis(cls.REDIS_URL) as redis_conn:
            async with RedisLock(redis_conn, cls.LOCK_KEYS["running"]):
                # Remove from waiting games and add to running games in a pipeline
                pipe = redis_conn.pipeline()
                pipe.srem(cls.WAITING_GAMES, str(game_id))
                pipe.sadd(cls.RUNNING_GAMES, str(game_id))
                await pipe.execute()

                # Update game status in game database
                async with await cls.get_redis(cls.REDIS_GAME_URL) as redis_game:
                    await redis_game.set(f"game_running:{game_id}", "1")

    @classmethod
    async def set_to_finished_game(cls, game_id):
        async with await cls.get_redis(cls.REDIS_URL) as redis_conn:
            async with RedisLock(redis_conn, cls.LOCK_KEYS["finished"]):
                # Remove from running games and add to finished games in a pipeline
                pipe = redis_conn.pipeline()
                pipe.srem(cls.RUNNING_GAMES, str(game_id))
                pipe.sadd(cls.FINISHED_GAMES, str(game_id))
                await pipe.execute()

                # Update game status in game database
                async with await cls.get_redis(cls.REDIS_GAME_URL) as redis_game:
                    pipe = redis_game.pipeline()
                    pipe.set(f"game_running:{game_id}", "0")
                    pipe.set(f"game_finished:{game_id}", "1")
                    await pipe.execute()




    # some more calls
    @classmethod
    async def cancel_booking(cls, user_id: str) -> dict:
        """
        Cancel all bookings for a user, logging if multiple bookings found
        """
        try:
            async with await cls.get_redis(cls.REDIS_GAME_URL) as redis_conn:
                bookings = []
                async for key in redis_conn.scan_iter(f"{cls.BOOKED_USER_PREFIX}{user_id}:*"):
                    bookings.append(key)

                if not bookings:
                    return {
                        "status": False,
                        "message": "No booking found for this user"
                    }

                if len(bookings) > 1:
                    logger.error(f"User {user_id} had multiple bookings: {bookings}")

                for booking in bookings:
                    game_id = booking.split(":")[-1]
                    async with RedisLock(redis_conn, f"{game_id}_player_situation"):
                        await redis_conn.delete(booking)
                
                return {
                    "status": True,
                    "message": "Booking(s) cancelled successfully",
                    "error": "Multiple bookings found and removed" if len(bookings) > 1 else None
                }
                
        except Exception as e:
            logger.error(f"Error cancelling booking for user {user_id}: {e}")
            return {
                "status": False,
                "message": f"Error cancelling booking: {e}"
            }








    # for user managment
    # is user online
    @classmethod
    async def is_user_online(cls, user_id: str) -> bool:
        try:
            async with await cls.get_redis(cls.REDIS_GAME_URL) as redis_conn:
                return bool(
                    await redis_conn.exists(f"{cls.USER_ONLINE_PREFIX}{user_id}")
                )
        except Exception as e:
            print(f"Error checking online status: {e}")
            return False

    @classmethod
    async def set_user_online(cls, user_id: str):
        """
        Set or refresh user's online status.
        Each call resets the expiry timer to USER_ONLINE_EXPIRY seconds.
        """
        try:
            async with await cls.get_redis(cls.REDIS_GAME_URL) as redis_conn:
                await redis_conn.set(
                    f"{cls.USER_ONLINE_PREFIX}{user_id}",
                    "",  # Empty value since we just need the key
                    ex=cls.USER_ONLINE_EXPIRY,
                )
        except Exception as e:
            print(f"Error setting online status: {e}")

    @classmethod
    async def set_user_offline(cls, user_id: str):
        try:
            async with await cls.get_redis(cls.REDIS_GAME_URL) as redis_conn:
                await redis_conn.delete(f"{cls.USER_ONLINE_PREFIX}{user_id}")
        except Exception as e:
            print(f"Error setting offline status: {e}")
