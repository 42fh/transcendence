from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, JsonResponse
from .models import SingleGame as Game, GameMode, Player
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from .models import Tournament


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


# TODO: uniformize naming for models and frontend
@csrf_exempt
def tournaments(request):
    """
    GET: List all tournaments
    POST: Create multiple tournaments
    """
    if request.method == "GET":
        tournament_list = Tournament.objects.all()
        data = [
            {
                "id": t.id,
                "name": t.name,
                "description": t.description,
                "startingDate": t.start_date.isoformat() if t.start_date else None,
                "closingRegistrationDate": t.end_registration.isoformat(),
                "isTimetableAvailable": bool(t.games.exists()),
                "participants": list(t.participants.values_list("display_name", flat=True)),
                "type": t.type.replace("_", " "),  # convert e.g., "single_elimination" to "single elimination"
                "timetable": None,  # You might want to add timetable logic here
            }
            for t in tournament_list
        ]
        return JsonResponse({"tournaments": data})

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def tournament(request, tournament_id):
    """
    GET: Retrieve a specific tournament
    PUT: Update a specific tournament
    DELETE: Delete a specific tournament
    """
    if request.method == "GET":
        try:
            tournament = Tournament.objects.get(id=tournament_id)
            data = {
                "id": tournament.id,
                "name": tournament.name,
                "description": tournament.description,
                "start_registration": tournament.start_registration.isoformat(),
                "end_registration": tournament.end_registration.isoformat(),
                "type": tournament.type,
                "start_mode": tournament.start_mode,
                "participants": list(tournament.participants.values_list("display_name", flat=True)),
            }
            return JsonResponse(data)
        except Tournament.DoesNotExist:
            return JsonResponse({"error": "Tournament not found"}, status=404)

    return JsonResponse({"error": "Method not allowed"}, status=405)
