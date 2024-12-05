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
    UserAvatarView,
    SendEmailVerificationView,
    ValidateEmailVerificationView,
    # FriendStatusView,
)

from .views import login_with_42, callback

urlpatterns = [
    path("auth/signup/", SignupView.as_view(), name="signup"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/send-email-verification/", SendEmailVerificationView.as_view(), name="send_email_verification"),
    path("auth/validate-email-verification/", ValidateEmailVerificationView.as_view(), name="validate_email_verification"),
    path("auth/delete/", DeleteUserView.as_view(), name="delete_user"),
    path("auth/oauth2/redirection/", callback, name='callback'),
    path("auth/login42/", login_with_42, name='login_with_42'),
    path("", UsersListView.as_view(), name="users_list"),
    path("<uuid:user_id>/", UserDetailView.as_view(), name="user_detail"),
    path("users/<uuid:user_id>/avatar/", UserAvatarView.as_view(), name="user_avatar"),
    path("<uuid:user_id>/friends/", FriendsListView.as_view(), name="friends_list"),
    path("friend-requests/", FriendRequestsView.as_view(), name="friend_requests"),
]
