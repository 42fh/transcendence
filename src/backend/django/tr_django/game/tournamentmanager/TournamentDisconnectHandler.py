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
            player = user.player
            active_tournaments = Tournament.objects.filter(
                participants=player,
            ).exclude(
                games__status='finished'
            )
            
            for tournament in active_tournaments:
                has_active_games = tournament.games.filter(
                    Q(status='active') | Q(status='ready'),
                    players=player
                ).exists()
                
                if not has_active_games:
                    tournament.participants.remove(player)
                    if tournament.type == Tournament.TYPE_SINGLE_ELIMINATION:
                        draft_games = tournament.games.filter(
                            status='draft',
                            players=player
                        )
                        for game in draft_games:
                            game.players.remove(player)
                            remaining_player = game.players.first()
                            if remaining_player:
                                game.status = 'finished'
                                game.winner = remaining_player
                                game.save()
                    
                    TournamentManager.create_rounds(tournament.id)

        except Exception as e:
            logger.error(f"Error handling tournament disconnect: {e}", exc_info=True)
