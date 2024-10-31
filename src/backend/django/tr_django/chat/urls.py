from django.urls import path
from .views import (
    get_username,
    get_user_list,
)

urlpatterns = [
    # path("", chatPage, name="chat-page"),
    path("get_username/", get_username, name="get_username"),
    path("get_user_list/", get_user_list, name="get_user_list"),
    # path(
    #     "create_one_to_one_chat/", create_one_to_one_chat, name="create-one-to-one-chat"
    # ),
    # path("api/chat/<str:room_name>/", one_to_one_chat, name="api-one-to-one-chat"),
]
