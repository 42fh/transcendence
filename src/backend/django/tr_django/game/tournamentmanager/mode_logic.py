class TournamentGameLogic:
    def __init__(self, game):
        self.game = game

    def handle_game_completion(self):
        """Base method - each tournament type handles completion differently"""
        if self.game.status != 'FINISHED' or not self.game.winner:
            return False
        return True


class DirectEliminationLogic(TournamentGameLogic):
    def handle_game_completion(self):
        """Handle completion specific to elimination tournaments"""
        if not super().handle_game_completion():
            return False
            
        # Add winner to next games since next players aren't known in advance
        for next_game in self.game.next_game1.all():
            next_game.players.add(self.game.winner)
            
        for next_game in self.game.next_game2.all():
            next_game.players.add(self.game.winner)
         
        return True


class RoundRobinLogic(TournamentGameLogic):
    def handle_game_completion(self):
        """Handle completion specific to round robin tournaments"""
        if not super().handle_game_completion():
            return False

        # Update rankings only - no need to handle player advancement
        # since all games are pre-created with players
        ranking, _ = TournamentRanking.objects.get_or_create(
            tournament=self.game.tournament,
            player=self.game.winner,
            defaults={'points': 0, 'rank': 0}
        )
        ranking.points += 3
        ranking.save()
        
        return True

