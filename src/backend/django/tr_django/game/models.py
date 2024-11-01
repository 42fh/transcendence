from decimal import Decimal
import uuid
from django.db import models
from users.models import CustomUser
from django.utils import timezone


class Player(models.Model):
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name="player"
    )
    display_name = models.CharField(max_length=50, unique=True, null=True, blank=True)

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

    @property
    def get_display_name(self):
        # Return display_name if set, otherwise return username
        return self.display_name or self.username

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


class GameMode(models.Model):
    # Basic fields
    name = models.CharField(max_length=200)
    description = models.TextField()

    # Player count configuration
    SINGLE_PLAYER = 1
    TWO_PLAYER = 2
    MULTIPLAYER = 3

    PLAYER_COUNT_CHOICES = [
        (SINGLE_PLAYER, "Single Player"),
        (TWO_PLAYER, "Two Player"),
        (MULTIPLAYER, "Multiplayer"),
    ]
    player_count = models.PositiveSmallIntegerField(
        choices=PLAYER_COUNT_CHOICES, default=TWO_PLAYER
    )
    exact_player_count = models.PositiveIntegerField(
        null=True, blank=True, help_text="Exact number of players for multiplayer games"
    )

    # Game configuration
    ball_speed = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=1.0,
        help_text="Default ball speed multiplier",
    )
    paddle_size = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=1.0,
        help_text="Default paddle size multiplier",
    )
    number_of_balls = models.IntegerField(
        default=1, help_text="Number of balls in play"
    )
    ball_size = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=1.0,
        help_text="Size multiplier for balls",
    )

    # Game type configuration
    PERSPECTIVE_CHOICES = [
        ("2D", "2D"),
        ("3D", "3D"),
    ]
    perspective = models.CharField(
        max_length=2, choices=PERSPECTIVE_CHOICES, default="2D"
    )

    LOCATION_CHOICES = [
        ("local", "Local"),
        ("remote", "Remote"),
    ]
    location = models.CharField(
        max_length=10,
        choices=LOCATION_CHOICES,
        default="remote",
    )

    # Power-ups configuration
    power_up_choices = [
        ("none", "None"),
        ("speed_boost", "Ball Speed Boost"),
        ("paddle_size", "Paddle Size Change"),
        ("multi_ball", "Multi-Ball"),
        ("reverse_controls", "Reverse Controls"),
        ("all", "All Power-Ups"),
    ]
    power_ups_enabled = models.CharField(
        max_length=50,
        choices=power_up_choices,
        default="none",
        help_text="Type of power-ups enabled in this game mode",
    )

    # Win conditions
    WIN_CONDITION_CHOICES = [
        ("points", "Play to Points"),
        ("time", "Play by Time"),
    ]
    win_condition = models.CharField(
        max_length=6, choices=WIN_CONDITION_CHOICES, default="points"
    )
    winning_score = models.PositiveIntegerField(
        default=11,
        blank=True,
        help_text="Target score to win (only relevant for 'Play to Points' mode).",
    )
    time_limit_seconds = models.PositiveIntegerField(
        default=60,
        blank=True,
        help_text="Time limit in seconds (only relevant for 'Play by Time' mode).",
    )
    allow_both_conditions = models.BooleanField(
        default=False,
        help_text="Allow the game to end if either the score or time condition is met.",
    )

    def clean(self):
        from django.core.exceptions import ValidationError

        # Validate exact_player_count
        if self.player_count == self.MULTIPLAYER:
            if not self.exact_player_count:
                raise ValidationError(
                    "Exact player count is required for multiplayer games"
                )
            if self.exact_player_count < 3:
                raise ValidationError("Multiplayer games must have at least 3 players")
        elif self.exact_player_count:
            raise ValidationError(
                "Exact player count should only be set for multiplayer games"
            )

    def __str__(self):
        return f"{self.name} ({self.get_player_count_display()}, {self.get_perspective_display()}) - {self.get_win_condition_display()}"

    def describe_mode(self):
        """Return a human-readable description of the game mode with all selected options."""
        description = f"{self.name}: {self.description}\n"
        description += f"Perspective: {self.get_perspective_display()}\n"
        description += f"Player Count: {self.get_player_count_display()}"
        if self.player_count == self.MULTIPLAYER:
            description += f" (Exact: {self.exact_player_count})\n"
        else:
            description += "\n"
        description += f"Location: {self.get_location_display()}\n"

        # Game configuration details
        description += f"Ball Speed: {self.ball_speed}x\n"
        description += f"Paddle Size: {self.paddle_size}x\n"
        description += f"Ball Size: {self.ball_size}x\n"
        description += f"Number of Balls: {self.number_of_balls}\n"

        # Power-ups
        description += f"Power-ups: {self.get_power_ups_enabled_display()}\n"

        # Win conditions
        description += f"Win Condition: {self.get_win_condition_display()}\n"
        if self.win_condition == "points" or self.allow_both_conditions:
            description += f"Winning Score: {self.winning_score}\n"
        if self.win_condition == "time" or self.allow_both_conditions:
            description += f"Time Limit: {self.time_limit_seconds} seconds\n"
        if self.allow_both_conditions:
            description += "Note: Game ends when either condition is met\n"

        return description.strip()  # Remove trailing newline

    def get_game_config(self):
        """Returns a dictionary with all game configuration parameters for game initialization."""
        return {
            "ball_speed": float(self.ball_speed),
            "paddle_size": float(self.paddle_size),
            "number_of_balls": self.number_of_balls,
            "ball_size": float(self.ball_size),
            "perspective": self.perspective,
            "power_ups": self.power_ups_enabled,
            "win_condition": {
                "type": self.win_condition,
                "points": (
                    self.winning_score
                    if self.win_condition == "points" or self.allow_both_conditions
                    else None
                ),
                "time": (
                    self.time_limit_seconds
                    if self.win_condition == "time" or self.allow_both_conditions
                    else None
                ),
                "allow_both": self.allow_both_conditions,
            },
        }


