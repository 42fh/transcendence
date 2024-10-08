from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from .models import Game, GameMode
from django.views.decorators.csrf import csrf_exempt

def transcendance(request):
    return render(request, "index.html")

@csrf_exempt
def create_game(request):
    if request.method == "POST":
        date = request.POST.get('date')
        mode_name = request.POST.get('mode') 
        
        # get game mode by name
        try:
            game_mode = GameMode.objects.get(name=mode_name)
        except GameMode.DoesNotExist:
            return JsonResponse({'message': 'GameMode does not exist'}, status=400)

        # Create the Game instance
        game = Game.objects.create(
            date=date,
            mode=game_mode
        )
        
        return JsonResponse({
            'game_id': game.id,
            'message': 'Game created successfully!',
        })

    return JsonResponse({'message': 'only POST requests are allowed'}, status=400)

@csrf_exempt
def create_game_mode(request):
    if request.method == "POST":
        name = request.POST.get('name')
        description = request.POST.get('description')
        
        # check if game mode already exists
        if GameMode.objects.filter(name=name).exists():
            return JsonResponse({'message': 'GameMode already exists'}, status=400)

        game_mode = GameMode.objects.create(
            name=name,
            description=description
        )

        return JsonResponse({
            'game_mode_id': game_mode.id,
            'message': 'GameMode created successfully!',
        })

    return JsonResponse({'message': 'only POST requests are allowed'}, status=400)

@csrf_exempt
def get_games(request):
    games = Game.objects.all()
    games_list = []
    for game in games:
        games_list.append({ 
            'id': game.id,
            'date': game.date,
            'duration': game.duration if game.duration else None,
            'mode': game.mode.name,
            'winner': game.winner.user.username if game.winner else None
        })
    return JsonResponse(games_list, safe=False)

@csrf_exempt
def get_game_modes(request):
    game_modes = GameMode.objects.all()
    game_modes_list = []
    for game_mode in game_modes:
        game_modes_list.append({
            'id': game_mode.id,
            'name': game_mode.name,
            'description': game_mode.description
        })
    return JsonResponse(game_modes_list, safe=False)