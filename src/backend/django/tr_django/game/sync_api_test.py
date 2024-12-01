from django.test import TransactionTestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from channels.testing import WebsocketCommunicator
from asgiref.sync import sync_to_async
import json
import redis

from .consumers import PongConsumer
from .gamecordinator.GameCordinator import GameCordinator
from tr_django.asgi import application

class SyncGameTests(TransactionTestCase):
    def setUp(self):
        self.application = application
        self.user_model = get_user_model()
        self.redis = redis.Redis(host='redis', port=6379, db=1, decode_responses=True)
        self.redis.flushall()
        
        # Create test users
        self.users = {
            'player1': self.user_model.objects.create_user(
                username='player1',
                email='player1@example.com',
                password='testpass123'
            ),
            'player2': self.user_model.objects.create_user(
                username='player2',
                email='player2@example.com',
                password='testpass123'
            ),
            'spectator': self.user_model.objects.create_user(
                username='spectator',
                email='spectator@example.com',
                password='testpass123'
            )
        }
        
        self.game_settings = {
            "mode": "classic"
        }

    def tearDown(self):
        self.redis.flushall()
        self.redis.close()
        for user in self.users.values():
            user.delete()

    def test_multiplayer_game(self):
        # Login first player and create game
        self.client.force_login(self.users['player1'])
        response = self.client.post(
            reverse('create_new_game'),
            data=json.dumps(self.game_settings),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        data = response.json()
        print("Response: ",data)


        #ws_url = data['ws_url']
        #game_id = ws_url.split('/')[-2]

        # Verify player1 in Redis
        ##self.assertTrue(self.redis.exists(f"player:{self.users['player1'].id}"))
        
        # Connect player1 to WebSocket
        #comm_player1 = WebsocketCommunicator(self.application, ws_url)
        #comm_player1.scope["user"] = self.users['player1']
        #connected1, _ = sync_to_async(comm_player1.connect)()
        #self.assertTrue(connected1)
        
        # Connect player2
        #self.client.force_login(self.users['player2'])
        #response = self.client.get(f'/api/game/{game_id}/join/')
        #self.assertEqual(response.status_code, 201)
        
        #comm_player2 = WebsocketCommunicator(self.application, ws_url)
        #comm_player2.scope["user"] = self.users['player2']
        #connected2, _ = sync_to_async(comm_player2.connect)()
        #self.assertTrue(connected2)

        # Connect spectator
        #comm_spectator = WebsocketCommunicator(self.application, ws_url)
        #comm_spectator.scope["user"] = self.users['spectator']
        #connected3, _ = sync_to_async(comm_spectator.connect)()
        #self.assertTrue(connected3)

        # Verify roles
        #response1 = json.loads(sync_to_async(comm_player1.receive_from)())
        #self.assertEqual(response1["role"], "player")
        #self.assertEqual(response1["player_index"], 0)

        #response2 = json.loads(sync_to_async(comm_player2.receive_from)())
        #self.assertEqual(response2["role"], "player")
        #self.assertEqual(response2["player_index"], 1)

        #response3 = json.loads(sync_to_async(comm_spectator.receive_from)())
        #self.assertEqual(response3["role"], "spectator")

        # Clean up
        #sync_to_async(comm_player1.disconnect)()
        #sync_to_async(comm_player2.disconnect)()
        #sync_to_async(comm_spectator.disconnect)()
