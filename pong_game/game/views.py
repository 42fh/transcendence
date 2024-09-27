
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Game
import json

def game_view(request):
    return render(request, 'game/index.html')

@csrf_exempt
def game_state(request):
    if request.method == 'POST':
        game = Game.objects.create()
        return JsonResponse({'game_id': game.id})
    elif request.method == 'GET':
        game_id = request.GET.get('id')
        game = Game.objects.get(id=game_id)
        return JsonResponse({
            'player1_score': game.player1_score,
            'player2_score': game.player2_score,
            'ball_x': game.ball_x,
            'ball_y': game.ball_y,
            'ball_dx': game.ball_dx,
            'ball_dy': game.ball_dy,
            'paddle1_y': game.paddle1_y,
            'paddle2_y': game.paddle2_y,
        })


