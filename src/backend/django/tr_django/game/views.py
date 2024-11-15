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
def all_tournaments(request):
    """GET: List all tournaments"""
    if request.method == "GET":
        tournament_list = Tournament.objects.all()
        data = [build_tournament_data(t) for t in tournament_list]
        return JsonResponse({"tournaments": data})
    return JsonResponse({"error": "Method not allowed"}, status=405)


def create_tournament(request):
    """Helper function to handle tournament creation logic"""
    try:
        data = json.loads(request.body)

        # Get the Player instance associated with the user
        try:
            creator = Player.objects.get(user=request.user)
        except Player.DoesNotExist:
            return JsonResponse({"error": "Player profile not found"}, status=400)

        # Convert frontend dates to backend format
        start_date = timezone.make_aware(datetime.fromisoformat(data["startingDate"].replace("Z", "+00:00")))
        reg_start = timezone.make_aware(datetime.fromisoformat(data["registrationStart"].replace("Z", "+00:00")))
        reg_end = timezone.make_aware(datetime.fromisoformat(data["registrationClose"].replace("Z", "+00:00")))

        # Create tournament
        tournament = Tournament.objects.create(
            name=data["name"],
            description=data["description"],
            start_registration=reg_start,
            end_registration=reg_end,
            start_date=start_date,
            type=data["type"].lower().replace(" ", "_"),
            start_mode=Tournament.START_MODE_FIXED,
            is_public=data["visibility"] == "public",
            creator=creator,
            min_participants=2,
            max_participants=8,
        )

        # Handle private tournament allowed users
        if data["visibility"] == "private" and data.get("allowedUsers"):
            allowed_players = Player.objects.filter(user__username__in=data["allowedUsers"])
            tournament.allowed_players.set(allowed_players)

        return JsonResponse(
            {"message": "Tournament created successfully", "tournament": build_tournament_data(tournament)}
        )

    except (json.JSONDecodeError, KeyError) as e:
        return JsonResponse({"error": f"Invalid request data: {str(e)}"}, status=400)
    except Exception as e:
        return JsonResponse({"error": f"Server error: {str(e)}"}, status=500)


@csrf_exempt
def single_tournament(request, tournament_id=None):
    """
    GET: Retrieve a specific tournament
    POST: Create a new tournament
    PUT: Update a tournament (full update)
    PATCH: Update a tournament (partial update)
    DELETE: Delete a tournament
    """
    if request.method == "POST":
        return create_tournament(request)

    if request.method == "GET":
        try:
            tournament = Tournament.objects.get(id=tournament_id)
            data = build_tournament_data(tournament)
            return JsonResponse(data)
        except Tournament.DoesNotExist:
            return JsonResponse({"error": "Tournament not found"}, status=404)

    if request.method == "PUT":
        return JsonResponse({"message": "Full tournament update not implemented yet"}, status=501)

    if request.method == "PATCH":
        return JsonResponse({"message": "Partial tournament update not implemented yet"}, status=501)

    if request.method == "DELETE":
        return JsonResponse({"message": "Tournament deletion not implemented yet"}, status=501)

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

    return JsonResponse({"error": "Method not allowed"}, status=405)
