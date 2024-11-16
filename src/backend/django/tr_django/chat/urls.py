from django.urls import path
from .views import (
    get_username,
    get_user_list,
    blocked_user,
)

urlpatterns = [
    path("get_username/", get_username, name="get_username"),
    path("get_user_list/", get_user_list, name="get_user_list"),
    path("blocked_user/", blocked_user, name="blocked_user"),
]
