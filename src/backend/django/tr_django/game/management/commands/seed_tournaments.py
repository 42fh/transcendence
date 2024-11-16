from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from game.models import Tournament, TournamentGameSchedule, TournamentGame as Game
import uuid


class Command(BaseCommand):
    help = "Seeds the database with initial tournament data for development"

    def handle(self, *args, **options):
        self.stdout.write("Checking existing tournaments...")

        # Check if tournaments already exist
        if Tournament.objects.exists():
            self.stdout.write(self.style.SUCCESS("Tournaments already seeded, skipping..."))
            return

        self.stdout.write("Seeding tournaments...")

        # Clear existing tournaments
        Tournament.objects.all().delete()

        # Calculate relative dates like in tournaments.js
        now = timezone.now()

        tournaments_data = [
            {
                "name": "WIMBLEDON",
                "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
                "start_registration": now,
                "end_registration": now + timedelta(days=5),  # 1 day before start
                "start_date": now + timedelta(days=6),  # 6 days from now
                "type": "single_elimination",
                "start_mode": "fixed",
                "is_public": True,
                "min_participants": 2,
                "max_participants": 8,
            },
            {
                "name": "US OPEN",
                "description": "Lorem ipsum dolor sit amet...",
                "start_registration": now,
                "end_registration": now + timedelta(hours=2),  # 1 hour before start
                "start_date": now + timedelta(hours=3),  # 3 hours from now
                "type": "single_elimination",
                "start_mode": "fixed",
                "is_public": True,
                "min_participants": 2,
                "max_participants": 8,
            },
            {
                "name": "42 NETWORK",
                "description": "Lorem ipsum dolor sit amet...",
                "start_registration": now,
                "end_registration": now + timedelta(minutes=30),  # 10 minutes before start
                "start_date": now + timedelta(minutes=40),  # 40 minutes from now
                "type": "single_elimination",
                "start_mode": "fixed",
                "is_public": True,
                "min_participants": 2,
                "max_participants": 8,
            },
            {
                "name": "42 BERLIN",
                "description": "Lorem ipsum dolor sit amet...",
                "start_registration": now - timedelta(days=1),  # closed yesterday
                "end_registration": now - timedelta(minutes=30),  # closed 30 minutes ago
                "start_date": now - timedelta(minutes=30),  # started 30 minutes ago
                "type": "single_elimination",
                "start_mode": "fixed",
                "is_public": True,
                "min_participants": 2,
                "max_participants": 8,
            },
        ]

        for data in tournaments_data:
            Tournament.objects.create(**data)
            self.stdout.write(self.style.SUCCESS(f'Successfully created tournament "{data["name"]}"'))

        # Then create the timetable for Berlin tournament
        berlin_tournament = Tournament.objects.get(name="42 BERLIN")

        # Create games and schedules for round 1
        for i in range(1, 4):  # 3 games in round 1
            game = Game.objects.create(
                game_type="direct_elimination",
                status="ready",
            )

            TournamentGameSchedule.objects.create(
                tournament=berlin_tournament,
                game=game,
                round_number=1,
                match_number=i,
                scheduled_time=timezone.now() + timedelta(minutes=30 * i),
            )

        # Create games and schedules for round 2
        for i in range(1, 3):  # 2 games in round 2
            game = Game.objects.create(
                game_type="direct_elimination",
                status="ready",
            )

            TournamentGameSchedule.objects.create(
                tournament=berlin_tournament,
                game=game,
                round_number=2,
                match_number=i,
                scheduled_time=timezone.now() + timedelta(days=1),
            )

        # Create final game
        final_game = Game.objects.create(
            game_type="direct_elimination",
            status="ready",
        )

        TournamentGameSchedule.objects.create(
            tournament=berlin_tournament,
            game=final_game,
            round_number=3,
            match_number=1,
            scheduled_time=timezone.now() + timedelta(days=2),
        )

        self.stdout.write(self.style.SUCCESS("Successfully created tournament timetable"))
