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
from .gamecordinator.GameCordinator import GameCordinator, RedisLock
from django.core.serializers.json import DjangoJSONEncoder
import json
from .gamecordinator.game_config import EnumGameMode 
from asgiref.sync import sync_to_async, async_to_sync

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
    print(f"USER: {request.user}, ID: {request.user.id}")

import redis as sync_redis
import time

class RedisLockSync:
    def __init__(self, redis_conn, lock_key, timeout=10):
        self.redis_conn = redis_conn
        self.lock_key = lock_key
        self.timeout = timeout

    def __enter__(self):
        start_time = time.time()
        while True:
            if self.redis_conn.set(self.lock_key, "1", nx=True, ex=self.timeout):
                return self
            if time.time() - start_time > self.timeout:
                raise TimeoutError(f"Could not acquire lock: {self.lock_key}")
            time.sleep(0.1)

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.redis_conn.delete(self.lock_key)

def get_redis(url: str = "redis://redis:6379/1") :
    return sync_redis.Redis.from_url(url, decode_responses=True)


import random
@csrf_exempt
def create_new_game(request, use_redis_lock: bool = True):
    # checks without redis lock 
    if request.method != "POST":
        return JsonResponse(
            {
                "error": "Method Not Allowed",
                "message": "only POST requests are allowed"
            }, 
            status=405
        )
    # random.randint(1000, 9999) -> hardcoded for test        
    # comment out because not connected to user yet
    if not request.user.is_authenticated:
        return JsonResponse(
            {
                "error": "Unauthorized - missing authentication",
                "message": "only login users can create new game"
            },
            status=401
        )
    print_request_details(request)
    request.user.id = 123
    if request.content_type != 'application/json':
        return JsonResponse(
            {
                "error": "Unsupported Media Type",
                "message": "This endpoint only accepts application/json payloads."
            },
            status=415
        )
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse(
            {
                "error": "Invalid JSON",
                "message": "The JSON payload is malformed."
            },
            status=400
        )
    game_mode = data.get('mode')
    if not game_mode:
        return JsonResponse(
            {
                "error": "Invalid request",
                "message": "Game mode is required."
            },
            status=400
        )

    try:
        game_mode = EnumGameMode(game_mode)
    except ValueError:
        return JsonResponse(
            {
                "error": "Invalid game mode",
                "message": f"Valid modes are: {[mode.value for mode in EnumGameMode]}"
            },
            status=400
        )
    user_id = request.user.id
    async def create_game_logic(user_id):
        if await GameCordinator.is_player_playing(user_id):
            return JsonResponse(
                {
                    "error": "Double booking",
                    "message": "Player already in active game"
                },
                status=409
            )
        game_id = await GameCordinator.create_new_game(data)
        if not game_id:
                return JsonResponse(
                    {
                        "error": "Game Creation Failed",
                        "message": "Unable to create new game. Please try again."
                    },
                    status=500  # Service Unavailable
                )
        
        message = "NEW Game created successfully! Joined Gaime."
        response = await GameCordinator.join_game(user_id, game_id)
        if response.get('available', True):          
            return JsonResponse(
                {'available': True, 
                'ws_url': f'ws://localhost:8000/ws/game/{game_id}/',
                "message": message     
                },
                status=201
            )

        return  JsonResponse(
            {'available': False, 
            'message': response.get("message", "NOT SET ERROR")
            },
            status=response.get("status", 500)
        )
    try:
        if use_redis_lock:
            with get_redis() as redis_conn:
                with RedisLockSync(redis_conn, f"player_lock:{request.user.id}"):
                    return async_to_sync(lambda: create_game_logic())()
        return async_to_sync(lambda: create_game_logic())()
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def join_game(request, game_id, use_redis_lock: bool = True):

    if request.method != "GET":
        return JsonResponse(
            {
                "error": "Method Not Allowed",
                "message": "only GET requests are allowed"
            }, 
            status=405
        )
    if not request.user.is_authenticated:
        return JsonResponse(
            {
                "error": "Unauthorized - missing authentication",
                "message": "only login users can create new game"
            },
            status=401
        )
    user_id = request.user.id
    async def join_logic(user_id):    
        if await GameCordinator.is_player_playing(user_id):
            return JsonResponse(
                {
                    "error": "Double booking",
                    "message": "Player already in active game"
                },
                status=409
            )
        message = getattr(request, "message", "Joined Game! ")
        
        response = await GameCordinator.join_game(user_id, game_id)

        if response.get('available', True):          
            return JsonResponse(
                {'available': True, 
                'ws_url': f'ws://localhost:8000/ws/game/{game_id}/',
                "message": message     
                },
                status=201
            )

        return  JsonResponse(
            {'available': False, 
            'message': response.get("message", "NOT SET ERROR")
            },
            status=response.get("status", 500)
        )
    try:
        if use_redis_lock:
            with get_redis() as redis_conn:
                with RedisLockSync(redis_conn, f"player_lock:{request.user.id}"):
                    return async_to_sync(join_logic(user_id))
        return async_to_sync(create_game_logic(user_id))
            
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
 


@csrf_exempt
def get_all_games(request):
    if request.method == "GET":      
        games = async_to_sync(GameCordinator.get_all_games())
        first_item = next(iter(games), None)
        if first_item and isinstance(first_item, bytes):
            # If bytes, decode
            games_list = [member.decode('utf-8') for member in games]
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


@csrf_exempt
def get_detail_from_game(request):
    if request.method == "GET":      
        param = request.GET.get('game_id')
        settings = async_to_sync(GameCordinator.get_detail_from_game(param))
        json_string = json.dumps(settings, cls=DjangoJSONEncoder)
        return JsonResponse(
            {
                "game_id": param,
                "settings": json_string,
                "message": "this are the settings of the game",
            }
        )

    return JsonResponse({"message": "only GET requests are allowed"}, status=400)


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
