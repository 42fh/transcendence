from django.urls import path
from .views import (
    username,
    users_overview,
    blocked_user,
)

urlpatterns = [
    path("username/", username, name="username"),
    path("users_overview/", users_overview, name="users_overview"),
    path("blocked_user/", blocked_user, name="blocked_user"),
]
