from django.urls import path
from .views import (
    rooms,
    blocked_user,
)

urlpatterns = [
    path("users/", rooms, name="rooms"),
    path("blocked_user/", blocked_user, name="blocked_user"),
]
