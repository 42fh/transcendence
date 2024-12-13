from django.utils import timezone
from asgiref.sync import sync_to_async
import logging
from django.db.models import Q
from .TournamentManager import TournamentManager
from ..models import Tournament, TournamentGame, TournamentGameSchedule, Player  



logger = logging.getLogger(__name__)

class TournamentDisconnectHandler:
    @classmethod
    @sync_to_async
    def handle_tournament_disconnect(cls, user):
        try:
            player = user
            logger.info(f"Handling tournament disconnect for player {player.id}")
            
            # First find any active/ready games the player is in
            active_games = TournamentGame.objects.filter(
                players=player,
                status__in=['active', 'ready']
            )
            
            if not active_games.exists():
                logger.info(f"No active tournament games found for player {player.id}")
                return
                
            # Get the game and associated tournament
            game = active_games.first()
            tournament = Tournament.objects.filter(games=game).first()
            
            if not tournament:
                logger.warning(f"No tournament found for game {game.id}")
                return
                
            logger.info(f"Found tournament {tournament.id} and game {game.id}")
            
            # Remove disconnected player
            game.players.remove(player)
            
            # Get remaining player as winner
            remaining_player = game.players.first()
            logger.info(f"Remaining player: {remaining_player.id if remaining_player else None}")
            
            # Whether there's a remaining player or not, mark game as finished
            game.status = 'finished'
            if remaining_player:
                game.winner = remaining_player
                # Set winner's score to 11 (winning score)
                game_stats = game.playergamestats_set.get(player=remaining_player)
                game_stats.score = 11
                game_stats.save()
            
            game.save()
            
            # Remove player from tournament
            tournament.participants.remove(player)
            logger.info(f"Removed player {player.id} from tournament {tournament.id}")
            
            # create_rounds will handle progression
            TournamentManager.create_rounds(tournament.id)

        except ObjectDoesNotExist as e:
            logger.error(f"Object not found error in tournament disconnect: {e}", exc_info=True)
        except Exception as e:
            logger.error(f"Error handling tournament disconnect: {e}", exc_info=True)
