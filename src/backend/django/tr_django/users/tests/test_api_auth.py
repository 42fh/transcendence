from django.test import TestCase
from django.urls import reverse
from users.models import CustomUser
import json
import uuid


class SignupTestCase(TestCase):
    """Test signup functionality using both direct model operations and HTTP layer"""

    def test_successful_signup_direct(self):
        """Test user creation directly using the CustomUser model
        This is a simple unit test that bypasses the HTTP layer"""

        CustomUser.objects.create_user(username="testuser", password="password123")
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

    def test_friendship_symmetry(self):
        """Test that friendships are symmetric."""
        self.user1.send_friend_request(self.user2)
        self.user2.accept_friend_request(self.user1)
        self.assertTrue(self.user1.is_friend_with(self.user2))
        self.assertTrue(self.user2.is_friend_with(self.user1))


class DeleteUserTests(TestCase):
    def setUp(self):
        # Add this line to define the URL
        self.url = reverse("delete_user")  # Change from delete-user to delete_user
        # Create test users
        self.user1 = CustomUser.objects.create_user(username="user1", password="test123")
        self.user2 = CustomUser.objects.create_user(username="user2", password="test123")
        self.user3 = CustomUser.objects.create_user(username="user3", password="test123")

    def test_unique_anonymous_username_generation(self):
        """Test that anonymous usernames are always unique"""
        # Create first user and anonymize
        user1 = CustomUser.objects.create_user(
            id=uuid.UUID("12345678-1234-5678-1234-567812345678"), username="testuser1", password="testpass123"
        )

        self.client.force_login(user1)
        response1 = self.client.post(
            self.url, data=json.dumps({"password": "testpass123"}), content_type="application/json"
        )
        self.assertEqual(response1.status_code, 200)
        anon_username1 = CustomUser.objects.get(id=user1.id).username

        # Create second user with similar UUID and anonymize
        user2 = CustomUser.objects.create_user(
            id=uuid.UUID("12345678-1234-5678-1234-567812345679"),  # Only last digit different
            username="testuser2",
            password="testpass123",
        )

        self.client.force_login(user2)
        response2 = self.client.post(
            self.url, data=json.dumps({"password": "testpass123"}), content_type="application/json"
        )
        self.assertEqual(response2.status_code, 200)
        anon_username2 = CustomUser.objects.get(id=user2.id).username

        # Verify usernames are different but share prefix
        self.assertNotEqual(anon_username1, anon_username2)
        prefix = "user_12345678"  # First 8 chars of UUID
        self.assertTrue(anon_username1.startswith(prefix))
        self.assertTrue(anon_username2.startswith(prefix))

    def test_multiple_anonymizations(self):
        """Test handling of multiple anonymizations with same UUID prefix"""
        base_uuid = "12345678-1234-5678-1234-56781234567"
        usernames = []

        # Create and anonymize multiple users with similar UUIDs
        for i in range(3):
            # Create user with UUID that differs only in last character
            user = CustomUser.objects.create_user(
                id=uuid.UUID(f"{base_uuid}{i}"), username=f"testuser{i}", password="testpass123"
            )

            self.client.force_login(user)
            response = self.client.post(
                self.url, data=json.dumps({"password": "testpass123"}), content_type="application/json"
            )
            self.assertEqual(response.status_code, 200)

            username = CustomUser.objects.get(id=user.id).username
            usernames.append(username)

        # Verify all usernames are unique but share the same prefix
        self.assertEqual(len(set(usernames)), 3)  # All usernames should be unique
        prefix = "user_12345678"  # First 8 chars of UUID
        self.assertTrue(all(u.startswith(prefix) for u in usernames))
