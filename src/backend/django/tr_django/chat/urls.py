from django.urls import path
from .views import (
    get_username,
    get_user_list,
    block_user,
    unblock_user,
)

urlpatterns = [
    path("get_username/", get_username, name="get_username"),
    path("get_user_list/", get_user_list, name="get_user_list"),
    path("block_user/", block_user, name="block_user"),
    path("unblock_user/", unblock_user, name="unblock_user"),
]
