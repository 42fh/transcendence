from django.urls import path
from .views import (
    get_username,
    get_user_list,
    block_user,
    unblock_user,
    get_notifications,
    mark_notification_read,
)

urlpatterns = [
    path("get_username/", get_username, name="get_username"),
    path("get_user_list/", get_user_list, name="get_user_list"),
    path("block_user/", block_user, name="block_user"),
    path("unblock_user/", unblock_user, name="unblock_user"),
    path("notifications/", get_notifications, name="get_notifications"),
    path("notifications/<int:notification_id>/read/", mark_notification_read, name="mark_notification_read"),
]
