from django.urls import path
from . import views

urlpatterns = [
    path('', views.transcendance, name='transcendance_home'),
]
