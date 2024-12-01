import redis.asyncio as redis
import msgpack
import asyncio
from .AGameManager import GameStateError
import math
from ..gamecordinator.GameCordinator import GameCordinator , RedisLock  
import logging 

logger = logging.getLogger(__name__)

async def start_game(self):
    """Start game with process-safe checks"""
    try:
        min_players = self.settings.get("min_players")
        await GameCordinator.set_to_waiting_game(self.game_id) 
        while True:
            player_count = await self.redis_conn.scard(self.players_key)
            if player_count == 0:
                await self.end_game()
                return
            if player_count >= min_players:
                break
            logger.info(f"{self.game_id}: Waiting for players... ({player_count}/{min_players})")
            await self.channel_layer.group_send(
                f"game_{self.game_id}",
                {
                    "type": "waiting",
                    "current_players": player_count,
                    "required_players": min_players,
                    "message": f"Waiting for players... ({player_count}/{min_players})",
                },
            )
            
            await asyncio.sleep(1)

        await self.redis_conn.set(self.running_key, b"1")
        logger.debug(f"""DEBUG    
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
        ball_mov: {self.previous_movements, type(self.previous_movements)}""")
        await GameCordinator.set_to_running_game(self.game_id)
        while await self.redis_conn.get(self.running_key) == b"1":
            game_over = await self.update_game()
            if game_over:
                await self.end_game()  # can be sync not async !
                break
            await asyncio.sleep(0.016)  # ~60 FPS
    except Exception as e:
        logger.error(f"Error in start_game: {e}")
        await self.end_game()
        return

async def end_game(self):
    """End game with process-safe cleanup"""
    try:
        # await self.redis_conn.set(self.running_key, b"0")
        await GameCordinator.set_to_finished_game(self.game_id)
        # Keep game state briefly for end-game display
        for key in [
            self.state_key,
            self.players_key,
            self.settings_key,
            self.paddles_key,
            self.running_key,
            self.settings_key,
            self.lock_key,
            self.type_key,
        ]:
            # await self.redis_conn.expire(key, 300)  # 5 minute expiry
            await self.redis_conn.expire(key, 1)  # 1 sec expiry

        logger.info(f"Game {self.game_id} has ended.")

    except Exception as e:
        logger.error(f"Error ending game: {e}")


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
                "winner": winner
            },
        )
        if len(cycle_data["events"]) > 0:
            await self.channel_layer.group_send(
                f"game_{self.game_id}",
                {
                    "type": "game_collision",
                    "data": cycle_data["events"]
                },
            )
            

        

        return game_over

    except Exception as e:
        logger.error(f"Error in update_game: {e}")
        await self.channel_layer.group_send(
            f"game_{self.game_id}",
            {"type": "error", "error": "Game update failed", "details": str(e)},
        )
        await self.end_game()
        return False

