from datetime import datetime
from django.utils import timezone
from typing import Dict, Tuple
import redis
import time
from asgiref.sync import async_to_sync
from .TournamentNotification import TournamentNotificationConsumer, TournamentNotifier
from typing import List, Dict
from django.utils import timezone
from datetime import timedelta
import random
import math
import logging
from channels.layers import get_channel_layer
from ..models import Tournament, TournamentGame, TournamentGameSchedule, Player
from ..gamecoordinator.GameCoordinator import GameCoordinator
from django.db.models import Q
from chat.models import Notification


logger = logging.getLogger(__name__)


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

def send_notifacation(user , message, url=None):
    try:
        if not url:
            notification = Notification.objects.create(
                user=user,
                message= message,
            )
        else:
            notification = Notification.objects.create(
                user=user,
                message= message,
                url=url,
            )

  
    except Exception as e:
        logger.error(f"Error creating notification: {str(e)}", exc_info=True)

def send_tournament_notification(tournament, message: str, url: str = None):
    """
    Send a notification to all participants in a tournament using the existing send_notifacation function.
    
    Args:
        tournament: Tournament instance to send notifications for
        message: Message content for the notification
        url: Optional URL to include in the notification
    """
    try:
        # Get all participants in the tournament
        participants = tournament.participants.all()
        
        # Send notification to each participant using existing function
        for player in participants:
            try:
                send_notifacation(player.user, message, url)
            except Exception as e:
                logger.error(
                    f"Failed to send notification to player {player.username}: {str(e)}",
                    exc_info=True
                )
                
    except Exception as e:
        logger.error(f"Error sending tournament notifications: {str(e)}", exc_info=True)





