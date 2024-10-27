from django.urls import path
from .views import user_profile
from .views import api_login, api_logout

urlpatterns = [
    path("user/<str:username>/", user_profile, name="user_profile"),
    path("api/login/", api_login, name="api-login"),
    path("api/logout/", api_logout, name="api-logout"),
]
