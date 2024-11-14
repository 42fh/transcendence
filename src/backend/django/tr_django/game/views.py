from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, JsonResponse
from .models import SingleGame as Game, GameMode, Player
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from .models import Tournament
import json
from .services.tournament_service import build_tournament_data


def transcendance(request):
    return HttpResponse("Initial view for transcendance")


@csrf_exempt
def create_game(request):
    if request.method == "POST":
        mode_name = request.POST.get("mode")

        # get game mode by name
        try:
            game_mode = GameMode.objects.get(name=mode_name)
        except GameMode.DoesNotExist:
            return JsonResponse({"message": "GameMode does not exist"}, status=400)

        # Create the Game instance with current timestamp
        game = Game.objects.create(date=timezone.now(), mode=game_mode)

        return JsonResponse(
            {
                "game_id": game.id,
                "message": "Game created successfully!",
            }
        )

    return JsonResponse({"message": "only POST requests are allowed"}, status=400)


@csrf_exempt
def create_game_mode(request):
    if request.method == "POST":
        name = request.POST.get("name")
        description = request.POST.get("description")

        # check if game mode already exists
        if GameMode.objects.filter(name=name).exists():
            return JsonResponse({"message": "GameMode already exists"}, status=400)

        game_mode = GameMode.objects.create(name=name, description=description)

        return JsonResponse(
            {
                "game_mode_id": game_mode.id,
                "message": "GameMode created successfully!",
            }
        )

    return JsonResponse({"message": "only POST requests are allowed"}, status=400)


@csrf_exempt
def get_games(request):
    games = Game.objects.all()
    games_list = []
    for game in games:
        games_list.append(
            {
                "id": game.id,
                "date": game.date,
                "duration": game.duration if game.duration else None,
                "mode": game.mode.name if game.mode else None,
                "winner": game.winner.username if game.winner else None,
            }
        )
    return JsonResponse(games_list, safe=False)


@csrf_exempt
def get_game_modes(request):
    game_modes = GameMode.objects.all()
    game_modes_list = []
    for game_mode in game_modes:
        game_modes_list.append(
            {
                "id": game_mode.id,
                "name": game_mode.name,
                "description": game_mode.description,
            }
        )
    return JsonResponse(game_modes_list, safe=False)


@csrf_exempt
def tournaments(request):
    """GET: List all tournaments"""
    if request.method == "GET":
        tournament_list = Tournament.objects.all()
        data = [build_tournament_data(t) for t in tournament_list]
        return JsonResponse({"tournaments": data})
    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def tournament(request, tournament_id):
    """
    GET: Retrieve a specific tournament
    """
    if request.method == "GET":
        try:
            tournament = Tournament.objects.get(id=tournament_id)
            data = build_tournament_data(tournament)
            return JsonResponse(data)
        except Tournament.DoesNotExist:
            return JsonResponse({"error": "Tournament not found"}, status=404)

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def tournament_enrollment(request, tournament_id):
    """
    POST: Enroll in tournament
    DELETE: Leave tournament
    """
    try:
        tournament = Tournament.objects.get(pk=tournament_id)
    except Tournament.DoesNotExist:
        return JsonResponse({"error": "Tournament not found"}, status=404)

    # Get the Player instance associated with the user
    try:
        player = Player.objects.get(user=request.user)
    except Player.DoesNotExist:
        return JsonResponse({"error": "Player profile not found"}, status=400)

    if request.method == "POST":
        if tournament.participants.filter(user=request.user).exists():
            return JsonResponse({"error": "Already enrolled in tournament"}, status=400)
        tournament.participants.add(player)
        return JsonResponse({"message": f"Successfully enrolled in {tournament.name}"})

    elif request.method == "DELETE":
        if not tournament.participants.filter(user=request.user).exists():
            return JsonResponse({"error": "Not enrolled in tournament"}, status=400)
        tournament.participants.remove(player)
        return JsonResponse({"message": f"Successfully left {tournament.name}"})
