from django.urls import path
from . import views

urlpatterns = [
    path(
        "get_detail_from_game/", views.get_detail_from_game, name="get_detail_from_game"
    ),
    path("create_new_game/", views.create_new_game, name="create_new_game"),
    path("get_all_games/", views.get_all_games, name="get_all_games"),
    path("get_waiting_games/", views.get_waiting_games, name="get_waiting_games"),
    path("<str:game_id>/join/", views.join_game, name="join_game"),
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
    path(
        "tournaments/<int:tournament_id>/",
        views.single_tournament,
        name="single_tournament",
    ),
    path("tournaments/", views.all_tournaments, name="all_tournaments"),
]
