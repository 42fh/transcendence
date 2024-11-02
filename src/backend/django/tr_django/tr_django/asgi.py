"""
ASGI config for tr_django project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "tr_django.settings")

# application = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path
from chat import routing as chat_routing
from game.consumers import PongConsumer

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": AuthMiddlewareStack(
            URLRouter(
                [
                    path("ws/game/<int:game_id>/", PongConsumer.as_asgi()),
                ]
            )
        ),
    }
)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "tr_django.settings")

django_asgi_app = get_asgi_application()

websocket_urlpatterns = [
    path("ws/game/<int:game_id>/", PongConsumer.as_asgi()),
    *chat_routing.websocket_urlpatterns,
]

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
    }
)
