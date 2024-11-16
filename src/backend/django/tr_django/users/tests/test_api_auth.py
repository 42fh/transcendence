from django.test import TestCase
from django.urls import reverse
from users.models import CustomUser


class SignupTestCase(TestCase):
    """Test signup functionality using both direct model operations and HTTP layer"""

    def test_successful_signup_direct(self):
        """Test user creation directly using the CustomUser model
        This is a simple unit test that bypasses the HTTP layer"""

        user = CustomUser.objects.create_user(username="testuser", password="password123")
        self.assertTrue(CustomUser.objects.filter(username="testuser").exists())

    def test_duplicate_username_direct(self):
        """Test duplicate username handling directly using the CustomUser model
        This is a simple unit test that bypasses the HTTP layer"""

        # Create first user
        CustomUser.objects.create_user(username="testuser", password="password123")

        # Try to create duplicate user
        with self.assertRaises(Exception):  # Could be more specific with IntegrityError
            CustomUser.objects.create_user(username="testuser", password="newpassword")

    def test_successful_signup_http(self):
        """Test user creation through the HTTP layer
        This is an integration test that verifies the entire signup flow"""

        response = self.client.post(
            reverse("signup"),
            data={"username": "testuser", "password": "password123"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(CustomUser.objects.filter(username="testuser").exists())

    def test_duplicate_username_http(self):
        """Test duplicate username handling through the HTTP layer
        This is an integration test that verifies the entire signup flow"""

        # Create a user first
        CustomUser.objects.create_user(username="testuser", password="password123")

        # Try to create another user with the same username via HTTP
        response = self.client.post(
            reverse("signup"),
            data={"username": "testuser", "password": "newpassword"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)


class FriendRequestTests(TestCase):
    def setUp(self):
        # Create test users
        self.user1 = CustomUser.objects.create_user(username="user1", password="test123")
        self.user2 = CustomUser.objects.create_user(username="user2", password="test123")
        self.user3 = CustomUser.objects.create_user(username="user3", password="test123")

    def test_friend_request_flow(self):
        """Test sending and accepting a friend request."""
        # Send friend request
        self.user1.send_friend_request(self.user2)
        self.assertTrue(self.user2 in self.user1.friend_requests_sent.all())
        self.assertTrue(self.user1 in self.user2.friend_requests_received.all())

        # Accept friend request
        self.user2.accept_friend_request(self.user1)
        self.assertTrue(self.user1.is_friend_with(self.user2))
        self.assertTrue(self.user2.is_friend_with(self.user1))
        self.assertFalse(self.user2 in self.user1.friend_requests_sent.all())

    def test_reject_friend_request(self):
        """Test rejecting a friend request."""
        self.user1.send_friend_request(self.user2)
        self.user2.reject_friend_request(self.user1)
        self.assertFalse(self.user2 in self.user1.friend_requests_sent.all())
        self.assertFalse(self.user1.is_friend_with(self.user2))

    def test_blocked_user_request(self):
        """Test sending a friend request to a blocked user."""
        # Block user2
        self.user1.blocked_users.add(self.user2)

        # Attempt to send friend request should raise ValueError
        with self.assertRaises(ValueError):
            self.user1.send_friend_request(self.user2)

    def test_duplicate_friend_request(self):
        """Test that duplicate friend requests are not created."""
        self.user1.send_friend_request(self.user2)
        self.user1.send_friend_request(self.user2)  # Send duplicate request
        self.assertEqual(self.user1.friend_requests_sent.filter(id=self.user2.id).count(), 1)

    def test_cancel_friend_request(self):
        """Test canceling a friend request."""
        self.user1.send_friend_request(self.user2)
        self.user1.cancel_friend_request(self.user2)
        self.assertFalse(self.user2 in self.user1.friend_requests_sent.all())
        self.assertFalse(self.user1 in self.user2.friend_requests_received.all())

    def test_blocked_user_cannot_send_request(self):
        """Test that a blocked user cannot send a friend request."""
        self.user2.blocked_users.add(self.user1)
        with self.assertRaises(ValueError):
            self.user1.send_friend_request(self.user2)

    def test_friendship_symmetry(self):
        """Test that friendships are symmetric."""
        self.user1.send_friend_request(self.user2)
        self.user2.accept_friend_request(self.user1)
        self.assertTrue(self.user1.is_friend_with(self.user2))
        self.assertTrue(self.user2.is_friend_with(self.user1))

    def test_unblock_user_allows_friend_request(self):
        """Test that unblocking a user allows sending a friend request."""
        self.user1.blocked_users.add(self.user2)
        self.user1.blocked_users.remove(self.user2)  # Unblock user
        self.user1.send_friend_request(self.user2)
        self.assertTrue(self.user2 in self.user1.friend_requests_sent.all())
