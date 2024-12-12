import asyncio
import msgpack
import redis.asyncio as redis
from ..gamecoordinator.GameCoordinator import GameCoordinator as GC
from ..gamecoordinator.GameCoordinator import RedisLock
import logging
import time


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
       

=======
 
>>>>>>> main
        # Check if player is booked -> add also already tournament key
        booking_key = f"{GC.BOOKED_USER_PREFIX}{player_id}:{self.game_id}"
        tournament_key = f"{GC.TOURNAMENT_USER_PREFIX}{player_id}:{self.game_id}"   # f"{GC.TOURNAMENT_USER_PREFIX}{player_id}:{self.game_id}" 
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
        print("aa") 
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
        paddle_index = self.active_sides.index(available_index)
        current_time = time.time()
        pipeline = self.redis_conn.pipeline()
        pipeline.sadd(self.players_key, player_id)
        pipeline.set(f"{self.game_id}:player_side:{player_id}", str(available_index).encode())
        pipeline.set(f"{self.game_id}:paddle_index:{player_id}", str(paddle_index).encode())
        pipeline.set(f"{self.game_id}:side_player:{available_index}", player_id.encode())
        pipeline.set(f"{GC.PLAYING_USER_PREFIX}{player_id}:{self.game_id}", b"1")
        pipeline.set(f"player_join_time:{self.game_id}:{player_id}", str(current_time).encode())
        pipeline.delete(booking_key)
        pipeline.delete(tournament_key)
        await pipeline.execute()
        return {
            "role": "player",
            "index": available_index,
            "paddle_index":  paddle_index,
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
            paddle_index = await self.redis_conn.get(f"{self.game_id}:paddle_index:{player_id}")
            is_running = await self.redis_conn.get(self.running_key) == b"1"
            is_tournament = await self.redis_conn.get(f"game_is_tournament:{self.game_id}")

            if not side_index:
                logger.error(f"Error removing player: side_index not found for {player_id}")
                return False
            side_index = int(side_index.decode()) if isinstance(side_index, bytes) else int(side_index)
            paddle_index = int(paddle_index.decode()) if isinstance(paddle_index, bytes) else int(paddle_index)

            # Handle different scenarios
            if not is_running:
                # Scenario 1: Player leaves before game starts
                if is_tournament:
                    await self._handle_tournament_pregame_leave(player_id, side_index)
                else:
                    await self._handle_normal_pregame_leave(player_id, side_index)
            else:
                # Scenario 2: Player leaves during game
                player_count = await self.redis_conn.scard(self.players_key)
                await self._handle_ingame_leave(player_id, side_index, player_count, paddle_index)
            
            return True
            
    except Exception as e:
        logger.error(f"Error removing player: {e}")
        return False


async def _handle_normal_pregame_leave(self, player_id: str, side_index: int):
    """Handle normal player leaving before game starts"""
    try:
        # Simply remove player data
        pipeline = self.redis_conn.pipeline()
        pipeline.srem(self.players_key, player_id)
        pipeline.delete(f"{self.game_id}:player_side:{player_id}")
        pipeline.delete(f"{self.game_id}:side_player:{side_index}")
        pipeline.delete(f"player_join_time:{self.game_id}:{player_id}")
        pipeline.delete(f"{GC.PLAYING_USER_PREFIX}{player_id}:{self.game_id}")
        await pipeline.execute()
        
        # Notify other players
        await self.channel_layer.group_send(
            f"game_{self.game_id}",
            {
                "type": "player_left",
                "player_id": player_id,
                "side_index": side_index,
                "message": "Player left before game started"
            }
        )
        
    except Exception as e:
        logger.error(f"Error handling normal pre-game leave: {e}")
        raise


# not right !!
async def _handle_tournament_pregame_leave(self, player_id: str, side_index: int):
    """Handle tournament player leaving before game starts"""
    try:
        # Set score to 0 for forfeiting player in game state
        state_data = await self.redis_conn.get(self.state_key)
        if state_data:
            current_state = msgpack.unpackb(state_data)
            current_state["scores"][side_index] = 0
            await self.redis_conn.set(self.state_key, msgpack.packb(current_state))
        
        # Remove player data
        pipeline = self.redis_conn.pipeline()
        pipeline.srem(self.players_key, player_id)
        pipeline.delete(f"{self.game_id}:player_side:{player_id}")
        pipeline.delete(f"{self.game_id}:side_player:{side_index}")
        pipeline.delete(f"player_join_time:{self.game_id}:{player_id}")
        pipeline.delete(f"{GC.PLAYING_USER_PREFIX}{player_id}:{self.game_id}")
        await pipeline.execute()
        
        # Notify other players
        await self.channel_layer.group_send(
            f"game_{self.game_id}",
            {
                "type": "player_forfeit",
                "player_id": player_id,
                "side_index": side_index,
                "message": "Player forfeited tournament by leaving"
            }
        )
        
    except Exception as e:
        logger.error(f"Error handling tournament pre-game leave: {e}")
        raise


async def _handle_ingame_leave(self, player_id: str, side_index: int, player_count: int, paddle_index: int):
    """Handle player leaving during active game"""
    try:
        # Use the same state lock as game_update
        async with RedisLock(self.redis_conn, f"{self.game_id}_state"):
            # Get current state to modify
            state_data = await self.redis_conn.get(self.state_key)
            if not state_data:
                raise ValueError("Game state not found")
            
            current_state = msgpack.unpackb(state_data)
            
            if player_count <= 2:
                # Last player leaving gives opponents 11 points, themselves 0
                current_state["scores"] = [11 if i != paddle_index else 0 for i in range(len(current_state["scores"]))]
                game_over = True
            else:
                # Convert player's paddle to wall
                if "paddles" in current_state:
                    for paddle in current_state["paddles"]:
                        if paddle.get("side_index") == side_index:
                            paddle["is_wall"] = True
                            paddle["active"] = False
                current_state["scores"][side_index] = 0
                for i, ball in enumerate(current_state.get("balls", [])):
                    current_state["balls"][i] = self.reset_ball(ball, i)
                game_over = False
            # Update state within the same lock
            print("STAAAATE: ", current_state)
            await self.redis_conn.set(self.state_key, msgpack.packb(current_state))
        
        # Notify other players
        await self.channel_layer.group_send(
            f"game_{self.game_id}",
            {
                "type": "player_disconnected",
                "player_id": player_id,
                "side_index": side_index,
                "converted_to_wall": player_count > 2,
                "game_over": game_over,
                "state": current_state
            }
        )
        
        if game_over:
            await self.end_game()
        # Remove player data - can be outside state lock since it's player-specific
        pipeline = self.redis_conn.pipeline()
        pipeline.srem(self.players_key, player_id)
        pipeline.delete(f"{self.game_id}:player_side:{player_id}")
        pipeline.delete(f"{self.game_id}:side_player:{side_index}")
        pipeline.delete(f"player_join_time:{self.game_id}:{player_id}")
        pipeline.delete(f"{GC.PLAYING_USER_PREFIX}{player_id}:{self.game_id}")
        await pipeline.execute()
        
        
    except Exception as e:
        logger.error(f"Error handling in-game leave: {e}")
        raise


    """
            if side_index:  # If we found their side index
                pipeline = self.redis_conn.pipeline()
                # Remove from the main players set
                pipeline.srem(self.players_key, player_id)
                # Delete the player-to-side mapping
                pipeline.delete(f"{self.game_id}:player_side:{player_id}")
                # Delete the side-to-player mapping
                pipeline.delete(f"{self.game_id}:side_player:{side_index}")
                # remove time
                pipeline.delete(f"player_join_time:{self.game_id}:{player_id}"
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
        """

