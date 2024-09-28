from django.urls import path
from . import views

urlpatterns = [
    path("page/", views.page),
    path("", views.index, name="jsongreeting"),
]