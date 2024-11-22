from typing import Dict, Any
import msgpack
from enum import Enum
from .game_config import (
    EnumGameMode,
    REGULAR_FIXED, IRREGULAR_FIXED, CIRCULAR_FIXED, CLASSIC_FIXED,
    DEFAULT_POLYGON, DEFAULT_REGULAR, DEFAULT_IRREGULAR, DEFAULT_CIRCULAR, DEFAULT_CLASSIC, DEFAULT_PLAYER 
)
import asyncio 


class GameSettingsError(Exception):
    pass



class GameSettingsManager:

    MODE_CONFIGS = {
        EnumGameMode.REGULAR: {
            'default': DEFAULT_POLYGON | DEFAULT_REGULAR,
            'fixed': REGULAR_FIXED
        },
        EnumGameMode.IRREGULAR: {
            'default': DEFAULT_POLYGON | DEFAULT_IRREGULAR,
            'fixed': IRREGULAR_FIXED
        },
        EnumGameMode.CIRCULAR: {
            'default': DEFAULT_CIRCULAR,
            'fixed': CIRCULAR_FIXED
        },
        EnumGameMode.CLASSIC: {
            'default': DEFAULT_CLASSIC,
            'fixed': CLASSIC_FIXED
        }
    }

    def __init__(self, redis_conn):
        self.redis_conn = redis_conn

    async def create_game_settings(self, user_settings: Dict[str, Any], game_id: str) -> Dict[str, Any]:
        """ """

        # 1. step: combine usersettings with default settings
        game_mode = user_settings.get('mode')
        mode_config = self.MODE_CONFIG[game_mode]        
        settings = mode_config['default'].copy()
        filtered_settings = {k: v for k, v in user_settings.items() if k in settings}
        settings.update(filtered_settings)
        settings.update(mode_config['fixed'])
        self.validate_settings(settings, mode_config) # validate step 1
        
        # 2. step: add player settings
        player_values = DEFAULT_PLAYER.copy()
        player_values['player_values'].update(settings["paddle_length"])  
        
        # 3. step: add calculations from AGameManager / PolygonPong / CircularPong
        
        


    # here we can add a second dict chain (e.g. min_values) and can then check against this 
    def validate_settings(self, settings: Dict[str, Any]) -> None:
    if settings.get('num_players') < 1:
        raise GameSettingsError("num_players must be at least 1")
        
    if settings.get('min_players') > settings.get('num_players'):
        raise GameSettingsError("min_players cannot be greater than num_players")
    
    if settings.get('mum_players') > settings.get('sides'):
        raise GameSettingsError("Number of paddles cannot exceed number of sides")
        
    if settings.get('num_balls', 0) < 1:
        raise GameSettingsError("num_balls must be at least 1")
    for field in ['paddle_length', 'paddle_width', 'ball_size']:
        value = settings.get(field)
        if value is not None and not (0 < value <= 1):
            raise GameSettingsError(f"{field} must be between 0 and 1")

