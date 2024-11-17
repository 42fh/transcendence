from django.urls import path
from .views import (
    users_overview,
    blocked_user,
)

urlpatterns = [
    path("users_overview/", users_overview, name="users_overview"),
    path("blocked_user/", blocked_user, name="blocked_user"),
]
