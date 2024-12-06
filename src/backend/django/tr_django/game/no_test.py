from django.test import TransactionTestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from channels.testing import WebsocketCommunicator
from channels.db import database_sync_to_async
from channels.routing import URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import re_path
from asgiref.sync import sync_to_async
import json
import asyncio

from .models import Tournament, Player
from .tournamentmanager.TournamentNotification import TournamentNotificationConsumer
from .tournamentmanager.utils import get_test_tournament_data

class TournamentWebsocketTest(TransactionTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Set up websocket routing
        cls.application = AuthMiddlewareStack(
            URLRouter([
                re_path(r"ws/tournament/(?P<tournament_id>\w+)/$", TournamentNotificationConsumer.as_asgi()),
            ])
        )

    def setUp(self):
        """Initialize the test environment and run async setup"""
        super().setUp()
        self.test_users = {}
        self.players = {}
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        self.loop.run_until_complete(self._async_setup())

    async def _async_setup(self):
        """Async setup with user creation"""
        try:
            # Create test users
            await self._create_test_users()
            # Get test tournament data
            self.tournament_data = get_test_tournament_data()
            print("\nTest setup completed - Users created and tournament data initialized")
        except Exception as e:
            print(f"Error during setup: {e}")
            raise

    async def _create_test_users(self):
        """Create a set of test users"""
        self.user_model = get_user_model()

        # Define test users
        test_user_configs = {
            "player1": {
                "username": "player1",
                "email": "player1@test.com",
                "password": "testpass123"
            },
            "player2": {
                "username": "player2",
                "email": "player2@test.com",
                "password": "testpass123"
            },
            "player3": {
                "username": "player3",
                "email": "player3@test.com",
                "password": "testpass123"
            },
            "player4": {
                "username": "player4",
                "email": "player4@test.com",
                "password": "testpass123"
            }
        }

        # Create each user and corresponding player
        for user_key, user_config in test_user_configs.items():
            # Create user
            user = await sync_to_async(self.user_model.objects.create_user)(**user_config)
            self.test_users[user_key] = user
            
            # Create player
            player = await sync_to_async(Player.objects.get_or_create)(
                user=user,
                defaults={'display_name': user_key}
            )
            self.players[user_key] = player[0]
            print(f"Created test user and player: {user_key}")

    async def _async_teardown(self):
        """Clean up all test data"""
        try:
            # Clean up tournaments
            await sync_to_async(Tournament.objects.all().delete)()
            # Clean up players
            await sync_to_async(Player.objects.all().delete)()
            # Clean up users
            for user_key, user in self.test_users.items():
                await sync_to_async(user.delete)()
                print(f"Deleted test user: {user_key}")
            print("\nTest cleanup completed - All test data deleted")
        except Exception as e:
            print(f"Error during teardown: {e}")

    def tearDown(self):
        """Run async teardown and clean up"""
        self.loop.run_until_complete(self._async_teardown())
        self.loop.close()
        super().tearDown()

    async def _test_tournament_notifications(self):
        print("\n=== Starting Tournament Notification Test ===")
        
        # Create tournament via API
        await sync_to_async(self.client.force_login)(self.test_users["player1"])
        
        response = await sync_to_async(self.client.post)(
            reverse("all_tournaments"),
            data=json.dumps(self.tournament_data),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        #print(response_data)
        tournament_id = response_data["tournament"]["id"]
        ws_url = f"ws/tournament/{tournament_id}/"
        
        print(f"Connecting to WebSocket at: {ws_url}")

        communicator1 = None
        try:
            # Connect player1 to WebSocket
            communicator1 = WebsocketCommunicator(
                self.application,
                ws_url
            )
            communicator1.scope["user"] = self.test_users["player1"]
            
            connected, _ = await communicator1.connect()
            self.assertTrue(connected)
            print("Player 1 connected to WebSocket")
            
            # Add player2 via API
            await sync_to_async(self.client.force_login)(self.test_users["player2"])
            await asyncio.sleep(0.1)  # Small delay to ensure operation completion
            
            response = await sync_to_async(self.client.post)(
                reverse("tournament_enrollment", args=[tournament_id])
            )
            self.assertEqual(response.status_code, 200)
            print("Player 2 added to tournament")
            
            # Check notification received by player1
            response = await communicator1.receive_json_from()
            print(f"Received notification: {response}")
            self.assertEqual(response["type"], "player_joined")
            self.assertEqual(response["username"], "player2")
            
        finally:
            if communicator1:
                await communicator1.disconnect()

    def test_tournament_notifications(self):
        """Wrapper to run async test"""
        self.loop.run_until_complete(self._test_tournament_notifications())
