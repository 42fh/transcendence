# Generated by Django 5.1.2 on 2024-11-01 16:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("game", "0002_alter_player_display_name"),
    ]

    operations = [
        migrations.AddField(
            model_name="gamemode",
            name="allow_both_conditions",
            field=models.BooleanField(
                default=False,
                help_text="Allow the game to end if either the score or time condition is met.",
            ),
        ),
        migrations.AddField(
            model_name="gamemode",
            name="ball_size",
            field=models.DecimalField(
                decimal_places=2,
                default=1.0,
                help_text="Size multiplier for balls",
                max_digits=5,
            ),
        ),
        migrations.AddField(
            model_name="gamemode",
            name="ball_speed",
            field=models.DecimalField(
                decimal_places=2,
                default=1.0,
                help_text="Default ball speed multiplier",
                max_digits=5,
            ),
        ),
        migrations.AddField(
            model_name="gamemode",
            name="exact_player_count",
            field=models.PositiveIntegerField(
                blank=True,
                help_text="Exact number of players for multiplayer games",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="gamemode",
            name="location",
            field=models.CharField(
                choices=[("local", "Local"), ("remote", "Remote")],
                default="remote",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="gamemode",
            name="number_of_balls",
            field=models.IntegerField(default=1, help_text="Number of balls in play"),
        ),
        migrations.AddField(
            model_name="gamemode",
            name="paddle_size",
            field=models.DecimalField(
                decimal_places=2,
                default=1.0,
                help_text="Default paddle size multiplier",
                max_digits=5,
            ),
        ),
        migrations.AddField(
            model_name="gamemode",
            name="perspective",
            field=models.CharField(
                choices=[("2D", "2D"), ("3D", "3D")], default="2D", max_length=2
            ),
        ),
        migrations.AddField(
            model_name="gamemode",
            name="player_count",
            field=models.PositiveSmallIntegerField(
                choices=[(1, "Single Player"), (2, "Two Player"), (3, "Multiplayer")],
                default=2,
            ),
        ),
        migrations.AddField(
            model_name="gamemode",
            name="power_ups_enabled",
            field=models.CharField(
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
        migrations.AddField(
            model_name="gamemode",
            name="time_limit_seconds",
            field=models.PositiveIntegerField(
                blank=True,
                default=60,
                help_text="Time limit in seconds (only relevant for 'Play by Time' mode).",
            ),
        ),
        migrations.AddField(
            model_name="gamemode",
            name="win_condition",
            field=models.CharField(
                choices=[("points", "Play to Points"), ("time", "Play by Time")],
                default="points",
                max_length=6,
            ),
        ),
        migrations.AddField(
            model_name="gamemode",
            name="winning_score",
            field=models.PositiveIntegerField(
                blank=True,
                default=11,
                help_text="Target score to win (only relevant for 'Play to Points' mode).",
            ),
        ),
    ]
