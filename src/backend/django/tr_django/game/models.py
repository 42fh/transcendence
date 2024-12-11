from decimal import Decimal
import uuid
from django.db import models
from users.models import CustomUser
from django.utils import timezone
from datetime import timedelta, datetime

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
    def start_game(self):
        """Start the game if all conditions are met."""
        if not self.mode:
            raise ValueError("Game mode must be set before starting")

        # Validate player count before starting
        self.validate_player_count()

        # Check if any players are already in an active game
        for stats in self.playergamestats_set.all():
            active_games = PlayerGameStats.objects.filter(
                player=stats.player, single_game__status=self.ACTIVE
            ).exists()
            if active_games:
                raise ValueError(f"Player {stats.player} is already in an active game")

        # Call parent's start_game method instead of duplicating logic
        super().start_game()

    def cancel_game(self, reason: str):
        """Cancel an active game."""
        if self.status not in [self.ACTIVE, self.READY]:
            raise ValueError(f"Cannot cancel game in {self.status} status")

        self.status = self.FINISHED
        self.finished_at = timezone.now()
        self.save()

        # Update player stats if needed
        for stats in self.playergamestats_set.all():
            stats.player.update_stats(won=False)

    def determine_winner(self):
        """Determine the winner based on game scores."""
        if self.status != self.FINISHED:
            raise ValueError(f"Cannot determine winner in {self.status} status")

        # Get player stats
        player_stats = list(self.playergamestats_set.all())
        if len(player_stats) != 2:
            raise ValueError("Can only determine winner for two-player games")

        # Find player with highest score and set as winner
        highest_score = max(player_stats, key=lambda x: x.score)
        self.set_winner(highest_score.player)
        return True






