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
from .gamecoordinator.GameCoordinator import GameCoordinator
from .gamecoordinator.game_config import EnumGameMode
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


def select_test(enabled=True):
    def decorator(test_func):
        test_func.enabled = enabled
        return test_func

    return decorator


class IntegratedGameTests(TransactionTestCase):
    """
    Comprehensive test suite that combines API endpoint testing with WebSocket consumer testing.
    This allows us to verify the complete game flow from creation through gameplay.
    """

    def setUp(self):
        """Initialize the test environment and run async setup"""
        self._run_if_enabled()
        super().setUp()
        # Store our test users in a dictionary for easy access
        self.application = application
        self.test_users: Dict = {}
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        self.loop.run_until_complete(self._async_setup())

    def _run_if_enabled(self):
        test_method = getattr(self, self._testMethodName)
        if hasattr(test_method, "enabled") and not test_method.enabled:
            self.skipTest("Test disabled")

    async def _async_setup(self):
        """Async setup with Redis connection and multiple user creation"""
        redis_url = "redis://redis:6379/1"  # Adjust to your Redis URL

        try:
            # Initialize Redis and flush the database
            self.redis_conn = await GameCoordinator.get_redis(redis_url)
            await self.redis_conn.flushall()

            # Create multiple test users with different roles
            await self._create_test_users()
            # Initialize game settings that can be used across tests
            self.game_settings = {
                "mode": "classic",
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

    @select_test(enabled=False)
    def test_print_games(self):
        """Print games from debug and waiting endpoints"""

        async def _test_print_games():
            # Create debug games
            response = await sync_to_async(self.client.post)(
                reverse("debug_create_games"), content_type="application/json"
            )
            print("\nDebug games creation response:", response.json())

            # Get waiting games
            response = await sync_to_async(self.client.get)(reverse("waiting_games"))
            print("\nWaiting games response:", json.dumps(response.json(), indent=2))

        self.loop.run_until_complete(_test_print_games())

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
            reverse("games"),
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
        response = await sync_to_async(self.client.get)(reverse("waiting_games"))
        games_data = response.json()
        games = json.loads(games_data["games"])
        print("Available games:", games)

        # Extract game_id correctly from the first game in the list
        game_id = games[0]["game_id"]
        print(f"Joining game with ID: {game_id}")

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
                #{
                #    "action": "move_paddle",
                #    "direction": "right",
                #    "user_id": str(player2.id),
                #},
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
            
            # disconect        
            await comm1.disconnect()
                   
            await asyncio.sleep(2)  # Give time for game to be saved
    
            game = await self.verify_game_in_database(player1, player2)
            print(f"\nSuccessfully verified game {game.id} in database")
 


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
    

    # Add this verification function to the test class
    @sync_to_async      
    def verify_game_in_database(self, player1, player2):
        """Verify that game data was properly saved to the database"""
        from .models import SingleGame, PlayerGameStats
        import time
        # Wait briefly for database operations to complete
        
        try:
            # Get all games and convert to list
            games_queryset = SingleGame.objects.filter(
                playergamestats__player__user_id__in=[player1.id, player2.id]
            ).distinct()
            games = list(games_queryset)

            if not games:
                raise AssertionError("No game found in database")

            game = games[-1]  # Get the most recent game

            # Verify game status and timestamps
            self.assertEqual(game.status, 'finished')
            self.assertIsNotNone(game.created_at)
            self.assertIsNotNone(game.start_date)
            self.assertIsNotNone(game.finished_at)

            # Get player stats for this game
            stats_queryset = PlayerGameStats.objects.filter(single_game=game)
            stats = list(stats_queryset)

            # Verify player stats
            for stat in stats:
                # Verify basic stat properties
                self.assertIsNotNone(stat.score)
                self.assertIsNotNone(stat.rank)
                self.assertIsNotNone(stat.joined_at)

                # Verify player assignment
                self.assertIn(stat.player.user_id, [player1.id, player2.id])

            # Print the synchronous parts
            print("\nGame Database Verification Results:")
            print(f"Game ID: {game.id}")
            print(f"Created: {game.created_at}")
            print(f"Started: {game.start_date}")
            print(f"Finished: {game.finished_at}")

            print("\nPlayer Stats:")
            for stat in stats:
                print(f"Player: {stat.player.username}")
                print(f"Score: {stat.score}")
                print(f"Rank: {stat.rank}")
                print(f"Joined at: {stat.joined_at}")
                print("---")

            return game

        except Exception as e:
            print(f"Error during database verification: {e}")
            raise

    @select_test(enabled=True)
    def test_websocket_auth(self):
        self.loop.run_until_complete(self._test_booking_and_websocket())

    @select_test(enabled=False)
    def test_user_online_status(self):
        """Test user online status endpoints"""

        async def _test_user_online_status():
            # Login user
            player1 = self.test_users["player1"]
            await sync_to_async(self.client.force_login)(player1)

            # Test setting user online
            response = await sync_to_async(self.client.post)(
                reverse("user_online_status"), content_type="application/json"
            )
            self.assertEqual(response.status_code, 200)

            # Test checking online status
            response = await sync_to_async(self.client.get)(
                reverse("user_online_status")
            )
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["online"])

            # Test setting user offline
            response = await sync_to_async(self.client.delete)(
                reverse("user_online_status")
            )
            self.assertEqual(response.status_code, 200)

            # Verify user is offline
            response = await sync_to_async(self.client.get)(
                reverse("user_online_status")
            )
            data = response.json()
            self.assertFalse(data["online"])

        self.loop.run_until_complete(_test_user_online_status())

    @select_test(enabled=False)
    def test_player_count_endpoint(self):
        """Test the player count endpoint functionality"""

        async def _test_player_count():
            print("\nStarting player count endpoint test")

            # First create a game
            response = await sync_to_async(self.client.post)(
                reverse("debug_create_games"), content_type="application/json"
            )
            self.assertEqual(response.status_code, 201)

            # Get the game ID from waiting games
            response = await sync_to_async(self.client.get)(reverse("waiting_games"))
            games = json.loads(response.json()["games"])
            self.assertTrue(len(games) > 0)
            game_id = games[0]["game_id"]

            print(f"\nTesting player count for game: {game_id}")

            # Test player count endpoint
            response = await sync_to_async(self.client.get)(
                reverse("player_count", kwargs={"game_id": game_id})
            )

            print(f"\nPlayer count response status: {response.status_code}")
            print(f"Player count response: {json.dumps(response.json(), indent=2)}")

            # Verify response structure and status
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("player_counts", data)
            self.assertIn("message", data)

            # Verify player counts structure
            player_counts = data["player_counts"]
            self.assertIn("status", player_counts)
            self.assertIn("current_players", player_counts)
            self.assertIn("reserved_players", player_counts)
            self.assertTrue(isinstance(player_counts["current_players"], int))
            self.assertTrue(isinstance(player_counts["reserved_players"], int))

            # Test with invalid game ID
            print("\nTesting with invalid game ID")
            invalid_game_id = "nonexistent-game-id"
            response = await sync_to_async(self.client.get)(
                reverse("player_count", kwargs={"game_id": invalid_game_id})
            )
            print(f"Invalid game ID response: {json.dumps(response.json(), indent=2)}")

            # The endpoint should still return a valid response with zero counts
            self.assertEqual(response.status_code, 200)
            data = response.json()
            player_counts = data["player_counts"]
            self.assertEqual(player_counts["current_players"], 0)
            self.assertEqual(player_counts["reserved_players"], 0)

            # Test invalid HTTP method
            print("\nTesting invalid HTTP method (POST)")
            response = await sync_to_async(self.client.post)(
                reverse("player_count", kwargs={"game_id": game_id})
            )
            self.assertEqual(response.status_code, 405)
            print(f"Invalid method response: {json.dumps(response.json(), indent=2)}")

        self.loop.run_until_complete(_test_player_count())

    @select_test(enabled=False)
    def test_cancel_booking(self):
        """Test cancelling a booking"""

        async def _test_cancel_booking():
            # First create a game and book it
            response = await sync_to_async(self.client.post)(
                reverse("create_new_game"),
                data=json.dumps(self.game_settings),
                content_type="application/json",
            )
            self.assertEqual(response.status_code, 201)

            # Login the user
            player1 = self.test_users["player1"]
            await sync_to_async(self.client.force_login)(player1)

            # Try to cancel the booking
            response = await sync_to_async(self.client.delete)(
                reverse("cancel_booking")
            )

            # Check response
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["status"], "success")
            self.assertIn("message", data)

            # Try cancelling again - should get 404 as no booking exists
            response = await sync_to_async(self.client.delete)(
                reverse("cancel_booking")
            )
            self.assertEqual(response.status_code, 404)

        self.loop.run_until_complete(_test_cancel_booking())
