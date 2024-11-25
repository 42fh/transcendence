
from .agame.AGameManager import AGameManager
from .polygon.PolygonPongGame import PolygonPongGame
from .circular.CircularPongGame import CircularPongGame

__all__ = ["AGameManager", "PolygonPongGame", "CircularPongGame"]

default_app_config = "game.apps.GameConfig"

