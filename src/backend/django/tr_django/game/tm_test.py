from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from datetime import datetime, timedelta
from django.utils import timezone
from .models import Tournament, Player, TournamentGame
import json
import logging

logger = logging.getLogger(__name__)

class TournamentIntegrationTest(TestCase):
    def setUp(self):
        logger.info("Setting up tournament test environment...")
        self.user_model = get_user_model()
        
        self.users = {}
        self.players = {}
        for i in range(1, 5):
            username = f"player{i}"
            self.users[username] = self.user_model.objects.create_user(
                username=username,
                password="testpass123",
                email=f"{username}@test.com"
            )
            self.players[username], created = Player.objects.get_or_create(
                user=self.users[username],
                defaults={'display_name': username}
            )
            logger.debug(f"{'Created' if created else 'Retrieved'} test player: {username}")

        now = timezone.localtime()
        self.tournament_data = {
            "name": "Test Tournament",
            "description": "Test Description",
            "start_date": now + timedelta(hours=1),
            "registration_start": now,
            "registration_close": now + timedelta(minutes=30),
            "type": "single_elimination",
            "min_participants": 2,
            "max_participants": 4,
            "visibility": "public",
            "game_settings": {
                "mode": "classic",
                "score": {"max": 5}
            }
        }
        logger.info(f"Tournament settings created with dates: start_date={self.tournament_data['start_date']}, registration_start={self.tournament_data['registration_start']}, registration_close={self.tournament_data['registration_close']}")
    def test_tournament_flow(self):
        print("\n=== Starting Tournament Flow Test ===")
        
        # Create tournament via debug endpoint
        print("\n1. Creating tournament via debug...")
        self.client.force_login(self.users["player1"])
        response = self.client.post(reverse("debug_tournament"))
        print(f"Tournament creation response status: {response.status_code}")
        print(f"Response content: {response.content.decode()}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        tournament_id = data["tournament_id"]
        print(f"Tournament created successfully. ID: {tournament_id}")
        print(f"Initial schedule: {json.dumps(data['schedule'], indent=2)}")

        # Get tournament details
        print("\n2. Getting tournament details...")
        response = self.client.get(reverse("single_tournament", args=[tournament_id]))
        print(f"Tournament details response: {response.content.decode()}")
        self.assertEqual(response.status_code, 200)
        
        # Check tournament state
        print("\n3. Verifying tournament state...")
        tournament = Tournament.objects.get(id=tournament_id)
        games = TournamentGame.objects.filter( tournamentgameschedule__tournament=tournament).select_related()
        print(f"Number of games created: {len(games)}")
        for i, game in enumerate(games, 1):
            print(f"\nGame {i}:")
            print(f"  - Status: {game.status}")
            players = game.players.all()
            print(f"  - Players: {', '.join(p.get_display_name for p in players)}")
    def tearDown(self):
        print("\nCleaning up test environment...")
        Tournament.objects.all().delete()
        Player.objects.all().delete()
        self.user_model.objects.all().delete()
        super().tearDown()
