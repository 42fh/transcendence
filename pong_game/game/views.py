from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Game
from django.core.cache import cache
import json

def game_view(request):
    return render(request, 'game/index.html')

@csrf_exempt
def game_state(request):
    if request.method == 'POST':
        # Check if there's a game waiting for a player
        waiting_game_id = cache.get('waiting_game_id')
        
        if waiting_game_id:
            # Join the waiting game
            game = Game.objects.get(id=waiting_game_id)
            cache.delete('waiting_game_id')
            return JsonResponse({'game_id': game.id, 'player_number': 2})
        else:
            # Create a new game and set it as waiting
            game = Game.objects.create()
            cache.set('waiting_game_id', game.id, timeout=300)  # 5 minutes timeout
            return JsonResponse({'game_id': game.id, 'player_number': 1})
    
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

