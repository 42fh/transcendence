import asyncio
import msgpack
import redis.asyncio as redis
from ..gamecoordinator.GameCoordinator import GameCoordinator as GC
from ..gamecoordinator.GameCoordinator import RedisLock
import logging

logger = logging.getLogger(__name__)


async def add_player(self, player_id):
    """Add player with process-safe checks"""
    try:

        max_players = self.settings.get("num_players")

        # Check if player exists
        if await self.redis_conn.sismember(self.players_key, player_id):
            return {
                "role": "spectator",
                "message": "Already connected - switching to spectator mode",
            }

        # Check if game is full
        current_count = await self.redis_conn.scard(self.players_key)
        if current_count >= max_players:
            return {"role": "spectator", "message": "Game full - joining as spectator"}
        # Check if player is booked regulat or in a tournamnet
        booking_key = f"{GC.BOOKED_USER_PREFIX}{player_id}:{self.game_id}"
        tournament_key = f"{GC.TOURNAMENT_USER_PREFIX}{player_id}:{self.game_id}"
        logger.debug(f"KEYS: {booking_key} / {tournament_key}")
        pipeline = self.redis_conn.pipeline()
        pipeline.exists(booking_key)
        pipeline.exists(tournament_key)
        is_booked, is_tournament_player = await pipeline.execute()

        if not (is_booked or is_tournament_player):
            return {
                "role": "spectator",
                "message": "No booking found - joining as spectator",
            }

        async with RedisLock(self.redis_conn, f"{self.game_id}_player_situation"):
            pipeline = self.redis_conn.pipeline()
            pipeline.sadd(self.players_key, player_id)
            pipeline.set(f"{GC.PLAYING_USER_PREFIX}{player_id}:{self.game_id}", "1")
            pipeline.delete(booking_key)
            pipeline.delete(tournament_key)
            await pipeline.execute()
            return {
                "role": "player",
                "index": current_count,
                "position": 0.5,
                "settings": self.settings.get("player_settings"),
                "message": "Successfully joined as player",
            }

    except Exception as e:
        logger.error(f"Error adding player: {e}")
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
                await self.redis_conn.delete(
                    f"{GC.PLAYING_USER_PREFIX}{player_id}:{self.game_id}"
                )
                return True
        return False

    except Exception as e:
        logger.error(f"Error removing player: {e}")
        return False
