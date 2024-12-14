import json
from django.test import TestCase, Client
from django.urls import reverse
from users.models import CustomUser
from game.models import Player
from game.gamecoordinator.GameCoordinator import GameCoordinator
from unittest.mock import patch, AsyncMock, call
import redis.asyncio as redis
from channels.testing import WebsocketCommunicator
from channels.routing import URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import re_path
from chat.consumers import NotificationConsumer
from asgiref.sync import sync_to_async

class InvitationEndpointTests(TestCase):
    def setUp(self):
        # Create test users
        self.client = Client()
        
        # Create users
        self.user1 = CustomUser.objects.create_user(
            username='testuser1',
            password='testpass123',
            email='abc@k.com'
        )
        self.user2 = CustomUser.objects.create_user(
            username='testuser2',
            password='testpass123',
            email='def@k.com'
        )
        
        # Create players
        self.player1 = Player.objects.create(user=self.user1)
        self.player2 = Player.objects.create(user=self.user2)
        
        # URL for the invitation endpoint
        self.invitation_url = reverse('invitation')
        
        # Login user1 by default
        self.client.login(username='testuser1', password='testpass123')

        # Set up WebSocket application
        self.application = AuthMiddlewareStack(
            URLRouter([
                re_path(r"ws/notifications/$", NotificationConsumer.as_asgi()),
            ])
        )

    @patch('game.gamecoordinator.GameCoordinator.get_redis')
    @patch('game.gamecoordinator.GameCoordinator.create_new_game')
    async def test_successful_invitation(self, mock_create_game, mock_get_redis):
        """Test successful creation of an invitation"""
        # Mock redis connection and responses
        mock_redis = AsyncMock(spec=redis.Redis)
        mock_get_redis.return_value.__aenter__.return_value = mock_redis
        mock_redis.exists.return_value = False
        mock_redis.set.return_value = True
        
        # Mock game creation
        mock_create_game.return_value = "test-game-id"
        
        # Test data
        data = {
            "to_user_id": str(self.user2.id)
        }
        
        response = await self.client.post(
            self.invitation_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertIn('game_id', response_data)
        self.assertEqual(response_data['message'], 'Invitation sent successfully')

    
    
#    @patch('game.gamecoordinator.GameCoordinator.get_redis')
#    async def test_invitation_to_nonexistent_user(self, mock_get_redis):
#        """Test sending invitation to non-existent user"""
#        data = {
#            "to_user_id": "99999"  # Non-existent user ID
#        }
#        
#        response = await self.client.post(
#            self.invitation_url,
#            data=json.dumps(data),
#            content_type='application/json'
#        )
#        
#        self.assertEqual(response.status_code, 404)
#        self.assertIn('error', json.loads(response.content))
#
#    async def test_unauthenticated_invitation(self):
#        """Test sending invitation while not logged in"""
#        self.client.logout()
#        
#        data = {
#            "to_user_id": str(self.user2.id)
#        }
#        
#        response = await self.client.post(
#            self.invitation_url,
#            data=json.dumps(data),
#            content_type='application/json'
#        )
#        
#        self.assertEqual(response.status_code, 401)
#        self.assertIn('error', json.loads(response.content))
#
#    @patch('game.gamecoordinator.GameCoordinator.get_redis')
#    async def test_invitation_to_blocked_user(self, mock_get_redis):
#        """Test sending invitation to a blocked user"""
#        # Create blocked user relationship
#        BlockedUser.objects.create(user=self.user1, blocked_user=self.user2)
#        
#        data = {
#            "to_user_id": str(self.user2.id)
#        }
#        
#        response = await self.client.post(
#            self.invitation_url,
#            data=json.dumps(data),
#            content_type='application/json'
#        )
#        
#        self.assertEqual(response.status_code, 403)
#        response_data = json.loads(response.content)
#        self.assertEqual(response_data['message'], 'Cannot send invitation to blocked user')
#
#    @patch('game.gamecoordinator.GameCoordinator.get_redis')
#    @patch('game.gamecoordinator.GameCoordinator.create_new_game')
#    async def test_duplicate_invitation(self, mock_create_game, mock_get_redis):
#        """Test sending duplicate invitation"""
#        # Mock redis connection and responses for existing invitation
#        mock_redis = AsyncMock(spec=redis.Redis)
#        mock_get_redis.return_value.__aenter__.return_value = mock_redis
#        mock_redis.scan_iter.return_value.__aiter__.return_value = [f"invitation_{self.user2.id}:{self.user1.id}"]
#        
#        data = {
#            "to_user_id": str(self.user2.id)
#        }
#        
#        response = await self.client.post(
#            self.invitation_url,
#            data=json.dumps(data),
#            content_type='application/json'
#        )
#        
#        self.assertEqual(response.status_code, 400)
#        response_data = json.loads(response.content)
#        self.assertEqual(response_data['message'], 'Invitation already exists between these users')
#
#    async def test_missing_to_user_id(self):
#        """Test sending invitation without to_user_id"""
#        data = {}  # Missing to_user_id
#        
#        response = await self.client.post(
#            self.invitation_url,
#            data=json.dumps(data),
#            content_type='application/json'
#        )
#        
#        self.assertEqual(response.status_code, 400)
#        response_data = json.loads(response.content)
#        self.assertIn('error', response_data)
#        self.assertEqual(response_data['message'], 'to_user_id is required')
#
#    @patch('game.gamecoordinator.GameCoordinator.get_redis')
#    @patch('game.gamecoordinator.GameCoordinator.create_new_game')
#    async def test_redis_connection_error(self, mock_create_game, mock_get_redis):
#        """Test handling of Redis connection error"""
#        # Mock Redis connection to raise an exception
#        mock_get_redis.side_effect = redis.ConnectionError("Connection failed")
#        
#        data = {
#            "to_user_id": str(self.user2.id)
#        }
#        
#        response = await self.client.post(
#            self.invitation_url,
#            data=json.dumps(data),
#            content_type='application/json'
#        )
#        
#        self.assertEqual(response.status_code, 500)
#        response_data = json.loads(response.content)
#        self.assertIn('error', response_data)
#
#    @patch('game.gamecoordinator.GameCoordinator.get_redis')
#    @patch('game.gamecoordinator.GameCoordinator.create_new_game')
#    @patch('game.tournamentmanager.TournamentManager.send_notifacation')
#    async def test_invitation_workflow(self, mock_send_notification, mock_create_game, mock_get_redis):
#        """Test complete invitation workflow including notifications"""
#        # Set up mock game ID
#        test_game_id = "test-game-id-123"
#        mock_create_game.return_value = test_game_id
#
#        # Set up Redis mock
#        mock_redis = AsyncMock(spec=redis.Redis)
#        mock_get_redis.return_value.__aenter__.return_value = mock_redis
#        mock_redis.scan_iter.return_value.__aiter__.return_value = []  # No existing invitations
#        mock_redis.set.return_value = True
#
#        # Connect WebSocket for both users
#        # Setup User 1's notification socket
#        scope_user1 = {"user": self.user1, "type": "websocket"}
#        communicator1 = WebsocketCommunicator(self.application, "ws/notifications/")
#        communicator1.scope.update(scope_user1)
#        connected1, _ = await communicator1.connect()
#        self.assertTrue(connected1)
#
#        # Setup User 2's notification socket
#        scope_user2 = {"user": self.user2, "type": "websocket"}
#        communicator2 = WebsocketCommunicator(self.application, "ws/notifications/")
#        communicator2.scope.update(scope_user2)
#        connected2, _ = await communicator2.connect()
#        self.assertTrue(connected2)
#
#        try:
#            # Send invitation
#            data = {
#                "to_user_id": str(self.user2.id)
#            }
#            
#            response = await self.client.post(
#                self.invitation_url,
#                data=json.dumps(data),
#                content_type='application/json'
#            )
#            
#            # Check response
#            self.assertEqual(response.status_code, 200)
#            response_data = json.loads(response.content)
#            self.assertEqual(response_data['game_id'], test_game_id)
#
#            # Verify Redis operations
#            # Check invitation was stored
#            invitation_key = f"invitation_{self.user2.id}:{test_game_id}:{self.user1.id}"
#            mock_redis.set.assert_called_with(
#                invitation_key,
#                ex=GameCoordinator.INVITATION_EXPIRY
#            )
#
#            # Verify notifications were sent
#            expected_url = f"/ws/game/{test_game_id}/"
#            expected_calls = [
#                # Notification to sender (user1)
#                call(
#                    self.user1,
#                    f"Here is your Game to play against {self.user2.username}",
#                    expected_url
#                ),
#                # Notification to recipient (user2)
#                call(
#                    self.user2,
#                    f"Player: {self.user2.username} invited  you)",
#                    expected_url
#                )
#            ]
#            mock_send_notification.assert_has_calls(expected_calls, any_order=True)
#
#            # Check if notifications were received via WebSocket
#            # Check User 1's notification
#            notification1 = await communicator1.receive_json_from()
#            self.assertEqual(notification1['type'], 'send_notification')
#            self.assertIn('Game to play against', notification1['notification']['message'])
#
#            # Check User 2's notification
#            notification2 = await communicator2.receive_json_from()
#            self.assertEqual(notification2['type'], 'send_notification')
#            self.assertIn('invited  you', notification2['notification']['message'])
#
#            # Verify the invitation exists in redis
#            mock_redis.exists.assert_called()
#
#        finally:
#            # Clean up WebSocket connections
#            await communicator1.disconnect()
#            await communicator2.disconnect()
#
#    @sync_to_async
#    def create_notification(self, user, message):
#        """Helper method to create a notification in the database"""
#        return Notification.objects.create(
#            user=user,
#            message=message,
#            url=f"/ws/game/test-game-id/"
#        )
#
#    async def test_notification_persistence(self):
#        """Test that notifications are properly stored in the database"""
#        # Create notification
#        notification_msg = "Game invitation received"
#        notification = await self.create_notification(self.user2, notification_msg)
#        
#        # Verify notification was stored
#        notifications = await sync_to_async(list)(Notification.objects.filter(user=self.user2))
#        self.assertEqual(len(notifications), 1)
#        self.assertEqual(notifications[0].message, notification_msg)
#       A self.assertFalse(notifications[0].is_read)
