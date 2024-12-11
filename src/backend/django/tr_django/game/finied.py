from django.utils import timezone
from django.db import transaction

def save_game_results(game_id: str, player_data: list, winner_id: int = None):
    """
    Save completed game data to database.
    
    Args:
        game_id: The game's identifier
        player_data: List of tuples containing (player_id, score)
        winner_id: ID of winning player if any
    """
    try:
        with transaction.atomic():
            # Create the SingleGame record
            game = SingleGame.objects.create(
                id=game_id,
                status=SingleGame.FINISHED,
                created_at=timezone.now(),
                finished_at=timezone.now()
            )

            # Save player stats
            for player_id, score in player_data:
                player = Player.objects.get(id=player_id)
                PlayerGameStats.objects.create(
                    single_game=game,
                    player=player,
                    score=score
                )
                
                # Update player's win/loss record
                won = player_id == winner_id
                player.update_stats(won=won)

            # Set winner if provided
            if winner_id:
                winner = Player.objects.get(id=winner_id)
                game.winner = winner
                game.save()

        return True

    except Exception as e:
        logger.error(f"Error saving game results: {e}")
        return False




@classmethod
async def handle_game_completion(cls, game_id: str, winner_id: str, final_state: dict):
    """Handle game completion for both tournament and regular games"""
    try:
        async with await cls.get_redis(cls.REDIS_GAME_URL) as redis_conn:
            # Mark game as finished in Redis
            await cls.set_to_finished_game(game_id)
            
            # First handle game data update
            is_tournament = await redis_conn.get(f"game_is_tournament:{game_id}")
            
            if is_tournament == "1":
                # Tournament game handling...
                [previous tournament code]
            else:
                # Regular game handling...
                [previous regular game code]

            # Cleanup all game-related keys
            # Use pattern matching to find all keys for this game
            cleanup_pattern = f"*:{game_id}"
            keys_to_delete = []
            async for key in redis_conn.scan_iter(match=cleanup_pattern):
                keys_to_delete.append(key)
            
            if keys_to_delete:
                await redis_conn.delete(*keys_to_delete)
                
            logger.info(f"Cleaned up {len(keys_to_delete)} keys for game {game_id}")

        return True
    except Exception as e:
        logger.error(f"Error in handle_game_completion: {e}")
        return False
