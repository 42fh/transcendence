from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, JsonResponse
from .models import SingleGame as Game, GameMode, Player
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from .models import Tournament
import json
from .services.tournament_service import build_tournament_data
from datetime import datetime
import asyncio
from .gamecoordinator.GameCoordinator import GameCoordinator, RedisLock
from django.core.serializers.json import DjangoJSONEncoder
import json
from .gamecoordinator.game_config import EnumGameMode
from asgiref.sync import sync_to_async
from django.views.decorators.http import require_http_methods
from django.utils.decorators import async_only_middleware
import random
from .tournamentmanager.utils import get_test_tournament_data

def transcendance(request):
    return HttpResponse("Initial view for transcendance")


def print_request_details(request):
    # Print all attributes
    #    print("Attributes:", vars(request))

    # Print all methods and properties
    #   print("Methods and properties:", dir(request))

    # Print common request properties
    #  print(f"Path: {request.path}")
    # print(f"Method: {request.method}")
    # print(f"GET params: {request.GET}")
    print(f"USER: {request.user}, ID: {request.user.id} ")


import random


@csrf_exempt
@async_only_middleware
@require_http_methods(["POST"])
async def create_new_game(request, use_redis_lock: bool = True):
    # checks without redis lock
    if request.method != "POST":
        return JsonResponse(
            {
                "error": "Method Not Allowed",
                "message": "only POST requests are allowed",
            },
            status=405,
        )
    # random.randint(1000, 9999) -> hardcoded for test
    # comment out because not connected to user yet
    is_authenticated = await sync_to_async(lambda: request.user.is_authenticated)()
    if not is_authenticated:
        return JsonResponse(
            {
                "error": "Unauthorized - missing authentication",
                "message": "only login users can create new game",
            },
            status=401,
        )
    user_id = await sync_to_async(lambda: request.user.id)()
    async_request = await sync_to_async(lambda: request)()
    if request.content_type != "application/json":
        return JsonResponse(
            {
                "error": "Unsupported Media Type",
                "message": "This endpoint only accepts application/json payloads.",
            },
            status=415,
        )
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "Invalid JSON", "message": "The JSON payload is malformed."},
            status=400,
        )
    game_mode = data.get("mode")
    if not game_mode:
        return JsonResponse(
            {"error": "Invalid request", "message": "Game mode is required."},
            status=400,
        )

    try:
        game_mode = EnumGameMode(game_mode)
    except ValueError:
        return JsonResponse(
            {
                "error": "Invalid game mode",
                "message": f"Valid modes are: {[mode.value for mode in EnumGameMode]}",
            },
            status=400,
        )

    async def create_game_logic():
        if await GameCoordinator.is_player_playing(user_id):
            return JsonResponse(
                {"error": "Double booking", "message": "Player already in active game"},
                status=409,
            )
        game_id = await GameCoordinator.create_new_game(data)
        if not game_id:
            return JsonResponse(
                {
                    "error": "Game Creation Failed",
                    "message": "Unable to create new game. Please try again.",
                },
                status=500,  # Service Unavailable
            )

        message = "NEW Game created successfully! Joined Gaime."
        response = await GameCoordinator.join_game(user_id, game_id)

        if response.get("available", True):
            return JsonResponse(
                {
                    "available": True,
                    "ws_url": f"ws://localhost:8000/ws/game/{game_id}/",
                    "message": message,
                },
                status=201,
            )

        return JsonResponse(
            {"available": False, "message": response.get("message", "NOT SET ERROR")},
            status=response.get("status", 500),
        )

    try:
        if use_redis_lock:
            async with await GameCoordinator.get_redis(
                GameCoordinator.REDIS_GAME_URL
            ) as redis_conn:
                async with RedisLock(
                    redis_conn, f"player_lock:{async_request.user.id}"
                ):
                    return await create_game_logic()
        return await create_game_logic()

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@async_only_middleware
@require_http_methods(["GET"])
async def join_game(request, game_id, use_redis_lock: bool = True):

    if request.method != "GET":
        return JsonResponse(
            {"error": "Method Not Allowed", "message": "only GET requests are allowed"},
            status=405,
        )
    is_authenticated = await sync_to_async(lambda: request.user.is_authenticated)()
    if not is_authenticated:
        return JsonResponse(
            {
                "error": "Unauthorized - missing authentication",
                "message": "only login users can create new game",
            },
            status=401,
        )
    user_id = await sync_to_async(lambda: request.user.id)()

    async def join_logic():
        if await GameCoordinator.is_player_playing(user_id):
            return JsonResponse(
                {"error": "Double booking", "message": "Player already in active game"},
                status=409,
            )
        message = "Joined Game! "

        response = await GameCoordinator.join_game(user_id, game_id)

        if response.get("available", True):
            return JsonResponse(
                {
                    "available": True,
                    "ws_url": f"ws://localhost:8000/ws/game/{game_id}/",
                    "message": message,
                },
                status=201,
            )

        return JsonResponse(
            {"available": False, "message": response.get("message", "NOT SET ERROR")},
            status=response.get("status", 500),
        )

    try:
        if use_redis_lock:
            async with await GameCoordinator.get_redis(
                GameCoordinator.REDIS_GAME_URL
            ) as redis_conn:
                async with RedisLock(redis_conn, f"player_lock:{user_id}"):
                    return await join_logic()
        return await join_logic()

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@async_only_middleware
@require_http_methods(["GET"])
@csrf_exempt
async def get_all_games(request):
    if request.method == "GET":
        games = await GameCoordinator.get_all_games()
        first_item = next(iter(games), None)
        if first_item and isinstance(first_item, bytes):
            # If bytes, decode
            games_list = [member.decode("utf-8") for member in games]
        else:
            # If already strings, use directly
            games_list = list(games)

        json_string = json.dumps(games_list, cls=DjangoJSONEncoder)
        return JsonResponse(
            {
                "games": json_string,
                "message": "all game uuids ",
            }
        )

    return JsonResponse({"message": "only GET requests are allowed"}, status=400)


