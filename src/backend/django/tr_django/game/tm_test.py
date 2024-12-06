from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from channels.testing import WebsocketCommunicator
from datetime import timedelta
from django.utils import timezone
from .models import Tournament, Player, TournamentGame, TournamentGameSchedule
from .tournamentmanager.TournamentNotification import TournamentNotificationConsumer
import json
import logging
from .tournamentmanager.utils import get_test_tournament_data   



logger = logging.getLogger(__name__)

def select_test(enabled=True):
    def decorator(test_func):
        test_func.enabled = enabled
        return test_func
    return decorator

class TournamentNotificationTest(TestCase):
    def setUp(self):
        self._run_if_enabled()
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
            # Get test tournament data
            self.tournament_data = get_test_tournament_data()
        

    def tearDown(self):
        Tournament.objects.all().delete()
        Player.objects.all().delete()
        self.user_model.objects.all().delete()

    def _run_if_enabled(self):
        test_method = getattr(self, self._testMethodName)
        if hasattr(test_method, "enabled") and not test_method.enabled:
            self.skipTest("Test disabled")


    @select_test(enabled=True)
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



