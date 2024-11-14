from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from game.models import Tournament, TournamentGame
import uuid


class Command(BaseCommand):
    help = "Seeds the database with initial tournament data for development"

    def handle(self, *args, **options):
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

        # Create games for round 1
        game1_1 = TournamentGame.objects.create(
            tournament=berlin_tournament,
            game_type=TournamentGame.GAME_TYPE_DIRECT_ELIMINATION,
            start_date=timezone.now(),
            status="ready",
            uuid=uuid.uuid4(),  # Generate unique UUID
        )

        game1_2 = TournamentGame.objects.create(
            tournament=berlin_tournament,
            game_type=TournamentGame.GAME_TYPE_DIRECT_ELIMINATION,
            start_date=timezone.now() + timedelta(minutes=30),
            status="ready",
            uuid=uuid.uuid4(),
        )

        game1_3 = TournamentGame.objects.create(
            tournament=berlin_tournament,
            game_type=TournamentGame.GAME_TYPE_DIRECT_ELIMINATION,
            start_date=timezone.now() + timedelta(minutes=60),
            status="ready",
            uuid=uuid.uuid4(),
        )

        game1_4 = TournamentGame.objects.create(
            tournament=berlin_tournament,
            game_type=TournamentGame.GAME_TYPE_DIRECT_ELIMINATION,
            start_date=timezone.now() + timedelta(minutes=90),
            status="ready",
            uuid=uuid.uuid4(),
        )

        # Create games for round 2 with references to previous games
        game2_1 = TournamentGame.objects.create(
            tournament=berlin_tournament,
            game_type=TournamentGame.GAME_TYPE_DIRECT_ELIMINATION,
            start_date=timezone.now() + timedelta(days=1),
            status="draft",
            uuid=uuid.uuid4(),
            source_game1=game1_1,
            source_game2=game1_2,
        )

        game2_2 = TournamentGame.objects.create(
            tournament=berlin_tournament,
            game_type=TournamentGame.GAME_TYPE_DIRECT_ELIMINATION,
            start_date=timezone.now() + timedelta(days=1),
            status="draft",
            uuid=uuid.uuid4(),
            source_game1=game1_3,
            source_game2=game1_4,
        )

        # Create final game
        TournamentGame.objects.create(
            tournament=berlin_tournament,
            game_type=TournamentGame.GAME_TYPE_DIRECT_ELIMINATION,
            start_date=timezone.now() + timedelta(days=2),
            status="draft",
            uuid=uuid.uuid4(),
            source_game1=game2_1,
            source_game2=game2_2,
        )

        self.stdout.write(self.style.SUCCESS("Successfully created tournament timetable"))
