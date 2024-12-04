from django.apps import AppConfig
from asgiref.sync import async_to_sync
from .gamecoordinator.GameCoordinator import GameCoordinator
import logging

logger = logging.getLogger(__name__)

class GameConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "game"

    def ready(self):
        # Only run on main process
        if not self.apps.is_installed('django.contrib.admin'):
            return
            
        @async_to_sync
        async def create_games():
            try:
                # First check existing waiting games
                waiting_games = await GameCoordinator.get_waiting_games_info()
                empty_games = [
                    game for game in waiting_games 
                    if game['players']['current'] == 0 and game['players']['reserved'] == 0
                ]
                
                if len(empty_games) >= 3:
                    logger.info(f"Found {len(empty_games)} empty waiting games, skipping creation")
                    return
                
                # Calculate how many games we need to create
                games_to_create = 3 - len(empty_games)
                
                game_configs = [
                    {"mode": "classic"},   # 2-player classic game
                    {"mode": "circular"},  # 4-player circular game
                    {"mode": "circular", "sides": 6}  # 6-player circular game
                ][:games_to_create]  # Only take as many as we need
                
                for config in game_configs:
                    game_id = await GameCoordinator.create_new_game(config)
                    if game_id:
                        await GameCoordinator.set_to_waiting_game(game_id)
                        logger.info(f"Created waiting game: {game_id} with config: {config}")
                        
                logger.info(f"Created {games_to_create} new games to maintain minimum of 3 empty games")
                        
            except Exception as e:
                logger.error(f"Failed to create debug games: {e}")
                
        create_games()
