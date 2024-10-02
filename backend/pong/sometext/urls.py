from django.urls import path
from . import views

urlpatterns = [
    path("my_page", views.my_page),
    path("login", views.my_login),
    path("page/", views.page),
    path("index", views.index),
    path("get_csrf_token", views.get_csrf_token),
    path("",      views.greeting, name="jsongreeting"),
]