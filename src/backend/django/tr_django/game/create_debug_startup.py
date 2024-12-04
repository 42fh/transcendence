from django.apps import AppConfig
from asgiref.sync import async_to_sync
from .gamecoordinator.GameCoordinator import GameCoordinator
import logging

logger = logging.getLogger(__name__)

class GameConfig(AppConfig):

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'game'  # Your app name is 'game'
    
    def ready(self):
        # Only run on main process
        if not self.apps.is_installed('django.contrib.admin'):
            return
            
        @async_to_sync
        async def create_games():
            game_configs = [
                {"mode": "classic"},   # 2-player classic game
                {"mode": "circular"},  # 4-player circular game
                {"mode": "circular", "sides": 6}  # 6-player circular game
            ]
            
            try:
                for config in game_configs:
                    game_id = await GameCoordinator.create_new_game(config)
                    if game_id:
                        await GameCoordinator.set_to_waiting_game(game_id)
                        logger.info(f"Created waiting game: {game_id} with config: {config}")
            except Exception as e:
                logger.error(f"Failed to create debug games: {e}")
                
        create_games()
