import json
from django.test import TransactionTestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from channels.testing import WebsocketCommunicator
from channels.routing import URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import re_path
from chat.consumers import NotificationConsumer
from asgiref.sync import sync_to_async
from game.models import Player
from game.gamecoordinator.GameCoordinator import GameCoordinator
import asyncio
import redis.asyncio as redis
from unittest.mock import patch, AsyncMock
from django.db import transaction

class InvitationEndpointTests(TransactionTestCase):
    def setUp(self):
        self.client = Client()
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        self._cleanup_database()
        self.loop.run_until_complete(self._async_setup())
        self.application = AuthMiddlewareStack(
            URLRouter([
                re_path(r"ws/notifications/$", NotificationConsumer.as_asgi()),
            ])
        )

    def _cleanup_database(self):
        with transaction.atomic():
            Player.objects.all().delete()
            get_user_model().objects.all().delete()

    async def _async_setup(self):
        try:
            self.redis_conn = await GameCoordinator.get_redis(GameCoordinator.REDIS_GAME_URL)
            await self.redis_conn.flushall()
            await self._create_test_users()
        except Exception as e:
            print(f"Error during setup: {e}")
            if hasattr(self, 'redis_conn'):
                await self.redis_conn.close()
            raise

    async def _create_test_users(self):
        try:
            self.user1 = await sync_to_async(get_user_model().objects.create_user)(
                username='testuser1', password='testpass123', email='abc@k.com'
            )
            self.user2 = await sync_to_async(get_user_model().objects.create_user)(
                username='testuser2', password='testpass123', email='def@k.com'
            )
            self.player1, _ = await sync_to_async(Player.objects.get_or_create)(user=self.user1)
            self.player2, _ = await sync_to_async(Player.objects.get_or_create)(user=self.user2)
            self.invitation_url = reverse('invitation')
            await sync_to_async(self.client.login)(username='testuser1', password='testpass123')
        except Exception as e:
            print(f"Error creating test users: {e}")
            raise

    async def _async_teardown(self):
        try:
            if hasattr(self, 'redis_conn'):
                await self.redis_conn.flushall()
                await self.redis_conn.close()
        except Exception as e:
            print(f"Error during teardown: {e}")
            if hasattr(self, 'redis_conn'):
                await self.redis_conn.close()

    def tearDown(self):
        self.loop.run_until_complete(self._async_teardown())
        self._cleanup_database()
        self.loop.close()
        super().tearDown()

    @patch.object(GameCoordinator, 'get_redis')
    @patch.object(GameCoordinator, 'create_new_game')
    async def test_successful_invitation(self, mock_create_game, mock_get_redis):
        mock_redis = AsyncMock(spec=redis.Redis)
        mock_get_redis.return_value.__aenter__.return_value = mock_redis
        mock_redis.exists.return_value = False
        mock_redis.set.return_value = True
        mock_redis.scan_iter.return_value.__aiter__.return_value = []
        
        mock_create_game.return_value = "test-game-id"
        
        data = {
            "to_user_id": str(self.user2.id),
            "game_settings": {}
        }
        
        response = await sync_to_async(self.client.post)(
            self.invitation_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertIn('game_id', response_data)
        self.assertEqual(response_data['message'], 'Invitation sent successfully')
