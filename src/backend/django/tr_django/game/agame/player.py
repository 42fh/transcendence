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


        # Check if player exists
        if await self.redis_conn.sismember(self.players_key, player_id):
            return {
                "role": "spectator",
                "message": "Already connected - switching to spectator mode",
            }
       

 
        # Check if player is booked -> add also already tournament key
        booking_key = f"{GC.BOOKED_USER_PREFIX}{player_id}:{self.game_id}"
        tournament_key = f"{GC.BOOKED_USER_PREFIX}{player_id}:{self.game_id}"   # f"{GC.TOURNAMENT_USER_PREFIX}{player_id}:{self.game_id}" 
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
            # check max player
            max_players = self.settings.get("num_players")
            current_count = await self.redis_conn.scard(self.players_key)
            if current_count >= max_players:
                return {"role": "spectator", "message": "Game full - joining as spectator"}
            
            # get index_site
            active_sides = self.settings.get("players_sides")
            taken_index = []
            for side_index in active_sides:
                # Check if this position is taken
                if await self.redis_conn.exists(f"{self.game_id}:side_player:{side_index}"):
                    taken_index.append(side_index)
            
            # Find first available position
            available_index = None
            for side_index in active_sides:
                if side_index not in taken_index:
                    available_index = side_index
                    break
            if available_index is None:
                return {"role": "spectator", "message": "No positions available"}
            pipeline = self.redis_conn.pipeline()
            pipeline.sadd(self.players_key, player_id)
            pipeline.set(f"{self.game_id}:player_side:{player_id}", available_index)
            pipeline.set(f"{self.game_id}:side_player:{available_index}", player_id)
            pipeline.set(f"{GC.PLAYING_USER_PREFIX}{player_id}:{self.game_id}", "1")
            pipeline.delete(booking_key)
            pipeline.delete(tournament_key)
            await pipeline.execute()
            return {
                "role": "player",
                "index": available_index,
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
            # First get the player's side index before we remove anything
            side_index = await self.redis_conn.get(f"{self.game_id}:player_side:{player_id}")
            
            if side_index:  # If we found their side index
                pipeline = self.redis_conn.pipeline()
                # Remove from the main players set
                pipeline.srem(self.players_key, player_id)
                # Delete the player-to-side mapping
                pipeline.delete(f"{self.game_id}:player_side:{player_id}")
                # Delete the side-to-player mapping
                pipeline.delete(f"{self.game_id}:side_player:{side_index}")
                # Remove from playing users
                pipeline.delete(f"{GC.PLAYING_USER_PREFIX}{player_id}:{self.game_id}")
                await pipeline.execute()

                # Check remaining players for game continuity
                remaining = await self.redis_conn.scard(self.players_key)
                min_players = self.settings.get("min_players")

                if remaining < min_players:
                    await self.end_game()
                
                return True

        logger.error(f"Error removing player: side_index not found")    
        return False
    
    except Exception as e:
        logger.error(f"Error removing player: {e}")
        return False
