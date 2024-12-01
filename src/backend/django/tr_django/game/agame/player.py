import asyncio
import msgpack
import redis.asyncio as redis
from ..gamecordinator.GameCordinator import GameCordinator as GC 
from ..gamecordinator.GameCordinator import RedisLock


async def add_player(self, player_id):
    """Add player with process-safe checks"""
    try:
        
        
        max_players = self.settings.get("num_players")

        # Check if player exists
        if await self.redis_conn.sismember(self.players_key, player_id):
            return {
                "role" : "spectator",
                "message" : "Already connected - switching to spectator mode"
            }

        # Check if game is full
        current_count = await self.redis_conn.scard(self.players_key)
        if current_count >= max_players:
            return {
                "role" : "spectator",
                "message" : "Game full - joining as spectator"
            }
        # Check if player is booked
        booking_key = f"{GC.BOOKED_USER_PREFIX}{player_id}:{self.game_id}"
        print(booking_key)
        is_booked = await self.redis_conn.exists(booking_key)
        if not is_booked:
            return {
                "role": "spectator",
                "message": "No booking found - joining as spectator"
            }

        async with RedisLock(self.redis_conn, f"{self.game_id}_player_situation"):
            pipeline = self.redis_conn.pipeline()
            pipeline.sadd(self.players_key, player_id)
            pipeline.delete(booking_key)
            await pipeline.execute()
            return {
                "role" : "player",
                "index": current_count,
                "position": 0.5,
                "settings": self.settings.get("player_settings"),
                "message" : "Successfully joined as player"
            }

    except Exception as e:
        print(f"Error adding player: {e}")
        return False


async def remove_player(self, player_id):
    """Remove player with process-safe cleanup"""
    try:
        async with RedisLock(self.redis_conn, f"{self.game_id}_player_situation"):
            if await self.redis_conn.srem(self.players_key, player_id):
                remaining = await self.redis_conn.scard(self.players_key)

                min_players = self.settings.get("min_players")

                
                if remaining < min_players:
                    await self.end_game()
                await self.redis_conn.delete(f"{GC.PLAYING_USER_PREFIX}{player_id}:{self.game_id}")
                return True
        return False

    except Exception as e:
        print(f"Error removing player: {e}")
        return False
