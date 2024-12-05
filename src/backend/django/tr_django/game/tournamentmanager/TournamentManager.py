from datetime import datetime
from django.utils import timezone
from typing import Dict, Tuple
from .models import Tournament, Player
import redis
import time
from asgiref.sync import async_to_sync
from .gamecoordinator.TournamentNotification import TournamentNotificationConsumer, TournamentNotifier


class RedisSyncLock:
    def __init__(self, redis_conn: redis.Redis, lock_key: str, timeout: int = 10):
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

class TournamentManager:
    REDIS_URL = "redis://redis:6379/3"

    @classmethod
    def get_redis(cls) -> Redis:
        return Redis.from_url(cls.REDIS_URL, decode_responses=True):

    @classmethod
    def create_tournament(cls, tournament_data: Dict, game_settings: Dict, creator: Player) -> Dict:
        """Creates tournament with game settings and returns status dict"""
        try:
            start_date = timezone.make_aware(datetime.fromisoformat(tournament_data["start_date"]))
            reg_start = timezone.make_aware(datetime.fromisoformat(tournament_data["registration_start"]))
            reg_end = timezone.make_aware(datetime.fromisoformat(tournament_data["registration_close"]))

            tournament = Tournament.objects.create(
                name=tournament_data["name"],
                description=tournament_data.get("description"),
                start_registration=reg_start, 
                end_registration=reg_end,
                start_date=start_date,
            if tournament_data["type"] not in [choice[0] for choice in Tournament.TYPE_CHOICES]:
                raise ValueError(f"Invalid tournament type. Must be one of: {[choice[0] for choice in Tournament.TYPE_CHOICES]}")
                start_mode=Tournament.START_MODE_FIXED,
                is_public=tournament_data.get("visibility", "public") == "public",
                creator=creator,
                min_participants=tournament_data.get("min_participants", 2),
                max_participants=tournament_data.get("max_participants", 8)
            )

            if not tournament.is_public and tournament_data.get("allowed_players"):
                allowed_players = Player.objects.filter(user__username__in=tournament_data["allowed_players"])
                tournament.allowed_players.set(allowed_players)

            tournament.full_clean()
            tournament.save()

            return {
                "status": True, 
                "tournament_id": tournament.id,
                "message": "Tournament created successfully"
            }

        except Exception as e:
            return {
                "status": False,
                "message": f"Failed to create tournament: {str(e)}"
            }

    @classmethod
    def add_player(cls, tournament_id: int, player: Player) -> Dict:
        try:
            with cls.get_redis() as redis_conn:
                with RedisSyncLock(redis_conn, f"tournament_lock_{tournament_id}"):
                    tournament = Tournament.objects.get(pk=tournament_id)
                   
                    # Validate enrollment
                    if tournament.participants.filter(id=player.id).exists():
                        return {"status": False, "message": "Player already enrolled", "error_code": "ALREADY_ENROLLED"}

                    if not tournament.is_public and not tournament.allowed_players.filter(id=player.id).exists():
                        return {"status": False, "message": "Not authorized for private tournament", "error_code": "NOT_AUTHORIZED"}

                    if tournament.participants.count() >= tournament.max_participants:
                        return {"status": False, "message": "Tournament is full", "error_code": "TOURNAMENT_FULL"}

                    # Add player
                     tournament.participants.add(player)
                  

                    ws_url = f"ws/tournament/{tournament_id}/"
                
                    # Schedule async notification
                    notifier = TournamentNotifier(tournament_id)
                    async_to_sync(notifier.player_joined)(player.display_name) 
                   
                    # Check if tournament is ready to start matchmaking
                    if tournament.participants.count() == tournament.max_participants:
                        cls.start_matchmaking(tournament)
                        return {
                            "status": True,
                            "message": f"Enrolled in {tournament.name}. Tournament starting soon!", 
                            "tournament_starting": True,
                            "ws_url": ws_url
                        }

                    return {
                        "status": True,
                        "message": f"Successfully enrolled in {tournament.name}",
                        "tournament_starting": False,
                        "ws_url": ws_url
                    }

        except Tournament.DoesNotExist:
            return {"status": False, "message": "Tournament not found", "error_code": "NOT_FOUND"}
        except Exception as e:
            return {"status": False, "message": f"Error: {str(e)}", "error_code": "SERVER_ERROR"}

    @classmethod
    def remove_player(cls, tournament_id: int, player: Player) -> Dict:
        """Remove player from tournament"""
        try:
            with cls.get_redis() as redis_conn:
                with RedisSyncLock(redis_conn, f"tournament_lock_{tournament_id}"):
                   tournament = Tournament.objects.get(pk=tournament_id)

                   if not tournament.participants.filter(id=player.id).exists():
                       return {
                           "status": False,
                           "message": "Player not enrolled in tournament",
                           "error_code": "NOT_ENROLLED"
                       }

                    tournament.participants.remove(player)
                    # Schedule async notification
                    async_to_sync(TournamentNotificationConsumer.close_player_connection)(tournament_id, player.id)
                    notifier = TournamentNotifier(tournament_id)
                    async_to_sync(notifier.player_left)(player.display_name)                   
                   return {
                       "status": True,
                       "message": f"Successfully left {tournament.name}"
                   }

       except Tournament.DoesNotExist:
           return {
               "status": False,
               "message": "Tournament not found", 
               "error_code": "NOT_FOUND"
           }
       except Exception as e:
           return {
               "status": False,
               "message": f"Error leaving tournament: {str(e)}",
               "error_code": "SERVER_ERROR"
           }




    @classmethod 
    def start_matchmaking(cls, tournament: Tournament):
       """Trigger matchmaking when tournament is full"""
       # TODO: Implement matchmaking logic
       pass
