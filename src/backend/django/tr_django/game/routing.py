from django.urls import path
from .consumers import PongConsumer
from .tournamentmanager.TournamentNotification import TournamentNotificationConsumer

websocket_urlpatterns = [
    path("ws/game/<int:game_id>/", PongConsumer.as_asgi()),
    path("ws/game/<uuid:game_id>/", PongConsumer.as_asgi()),
    path("ws/game/<str:game_id>/", PongConsumer.as_asgi()),
    path("wss/game/<int:game_id>/", PongConsumer.as_asgi()),
    path("wss/game/<uuid:game_id>/", PongConsumer.as_asgi()),
    path("wss/game/<str:game_id>/", PongConsumer.as_asgi()),
    path("ws/pong/<int:game_id>/", PongConsumer.as_asgi()),
    path("ws/pong/<uuid:game_id>/", PongConsumer.as_asgi()),
    path("ws/pong/<str:game_id>/", PongConsumer.as_asgi()),
    path("wss/pong/<int:game_id>/", PongConsumer.as_asgi()),
    path("wss/pong/<uuid:game_id>/", PongConsumer.as_asgi()),
    path("wss/pong/<str:game_id>/", PongConsumer.as_asgi()),
    # TournamentNotification
    path('ws/tournament/<str:tournament_id>/notifications/', TournamentNotificationConsumer.as_asgi()),
    path('wss/tournament/<str:tournament_id>/notifications/', TournamentNotificationConsumer.as_asgi()),
]
