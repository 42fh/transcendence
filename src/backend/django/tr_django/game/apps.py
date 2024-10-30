from django.apps import AppConfig


class GameConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "game"
    def ready(self):
        # This ensures the game types are registered when Django starts
        from . import PolygonPongGame
        from . import CircularPongGame