class TournamentManager:
    REDIS_URL = "redis://redis:6379/3"

    @classmethod
    def get_redis(cls) -> redis:
        return redis.from_url(cls.REDIS_URL, decode_responses=True)

    @classmethod
    def create_tournament(
        cls, tournament_data: Dict, game_settings: Dict, creator: Player
    ) -> Dict:
        """Creates tournament with game settings and returns status dict"""
        try:
            start_date = timezone.make_aware(
                datetime.fromisoformat(
                    tournament_data["startingDate"].replace("Z", "+00:00")
                )
            )
            reg_start = timezone.make_aware(
                datetime.fromisoformat(
                    tournament_data["registrationStart"].replace("Z", "+00:00")
                )
            )
            reg_end = timezone.make_aware(
                datetime.fromisoformat(
                    tournament_data["registrationClose"].replace("Z", "+00:00")
                )
            )
            tournament = Tournament.objects.create(
                name=tournament_data["name"],
                description=tournament_data.get("description"),
                start_registration=reg_start,
                end_registration=reg_end,
                start_date=start_date,
                type=tournament_data["type"],
                start_mode=Tournament.START_MODE_FIXED,
                is_public=tournament_data.get("visibility", "public") == "public",
                creator=creator,
                min_participants=tournament_data.get("min_participants", 2),
                max_participants=tournament_data.get("max_participants", 4),
            )
            if not tournament.is_public and tournament_data.get("allowed_players"):
                allowed_players = Player.objects.filter(
                    user__username__in=tournament_data["allowed_players"]
                )
                tournament.allowed_players.set(allowed_players)

            tournament.full_clean()
            tournament.save()
            response = {"status": True, "tournament_id": tournament.id}
            response.update(cls.add_player(tournament.id, creator))
            return response
        except Exception as e:
            return {
                "status": False,
                "message": f"Failed to create tournament: {str(e)}",
            }

    @classmethod
    def add_player(cls, tournament_id: int, player: Player) -> Dict:
        try:
            with cls.get_redis() as redis_conn:
                with RedisSyncLock(redis_conn, f"tournament_lock_{tournament_id}"):
                    tournament = Tournament.objects.get(pk=tournament_id)
                    
                    # Validate enrollment
                    if tournament.participants.filter(id=player.id).exists():
                        return {
                            "status": False,
                            "message": "Player already enrolled",
                            "error_code": "ALREADY_ENROLLED",
                        }
                        # Check if player is enrolled in any other tournament that hasn't finished
                    existing_tournaments = Tournament.objects.filter(
                        participants=player
                    ).exclude(
                        Q(games__status=TournamentGame.FINISHED)  # Or tournaments where all games are finished
                    )
                    
                    if existing_tournaments.exists():
                        tournament_names = ", ".join([t.name for t in existing_tournaments])
                        return {
                            "status": False,
                            "message": f"Player is already enrolled in tournament(s): {tournament_names}. "
                                      "You must wait until your current tournament is finished.",
                            "error_code": "ALREADY_IN_TOURNAMENT"
                        }
                    

                    if (
                        not tournament.is_public
                        and not tournament.allowed_players.filter(id=player.id).exists()
                    ):
                        return {
                            "status": False,
                            "message": "Not authorized for private tournament",
                            "error_code": "NOT_AUTHORIZED",
                        }

                    if tournament.participants.count() >= tournament.max_participants:
                        return {
                            "status": False,
                            "message": "Tournament is full",
                            "error_code": "TOURNAMENT_FULL",
                        }

                    # Add player


                    send_tournament_notification(tournament, f"Player: {player.username} joind Tournament: {tournament.name}")
                    tournament.participants.add(player)
                    logger.debug(
                        f"Tournament[{tournament.name}]: booked in: {tournament.participants.count()} full with: {tournament.max_participants}"
                    )
                    # Check if tournament is ready to start matchmaking
                    if tournament.participants.count() == tournament.max_participants:
                        send_notifacation(player.user ,  f"Successfully enrolled in {tournament.name}. Tournament will start soon", url=None)
                        logger.info(f"Tournament[{tournament.name}]: booked in: {tournament.participants.count()} full with: {tournament.max_participants} - lets start")
                        cls.start_matchmaking(tournament)
                        return {
                            "status": True,
                            "message": f"Enrolled in {tournament.name}. Tournament starting soon! Connect to tournament_notification_url",
                            "tournament_starting": True,
                        }
                    send_notifacation(player.user ,  f"Successfully enrolled in {tournament.name}. Waiting for other player. More new over Notification", url=None)
                    return {
                        "status": True,
                        "message": f"Successfully enrolled in {tournament.name}. Waiting for other player.  Connect to tournament_notification_url",
                        "tournament_starting": False,
                    }

        except Tournament.DoesNotExist:
            logger.error("add_player: Tournament not found")
            return {
                "status": False,
                "message": "Tournament not found",
                "error_code": "NOT_FOUND",
            }
        except Exception as e:
            logger.error(f"SERVER_ERROR: {str(e)}")
            return {
                "status": False,
                "message": f"Error: {str(e)}",
                "error_code": "SERVER_ERROR",
            }

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
                            "error_code": "NOT_ENROLLED",
                        }
                    if TournamentGame.objects.filter(tournaments=tournament).exists():
                        return {
                            "status": False,
                            "message": "Cannot remove player - tournament has already started",
                            "error_code": "NOT_REMOVED",
                        }

                    tournament.participants.remove(player)
                    send_tournament_notification(tournament, f"Player: {player.username} left Tournament: {tournament.name}")
                    return {
                        "status": True,
                        "message": f"Successfully left {tournament.name}",
                    }

        except Tournament.DoesNotExist:
            logger.error("remove_player: Tournament not found")
            return {
                "status": False,
                "message": "Tournament not found",
                "error_code": "NOT_FOUND",
            }
        except Exception as e:
            logger.error(f"SERVER_ERROR: {str(e)}")
            return {
                "status": False,
                "message": f"Error leaving tournament: {str(e)}",
                "error_code": "SERVER_ERROR",
            }

    @classmethod
    def start_matchmaking(cls, tournament: Tournament):
        """Creates and schedules tournament games based on tournament type"""

        
        send_tournament_notification(tournament, f"HEY LETS GOOOOO TOURNAMENT ON THE WAY")
        if tournament.type == Tournament.TYPE_SINGLE_ELIMINATION:
            cls._create_single_elimination_bracket(tournament)
        elif tournament.type == Tournament.TYPE_ROUND_ROBIN:
            cls._create_round_robin_schedule(tournament)

        tournament.save()
        debug = cls.create_rounds(tournament.id)
        logger.info(f"Tournamnet: {debug}")

    @classmethod
    def get_game_schedule(cls, tournament_id: int) -> Dict:
        """
        Get full game schedule for tournament with timing and player info.
        Returns schedule organized by rounds.
        """
        try:
            tournament = Tournament.objects.get(pk=tournament_id)
            schedules = (
                TournamentGameSchedule.objects.filter(tournament=tournament)
                .select_related("game")
                .prefetch_related("game__players")
                .order_by("round_number", "match_number")
            )

            schedule_by_rounds = {}
            for schedule in schedules:
                game = schedule.game
                players = list(game.players.all())

                game_info = {
                    "match_number": schedule.match_number,
                    "scheduled_time": schedule.scheduled_time,
                    "status": game.status,
                    "game_id": game.id,
                    "players": (
                        [{"id": p.user.id, "name": p.username} for p in players]
                        if players
                        else []
                    ),
                    "source_games": (
                        [game.source_game1_id, game.source_game2_id]
                        if tournament.type == Tournament.TYPE_SINGLE_ELIMINATION
                        else None
                    ),
                }

                round_num = schedule.round_number
                if round_num not in schedule_by_rounds:
                    schedule_by_rounds[round_num] = []
                schedule_by_rounds[round_num].append(game_info)

            return {
                "status": True,
                "tournament_id": tournament_id,
                "type": tournament.type,
                "schedule": schedule_by_rounds,
            }

        except Tournament.DoesNotExist:
            logger.error("schedule: Tournament not found")
            return {
                "status": False,
                "message": "Tournament not found",
                "error_code": "NOT_FOUND",
            }
        except Exception as e:
            logger.error(f"schedule: {e}")
            return {
                "status": False,
                "message": f"Error getting schedule: {str(e)}",
                "error_code": "SERVER_ERROR",
            }

    @classmethod
    def create_rounds(cls, tournament_id: str):
        """
        Unified round creation and game status management for all tournament types.
        """
        try:
            tournament = Tournament.objects.get(pk=tournament_id)
            games = (
                TournamentGameSchedule.objects.filter(tournament=tournament)
                .select_related("game")
                .order_by("round_number")
            )
            tournament_completed = True
            games_started = 0

            # First handle completed games
            for schedule in games:
                game = schedule.game
                if game.status == "finished":
                    game.get_game_logic().handle_game_completion()

            # Then check for games that can be started
            for schedule in games:
                game = schedule.game
                players = list(game.players.all())

                if not players or game.status == "finished":
                    continue

                tournament_completed = False
                if len(players) == 2:
                    logger.debug(f"Create_Rounds/A: {players}")
                    # Check if any players are in a READY game
                    players_in_ready = any(
                        TournamentGame.objects.filter(
                            players=player, status="ready"
                        ).exists()
                        for player in players
                    )
                    logger.debug(f"Create_Rounds: game.status: {game.status}")
                    if not players_in_ready and game.status == "draft":
                        game.status = "ready"
                        game.save()

                    if game.status == "ready":
                        logger.debug(f"Create_Rounds/AA")
                        player_data = [str(player.user.id) for player in players]
                        response = async_to_sync(
                            GameCoordinator.create_tournament_game
                        )(
                            real_game_id=str(game.id),
                            tournament_id=tournament_id,
                            players=player_data,
                            game_settings={"mode": "classic"},
                        )
                        logger.debug(f"Create_Rounds/AA: Response: {response}")
                        if response["status"] == "running":
                            game.status = "activ"
                            game.save()
                            games_started += 1
                            
                            # Create a mapping of user IDs to players for easy lookup
                            player_map = {str(p.user.id): p for p in players}
                            
                            # Notify players
                            for player_id, ws_url in response["player_urls"]:
                                logger.debug(
                                    f"player_id: {player_id}/{type(player_id)} , ws_url: {ws_url}/{type(ws_url)}"
                                )
                                # Get the corresponding player from our mapping
                                if player := player_map.get(str(player_id)):
                                    send_notifacation(
                                        player.user,
                                        f"Your game in tournament {tournament.name} is ready! Round {schedule.round_number}, Match {schedule.match_number}",
                                        url=ws_url
                                    )
                else:
                    # Players waiting for opponents
                    tournament_completed = False
                    logger.debug(f"B: {players}")
                    for player in players:
                        send_notifacation(
                            player.user,
                            f"Tournament {tournament.name}: Waiting for your opponent in Round {schedule.round_number}, Match {schedule.match_number}. You'll be notified when your game is ready."
                        )
                        logger.debug(f"Sent waiting notification to player {player.username} for game {game.id} in round {schedule.round_number}")


            if tournament_completed:
                tournament.status = Tournament.STATUS_COMPLETED
                tournament.save()
                message = f"Tournament {tournament.name} has completed!"
                send_tournament_notification(
                    tournament,
                    message,
                    url=None
                )
    

            return {
                "status": True,
                "games_started": games_started,
                "tournament_completed": tournament_completed,
            }

        except Tournament.DoesNotExist:
            logger.error("create_rounds: Tournament not found")
            return {
                "status": False,
                "message": "Tournament not found",
                "error_code": "NOT_FOUND",
            }
        except Exception as e:
            logger.error(f"create_rounds: {e}")
            return {
                "status": False,
                "message": f"Error processing rounds: {str(e)}",
                "error_code": "SERVER_ERROR",
            }

    @classmethod
    def _create_single_elimination_bracket(cls, tournament: Tournament):
        """Creates a single elimination tournament bracket"""
        players = list(tournament.participants.all())
        num_players = len(players)
        num_rounds = math.ceil(math.log2(num_players))

        # Randomize player order
        random.shuffle(players)

        # First round games
        first_round_games = []
        byes = []
        game_time = tournament.start_date

        # Calculate byes
        perfect_bracket_size = 2**num_rounds
        num_byes = perfect_bracket_size - num_players

        for i in range(0, num_players - num_byes, 2):
            game = TournamentGame.objects.create(
                game_type=TournamentGame.GAME_TYPE_DIRECT_ELIMINATION,
                status=TournamentGame.READY,
                start_date=game_time,
            )
            game.players.add(players[i], players[i + 1])

            TournamentGameSchedule.objects.create(
                tournament=tournament,
                game=game,
                round_number=1,
                match_number=len(first_round_games) + 1,
                scheduled_time=game_time,
            )
            first_round_games.append(game)
            game_time += timedelta(minutes=30)

        # Handle byes
        for i in range(num_players - num_byes, num_players):
            byes.append(players[i])

        # Create subsequent rounds
        prev_round_games = first_round_games
        round_num = 2

        while len(prev_round_games) > 1 or byes:
            current_round_games = []
            # Handle pairs of previous round games
            for i in range(0, len(prev_round_games), 2):
                if i + 1 < len(prev_round_games):
                    game = TournamentGame.objects.create(
                        game_type=TournamentGame.GAME_TYPE_DIRECT_ELIMINATION,
                        status=TournamentGame.DRAFT,
                        start_date=game_time,
                        source_game1=prev_round_games[i],
                        source_game2=prev_round_games[i + 1],
                    )

                    TournamentGameSchedule.objects.create(
                        tournament=tournament,
                        game=game,
                        round_number=round_num,
                        match_number=len(current_round_games) + 1,
                        scheduled_time=game_time,
                    )
                    current_round_games.append(game)
                    game_time += timedelta(minutes=30)

            # Handle byes if any
            while len(byes) >= 2:
                game = TournamentGame.objects.create(
                    game_type=TournamentGame.GAME_TYPE_DIRECT_ELIMINATION,
                    status=TournamentGame.READY,
                    start_date=game_time,
                )
                game.players.add(byes.pop(0), byes.pop(0))

                TournamentGameSchedule.objects.create(
                    tournament=tournament,
                    game=game,
                    round_number=round_num,
                    match_number=len(current_round_games) + 1,
                    scheduled_time=game_time,
                )
                current_round_games.append(game)
                game_time += timedelta(minutes=30)

            # Update for next round
            prev_round_games = current_round_games
            round_num += 1

    @classmethod
    def _create_round_robin_schedule(cls, tournament: Tournament):
        players = list(tournament.participants.all())
        if len(players) % 2:
            players.append(None)

        n = len(players)
        rounds = n - 1
        matches_per_round = n // 2
        game_time = tournament.start_date

        for round_num in range(rounds):
            for match in range(matches_per_round):
                player1_idx = (round_num + match) % (n - 1)
                player2_idx = (n - 1 - match + round_num) % (n - 1)
                if match == 0:
                    player2_idx = n - 1

                player1 = players[player1_idx]
                player2 = players[player2_idx]

                if player1 and player2:
                    game = TournamentGame.objects.create(
                        game_type=TournamentGame.GAME_TYPE_ROUND_ROBIN,
                        status=(
                            TournamentGame.READY
                            if round_num == 0
                            else TournamentGame.DRAFT
                        ),
                        start_date=game_time,
                        group_number=1,
                    )
                    game.players.add(player1, player2)

                    TournamentGameSchedule.objects.create(
                        tournament=tournament,
                        game=game,
                        round_number=round_num + 1,
                        match_number=match + 1,
                        scheduled_time=game_time,
                    )
                    game_time += timedelta(minutes=30)

            players.insert(1, players.pop())
