from django.urls import path
from .views import chatPage, testPage, create_one_to_one_chat, one_to_one_chat
from django.contrib.auth import views as auth_views

urlpatterns = [
    path("", chatPage, name="chat-page"),
    path("test/", testPage, name="test-page"),
    path(
        "create_one_to_one_chat/", create_one_to_one_chat, name="create-one-to-one-chat"
    ),
    path("<str:room_name>/", one_to_one_chat, name="one-to-one-chat"),
    path("logout/", auth_views.LogoutView.as_view(), name="logout-user"),
]