class TournamentGame(BaseGame):
    GAME_TYPE_DIRECT_ELIMINATION = "direct_elimination"
    GAME_TYPE_ROUND_ROBIN = "round_robin"
    GAME_TYPE_SWISS = "swiss"

    GAME_TYPE_CHOICES = [
        (GAME_TYPE_DIRECT_ELIMINATION, "Direct Elimination"),
        (GAME_TYPE_ROUND_ROBIN, "Round Robin"),
        (GAME_TYPE_SWISS, "Swiss System"),
    ]

    game_type = models.CharField(max_length=20, choices=GAME_TYPE_CHOICES)
    # Fields from DirectEliminationTournamentGame
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

    # Fields from RoundRobinTournamentGame
    group_number = models.PositiveIntegerField(null=True, blank=True)

    # Fields from SwissTournamentGame
    swiss_round = models.PositiveIntegerField(null=True, blank=True)
    
    from .tournamentmanager.mode_logic import DirectEliminationLogic, RoundRobinLogic
    def get_mode_logic(self):
        """Factory method to get the appropriate game logic handler"""
        if self.game_type == self.GAME_TYPE_DIRECT_ELIMINATION:
            return DirectEliminationLogic(self)
        elif self.game_type == self.GAME_TYPE_ROUND_ROBIN:
            return RoundRobinLogic(self)
        
        #elif self.game_type == self.GAME_TYPE_SWISS:
        #    return SwissSystemLogic(self)
    
    def set_finished(self, winner):
        """Called by GameCoordinator when game finishes"""
        from .tournamentmanager.TournamentManager  import RedisSyncLock, TournamentManager
        self.status = self.FINISHED
        self.winner = winner
        self.save()
        
        # Get game logic and handle completion before checking rounds
        self.get_game_logic().handle_game_completion()
        
        # Then trigger round check with lock
        with RedisSyncLock(TournamentManager.get_redis(), f"tournament_round_lock_{self.tournament.id}"):
            TournamentManager.create_rounds(self.tournament.id)
        


    def handle_game_completion(self):
        """
        Updates next round's games with this game's winner
        """
        if self.status != self.FINISHED or not self.winner:
            return
            
        # Update next_game1 if this game feeds into it
        for next_game in self.next_game1.all():
            next_game.players.add(self.winner)
            
        # Update next_game2 if this game feeds into it    
        for next_game in self.next_game2.all():
            next_game.players.add(self.winner)
         
        self.completion_handled = True
        self.save()
            
    class Meta:
        abstract = False


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

    # Registration dates
    start_registration = models.DateTimeField()
    end_registration = models.DateTimeField()

    # Tournament type choices
    TYPE_ROUND_ROBIN = "round_robin"
    TYPE_KNOCKOUT = "knockout"
    TYPE_DOUBLE_ELIMINATION = "double_elimination"
    TYPE_SINGLE_ELIMINATION = "single_elimination"

    TYPE_CHOICES = [
        (TYPE_ROUND_ROBIN, "Round Robin"),
        (TYPE_KNOCKOUT, "Knockout"),
        (TYPE_DOUBLE_ELIMINATION, "Double Elimination"),
        (TYPE_SINGLE_ELIMINATION, "Single Elimination"),
    ]

    type = models.CharField(max_length=20, choices=TYPE_CHOICES)

    # Start mode configuration
    START_MODE_FIXED = "fixed"
    START_MODE_AUTO = "auto"

    START_MODE_CHOICES = [
        (START_MODE_FIXED, "Fixed Start Time"),
        (START_MODE_AUTO, "Start When Ready"),
    ]

    start_mode = models.CharField(
        max_length=10,
        choices=START_MODE_CHOICES,
        default=START_MODE_FIXED,
        help_text="Whether to start at fixed time or when minimum participants is reached",
    )

    # For fixed start mode
    start_date = models.DateTimeField(
        null=True, blank=True, help_text="Required for fixed start mode"
    )

    # For auto start mode
    auto_start_delay = models.DurationField(
        default=timedelta(minutes=5),
        help_text="How long to wait after minimum participants reached before starting",
    )

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

    games = models.ManyToManyField(
        TournamentGame,  # Now works because TournamentGame is defined above
        related_name="tournaments",
        through="TournamentGameSchedule",
    )

    def clean(self):
        from django.core.exceptions import ValidationError

        # Validate start mode configuration
        if self.start_mode == self.START_MODE_FIXED and not self.start_date:
            raise ValidationError("Fixed start mode requires a start date")

        # Validate registration dates
        if self.start_registration >= self.end_registration:
            raise ValidationError("Registration end must be after registration start")

        if self.start_mode == self.START_MODE_FIXED:
            if self.end_registration >= self.start_date:
                raise ValidationError("Tournament start must be after registration end")

        if self.end_registration and self.start_registration:
            if self.end_registration < self.start_registration:
                raise ValidationError(
                    {
                        "end_registration": "Registration end date cannot be before registration start date"
                    }
                )
            if self.start_date < self.end_registration:
                raise ValidationError(
                    {
                        "start_date": "Tournament start date must be after registration end date"
                    }
                )

    def can_start(self) -> bool:
        """Check if tournament can start based on its configuration"""
        if self.participants.count() < self.min_participants:
            return False

        now = timezone.now()

        if self.start_mode == self.START_MODE_FIXED:
            return now >= self.start_date
        else:  # AUTO mode
            return now >= (self.last_min_participant_joined_at + self.auto_start_delay)

    @property
    def estimated_start_time(self) -> datetime:
        """Get the estimated start time based on current configuration"""
        if self.start_mode == self.START_MODE_FIXED:
            return self.start_date
        else:
            if self.participants.count() >= self.min_participants:
                return self.last_min_participant_joined_at + self.auto_start_delay
            return None

    def __str__(self):
        return f"{self.name} ({self.get_type_display()}) - Starts on {self.start_date}"


class PrizeConfig(models.Model):
    tournament = models.OneToOneField(Tournament, on_delete=models.CASCADE)
    prize_type = models.CharField(max_length=20)  # Define choices in migration
    prize_details = models.TextField(blank=True, null=True)
    has_entry_fee = models.BooleanField(default=False)
    entry_fee = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )
    prize_pot = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )


class TournamentRanking(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    player = models.ForeignKey("Player", on_delete=models.CASCADE)
    rank = models.PositiveIntegerField()
    points = models.IntegerField()

    class Meta:
        unique_together = ["tournament", "player"]
        ordering = ["rank"]


class TournamentGameSchedule(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    game = models.ForeignKey(TournamentGame, on_delete=models.CASCADE)
    round_number = models.PositiveIntegerField()
    match_number = models.PositiveIntegerField()
    scheduled_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["round_number", "match_number"]


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
        "TournamentGame", on_delete=models.CASCADE, null=True, blank=True
    )
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    # Initial state - with default value
    joined_at = models.DateTimeField(default=timezone.now)
    # Game stats (updated during/after game)
    score = models.IntegerField(default=0)
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
