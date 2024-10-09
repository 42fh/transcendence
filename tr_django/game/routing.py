from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/echo/([0-9]+)", consumers.EchoConsumer.as_asgi()),
]
