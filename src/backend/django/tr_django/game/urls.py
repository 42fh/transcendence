from django.urls import path
from . import views

urlpatterns = [
    path('waiting/', views.waiting_games, name='waiting_games'),   
    path('running/', views.running_games, name='running_games'),   
    path('all/', views.all_games, name='all_games'),  
    path('<str:game_id>/', views.game_settings, name='game_settings'), # GET: game details
    path('<str:game_id>/join/', views.join_game, name='join_game'),# POST: join specific game
    path('games/', views.create_game, name='create_game'),               # POST: create new game
    path('<str:game_id>/players/count/', views.player_count, name='player_count'),
    path('booking/cancel/', views.cancel_booking, name='cancel_booking'),
    path("", views.transcendance, name="transcendance_home"),
    # online status user
    path('user/online/', views.user_online_status, name='user_online_status'),
    # debug api
    path('debug/create/', views.debug_create_games, name='debug_create_games'),  # POST: create sample games for testing



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
