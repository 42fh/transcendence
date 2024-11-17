from django.urls import path
from .views import (
    users,
    blocked_user,
)

urlpatterns = [
    path("users/", users, name="users"),
    path("blocked_user/", blocked_user, name="blocked_user"),
]
