from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal
from users.models import CustomUser 

class GameMode(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()

    def __str__(self):
        return str(self.name)

class Player(models.Model):
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name="player"
    )
    display_name = models.CharField(max_length=50, unique=True)

    wins = models.PositiveIntegerField(default=0)
    losses = models.PositiveIntegerField(default=0)

    @property
    def avatar(self):
        # Return the avatar from the linked CustomUser model
        return self.user.avatar.url if self.user.avatar else None

    @property
    def username(self):
        # Access the username of the associated CustomUser
        return self.user.username

    def update_stats(self, won: bool):
        if won:
            self.wins += 1
        else:
            self.losses += 1
        self.save()

    def win_ratio(self):
        return (
            self.wins / (self.wins + self.losses) if self.wins + self.losses > 0 else 0
        )


class BaseGame(models.Model):
    date = models.DateTimeField()
    duration = models.IntegerField(blank=True, null=True)
    mode = models.ForeignKey(GameMode, on_delete=models.SET_NULL, null=True)
    players = models.ManyToManyField(Player, through="PlayerGameStats")
    winner = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True)

    class Meta:
        abstract = True

    def __str__(self):
        return f"{self.mode.name} on {self.date}"

    def set_winner(self, player: Player):
        try:
            self.winner = self.playergamestats_set.get(player=player).player
            self.save()
        except PlayerGameStats.DoesNotExist:
            raise ValueError(f"Player {player} not found in game {self}")


class SingleGame(BaseGame):
    mode = models.ForeignKey(GameMode, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"SingleGame: {self.mode.name} on {self.date}"


class Tournament(models.Model):
    # Basic tournament details
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    participants = models.ManyToManyField(
        "Player", blank=True, related_name="tournaments_participated"
    )
    waiting_list = models.ManyToManyField(
        "Player", blank=True, related_name="tournaments_waiting_list"
    )

    # Registration and start dates
    start_registration = models.DateTimeField()
    end_registration = models.DateTimeField()
    start_date = models.DateTimeField()

    # Optional auto-start time after min participants reached
    auto_start_warning_time = models.DurationField(
        blank=True, null=True, help_text="Time delay after min participants reached"
    )

    # Tournament type choices with auto-derived labels
    TYPE_CHOICES = [
        ("round_robin", "Round Robin"),
        ("knockout", "Knockout"),
        ("double_elimination", "Double Elimination"),
        ("single_elimination", "Single Elimination"),
    ]

    type = models.CharField(max_length=20, choices=type_choices)

    # Visibility and participant settings
    is_public = models.BooleanField(default=True)
    allowed_players = models.ManyToManyField(
        "Player", blank=True, related_name="allowed_in_tournaments"
    )
    creator = models.ForeignKey(
        "Player",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_tournaments",
    )
    min_participants = models.PositiveIntegerField(default=2)
    max_participants = models.PositiveIntegerField(blank=True, null=True)

    # Relationships and tournament-specific data
    match_schedule = models.ManyToManyField(
        "Game", blank=True, related_name="tournaments"
    )
    ranking = models.JSONField(
        blank=True,
        null=True,
        help_text="Stores ranking details, e.g., [{'player_id': 1, 'rank': 1, 'points': 100}]",
    )

    PRIZE_CHOICES = [
        ("no_prize", "No Prize"),
        ("crypto_coin", "Crypto Coin"),
        ("real_money", "Real Money"),
        ("in_game_points", "In Game Points"),
        ("fun_item", "Fun Item"),
    ]
    prize_type = models.CharField(max_length=20, choices=PRIZE_CHOICES)
    prize_details = models.TextField(blank=True, null=True)

    # Entry fee details
    has_entry_fee = models.BooleanField(default=False)
    entry_fee = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )
    prize_pot = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )

    def __str__(self):
        return f"{self.name} ({self.get_type_display()}) - Starts on {self.start_date}"

    def add_to_pot(self, amount):
        """Adds entry fees or other contributions to the tournament's prize pot."""
        self.prize_pot += amount
        self.save()


class TournamentGame(BaseGame):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)

    class Meta:
        abstract = True

    def __str__(self):
        return f"Tournament Game ({self.tournament.name}) - {self.mode.name} on {self.date}"


class DirectEliminationTournamentGame(TournamentGame):
    round_number = models.PositiveIntegerField(default=1)
    source_game1 = models.ForeignKey(
        TournamentGame,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="next_game_as_player1",
    )
    source_game2 = models.ForeignKey(
        TournamentGame,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="next_game_as_player2",
    )

    def __str__(self):
        return f"Direct Elimination Game - Round {self.round_number} ({self.date})"tTo


# The most straightforward way to store player stats for a game is to create an intermediate model
# that links a player to a game and stores individual stats like score and rank. SQL doesn’t support
# storing complex objects directly.
class PlayerGameStats(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    score = models.IntegerField(default=0)
    rank = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.player.display_name} - Game on {self.game.date} - Score: {self.score}, Rank: {self.rank}"


class Ranking(models.Model):
    player = models.OneToOneField(
        Player, on_delete=models.CASCADE, related_name="ranking"
    )
    points = models.IntegerField(default=0)
    rank_position = models.IntegerField(null=True, blank=True)

    def update_points(self, new_points: int):
        self.points += new_points
        self.save()
        Ranking.recalculate_rankings()

    @staticmethod
    def recalculate_rankings():
        rankings = Ranking.objects.order_by(
            "-points", "player__id"
        )  # Sort by points descending, then by player ID

        current_rank = 1
        previous_points = None
        skipped_ranks = 0

        for position, ranking in enumerate(rankings, start=1):
            # If points differ from the previous, update rank; otherwise, keep the same rank
            if ranking.points != previous_points:
                current_rank = position  # Update to current position in the list
                skipped_ranks = 0  # Reset skipped ranks count
            else:
                skipped_ranks += 1

            ranking.rank_position = current_rank
            ranking.save()

        previous_points = ranking.points
