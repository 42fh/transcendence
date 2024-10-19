from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from . import views

urlpatterns = [
    path('', views.transcendance, name='transcendance_home'),
    path('join_any_game/', views.join_any_game),
    path('create_game/', views.create_game, name='create_game'),
    path('create_game_mode/', views.create_game_mode, name='create_game_mode'),
    path('get_games/', views.get_games, name='get_games'),
    path('get_game_modes/', views.get_game_modes, name='get_game_modes'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
