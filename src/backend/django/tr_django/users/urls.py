"""
URLs for the users app.
"""

from django.urls import path
from .views import (
    SignupView,
    DRFSignupView,
    DeleteUserView,
    LogoutView,
    LoginView,
    DRFLoginView,
    DRFLogoutView,
)

urlpatterns = [
    path("signup/", SignupView.as_view(), name="signup"),
    path("drf-signup/", DRFSignupView.as_view(), name="drf_signup"),
    path("login/", LoginView.as_view(), name="login"),
    path("drf-login/", DRFLoginView.as_view(), name="drf_login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("drf-logout/", DRFLogoutView.as_view(), name="drf_logout"),
    path("delete-user/", DeleteUserView.as_view(), name="delete_user"),
]
