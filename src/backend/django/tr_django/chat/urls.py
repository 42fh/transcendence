from django.urls import path
from .views import (
    rooms,
    blocked_user,
    notifications,
)

urlpatterns = [
    path("users/", rooms, name="rooms"),
    path("blocked_user/", blocked_user, name="blocked_user"),
    path("notifications/", notifications, name="notifications"),  # GET and POST
]
