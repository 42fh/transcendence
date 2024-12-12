from django.urls import path
from . import views

urlpatterns = [
    # Games listing
    path("waiting/", views.waiting_games, name="waiting_games"),
    path("running/", views.running_games, name="running_games"),
    path("all/", views.all_games, name="all_games"),
    # Game operations
    path("games/", views.create_new_game, name="games"),  # POST: create new game
    path("booking/cancel/", views.cancel_booking, name="cancel_booking"),
    # Tournament operations
    path("tournaments/", views.all_tournaments, name="all_tournaments"),
    path("tournaments/<int:tournament_id>/", views.single_tournament, name="single_tournament"),
    path("tournaments/<int:tournament_id>/enrollment/", views.tournament_enrollment, name="tournament_enrollment"),
    path(
        "tournaments/<int:tournament_id>/schedule/",
        views.get_game_schedule,
        name="tournament_schedule",
    ),
    # User status
    path("user/online/", views.user_online_status, name="user_online_status"),
    # Debug endpoints
    path("debug/create/", views.debug_create_games, name="debug_create_games"),
    path("tournament/debug/", views.debug_tournament, name="debug_tournament"),
    # Catch-all game paths
    path("<str:game_id>/join/", views.join_game, name="join_game"),  # POST: join specific game
    path("<str:game_id>/players/count/", views.player_count, name="player_count"),
    path("<str:game_id>/", views.game_settings, name="game_settings"),  # GET: game details
    # Root path (must be last)
    path("", views.transcendance, name="transcendance_home"),
]
