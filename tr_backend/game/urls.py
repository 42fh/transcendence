from django.urls import path
from .views import PaddleMoveView

urlpatterns = [
    #path('matches/<int:match_id>/paddles/<int:player_id>/move/', PaddleMoveView.as_view(), name='paddle-move'),
    path('match/<int:paddle_id>/move/', PaddleMoveView.as_view(), name='paddle-move'),

]
