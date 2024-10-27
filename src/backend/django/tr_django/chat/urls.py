from django.urls import path
from .views import chatPage, create_one_to_one_chat, one_to_one_chat, get_username, get_user_list
from django.contrib.auth import views as auth_views

urlpatterns = [
    path("", chatPage, name="chat-page"),
    path("logout/", auth_views.LogoutView.as_view(), name="logout-user"),
    path("login/", auth_views.LoginView.as_view(), name="login-user"),
    path("api/get_username/", get_username, name="get_username"),
    path("api/get_user_list/", get_user_list, name="get_user_list"),
    path("create_one_to_one_chat/", create_one_to_one_chat, name="create-one-to-one-chat"),
    path("api/chat/<str:room_name>/", one_to_one_chat, name="api-one-to-one-chat"),
]
