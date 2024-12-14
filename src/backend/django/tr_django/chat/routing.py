from django.urls import path, re_path
from . import consumers

websocket_urlpatterns = [
    path("ws/chat/", consumers.ChatConsumer.as_asgi()),
    re_path('^ws/chat/(?P<room_name>[^/]+)/$', consumers.ChatConsumer.as_asgi()),
    path("ws/notifications/<str:username>/", consumers.NotificationConsumer.as_asgi()),
]
