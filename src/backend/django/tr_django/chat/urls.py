from django.urls import path
from .views import (
    rooms,
    blocked_user,
    notifications,
)

urlpatterns = [
    path("", rooms, name="rooms"),
    path("blocked_user/", blocked_user, name="blocked_user"),
    path("notifications/", notifications, name="notifications"),  # Supports GET, POST, and PATCH
    # path('ws/chat/<str:chat_id>/', consumers.ChatConsumer.as_asgi()),

]
