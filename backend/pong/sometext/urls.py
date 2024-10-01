from django.urls import path
from . import views

urlpatterns = [
    path("my_page", views.my_page),
    path("login", views.my_login),
    path("page/", views.page),
    path("index", views.index),
    path("",      views.greeting, name="jsongreeting"),
]