# for debug
@csrf_exempt
@async_only_middleware
@require_http_methods(["POST"])
async def debug_create_games(request):
    try:
        sample_modes = ["classic", "circular", "regular"]
        sample_types = ["2P", "4P"]

        for mode in sample_modes:
            for n_type in sample_types:
                settings = {
                    "mode": mode,
                    "sides": (4 if n_type == "4P" else 2) + random.randint(1, 10),
                    "score": {"max": 5},
                    "num_players": 4 if n_type == "4P" else 2,
                    "min_players": 4 if n_type == "4P" else 2,
                    "initial_ball_speed": 0.02,
                    "paddle_length": 0.2,
                    "paddle_width": 0.02,
                    "ball_size": 0.02,
                }

                game_id = await GameCoordinator.create_new_game(settings)
                if game_id:
                    await GameCoordinator.set_to_waiting_game(game_id)

        return JsonResponse(
            {"message": "Debug games created successfully", "status": 201}
        )

    except Exception as e:
        return JsonResponse({"error": str(e), "status": 500})


@async_only_middleware
@require_http_methods(["GET"])
@csrf_exempt
async def waiting_games(request):
    if request.method == "GET":
        games = await GameCoordinator.get_waiting_games_info()
        json_string = json.dumps(games, cls=DjangoJSONEncoder)
        return JsonResponse(
            {
                "games": json_string,
                "message": "all waiting game",
            }
        )

    return JsonResponse({"message": "only GET requests are allowed"}, status=405)


@async_only_middleware
@require_http_methods(["GET"])
@csrf_exempt
async def running_games(request):
    if request.method == "GET":
        games = await GameCoordinator.get_running_games_info()
        json_string = json.dumps(games, cls=DjangoJSONEncoder)
        return JsonResponse(
            {
                "games": json_string,
                "message": "all running game",
            }
        )

    return JsonResponse({"message": "only GET requests are allowed"}, status=405)


@csrf_exempt
@async_only_middleware
@require_http_methods(["GET"])
async def player_count(request, game_id):
    """API endpoint to get player counts for a specific game"""
    if request.method == "GET":
        try:
            count_info = await GameCoordinator.get_player_count_info(game_id)
            if count_info["status"]:
                return JsonResponse(
                    {
                        "player_counts": count_info,
                        "message": "Current player counts retrieved successfully",
                    }
                )
            else:
                return JsonResponse(
                    {
                        "error": "Failed to retrieve player counts",
                        "message": "Unable to get current player counts",
                    },
                    status=500,
                )

        except Exception as e:
            return JsonResponse(
                {"error": str(e), "message": "Error retrieving player counts"},
                status=500,
            )

    return JsonResponse({"message": "only GET requests are allowed"}, status=405)


@csrf_exempt
@async_only_middleware
@require_http_methods(["DELETE"])
async def cancel_booking(request):
    """Cancel all bookings for the authenticated user"""
    if not request.user.is_authenticated:
        return JsonResponse(
            {
                "error": "Unauthorized - missing authentication",
                "message": "Only logged in users can cancel bookings",
            },
            status=401,
        )

    user_id = request.user.id
    try:
        result = await GameCoordinator.cancel_booking(str(user_id))

        if result["status"]:
            status_code = 200
            response_data = {"message": result["message"], "status": "success"}
            if result.get("error"):
                response_data["warning"] = result["error"]
        else:
            status_code = 404
            response_data = {"message": result["message"], "status": "error"}

        return JsonResponse(response_data, status=status_code)

    except Exception as e:
        return JsonResponse(
            {"error": str(e), "message": "Server error while cancelling booking"},
            status=500,
        )


