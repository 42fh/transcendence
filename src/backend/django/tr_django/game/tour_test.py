from django.test import TransactionTestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from channels.testing import WebsocketCommunicator
from django.utils import timezone
from asgiref.sync import sync_to_async
import json
import asyncio
import logging
from .models import Tournament, Player, TournamentGame
from tr_django.asgi import application
from .tournamentmanager.utils import get_test_tournament_data
import redis.asyncio as redis


logger = logging.getLogger(__name__)

class TournamentFlowTest(TransactionTestCase):
    def setUp(self):
        self.user_model = get_user_model()
        self.test_users = {}
        self.players = {}
        self.notification_comms = {}
        self.game_comms = {}
        self.game_pairings = {}
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        self.tournament_data = get_test_tournament_data()
        self.tournament_data.update({
            "max_participants": 4,
            "min_participants": 4,
            "type": "single_elimination"
        })
        self.loop.run_until_complete(self._async_setup())

    async def _async_setup(self):
        # Create test users and players
        for i in range(1, 5):
            username = f"player{i}"
            user = await sync_to_async(self.user_model.objects.create_user)(
                username=username,
                email=f"{username}@test.com",
                password="testpass123"
            )
            self.test_users[username] = user
            
            player = await sync_to_async(Player.objects.get_or_create)(
                user=user,
                defaults={'display_name': username}
            )
            self.players[username] = player[0]

            # Connect to notification websocket
            notification_comm = WebsocketCommunicator(
                application,
                f"ws/notifications/{username}/"
            )
            notification_comm.scope["user"] = user
            connected = await notification_comm.connect()
            self.assertTrue(connected)
            self.notification_comms[username] = notification_comm
            logger.info(f"Set up {username} with notification websocket")

    async def monitor_notifications(self, player_name):
        comm = self.notification_comms[player_name]
        try:
            while True:
                message = await comm.receive_json_from()
                logger.info(f"{player_name} received notification: {message}")
                                

        except Exception as e:
            logger.error(f"Error monitoring {player_name}: {e}")

    async def _test_tournament_flow(self):
        # Create tournament with player1
        await sync_to_async(self.client.force_login)(self.test_users["player1"])

        response = await sync_to_async(self.client.post)(
            reverse('all_tournaments'),
            data=json.dumps(self.tournament_data),
            content_type='application/json'
        )
        data = json.loads(response.content)
        tournament_id = data['tournament']['id']
        logger.info(f"Created tournament {tournament_id}")

        # Start monitoring notifications for each player
        monitor_tasks = []
        for player_name in ["player1", "player2", "player3", "player4"]:
            task = asyncio.create_task(self.monitor_notifications(player_name))
            monitor_tasks.append(task)

        # Join players 2-4
        for i in range(2, 5):
            player_key = f"player{i}"
            await sync_to_async(self.client.force_login)(self.test_users[player_key])
            
            join_response = await sync_to_async(self.client.post)(
                reverse('tournament_enrollment', args=[tournament_id])
            )
            self.assertEqual(join_response.status_code, 200)
            logger.info(f"{player_key} joined tournament")

            # Get tournament schedule after each join
            schedule_response = await sync_to_async(self.client.get)(
                reverse('tournament_schedule', args=[tournament_id])
            )
            logger.info(f"Tournament schedule: {schedule_response.content.decode()}")

        # Wait for first round to finish
        await asyncio.sleep(20)


    def test_tournament_flow(self):
        self.loop.run_until_complete(self._test_tournament_flow())

    def tearDown(self):
        self.loop.run_until_complete(self._async_teardown())
        self.loop.close()
        super().tearDown()

    async def _async_teardown(self):
        # Close notification websockets
        for comm in self.notification_comms.values():
            await comm.disconnect()
            
        await sync_to_async(Tournament.objects.all().delete)()
        await sync_to_async(Player.objects.all().delete)()
        await sync_to_async(self.user_model.objects.all().delete)()

        # Clear Redis using async Redis client
        redis_conn = redis.Redis.from_url("redis://redis:6379")
        try:
            await redis_conn.flushall()
        finally:
            await redis_conn.close()