class BaseGame(models.Model):
    """
    Abstract base class for all game types. Provides common fields and relationships.

    Related name patterns for accessing games from a Player instance:
    1. All games a player participated in:
       - SingleGame: player.single_games.all()
       - TournamentGame: player.directeliminationtournament_games.all()

    2. Games a player won:
       - SingleGame: player.won_single_games.all()
       - TournamentGame: player.won_directeliminationtournament_games.all()

    These related names are automatically generated using Django's %(class)s placeholder,
    which gets replaced with the lowercase name of the child class.

    Game Status Flow:
    DRAFT -> READY -> ACTIVE -> FINISHED
    - DRAFT: Initial setup, fully modifiable
    - READY: Configuration complete, waiting for start
    - ACTIVE: Game in progress, configuration locked
    - FINISHED: Game completed
    """

    DRAFT = "draft"
    READY = "ready"
    ACTIVE = "active"
    FINISHED = "finished"

    GAME_STATUS_CHOICES = [
        (DRAFT, "Draft"),
        (READY, "Ready"),
        (ACTIVE, "Active"),
        (FINISHED, "Finished"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    status = models.CharField(max_length=10, choices=GAME_STATUS_CHOICES, default=DRAFT)
    mode = models.ForeignKey(
        GameMode,
        on_delete=models.SET_NULL,
        null=True,
        help_text="Defines game rules and player requirements",
    )
    players = models.ManyToManyField(
        Player, through="PlayerGameStats", related_name="%(class)s_games"
    )
    winner = models.ForeignKey(
        Player,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="won_%(class)s_games",
    )

    # Timestamps
    created_at = models.DateTimeField(null=True, blank=True)
    start_date = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def __str__(self):
        status_str = f"[{self.status.upper()}]"
        date_str = f"on {self.start_date}" if self.start_date else "(not started)"
        return f"{status_str} {self.mode.name} {date_str}"

    def validate_player_count(self):
        """Validate that player count matches game mode requirements"""
        if not self.mode:
            raise ValueError("Cannot validate player count without a game mode")

        current_count = self.players.count()

        if self.mode.player_count == GameMode.MULTIPLAYER:
            if current_count != self.mode.exact_player_count:
                raise ValueError(
                    f"Multiplayer game requires exactly {self.mode.exact_player_count} players, "
                    f"got {current_count}"
                )
        elif self.mode.player_count == GameMode.TWO_PLAYER:
            if current_count != 2:
                raise ValueError(
                    f"Two-player game requires exactly 2 players, got {current_count}"
                )
        elif self.mode.player_count == GameMode.SINGLE_PLAYER:
            if current_count != 1:
                raise ValueError(
                    f"Single-player game requires exactly 1 player, got {current_count}"
                )

    def mark_as_ready(self):
        """Mark game as ready to start after validating configuration"""
        if self.status != self.DRAFT:
            raise ValueError(f"Cannot mark game as ready from {self.status} status")

        # Validate game configuration
        if not self.mode:
            raise ValueError("Cannot start game without a game mode")

        self.validate_player_count()

        self.status = self.READY
        self.save()

    def start_game(self):
        """Start the game, setting start_date and moving to ACTIVE status"""
        if self.status not in [self.DRAFT, self.READY]:
            raise ValueError(f"Cannot start game in {self.status} status")

        # If coming directly from DRAFT, validate configuration
        if self.status == self.DRAFT:
            self.mark_as_ready()

        # Set created_at if not already set
        if not self.created_at:
            self.created_at = timezone.now()

        self.start_date = timezone.now()
        self.status = self.ACTIVE
        self.save()

    def finish_game(self):
        """Mark game as finished"""
        if self.status != self.ACTIVE:
            raise ValueError(f"Cannot finish game in {self.status} status")

        self.status = self.FINISHED
        self.finished_at = timezone.now()
        self.save()

    def set_winner(self, player: Player):
        """Set the winner of the game"""
        if self.status != self.FINISHED:
            raise ValueError("Cannot set winner before game is finished")
        try:
            self.winner = self.playergamestats_set.get(player=player).player
            self.save()
        except PlayerGameStats.DoesNotExist:
            raise ValueError(f"Player {player} not found in game {self}")

    @property
    def duration(self):
        """Calculate actual game duration in seconds"""
        if self.status == self.FINISHED and self.start_date and self.finished_at:
            return (self.finished_at - self.start_date).total_seconds()
        return None

    def save_as_template(self, template_name: str):
        """Save current game configuration as a template"""
        if self.status != self.DRAFT:
            raise ValueError("Can only save drafts as templates")
        # Implementation for saving as template
        pass


class SingleGame(BaseGame):
    pass  # Inherits everything from BaseGame


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
    type_choices = [
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
        "DirectEliminationTournamentGame",  # Now referencing a concrete tournament game model
        related_name="tournaments",
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
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True


class DirectEliminationTournamentGame(TournamentGame):
    source_game1 = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="next_game1",
    )
    source_game2 = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="next_game2",
    )


# The most straightforward way to store player stats for a game is to create an intermediate model
# that links a player to a game and stores individual stats like score and rank. SQL doesn’t support
# storing complex objects directly.
class PlayerGameStats(models.Model):
    """
    Tracks player-specific statistics for a game.
    Initially created when a player joins a game, updated throughout gameplay.
    """

    # Instead of referencing BaseGame, use a generic foreign key
    single_game = models.ForeignKey(
        "SingleGame", on_delete=models.CASCADE, null=True, blank=True
    )
    tournament_game = models.ForeignKey(
        "DirectEliminationTournamentGame",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    # Initial state - with default value
    joined_at = models.DateTimeField(default=timezone.now)
    # Game stats (updated during/after game)
    score = models.IntegerField(null=True, blank=True)
    rank = models.PositiveIntegerField(null=True, blank=True)

    def __str__(self):
        score_display = (
            f"Score: {self.score}" if self.score is not None else "No score yet"
        )
        rank_display = f"Rank: {self.rank}" if self.rank is not None else "No rank yet"
        return f"{self.player.display_name} - {score_display}, {rank_display}"

    @property
    def game(self):
        """Returns the associated game, whether single or tournament"""
        return self.single_game or self.tournament_game


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
