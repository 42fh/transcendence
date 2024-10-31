from django.urls import path, include
from django.contrib import admin

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("game.urls")),
    path("api/chat/", include("chat.urls")),
    # path("chat/", include("chat.urls")),
    # path("user/", include("user.urls")),
    # path("accounts/", include("django.contrib.auth.urls")),
    # # path("accounts/", include("user.urls")),
    path("api/users/", include("users.urls")),
]
