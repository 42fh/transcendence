from django.urls import path, include
from django.contrib import admin

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/chat/", include("chat.urls")),
    path("api/users/", include("users.urls")),
    path("", include("game.urls")),
]
