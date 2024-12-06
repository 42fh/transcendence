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
from ..models import Tournament, TournamentGame, TournamentGameSchedule, Player
import math
import logging


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

class TournamentManager:
    REDIS_URL = "redis://redis:6379/3"

    @classmethod
    def get_redis(cls) -> redis:
        return redis.from_url(cls.REDIS_URL, decode_responses=True)

    @classmethod
    def create_tournament(cls, tournament_data: Dict, game_settings: Dict, creator: Player) -> Dict:
        """Creates tournament with game settings and returns status dict"""
        try:
            start_date = timezone.make_aware(datetime.fromisoformat(tournament_data["startingDate"].replace("Z", "+00:00"))) 
            reg_start = timezone.make_aware( 
                 datetime.fromisoformat(tournament_data["registrationStart"].replace("Z", "+00:00")) 
            ) 
            reg_end = timezone.make_aware( 
                datetime.fromisoformat(tournament_data["registrationClose"].replace("Z", "+00:00")) 
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
                max_participants=tournament_data.get("max_participants", 4)
            )
            if not tournament.is_public and tournament_data.get("allowed_players"):
                allowed_players = Player.objects.filter(user__username__in=tournament_data["allowed_players"])
                tournament.allowed_players.set(allowed_players)

            tournament.full_clean()
            tournament.save()
            response = {"status": True, "tournament_id": tournament.id}
            response.update(cls.add_player(tournament.id, creator))
            return response
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
                    async_to_sync(notifier.player_joined)(player.username) 
                    logger.debug(f"Tournament: booked in: {tournament.participants.count()} full with: {tournament.max_participants}") 
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
        """Creates and schedules tournament games based on tournament type"""
        if tournament.type == Tournament.TYPE_SINGLE_ELIMINATION:
            cls._create_single_elimination_bracket(tournament)
        elif tournament.type == Tournament.TYPE_ROUND_ROBIN:
            cls._create_round_robin_schedule(tournament)
        elif tournament.type == Tournament.TYPE_KNOCKOUT:
            cls._create_knockout_bracket(tournament)
        elif tournament.type == Tournament.TYPE_DOUBLE_ELIMINATION:
            cls._create_double_elimination_bracket(tournament)

        tournament.save()
        
        # Notify players that tournament is starting for this we need the Gamecordinator
        notifier = TournamentNotifier(tournament.id)
        # async_to_sync(notifier.game_ready)()

    @classmethod
    def get_game_schedule(cls, tournament_id: int) -> Dict:
        """
        Get full game schedule for tournament with timing and player info.
        Returns schedule organized by rounds.
        """
        try:
            tournament = Tournament.objects.get(pk=tournament_id)
            schedules = TournamentGameSchedule.objects.filter(
                tournament=tournament
            ).select_related('game').prefetch_related('game__players').order_by(
                'round_number', 'match_number'
            )

            schedule_by_rounds = {}
            for schedule in schedules:
                game = schedule.game
                players = list(game.players.all())
                
                game_info = {
                    'match_number': schedule.match_number,
                    'scheduled_time': schedule.scheduled_time,
                    'status': game.status,
                    'game_id': game.id,
                    'players': [
                        {'id': p.id, 'name': p.display_name} 
                        for p in players
                    ] if players else [],
                    'source_games': [
                        game.source_game1_id,
                        game.source_game2_id
                    ] if tournament.type == Tournament.TYPE_SINGLE_ELIMINATION else None
                }

                round_num = schedule.round_number
                if round_num not in schedule_by_rounds:
                    schedule_by_rounds[round_num] = []
                schedule_by_rounds[round_num].append(game_info)

            return {
                'status': True,
                'tournament_id': tournament_id,
                'type': tournament.type,
                'schedule': schedule_by_rounds
            }

        except Tournament.DoesNotExist:
            return {
                'status': False,
                'message': 'Tournament not found',
                'error_code': 'NOT_FOUND'
            }
        except Exception as e:
            return {
                'status': False,
                'message': f'Error getting schedule: {str(e)}',
                'error_code': 'SERVER_ERROR' 
            }

    @classmethod
    def create_rounds(cls, tournament_id: int): 
        """
        Checks all rounds in tournament and creates/updates games as needed.
        - Creates GameCoordinator games for full tournament games
        - Notifies players of game status
        - Handles tournament completion
        """
        try:
            tournament = Tournament.objects.get(pk=tournament_id)
            games = TournamentGameSchedule.objects.filter(
                tournament=tournament
            ).select_related('game').order_by('round_number')
            
            tournament_completed = True  # Flag to track if all games are complete
            games_started = 0  # Counter for started games
            
            for schedule in games:
                game = schedule.game
                players = list(game.players.all())
                
                # Skip if game empty or completed
                if not players or game.status == TournamentGame.COMPLETED:
                    continue
                    
                tournament_completed = False  # At least one game not complete
                    
                # If game has all required players
                if len(players) == tournament.max_participants:
                    if game.status != TournamentGame.IN_PROGRESS:  # Don't recreate if already running
                        response = GameCoordinator.create_tournament_game(
                            real_game_id=game.id,
                            tournament_id=tournament_id,
                            players=players,
                            game_settings={"mode": "classic"}
                        )
                        
                        if response["status"] == "running":
                            game.status = TournamentGame.IN_PROGRESS
                            game.save()
                            games_started += 1
                            
                            # Notify players
                            notifier = TournamentNotifier(tournament_id)
                            for player_id, ws_url in response["player_urls"]:
                                async_to_sync(notifier.game_ready)(game.id, ws_url)
                else:
                    tournament_completed = False
                    # Game waiting for players
                    notifier = TournamentNotifier(tournament_id)
                    async_to_sync(notifier.game_needs_players)(game.id)
                    
                    # Get list of running games for spectating
                    running_games = games.filter(
                        game__status=TournamentGame.IN_PROGRESS
                    )
                    for running_game in running_games:
                        async_to_sync(notifier.spectate_available)(
                            running_game.game.id,
                            f"ws/game/{tournament_id}:{running_game.game.id}/"
                        )
            if tournament_completed:
                tournament.status = Tournament.STATUS_COMPLETED
                tournament.save()
                # Notify tournament completion
                notifier = TournamentNotifier(tournament_id)
                async_to_sync(notifier.tournament_complete)(tournament_id)
            logger.info(f"status: {True} //  message: Rounds processed. {games_started} new games started. // tournament_completed: {tournament_completed} ")
            return 
            
        except Tournament.DoesNotExist:
            logger.error(f"status: {False} //  message: Tournament not found")
            return 
        except Exception as e:
            logger.error(f"status: {False} //  message: Error processing rounds: {str(e)}")
            return 



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
        perfect_bracket_size = 2 ** num_rounds
        num_byes = perfect_bracket_size - num_players
        
        for i in range(0, num_players - num_byes, 2):
            game = TournamentGame.objects.create(
                game_type=TournamentGame.GAME_TYPE_DIRECT_ELIMINATION,
                status=TournamentGame.READY,
                start_date=game_time
            )
            game.players.add(players[i], players[i+1])
            
            TournamentGameSchedule.objects.create(
                tournament=tournament,
                game=game,
                round_number=1,
                match_number=len(first_round_games) + 1,
                scheduled_time=game_time
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
                        source_game2=prev_round_games[i+1]
                    )
                    
                    TournamentGameSchedule.objects.create(
                        tournament=tournament,
                        game=game,
                        round_number=round_num,
                        match_number=len(current_round_games) + 1,
                        scheduled_time=game_time
                    )
                    current_round_games.append(game)
                    game_time += timedelta(minutes=30)
                
            # Handle byes if any
            while len(byes) >= 2:
                game = TournamentGame.objects.create(
                    game_type=TournamentGame.GAME_TYPE_DIRECT_ELIMINATION,
                    status=TournamentGame.READY,
                    start_date=game_time
                )
                game.players.add(byes.pop(0), byes.pop(0))
                
                TournamentGameSchedule.objects.create(
                    tournament=tournament,
                    game=game,
                    round_number=round_num,
                    match_number=len(current_round_games) + 1,
                    scheduled_time=game_time
                )
                current_round_games.append(game)
                game_time += timedelta(minutes=30)
            
            # Update for next round
            prev_round_games = current_round_games
            round_num += 1

    @classmethod
    def _create_round_robin_schedule(cls, tournament: Tournament):
        """Creates a round robin tournament schedule"""
        players = list(tournament.participants.all())
        if len(players) % 2:
            players.append(None)  # Add bye if odd number of players
            
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
                
                if player1 and player2:  # Skip if either player is None (bye)
                    game = TournamentGame.objects.create(
                        game_type=TournamentGame.GAME_TYPE_ROUND_ROBIN,
                        status=TournamentGame.READY,
                        start_date=game_time,
                        group_number=1  # All players in same group for simple round robin
                    )
                    game.players.add(player1, player2)
                    
                    TournamentGameSchedule.objects.create(
                        tournament=tournament,
                        game=game,
                        round_number=round_num + 1,
                        match_number=match + 1,
                        scheduled_time=game_time
                    )
                    game_time += timedelta(minutes=30)
            
            # Rotate players for next round
            players.insert(1, players.pop())


