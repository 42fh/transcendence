from django.urls import path
from . import views

urlpatterns = [
    path("", views.transcendance, name="transcendance_home"),
    path("create_game/", views.create_game, name="create_game"),
    path("create_game_mode/", views.create_game_mode, name="create_game_mode"),
    path("get_games/", views.get_games, name="get_games"),
    path("get_game_modes/", views.get_game_modes, name="get_game_modes"),
    path(
        "tournaments/<int:tournament_id>/enrollment/",
        views.tournament_enrollment,
        name="tournament_enrollment",
    ),
    path("tournaments/<int:tournament_id>/", views.single_tournament, name="single_tournament"),
    path("tournaments/", views.all_tournaments, name="all_tournaments"),
]
