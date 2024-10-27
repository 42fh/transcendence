from django.conf import settings
from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("game.urls")),
    path("chat/", include("chat.urls")),
    path("user/", include("user.urls")),
    path("accounts/", include("django.contrib.auth.urls")),
    # path("accounts/", include("user.urls")),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
