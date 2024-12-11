from django.test import TestCase, Client
from django.urls import reverse
from users.models import CustomUser
import json


class FriendRequestsAPITests(TestCase):
    fixtures = ["users.json"]

    def setUp(self):
        self.client = Client()
        # Get existing users from fixtures
        self.user1 = CustomUser.objects.get(username="testuser1")
        self.user2 = CustomUser.objects.get(username="testuser2")
        self.user3 = CustomUser.objects.get(username="testuser3")

        # Create additional test users
        self.user4 = CustomUser.objects.create_user(username="testuser4", password="test123", email="test4@example.com")
        self.user5 = CustomUser.objects.create_user(username="testuser5", password="test123", email="test5@example.com")

        # Login as user1 by default
        self.client.force_login(self.user1)
        self.base_url = "/api/users/friend-requests/"

    def test_get_empty_friend_requests(self):
        """Test getting friend requests when there are none"""
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(len(data["sent"]), 0)
        self.assertEqual(len(data["received"]), 0)

    def test_send_friend_request(self):
        """Test sending a friend request"""
        response = self.client.post(
            self.base_url, data=json.dumps({"to_user_id": str(self.user2.id)}), content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)

        # Verify request was sent
        response = self.client.get(self.base_url)
        data = response.json()
        self.assertEqual(len(data["sent"]), 1)
        self.assertEqual(data["sent"][0]["username"], "testuser2")

    def test_send_multiple_friend_requests(self):
        """Test sending multiple friend requests"""
        # Send requests to multiple users
        users = [self.user2, self.user3, self.user4]
        for user in users:
            response = self.client.post(
                self.base_url, data=json.dumps({"to_user_id": str(user.id)}), content_type="application/json"
            )
            self.assertEqual(response.status_code, 200)

        # Verify all requests were sent
        response = self.client.get(self.base_url)
        data = response.json()
        self.assertEqual(len(data["sent"]), 3)

    def test_receive_friend_requests(self):
        """Test receiving friend requests"""
        # Login as different users and send requests to user1
        users = [self.user2, self.user3, self.user4]
        for user in users:
            self.client.force_login(user)
            response = self.client.post(
                self.base_url, data=json.dumps({"to_user_id": str(self.user1.id)}), content_type="application/json"
            )
            self.assertEqual(response.status_code, 200)

        # Login back as user1 and check received requests
        self.client.force_login(self.user1)
        response = self.client.get(self.base_url)
        data = response.json()
        self.assertEqual(len(data["received"]), 3)

    def test_accept_friend_request(self):
        """Test accepting a friend request"""
        # User2 sends request to user1
        self.client.force_login(self.user2)
        self.client.post(
            reverse("friend_requests"),
            data=json.dumps({"to_user_id": str(self.user1.id)}),
            content_type="application/json",
        )

        # User1 accepts the request (now using FriendshipsView)
        self.client.force_login(self.user1)
        response = self.client.post(
            "/api/users/friends/",
            data=json.dumps({"from_user_id": str(self.user2.id)}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        # Verify they are now friends
        self.assertTrue(self.user1.is_friend_with(self.user2))
        self.assertTrue(self.user2.is_friend_with(self.user1))

    def test_reject_friend_request(self):
        """Test rejecting a friend request"""
        # User2 sends request to user1
        self.client.force_login(self.user2)
        self.client.post(
            self.base_url, data=json.dumps({"to_user_id": str(self.user1.id)}), content_type="application/json"
        )

        # User1 rejects the request
        self.client.force_login(self.user1)
        response = self.client.patch(
            self.base_url,
            data=json.dumps({"from_user_id": str(self.user2.id), "action": "reject"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        # Verify they are not friends
        self.assertFalse(self.user1.is_friend_with(self.user2))
        self.assertFalse(self.user2.is_friend_with(self.user1))

    def test_cancel_friend_request(self):
        """Test canceling a sent friend request"""
        # Send request
        response = self.client.post(
            self.base_url, data=json.dumps({"to_user_id": str(self.user2.id)}), content_type="application/json"
        )

        # Cancel request
        response = self.client.delete(
            self.base_url, data=json.dumps({"to_user_id": str(self.user2.id)}), content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)

        # Verify request was cancelled
        response = self.client.get(self.base_url)
        data = response.json()
        self.assertEqual(len(data["sent"]), 0)

    def test_error_cases(self):
        """Test various error cases"""
        # Test unauthenticated access
        self.client.logout()
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, 401)

        # Test sending request to non-existent user
        self.client.force_login(self.user1)
        response = self.client.post(
            self.base_url, data=json.dumps({"to_user_id": "nonexistent-uuid"}), content_type="application/json"
        )
        self.assertEqual(response.status_code, 404)

        # Test sending request to self
        response = self.client.post(
            self.base_url, data=json.dumps({"to_user_id": str(self.user1.id)}), content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)

        # Test duplicate friend request
        self.client.post(
            self.base_url, data=json.dumps({"to_user_id": str(self.user2.id)}), content_type="application/json"
        )
        response = self.client.post(
            self.base_url, data=json.dumps({"to_user_id": str(self.user2.id)}), content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
