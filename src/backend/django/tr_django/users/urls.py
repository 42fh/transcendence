"""
URLs for the users app.
"""

from django.urls import path
from .views import (
    SignupView,
    LoginView,
    LogoutView,
    DeleteUserView,
    UsersListView,
    UserDetailView,
    FriendsListView,
    FriendRequestsView,
    # FriendStatusView,
)

urlpatterns = [
    path("auth/signup/", SignupView.as_view(), name="signup"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/delete/", DeleteUserView.as_view(), name="delete_user"),
    path("", UsersListView.as_view(), name="users_list"),
    path("<uuid:user_id>/", UserDetailView.as_view(), name="user_detail"),
    path("<uuid:user_id>/friends/", FriendsListView.as_view(), name="friends_list"),
    path("friend-requests/", FriendRequestsView.as_view(), name="friend_requests"),
]
