import asyncio
import msgpack
import redis.asyncio as redis


async def add_player(self, player_id):
    """Add player with process-safe checks"""
    try:
        settings = msgpack.unpackb(await self.redis_conn.get(self.settings_key))
        max_players = settings.get("num_players", 2)

        # Check if player exists
        if await self.redis_conn.sismember(self.players_key, str(player_id)):
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
        # Add player atomically
        if await self.redis_conn.sadd(self.players_key, str(player_id)):
            # Initialize player data
            return {
                "role" : "player",
                "index": current_count,
                "position": 0.5,
                "settings": settings.get("player_settings", {}),
                "message" : "Successfully joined as player"
            }

        return False

    except Exception as e:
        print(f"Error adding player: {e}")
        return False


async def remove_player(self, player_id):
    """Remove player with process-safe cleanup"""
    try:
        if await self.redis_conn.srem(self.players_key, str(player_id)):
            remaining = await self.redis_conn.scard(self.players_key)

            settings = msgpack.unpackb(await self.redis_conn.get(self.settings_key))
            min_players = settings.get("min_players", 2)

            if remaining < min_players:
                await self.end_game()
            elif remaining == 0:
                # Clean up game
                await self.redis_conn.delete(
                    self.state_key,
                    self.players_key,
                    self.running_key,
                    self.settings_key,
                    self.paddles_key,
                    self.lock_key,
                )
            return True
        return False

    except Exception as e:
        print(f"Error removing player: {e}")
        return False