@csrf_exempt
@async_only_middleware
@require_http_methods(["GET", "POST", "DELETE"])
async def user_online_status(request):
    """
    GET: Check if user is online
    POST: Set user as online
    DELETE: Set user as offline
    """
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Unauthorized", "message": "Authentication required"}, status=401
        )

    user_id = str(request.user.id)

    try:
        if request.method == "GET":
            is_online = await GameCoordinator.is_user_online(user_id)
            return JsonResponse({"online": is_online, "user_id": user_id})

        elif request.method == "POST":
            await GameCoordinator.set_user_online(user_id)
            return JsonResponse({"message": "User set to online", "user_id": user_id})

        elif request.method == "DELETE":
            await GameCoordinator.set_user_offline(user_id)
            return JsonResponse({"message": "User set to offline", "user_id": user_id})

    except Exception as e:
        return JsonResponse(
            {"error": str(e), "message": "Failed to process request"}, status=500
        )


@csrf_exempt
@async_only_middleware
@require_http_methods(["GET"])
async def game_settings(request, game_id):
    if request.method == "GET":
        settings = await GameCoordinator.get_detail_from_game(game_id)
        json_string = json.dumps(settings, cls=DjangoJSONEncoder)
        return JsonResponse(
            {
                "game_id": game_id,
                "settings": json_string,
                "message": "this are the settings of the game",
            }
        )

    return JsonResponse({"message": "only GET requests are allowed"}, status=400)


@async_only_middleware
@require_http_methods(["GET"])
@csrf_exempt
async def all_games(request):
    if request.method == "GET":
        games = await GameCoordinator.get_running_games_info()
        json_string = json.dumps(games, cls=DjangoJSONEncoder)
        return JsonResponse(
            {
                "games": json_string,
                "message": "allgame",
            }
        )

    return JsonResponse({"message": "only GET requests are allowed"}, status=405)

# ------ new Tournament
from .tournamentmanager.TournamentManager import TournamentManager


#@require_http_methods(["GET", "POST"])
@csrf_exempt
def all_tournaments(request):
    if request.method == "GET":
        tournament_list = Tournament.objects.all()
        data = [build_tournament_data(t) for t in tournament_list]
        return JsonResponse({"tournaments": data})
        
    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            creator = Player.objects.get(user=request.user)
            result = TournamentManager.create_tournament(data, data.get("game_settings", {}), creator)
            
            if result["status"]:
                tournament = Tournament.objects.get(pk=result["tournament_id"])
                return JsonResponse({
                    "message": "Tournament created successfully",
                    "tournament": build_tournament_data(tournament)
                })
            return JsonResponse({"error": result["message"]}, status=400)
            
        except (json.JSONDecodeError, Player.DoesNotExist) as e:
            return JsonResponse({"error": str(e)}, status=400)

@require_http_methods(["POST", "DELETE"])
@csrf_exempt
def tournament_enrollment(request, tournament_id):
    try:
        player = Player.objects.get(user=request.user)
        
        if request.method == "POST":
            result = TournamentManager.add_player(tournament_id, player)
        elif request.method == "DELETE":
            result = TournamentManager.remove_player(tournament_id, player)
        else:
            return JsonResponse({"error": "Method not allowed"}, status=405)
            
        return JsonResponse(result, status=400 if not result["status"] else 200)
        
    except Player.DoesNotExist:
        return JsonResponse({"error": "Player profile not found"}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def debug_tournament(request):
    """Debug endpoint to create tournament with sample data and get schedule"""
    from datetime import timedelta   
    try:
        creator = Player.objects.get(user=request.user)
        data = None
        
        if request.body:
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                pass
                
        tournament_data = get_test_tournament_data(data)
        result = TournamentManager.create_tournament(tournament_data, {}, creator)
        if not result["status"]:
            return JsonResponse(result, status=400)
        print("debug: " ,result)   
        tournament_id = result["tournament_id"]
        
        # Add 4 sample players
        sample_players = Player.objects.all()[:4]
        print ("players: ", sample_players)
        for player in sample_players:
            result = TournamentManager.add_player(tournament_id, player)
            print("debug2: ", result)
        # Get schedule
        schedule = TournamentManager.get_game_schedule(tournament_id)
        
        return JsonResponse({
            "tournament_id": tournament_id,
            "schedule": schedule
        })
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)




# ----------------  Tournament and Game  -> database?



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
def single_tournament(request, tournament_id):
    """
    GET: Retrieve a specific tournament
    PUT: Update a tournament
    DELETE: Delete a tournament
    """
    try:
        tournament = Tournament.objects.get(id=tournament_id)
    except Tournament.DoesNotExist:
        return JsonResponse({"error": "Tournament not found"}, status=404)

    if request.method == "GET":
        data = build_tournament_data(tournament)
        return JsonResponse(data)
    elif request.method in ["PUT", "PATCH"]:
        return JsonResponse(
            {"message": "Tournament update not implemented yet"}, status=501
        )
    elif request.method == "DELETE":
        return JsonResponse(
            {"message": "Tournament deletion not implemented yet"}, status=501
        )

    return JsonResponse({"error": "Method not allowed"}, status=405)


