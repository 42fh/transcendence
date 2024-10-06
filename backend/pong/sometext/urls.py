from django.urls import path
from . import views

urlpatterns = [
    path("start_ball", views.start_ball),
    path("all_games", views.all_games),
    path("init_game", views.view_init_game),
    path("add_game", views.view_add_game),
    path("my_page", views.my_page),
    path("delta_time", views.delta_time),
    path("get_jack_email", views.get_jack_email),
    path("create_int", views.create_int),
    path("next_int", views.next_int),
    path("login", views.my_login),
    path("page/", views.page),
    path("index", views.index),
    path("get_csrf_token", views.get_csrf_token),
    path("",      views.greeting, name="jsongreeting"),
]