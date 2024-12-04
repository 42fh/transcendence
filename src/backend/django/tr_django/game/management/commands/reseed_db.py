from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import connection


class Command(BaseCommand):
    help = "Resets and reseeds the database with initial data"

    def handle(self, *args, **options):
        self.stdout.write("Resetting database...")

        # Reset database
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM game_tournament_participants")
            cursor.execute("DELETE FROM game_tournament_waiting_list")
            cursor.execute("DELETE FROM game_tournamentgameschedule")
            cursor.execute("DELETE FROM game_tournamentgame")
            cursor.execute("DELETE FROM game_tournament")

        self.stdout.write("Running seed_tournaments command...")

        # Run seed_tournaments command instead of loading fixtures
        call_command("seed_tournaments")

        self.stdout.write(
            self.style.SUCCESS("Database reset and reseeded successfully!")
        )
