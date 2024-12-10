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
import logging
import redis.asyncio as redis
from .models import Tournament, Player
from .tournamentmanager.TournamentNotification import TournamentNotificationConsumer
from .tournamentmanager.utils import get_test_tournament_data


logger = logging.getLogger(__name__)


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
            logger.info(f"Created test user and player: {user_key}")

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
                logger.info(f"Deleted test user: {user_key}")
            # Clean up entire Redis instance
            redis_conn = await redis.Redis.from_url("redis://redis:6379")
            try:
                await redis_conn.flushall()
                logger.info("Flushed all Redis databases")
            except Exception as e:
                logger.error(f"Error flushing Redis: {e}")
            finally:
                await redis_conn.close()
            logger.info("\nTest cleanup completed - All test data deleted")
        except Exception as e:
            logger.error(f"Error during teardown: {e}")

    def tearDown(self):
        """Run async teardown and clean up"""
        self.loop.run_until_complete(self._async_teardown())
        self.loop.close()
        super().tearDown()

    async def _test_tournament_notifications(self):
        logger.info("\n=== Starting Tournament Notification Test ===")
        
        # Create tournament via API
        await sync_to_async(self.client.force_login)(self.test_users["player1"])
        
        response = await sync_to_async(self.client.post)(
            reverse("all_tournaments"),
            data=json.dumps(self.tournament_data),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        logger.debug(f"Tournament Notification Response: {response_data}")
        ws_url = response_data["tournament_notification_url"]
        
        logger.info(f"Connecting to WebSocket at: {ws_url}")

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
            logger.info("Player 1 connected to WebSocket")
            
            # Add player2 via API
            await sync_to_async(self.client.force_login)(self.test_users["player2"])
            await asyncio.sleep(0.1)  # Small delay to ensure operation completion
           

            list_response = await sync_to_async(self.client.get)(
                reverse("all_tournaments")
            )
            self.assertEqual(list_response.status_code, 200)
            tournaments_data = json.loads(list_response.content)
            logger.debug(f"All tournaments: {tournaments_data}")
            
            self.assertTrue(tournaments_data["tournaments"], "No tournaments available")
            
            # Get first available tournament
            available_tournaments = tournaments_data["tournaments"]
            self.assertTrue(len(available_tournaments) > 0, "No tournaments found in list")
            tournament_to_join = available_tournaments[0]
            tournament_id = tournament_to_join["id"]
            logger.info(f"Player2 found tournament to join with ID: {tournament_id}")           

            response = await sync_to_async(self.client.post)(
                reverse("tournament_enrollment", args=[tournament_id]),
                content_type="application/json"
            )
            self.assertEqual(response.status_code, 200)
            enrollment_data = json.loads(response.content)
            logger.info("Player 2 enrolled in tournament")
            logger.debug(f"{enrollment_data}")           

 
            # Verify enrollment response
            self.assertIn("status", enrollment_data)
            self.assertTrue(enrollment_data["status"], "Enrollment failed")
            self.assertIn("tournament_notification_url", enrollment_data)

            # Check notification received by player1
            response = await communicator1.receive_json_from()
            logger.debug(f"{response}")
            logger.info(f"Received notification: {response}")
            self.assertEqual(response["type"], "player_joined")
            self.assertEqual(response["username"], "player2")
            
            # Connect player2 to WebSocket
            communicator2 = WebsocketCommunicator(
                self.application,
                ws_url
            )
            communicator2.scope["user"] = self.test_users["player2"]
            connected, _ = await communicator2.connect()
            self.assertTrue(connected)
            logger.info("Player 2 connected to WebSocket")
           


            # Add player3 via API
            await sync_to_async(self.client.force_login)(self.test_users["player3"])
            await asyncio.sleep(0.1)  # Small delay to ensure operation completion

            response = await sync_to_async(self.client.post)(
                reverse("tournament_enrollment", args=[tournament_id]),
                content_type="application/json"
            )
            self.assertEqual(response.status_code, 200)
            enrollment_data = json.loads(response.content)
            logger.info("Player 3 enrolled in tournament")
            logger.debug(f"{enrollment_data}")           

 
            # Verify enrollment response
            self.assertIn("status", enrollment_data)
            self.assertTrue(enrollment_data["status"], "Enrollment failed")

            # Connect player3 to WebSocket
            communicator3 = WebsocketCommunicator(
                self.application,
                ws_url
            )
            communicator3.scope["user"] = self.test_users["player3"]
            connected, _ = await communicator3.connect()
            self.assertTrue(connected)
            logger.info("Player 3 connected to WebSocket")
            
            # Check notification received by player2
            response = await communicator2.receive_json_from()
            logger.info(f"Received notification: {response}")
            self.assertEqual(response["type"], "player_joined")
            self.assertEqual(response["username"], "player3")
            
            # Disconnect Player 3
            response = await sync_to_async(self.client.delete)(
                reverse("tournament_enrollment", args=[tournament_id])
            )
            enrollment_data = json.loads(response.content)
            logger.debug(f"disconnect player 3: {enrollment_data}")
            # Check notification received by player2
            response = await communicator2.receive_json_from()
            logger.info(f"Received notification: {response}")
            
            # check if  communicator3 closed by its self connection 
            close_message = await communicator3.receive_output()
            logger.debug(f"Received close message: {close_message}")
            if close_message.get("type") == "websocket.close":
                close_code = close_message.get("code")
                logger.info(f"WebSocket closed with code: {close_code} -> closed from backend")
            # connect again player 3 
            await communicator3.connect()
            try:
                close_message = await communicator3.receive_output()
            except Exception as e:
                logger.info(f"{type(e)}")
            if close_message.get("type") == "websocket.close":
                close_code = close_message.get("code")
                logger.info(f"WebSocket closed with code: {close_code} --> user not endrolled")
            response = await sync_to_async(self.client.post)(
                reverse("tournament_enrollment", args=[tournament_id]),
                content_type="application/json"
            )
            self.assertEqual(response.status_code, 200)
            enrollment_data = json.loads(response.content)
            logger.info("Player 3 enrolled in tournament")
            logger.debug(f"{enrollment_data}")           

 
            # Verify enrollment response
            self.assertIn("status", enrollment_data)
            self.assertTrue(enrollment_data["status"], "Enrollment failed")

            # Connect player3 to WebSocket
            communicator3 = WebsocketCommunicator(
                self.application,
                ws_url
            )
            communicator3.scope["user"] = self.test_users["player3"]
            connected, _ = await communicator3.connect()
            self.assertTrue(connected)
            logger.info("Player 3 connected to WebSocket")
            
            
            # Add player4 via API
            await sync_to_async(self.client.force_login)(self.test_users["player4"])
            await asyncio.sleep(0.1)  # Small delay to ensure operation completion

            response = await sync_to_async(self.client.post)(
                reverse("tournament_enrollment", args=[tournament_id]),
                content_type="application/json"
            )
            self.assertEqual(response.status_code, 200)
            enrollment_data = json.loads(response.content)
            logger.info("Player 4 enrolled in tournament")
            logger.debug(f"{enrollment_data}")           

 
            # Verify enrollment response
            self.assertIn("status", enrollment_data)
            self.assertTrue(enrollment_data["status"], "Enrollment failed")

            # Connect player4 to WebSocket
            communicator4 = WebsocketCommunicator(
                self.application,
                ws_url
            )
            communicator4.scope["user"] = self.test_users["player4"]
            connected, _ = await communicator4.connect()
            self.assertTrue(connected)
            logger.info("Player 4 connected to WebSocket")
           
            # all four player are here. how to check that everybody get his gane_id

            response = await communicator1.receive_json_from()
            logger.info(f"Received notification: {response}")
            response = await communicator1.receive_json_from()
            logger.info(f"Received notification: {response}")
            response = await communicator1.receive_json_from()
            logger.info(f"Received notification: {response}")
            response = await communicator1.receive_json_from()
            logger.info(f"Received notification: {response}")
            response = await communicator1.receive_json_from()
            logger.info(f"Received notification: {response}")
            
            response = await communicator3.receive_json_from()
            logger.info(f"Received notificationi (3): {response}")
            response = await communicator3.receive_json_from()
            logger.info(f"Received notificationi (3): {response}")
            response = await communicator4.receive_json_from()
            logger.info(f"Received notificationi (4): {response}")
            response = await sync_to_async(self.client.get)(
            reverse("tournament_schedule",  args=[tournament_id]),
            )
            data = json.loads(response.content)  
            logger.info(f"created Tournament: {data}")
     
            # Disconnect Player 4
            response = await sync_to_async(self.client.delete)(
                reverse("tournament_enrollment", args=[tournament_id])
            )
            enrollment_data = json.loads(response.content)
            logger.info(f"disconnect player 3: {enrollment_data}")
        
        finally:
            if communicator1:
                await communicator1.disconnect()
            if communicator2:
                await communicator2.disconnect()
            if communicator3:
                await communicator3.disconnect()
            if communicator4:
                await communicator4.disconnect()
          

    
    def test_tournament_notifications(self):
        """Wrapper to run async test"""
        self.loop.run_until_complete(self._test_tournament_notifications())
