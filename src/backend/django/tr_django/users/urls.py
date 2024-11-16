"""
URLs for the users app.
"""

from django.urls import path
from .views import (
    SignupView,
    LoginView,
    LogoutView,
    DeleteUserView,
    UserListView,
    UserDetailView,
    # FriendListView,
    # FriendRequestView,
    # FriendStatusView,
)

urlpatterns = [
    # Auth endpoints
    path("auth/signup/", SignupView.as_view(), name="signup"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/delete/", DeleteUserView.as_view(), name="delete_user"),
    # Future endpoints (commented out)
    path("users/", UserListView.as_view(), name="users_list"),
    path("users/<uuid:user_id>/", UserDetailView.as_view(), name="user_detail"),
    # path("<int:user_id>/", UserDetailView.as_view(), name="user_detail"),
    # path("<int:user_id>/friends/", FriendListView.as_view(), name="friend_list"),
    # path("<int:user_id>/friends/<int:friend_id>/", FriendRequestView.as_view(), name="friend_request"),
    # path("<int:user_id>/status/", UserStatusView.as_view(), name="user_status"),
]
