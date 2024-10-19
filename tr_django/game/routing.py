from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    # re_path(r"ws/echo/([0-9]+)", consumers.EchoConsumer.as_asgi()),
    # re_path(r"^ws/echo/(?P<unique_game_id>[0-9]+)$", consumers.EchoConsumer.as_asgi()),
    re_path(r"^ws/echo/(?P<unique_game_id>[0-9a-fA-F\-]{36})$", consumers.EchoConsumer.as_asgi()),
]
