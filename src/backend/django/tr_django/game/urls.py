from django.urls import path
from . import views

urlpatterns = [
    path('games/waiting/', views.waiting_games, name='waiting_games'),    # GET: list waiting games
    path('games/running/', views.running_games, name='running_games'),    # GET: list running games
    path('games/<str:game_id>/', views.game_detail, name='game_detail'), # GET: game details
    path('games/<str:game_id>/join/', views.join_game, name='join_game'),# POST: join specific game
    path('games/', views.create_game, name='create_game'),               # POST: create new game
    path("", views.transcendance, name="transcendance_home"),
    # from game modles -> old API dummys from stefano 
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
