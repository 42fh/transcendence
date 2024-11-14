# Generated by Django 5.1.2 on 2024-11-14 21:34

import datetime
import django.db.models.deletion
import django.utils.timezone
import uuid
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="GameMode",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=200)),
                ("description", models.TextField()),
                (
                    "player_count",
                    models.PositiveSmallIntegerField(
                        choices=[
                            (1, "Single Player"),
                            (2, "Two Player"),
                            (3, "Multiplayer"),
                        ],
                        default=2,
                    ),
                ),
                (
                    "exact_player_count",
                    models.PositiveIntegerField(
                        blank=True,
                        help_text="Exact number of players for multiplayer games",
                        null=True,
                    ),
                ),
                (
                    "ball_speed",
                    models.DecimalField(
                        decimal_places=2,
                        default=1.0,
                        help_text="Default ball speed multiplier",
                        max_digits=5,
                    ),
                ),
                (
                    "paddle_size",
                    models.DecimalField(
                        decimal_places=2,
                        default=1.0,
                        help_text="Default paddle size multiplier",
                        max_digits=5,
                    ),
                ),
                (
                    "number_of_balls",
                    models.IntegerField(default=1, help_text="Number of balls in play"),
                ),
                (
                    "ball_size",
                    models.DecimalField(
                        decimal_places=2,
                        default=1.0,
                        help_text="Size multiplier for balls",
                        max_digits=5,
                    ),
                ),
                (
                    "perspective",
                    models.CharField(
                        choices=[("2D", "2D"), ("3D", "3D")], default="2D", max_length=2
                    ),
                ),
                (
                    "location",
                    models.CharField(
                        choices=[("local", "Local"), ("remote", "Remote")],
                        default="remote",
                        max_length=10,
                    ),
                ),
                (
                    "power_ups_enabled",
                    models.CharField(
                        choices=[
                            ("none", "None"),
                            ("speed_boost", "Ball Speed Boost"),
                            ("paddle_size", "Paddle Size Change"),
                            ("multi_ball", "Multi-Ball"),
                            ("reverse_controls", "Reverse Controls"),
                            ("all", "All Power-Ups"),
                        ],
                        default="none",
                        help_text="Type of power-ups enabled in this game mode",
                        max_length=50,
                    ),
                ),
                (
                    "win_condition",
                    models.CharField(
                        choices=[
                            ("points", "Play to Points"),
                            ("time", "Play by Time"),
                        ],
                        default="points",
                        max_length=6,
                    ),
                ),
                (
                    "winning_score",
                    models.PositiveIntegerField(
                        blank=True,
                        default=11,
                        help_text="Target score to win (only relevant for 'Play to Points' mode).",
                    ),
                ),
                (
                    "time_limit_seconds",
                    models.PositiveIntegerField(
                        blank=True,
                        default=60,
                        help_text="Time limit in seconds (only relevant for 'Play by Time' mode).",
                    ),
                ),
                (
                    "allow_both_conditions",
                    models.BooleanField(
                        default=False,
                        help_text="Allow the game to end if either the score or time condition is met.",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Player",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "display_name",
                    models.CharField(blank=True, max_length=50, null=True, unique=True),
                ),
                ("wins", models.PositiveIntegerField(default=0)),
                ("losses", models.PositiveIntegerField(default=0)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="player",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="PlayerGameStats",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("joined_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("score", models.IntegerField(default=0)),
                ("rank", models.PositiveIntegerField(blank=True, null=True)),
                (
                    "player",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="game.player"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Ranking",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("points", models.IntegerField(default=0)),
                ("rank_position", models.IntegerField(blank=True, null=True)),
                (
                    "player",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ranking",
                        to="game.player",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="SingleGame",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("draft", "Draft"),
                            ("ready", "Ready"),
                            ("active", "Active"),
                            ("finished", "Finished"),
                        ],
                        default="draft",
                        max_length=10,
                    ),
                ),
                ("created_at", models.DateTimeField(blank=True, null=True)),
                ("start_date", models.DateTimeField(blank=True, null=True)),
                ("finished_at", models.DateTimeField(blank=True, null=True)),
                (
                    "mode",
                    models.ForeignKey(
                        help_text="Defines game rules and player requirements",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="game.gamemode",
                    ),
                ),
                (
                    "players",
                    models.ManyToManyField(
                        related_name="%(class)s_games",
                        through="game.PlayerGameStats",
                        to="game.player",
                    ),
                ),
                (
                    "winner",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="won_%(class)s_games",
                        to="game.player",
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.AddField(
            model_name="playergamestats",
            name="single_game",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="game.singlegame",
            ),
        ),
        migrations.CreateModel(
            name="Tournament",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=100)),
                ("description", models.TextField(blank=True, null=True)),
                ("start_registration", models.DateTimeField()),
                ("end_registration", models.DateTimeField()),
                (
                    "type",
                    models.CharField(
                        choices=[
                            ("round_robin", "Round Robin"),
                            ("knockout", "Knockout"),
                            ("double_elimination", "Double Elimination"),
                            ("single_elimination", "Single Elimination"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "start_mode",
                    models.CharField(
                        choices=[
                            ("fixed", "Fixed Start Time"),
                            ("auto", "Start When Ready"),
                        ],
                        default="fixed",
                        help_text="Whether to start at fixed time or when minimum participants is reached",
                        max_length=10,
                    ),
                ),
                (
                    "start_date",
                    models.DateTimeField(
                        blank=True, help_text="Required for fixed start mode", null=True
                    ),
                ),
                (
                    "auto_start_delay",
                    models.DurationField(
                        default=datetime.timedelta(seconds=300),
                        help_text="How long to wait after minimum participants reached before starting",
                    ),
                ),
                ("is_public", models.BooleanField(default=True)),
                ("min_participants", models.PositiveIntegerField(default=2)),
                (
                    "max_participants",
                    models.PositiveIntegerField(blank=True, null=True),
                ),
                (
                    "allowed_players",
                    models.ManyToManyField(
                        blank=True,
                        related_name="allowed_in_tournaments",
                        to="game.player",
                    ),
                ),
                (
                    "creator",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_tournaments",
                        to="game.player",
                    ),
                ),
                (
                    "participants",
                    models.ManyToManyField(
                        blank=True,
                        related_name="tournaments_participated",
                        to="game.player",
                    ),
                ),
                (
                    "waiting_list",
                    models.ManyToManyField(
                        blank=True,
                        related_name="tournaments_waiting_list",
                        to="game.player",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="PrizeConfig",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("prize_type", models.CharField(max_length=20)),
                ("prize_details", models.TextField(blank=True, null=True)),
                ("has_entry_fee", models.BooleanField(default=False)),
                (
                    "entry_fee",
                    models.DecimalField(
                        decimal_places=2, default=Decimal("0.00"), max_digits=10
                    ),
                ),
                (
                    "prize_pot",
                    models.DecimalField(
                        decimal_places=2, default=Decimal("0.00"), max_digits=10
                    ),
                ),
                (
                    "tournament",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="game.tournament",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="TournamentGame",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("draft", "Draft"),
                            ("ready", "Ready"),
                            ("active", "Active"),
                            ("finished", "Finished"),
                        ],
                        default="draft",
                        max_length=10,
                    ),
                ),
                ("created_at", models.DateTimeField(blank=True, null=True)),
                ("start_date", models.DateTimeField(blank=True, null=True)),
                ("finished_at", models.DateTimeField(blank=True, null=True)),
                (
                    "game_type",
                    models.CharField(
                        choices=[
                            ("direct_elimination", "Direct Elimination"),
                            ("round_robin", "Round Robin"),
                            ("swiss", "Swiss System"),
                        ],
                        max_length=20,
                    ),
                ),
                ("group_number", models.PositiveIntegerField(blank=True, null=True)),
                ("swiss_round", models.PositiveIntegerField(blank=True, null=True)),
                (
                    "mode",
                    models.ForeignKey(
                        help_text="Defines game rules and player requirements",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="game.gamemode",
                    ),
                ),
                (
                    "players",
                    models.ManyToManyField(
                        related_name="%(class)s_games",
                        through="game.PlayerGameStats",
                        to="game.player",
                    ),
                ),
                (
                    "source_game1",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="next_game1",
                        to="game.tournamentgame",
                    ),
                ),
                (
                    "source_game2",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="next_game2",
                        to="game.tournamentgame",
                    ),
                ),
                (
                    "winner",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="won_%(class)s_games",
                        to="game.player",
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.AddField(
            model_name="playergamestats",
            name="tournament_game",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="game.tournamentgame",
            ),
        ),
        migrations.CreateModel(
            name="TournamentGameSchedule",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("round_number", models.PositiveIntegerField()),
                ("match_number", models.PositiveIntegerField()),
                ("scheduled_time", models.DateTimeField(blank=True, null=True)),
                (
                    "game",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="game.tournamentgame",
                    ),
                ),
                (
                    "tournament",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="game.tournament",
                    ),
                ),
            ],
            options={
                "ordering": ["round_number", "match_number"],
            },
        ),
        migrations.AddField(
            model_name="tournament",
            name="games",
            field=models.ManyToManyField(
                related_name="tournaments",
                through="game.TournamentGameSchedule",
                to="game.tournamentgame",
            ),
        ),
        migrations.CreateModel(
            name="TournamentRanking",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("rank", models.PositiveIntegerField()),
                ("points", models.IntegerField()),
                (
                    "player",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="game.player"
                    ),
                ),
                (
                    "tournament",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="game.tournament",
                    ),
                ),
            ],
            options={
                "ordering": ["rank"],
                "unique_together": {("tournament", "player")},
            },
        ),
    ]
