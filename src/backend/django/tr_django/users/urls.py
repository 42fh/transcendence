"""
URLs for the users app.
"""

from django.urls import path
from .views import (
    SignupView,
    LoginView,
    LogoutView,
    DeleteUserView,
)

urlpatterns = [
    path("signup/", SignupView.as_view(), name="signup"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("delete-user/", DeleteUserView.as_view(), name="delete_user"),
]
