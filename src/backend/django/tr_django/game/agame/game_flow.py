import redis.asyncio as redis
import msgpack
import asyncio
from .AGameManager import GameStateError
import math
from ..gamecoordinator.GameCoordinator import GameCoordinator, RedisLock
import logging
import time



logger = logging.getLogger(__name__)


async def error_exit(self, error_message: str, error_details: str = None):
    """Handle graceful error exit with user communication and cleanup"""
    try:
        # Notify users about the error
        await self.channel_layer.group_send(
            f"game_{self.game_id}",
            {
                "type": "error",
                "error": error_message,
                "details": error_details or "Game terminated due to error",
            }
        )
        
        # Clean up game through GameCoordinator - will remove all game keys including running_key
        await GameCoordinator.cleanup_game(self.game_id)
        

    except Exception as e:
        logger.error(f"Error during error_exit cleanup: {e}")
        # Attempt cleanup again in case of failure
        try:
            await GameCoordinator.cleanup_game(self.game_id)
        except Exception as cleanup_error:
            logger.error(f"Final cleanup attempt failed: {cleanup_error}")





async def start_game(self):
    """Start game with process-safe checks"""

    waiting_after_leaving = 300 # 5min 
    try:
        players = self.settings.get("num_players")
        await GameCoordinator.set_to_waiting_game(self.game_id)

        
        redis_str = await GameCoordinator.get_redis(GameCoordinator.REDIS_GAME_URL)
        redis_bin = await GameCoordinator.get_redis_binary(GameCoordinator.REDIS_GAME_URL)        

        # Use async context managers for both Redis connections
        # async with await GameCoordinator.get_redis(GameCoordinator.REDIS_GAME_URL) as redis_str, \
        #          await GameCoordinator.get_redis_binary(GameCoordinator.REDIS_GAME_URL) as redis_bin:


        while True:
            async with RedisLock(self.redis_conn, f"{self.game_id}_player_situation"):
                player_count = await self.redis_conn.scard(self.players_key)
                if player_count == 0:
                    logger.info( f"{self.game_id}: exit task but stat stays in redis for {waiting_after_leaving}")
                    await GameCoordinator.set_to_waiting_game(self.game_id, waiting_after_leaving)
                    return
                if player_count >= players:
                    break
            logger.info(f"{self.game_id}: Waiting for players... ({player_count}/{players})")
            await self.channel_layer.group_send(
                f"game_{self.game_id}",
                {
                    "type": "waiting",
                    "current_players": player_count,
                    "required_players": players,
                    "message": f"Waiting for players... ({player_count}/{players})",
                },
            )

            await asyncio.sleep(1)
        pipeline = self.redis_conn.pipeline()
        current_time = time.time()
        pipeline.set(self.running_key, b"1")
        pipeline.set(f"game_start_time:{self.game_id}", str(current_time).encode())        
        await pipeline.execute()


        logger.debug(
        f"""DEBUG    
        sides: {self.num_sides} 
        paddles: {self.num_paddles} 
        mode: {self.game_mode} 
        shape: {self.game_shape} 
        score: {self.score_mode} 
        active_sides:  {self.active_sides}
        vertices:  {self.vertices}
        scale: {self.scale}
        normals:  {self.side_normals}         
        inner_boundary: {self.inner_boundary}  
        ball_mov: {self.previous_movements, type(self.previous_movements)}"""
        )
        # countdown
        timer = 11
        while timer:
 
            timer -= 1       
            await self.channel_layer.group_send(
                f"game_{self.game_id}",
                {
                    "type": "timer",
                    "timer": timer,
                })
            await asyncio.sleep(1) 

        await GameCoordinator.set_to_running_game(self.game_id)

        while await self.redis_conn.get(self.running_key) == b"1":
            game_over = await self.update_game()
            if game_over:
                await self.end_game()  # can be sync not async !
                break
            await asyncio.sleep(0.016)  # ~60 FPS
    except Exception as e:
        logger.error(f"Error in start_game: {e}")
        await self.error_exit("Error in start_game" , f"{e}")
        return


async def end_game(self):
    """End game with process-safe cleanup"""
    try:
        await GameCoordinator.set_to_finished_game(self.game_id)
        print("end now the datavbase")
        await GameCoordinator.store_game_in_database(self.game_id)
        # Keep game state briefly for end-game display
        # would be handle by GameCoordinator 
        print ("the END")
    except Exception as e:
        logger.error(f"Error ending game: {e}")
        await self.error_exit("Error in ending game" , f"{e}")

async def update_game(self):
    """Process-safe game update with enhanced error handling"""

    try:
        # Get current state with error handling
        try:
            state_data = await self.redis_conn.get(self.state_key)
            current_state = msgpack.unpackb(state_data) if state_data else None
        except msgpack.UnpackException as e:
            logger.error(f"Error unpacking game state: {e}")
            await self.channel_layer.group_send(
                f"game_{self.game_id}",
                {
                    "type": "error",
                    "error": "Game state corruption detected",
                    "details": str(e),
                },
            )
            return False

        if not current_state:
            await self.channel_layer.group_send(
                f"game_{self.game_id}",
                {
                    "type": "error",
                    "error": "Game state not found",
                },
            )
            return False

        # Verify state before proceeding
        try:
            self.verify_game_state(current_state)
        except GameStateError as e:
            logger.error(f"Game state validation error: {e}")
            await self.channel_layer.group_send(
                f"game_{self.game_id}",
                {
                    "type": "error",
                    "error": "Invalid game state detected",
                    "details": str(e),
                },
            )
            return False

        # Update paddle positions in state
        paddle_positions = await self.get_paddle_positions()
        active_paddle_count = 0
        for paddle in current_state["paddles"]:
            if paddle["active"]:
                paddle["position"] = paddle_positions.get(active_paddle_count, 0.5)
                active_paddle_count += 1
        # Run game logic
        new_state, game_over, cycle_data = await self.game_logic(current_state)

        # Verify new state
        try:
            self.verify_game_state(new_state)
        except GameStateError as e:
            logger.error(f"New game state validation error: {e}")
            await self.channel_layer.group_send(
                f"game_{self.game_id}",
                {
                    "type": "error",
                    "error": "Game logic produced invalid state",
                    "details": str(e),
                },
            )
            return False

        # Save new state
        try:
            packed_state = msgpack.packb(new_state)
            await self.redis_conn.set(self.state_key, packed_state)
        except Exception as e:
            logger.error(f"Error saving game state: {e}")
            await self.channel_layer.group_send(
                f"game_{self.game_id}",
                {
                    "type": "error",
                    "error": "Failed to save game state",
                    "details": str(e),
                },
            )
            return False

        # Broadcast update
        winner = self.check_winner(new_state["scores"]) if game_over else None
        await self.channel_layer.group_send(
            f"game_{self.game_id}",
            {
                "type": "game_finished" if game_over else "game_state",
                "game_state": new_state,
                "winner": winner,
            },
        )
        if len(cycle_data["events"]) > 0:
            await self.channel_layer.group_send(
                f"game_{self.game_id}",
                {"type": "game_collision", "data": cycle_data["events"]},
            )

        return game_over

    except Exception as e:
        logger.error(f"Error in update_game: {e}")
        await self.error_exit("Error in update_game" , f"{e}")
        return False




