import random
import json
from django.views.decorators.csrf import csrf_exempt
from django.core.serializers.json import DjangoJSONEncoder
from datetime import datetime
from django.utils import timezone
from django.http import HttpResponse, JsonResponse
from .models import SingleGame as Game, GameMode, Player
from .models import Tournament
from .services.tournament_service import build_tournament_data
from .gamecoordinator.GameCoordinator import GameCoordinator, RedisLock
from .gamecoordinator.game_config import EnumGameMode
from asgiref.sync import sync_to_async
from django.views.decorators.http import require_http_methods
from django.utils.decorators import async_only_middleware
from .tournamentmanager.utils import get_test_tournament_data
from .tournamentmanager.TournamentManager import TournamentManager


def transcendance(request):
    return HttpResponse("Initial view for transcendance")


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
        # if await GameCoordinator.is_player_playing(user_id):
        #     return JsonResponse(
        #         {"error": "Double booking", "message": "Player already in active game"},
        #         status=409,
        #     )
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
                    "game_id": game_id,
                    "ws_url": f"/ws/game/{game_id}/",
                    "full_ws_url": f"ws://localhost:8000/ws/game/{game_id}/",
                    "message": message,
                    "settings": data,
                },
                status=201,
            )

        return JsonResponse(
            {"available": False, "message": response.get("message", "NOT SET ERROR")},
            status=response.get("status", 500),
        )

    try:
        if use_redis_lock:
            async with await GameCoordinator.get_redis(GameCoordinator.REDIS_GAME_URL) as redis_conn:
                async with RedisLock(redis_conn, f"player_lock:{async_request.user.id}"):
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
        # if await GameCoordinator.is_player_playing(user_id):
        #     return JsonResponse(
        #         {"error": "Double booking", "message": "Player already in active game"},
        #         status=409,
        #     )
        message = "Joined Game! "

        response = await GameCoordinator.join_game(user_id, game_id)

        if response.get("available", True):
            return JsonResponse(
                {
                    "available": True,
                    "game_id": game_id,
                    "ws_url": f"/ws/game/{game_id}/",
                    "full_ws_url": f"ws://localhost:8000/ws/game/{game_id}/",
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
            async with await GameCoordinator.get_redis(GameCoordinator.REDIS_GAME_URL) as redis_conn:
                async with RedisLock(redis_conn, f"player_lock:{user_id}"):
                    return await join_logic()
        return await join_logic()

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@sync_to_async
def is_user_blocked(user, to_user_id):
    """Check if either user has blocked the other.
    
    Args:
        user: User object
        to_user_id: Target user's ID
        
    Returns:
        bool: True if either user has blocked the other
    """
    blocked_users = set(
        BlockedUser.objects.filter(user=user).values_list("blocked_user__username", flat=True)
    )
    
    blocked_by_users = set(
        BlockedUser.objects.filter(blocked_user=user).values_list("user__username", flat=True)
    )
    
    all_blocked_users = blocked_users.union(blocked_by_users)
    return to_user_id in all_blocked_users



@csrf_exempt
@async_only_middleware
@require_http_methods(["POST", "GET"])
async def invitation(request):
    """Handle game invitations"""
    if not request.user.is_authenticated:
        return JsonResponse({
            "error": "Unauthorized",
            "message": "Authentication required"
        }, status=401)

    if request.method == "POST":
        try:
            data = json.loads(request.body)
            to_user_id = data.get("to_user_id")
            # to_user_id is required
            if not to_user_id:
                return JsonResponse({
                    "error": "Bad Request",
                    "message": "to_user_id is required"
                }, status=400)
            # check for blocking
            if await is_user_blocked(user, to_user_id):
                return JsonResponse({
                    "error": "Bad Request",
                    "message": "to_user_id"
                }, status=403)
                
            # Default game settings for invitation
            game_settings = {
                "mode": "classic",
            }
            
            result = await GameCoordinator.create_invitation(
                str(request.user.id),
                str(to_user_id),
                game_settings
            )
            
            if result["status"]:
                return JsonResponse({
                    "message": result["message"],
                    "game_id": result["game_id"]
                })
            else:
                return JsonResponse({
                    "error": "Invitation Failed",
                    "message": result["message"]
                }, status=400)
                
        except json.JSONDecodeError:
            return JsonResponse({
                "error": "Invalid JSON",
                "message": "Invalid request format"
            }, status=400)
            
    elif request.method == "GET":
        invitations = await GameCoordinator.get_pending_invitations(str(request.user.id))
        return JsonResponse({
            "invitations": invitations
        })




# @async_only_middleware
# @require_http_methods(["GET"])
# @csrf_exempt
# async def get_all_games(request):
#     if request.method == "GET":
#         games = await GameCoordinator.get_all_games()
#         first_item = next(iter(games), None)
#         if first_item and isinstance(first_item, bytes):
#             # If bytes, decode
#             games_list = [member.decode("utf-8") for member in games]
#         else:
#             # If already strings, use directly
#             games_list = list(games)

#         json_string = json.dumps(games_list, cls=DjangoJSONEncoder)
#         return JsonResponse(
#             {
#                 "games": json_string,
#                 "message": "all game uuids ",
#             }
#         )

#     return JsonResponse({"message": "only GET requests are allowed"}, status=400)


# no games are stored in all games -> yiu will see always no games
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

        return JsonResponse({"message": "Debug games created successfully", "status": 201})

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
        return JsonResponse({"error": "Unauthorized", "message": "Authentication required"}, status=401)

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
        return JsonResponse({"error": str(e), "message": "Failed to process request"}, status=500)


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


@require_http_methods(["GET"])
@csrf_exempt
def get_game_schedule(request, tournament_id):
    if request.method == "GET":
        result = TournamentManager.get_game_schedule(tournament_id)
        return JsonResponse(result, status=400 if not result["status"] else 200)


# this is only for debugging the schedule creation, notifications will be ignored, do not use out of this scope
@csrf_exempt
@require_http_methods(["POST"])
def debug_tournament(request):
    """Debug endpoint to create tournament with sample data and get schedule"""
    try:
        creator = Player.objects.get(user=request.user)
        tournament_data = get_test_tournament_data()
        result = TournamentManager.create_tournament(tournament_data, {}, creator)
        if not result["status"]:
            return JsonResponse(result, status=400)
        print("debug: ", result)
        tournament_id = result["tournament_id"]

        # Add 4 sample players
        sample_players = Player.objects.all()[:4]
        print("players: ", sample_players)
        for player in sample_players:
            result = TournamentManager.add_player(tournament_id, player)
            print("debug2: ", result)
        # Get schedule
        schedule = TournamentManager.get_game_schedule(tournament_id)

        return JsonResponse({"tournament_id": tournament_id, "schedule": schedule})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


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
        return JsonResponse({"message": "Tournament update not implemented yet"}, status=501)
    elif request.method == "DELETE":
        return JsonResponse({"message": "Tournament deletion not implemented yet"}, status=501)

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
            {
                "message": "Tournament created successfully",
                "tournament": build_tournament_data(tournament),
            }
        )

    except (json.JSONDecodeError, KeyError) as e:
        return JsonResponse({"error": f"Invalid request data: {str(e)}"}, status=400)
    except Exception as e:
        return JsonResponse({"error": f"Server error: {str(e)}"}, status=500)


# TODO: we have a naming issue here.
@csrf_exempt
def all_tournaments(request):
    """
    GET: List all tournaments
    POST: Create a new tournament
    """
    if request.method == "GET":
        tournament_list = Tournament.objects.all()
        data = [build_tournament_data(t) for t in tournament_list]
        return JsonResponse({"tournaments": data})
    elif request.method == "POST":
        return create_tournament(request)

    return JsonResponse({"error": "Method not allowed"}, status=405)


# @require_http_methods(["GET", "POST"])
# @csrf_exempt
# def all_tournaments(request):
#     if request.method == "GET":
#         tournament_list = Tournament.objects.all()
#         data = [build_tournament_data(t) for t in tournament_list]
#         return JsonResponse({"tournaments": data})

#     elif request.method == "POST":
#         try:
#             data = json.loads(request.body)
#             creator = Player.objects.get(user=request.user)
#             result = TournamentManager.create_tournament(data, data.get("game_settings", {}), creator)
#             if result["status"]:
#                 tournament = Tournament.objects.get(pk=result["tournament_id"])
#                 return JsonResponse(
#                     {
#                         "status": "success",
#                         "message": f"Tournament[{tournament.name}] created successfully. {result['message']}",
#                         "tournament_notification_url": result["tournament_notification_url"],
#                         "value_create_tournament_debug": result,
#                         "tournament_debug": build_tournament_data(tournament),
#                     }
#                 )
#             return JsonResponse({"error": result["message"]}, status=400)

#         except (json.JSONDecodeError, Player.DoesNotExist) as e:
#             return JsonResponse({"error": str(e)}, status=400)
