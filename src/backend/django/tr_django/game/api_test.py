from django.test import TransactionTestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from channels.testing import WebsocketCommunicator
from channels.routing import URLRouter, ProtocolTypeRouter
from channels.auth import AuthMiddlewareStack
from django.urls import re_path
from asgiref.sync import sync_to_async
import json
import asyncio


from .consumers import PongConsumer
from .gamecordinator.GameCordinator import GameCordinator
from .gamecordinator.game_config import EnumGameMode
from tr_django.asgi import application


from django.contrib.sessions.middleware import SessionMiddleware


class TestSessionMiddleware(SessionMiddleware):
    def __init__(self, app):
        self.app = app
        self._session_store = {}

    async def __call__(self, scope, receive, send):
        scope["session"] = self._session_store
        scope["session_key"] = "1234"
        return await self.app(scope, receive, send)

    def process_request(self, request):
        request.session = self._session_store
        request.session_key = "1234"


class IntegratedGameTests(TransactionTestCase):
    """
    Comprehensive test suite that combines API endpoint testing with WebSocket consumer testing.
    This allows us to verify the complete game flow from creation through gameplay.
    """

    def setUp(self):
        """Initialize the test environment and run async setup"""
        super().setUp()
        # Store our test users in a dictionary for easy access
        self.application = application
        self.test_users: Dict = {}
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        self.loop.run_until_complete(self._async_setup())

    async def _async_setup(self):
        """Async setup with Redis connection and multiple user creation"""
        redis_url = "redis://redis:6379/1"  # Adjust to your Redis URL

        try:
            # Initialize Redis and flush the database
            self.redis_conn = await GameCordinator.get_redis(redis_url)
            await self.redis_conn.flushall()

            # Create multiple test users with different roles
            await self._create_test_users()
            # Initialize game settings that can be used across tests
            self.game_settings = {
                "mode": "circular",
            }
            print(
                "\nTest setup completed - Redis flushed and users created and settings"
            )

        except Exception as e:
            print(f"Error during setup: {e}")
            if hasattr(self, "redis_conn"):
                await self.redis_conn.close()
            raise

    async def _create_test_users(self):
        """Create a set of test users with different characteristics"""
        self.user_model = get_user_model()

        # Define our test users with their properties
        test_user_configs = {
            "player1": {
                "username": "player1",
                "email": "player1@example.com",
                "password": "testpass123",
            },
            "player2": {
                "username": "player2",
                "email": "player2@example.com",
                "password": "testpass123",
            },
            "player3": {
                "username": "player3",
                "email": "player3@example.com",
                "password": "testpass123",
            },
            "spectator": {
                "username": "spectator",
                "email": "spectator@example.com",
                "password": "testpass123",
            },
        }

        # Create each user and store them in our dictionary
        for user_key, user_config in test_user_configs.items():
            self.test_users[user_key] = await sync_to_async(
                self.user_model.objects.create_user
            )(**user_config)
            print(f"Created test user: {user_key}")

    async def _async_teardown(self):
        """Clean up Redis and all test users"""
        try:
            # Flush Redis
            await self.redis_conn.flushall()

            # Clean up all test users
            for user_key, user in self.test_users.items():
                await sync_to_async(user.delete)()
                print(f"Deleted test user: {user_key}")

            # Close Redis connection
            await self.redis_conn.close()
            print("\nTest cleanup completed - Redis flushed and users deleted")

        except Exception as e:
            print(f"Error during teardown: {e}")
            if hasattr(self, "redis_conn"):
                await self.redis_conn.close()

    def tearDown(self):
        """Run async teardown and clean up"""
        self.loop.run_until_complete(self._async_teardown())
        self.loop.close()
        super().tearDown()

    # def test_a_game_creation(self):
    #    """Test game creation with visible console output"""
    #    async def _test_game_creation():
    #        print("\nStarting game creation test")
    #        print(f"\nAttempting to create game with settings: {self.game_settings}")
    #
    #        response = await sync_to_async(self.client.post)(
    #            reverse('create_new_game'),
    #            data=json.dumps(self.game_settings),
    #            content_type='application/json'
    #        )
    #
    #        print(f"\nResponse status code: {response.status_code}")
    #        print(f"Response content: {response.content.decode()}")
    #
    #        self.assertEqual(response.status_code, 201)
    #
    #    self.loop.run_until_complete(_test_game_creation())

    # def test_b_complete_game_flow(self):
    #    """Test the entire game flow from creation through gameplay"""
    #    async def _test_complete_game_flow():
    #
    #        # Create game and get WebSocket URL
    #        response = await sync_to_async(self.client.post)(
    #            reverse('create_new_game'),
    #            data=json.dumps(self.game_settings),
    #            content_type='application/json'
    #        )
    #        self.assertEqual(response.status_code, 201)
    #         data = response.json()
    #        ws_url = data['ws_url']
    #
    #        # Create WebSocket comm1 for first player
    #        comm11 = WebsocketCommunicator(
    #            self.application,
    #            ws_url
    #        )
    #        comm11.scope["user"] = self.test_users["player1"]
    #
    #        # Connect first player
    #        connected1, _ = await comm11.connect()
    #        self.assertTrue(connected1)
    #        # Receive response
    #        response = await comm11.receive_from()
    #        print(f"Received message: {response}")
    #        print("Player 1 connected successfully")
    #    self.loop.run_until_complete(_test_complete_game_flow())

    async def _test_booking_and_websocket(self):
        # Add session middleware
        session_middleware = SessionMiddleware(lambda x: None)
        self.client.cookies["sessionid"] = "test-session"
        # Login player1
        player1 = self.test_users["player1"]
        # Add this line to authenticate
        await sync_to_async(self.client.force_login)(player1)
        self.client.user = player1
        # Create game and join simultaneously
        response = await sync_to_async(self.client.post)(
            reverse("create_new_game"),
            data=json.dumps(self.game_settings),
            content_type="application/json",
        )
        data = response.json()
        ws_url = data["ws_url"]

        # Connect with WebSocket using same user
        comm1 = WebsocketCommunicator(self.application, ws_url)
        comm1.scope["user"] = player1
        connected, _ = await comm1.connect()
        self.assertTrue(connected)
        # self.assertEqual(response_data["role"], "player")
        # self.assertIsNotNone(response_data["player_index"])
        await asyncio.sleep(1)

        print("next pLayer")
        # Player 2 Setup
        player2 = self.test_users["player2"]
        await sync_to_async(self.client.force_login)(player2)

        # First get available games
        response = await sync_to_async(self.client.get)(reverse("get_waiting_games"))
        games = response.json()
        print("Available games:", games)
        game_id = json.loads(games["games"])[0]
        print(game_id)
        # Join specific game as Player 2
        join_response = await sync_to_async(self.client.get)(
            reverse("join_game", kwargs={"game_id": game_id}),
            content_type="application/json",
        )
        join_data = join_response.json()
        print(join_data)
        ws_url2 = join_data["ws_url"]
        # Now connect Player 2 via websocket
        comm2 = WebsocketCommunicator(self.application, ws_url2)
        comm2.scope["user"] = player2
        connected2, _ = await comm2.connect()
        self.assertTrue(connected2)
        # print("Player 2 connected:", json.loads(response2))

        # Start monitoring tasks

        player1_task = asyncio.create_task(self.monitor_messages(comm1, "Player 1"))
        player2_task = asyncio.create_task(self.monitor_messages(comm2, "Player 2"))
        try:
            # Wait for game to start
            await asyncio.sleep(2)

            # Test paddle movements for Player 1
            print("\nTesting Player 1 paddle movements")
            paddle_moves = [
                {
                    "action": "move_paddle",
                    "direction": "left",
                    "user_id": str(player1.id),
                },
                {
                    "action": "move_paddle",
                    "direction": "right",
                    "user_id": str(player1.id),
                },
            ]

            for move in paddle_moves:
                await comm1.send_json_to(move)
                # Wait for cooldown (0.1 seconds as defined in consumer)
                await asyncio.sleep(0.15)

            # Test paddle movements for Player 2
            print("\nTesting Player 2 paddle movements")
            paddle_moves = [
                {
                    "action": "move_paddle",
                    "direction": "left",
                    "user_id": str(player2.id),
                },
                {
                    "action": "move_paddle",
                    "direction": "right",
                    "user_id": str(player2.id),
                },
            ]

            for move in paddle_moves:
                await comm2.send_json_to(move)
                await asyncio.sleep(0.15)

            # Test invalid movements
            print("\nTesting invalid movements")

            # Test wrong direction
            await comm1.send_json_to(
                {
                    "action": "move_paddle",
                    "direction": "up",  # invalid direction
                    "user_id": str(player1.id),
                }
            )

            # Test wrong user_id
            await comm1.send_json_to(
                {
                    "action": "move_paddle",
                    "direction": "left",
                    "user_id": str(player2.id),  # trying to move other player's paddle
                }
            )

            # Test cooldown violation
            for _ in range(3):  # Send multiple moves quickly
                await comm1.send_json_to(
                    {
                        "action": "move_paddle",
                        "direction": "left",
                        "user_id": str(player1.id),
                    }
                )

            # Wait to observe responses
            await asyncio.sleep(5)

        finally:
            # Clean up tasks
            player1_task.cancel()
            player2_task.cancel()
            try:
                await player1_task
                await player2_task
            except asyncio.CancelledError:
                pass

            # Close connections
            await comm1.disconnect()
            await comm2.disconnect()

    async def monitor_messages(self, comm1, player_name):
        """Helper method to continuously monitor websocket messages"""
        try:
            while True:
                message = await comm1.receive_from()
                if message == "ping":
                    print(f"PING {player_name}")
                    # await comm.send_to(text_data="pong")
                    continue

                message_data = json.loads(message)
                # Only print if the message type is not 'gamestate'
                if message_data.get("type") != "game_state":
                    print(f"{player_name} received: {message_data}")

        except Exception as e:
            print(f"{player_name} monitoring ended: {str(e)}")

    def test_websocket_auth(self):
        self.loop.run_until_complete(self._test_booking_and_websocket())
