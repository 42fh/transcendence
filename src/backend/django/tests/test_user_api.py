import unittest
import requests
import os

BASE_URL = os.getenv("API_URL", "http://localhost:8000/api")


class TestUserAPI(unittest.TestCase):
    def setUp(self):
        self.api_url = f"{BASE_URL}/users"
        # Ensure API is accessible
        try:
            requests.get(f"{BASE_URL}/health/")
        except requests.ConnectionError:
            self.skipTest("API server is not running")

    def test_list_users(self):
        """Test GET /api/users/"""
        response = requests.get(f"{self.api_url}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Check if our seeded users exist
        usernames = [user["username"] for user in data["users"]]
        expected_users = ["dev", "ThePrimeagen", "LexFridman", "ElonMusk", "CheGuevara"]
        for username in expected_users:
            self.assertIn(username, usernames)

        # Check pagination structure
        self.assertIn("pagination", data)
        pagination = data["pagination"]
        self.assertIn("total", pagination)
        self.assertIn("page", pagination)
        self.assertIn("per_page", pagination)
        self.assertIn("total_pages", pagination)

    def test_user_detail(self):
        """Test GET /api/users/<uuid:user_id>/"""
        # First get the user's UUID from the list endpoint
        response = requests.get(f"{self.api_url}/")
        users = response.json()["users"]
        dev_user = next(user for user in users if user["username"] == "dev")
        user_id = dev_user["id"]

        # Then test the detail endpoint
        response = requests.get(f"{self.api_url}/{user_id}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Check basic user details
        self.assertEqual(data["username"], "dev")
        self.assertEqual(data["email"], "dev@example.com")
        self.assertEqual(data["bio"], "Development user for local testing")

        # Check required fields are present
        required_fields = {
            "id",
            "username",
            "email",
            "avatar",
            "bio",
            "telephone_number",
            "pronoun",
            "is_active",
            "visibility_online_status",
            "visibility_user_profile",
            "stats",
            "recent_matches",
        }
        self.assertTrue(all(field in data for field in required_fields))

        # Check stats structure
        self.assertIn("stats", data)
        stats = data["stats"]
        self.assertEqual(stats["wins"], 5)
        self.assertEqual(stats["losses"], 2)
        self.assertAlmostEqual(stats["win_ratio"], 5 / 7)  # Should be wins/(wins+losses)
        self.assertIn("display_name", stats)

        # Check recent matches
        self.assertIn("recent_matches", data)
        matches = data["recent_matches"]
        self.assertIsInstance(matches, list)
        if matches:  # If there are matches
            match = matches[0]
            required_match_fields = {"game_id", "date", "score", "won", "game_type", "opponent"}
            self.assertTrue(all(field in match for field in required_match_fields))

            # If there's an opponent, check opponent data
            if match["opponent"]:
                required_opponent_fields = {"username", "display_name", "score"}
                self.assertTrue(all(field in match["opponent"] for field in required_opponent_fields))

    def test_invalid_user(self):
        """Test requesting non-existent user"""
        response = requests.get(f"{self.api_url}/nonexistent-uuid/")
        self.assertEqual(response.status_code, 404)

    def test_update_user(self):
        """Test PATCH /api/users/<uuid:user_id>/"""
        # First create and login as a test user with a unique username
        signup_data = {
            "username": f"testuser_{os.urandom(4).hex()}",
            "password": "testpass123",
            "email": "testuser@example.com",
            "first_name": "Test",
            "last_name": "User",
        }
        response = requests.post(f"{self.api_url}/auth/signup/", json=signup_data)
        print(f"Signup response: {response.status_code}")
        print(f"Response content: {response.text}")
        self.assertEqual(response.status_code, 200)
        user_data = response.json()
        user_id = user_data["id"]

        # Store cookies from signup response for authentication
        cookies = response.cookies

        # Update user profile
        update_data = {
            "first_name": "Test",
            "last_name": "User",
            "email": "test@example.com",
            "bio": "Updated bio",
            "telephone_number": "1234567890",
            "pronoun": "they/them",
            "visibility_online_status": "everyone",
            "visibility_user_profile": "friends",
        }

        response = requests.patch(f"{self.api_url}/{user_id}/", json=update_data, cookies=cookies)
        print(f"Update response: {response.status_code}")
        print(f"Update response content: {response.text}")

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Verify updated fields directly from the update response
        self.assertEqual(data["email"], "test@example.com")
        self.assertEqual(data["bio"], "Updated bio")
        self.assertEqual(data["telephone_number"], "1234567890")
        self.assertEqual(data["pronoun"], "they/them")
        self.assertEqual(data["visibility_online_status"], "everyone")
        self.assertEqual(data["visibility_user_profile"], "friends")

    def test_update_other_user(self):
        """Test that a user cannot update another user's profile"""
        # Create first user with unique username
        signup_data1 = {
            "username": f"user1_{os.urandom(4).hex()}",  # Generate unique username
            "password": "pass123",
            "email": "user1@example.com",
            "first_name": "User",
            "last_name": "One",
        }
        response = requests.post(f"{self.api_url}/auth/signup/", json=signup_data1)
        print(f"First user signup response: {response.status_code}")
        print(f"Response content: {response.text}")
        user1_cookies = response.cookies

        # Create second user with unique username
        signup_data2 = {
            "username": f"user2_{os.urandom(4).hex()}",  # Generate unique username
            "password": "pass123",
            "email": "user2@example.com",
            "first_name": "User",
            "last_name": "Two",
        }
        response = requests.post(f"{self.api_url}/auth/signup/", json=signup_data2)
        print(f"Second user signup response: {response.status_code}")
        print(f"Response content: {response.text}")
        user2_id = response.json()["id"]

        # Try to update user2's profile while logged in as user1
        update_data = {"bio": "Should not work"}
        response = requests.patch(f"{self.api_url}/{user2_id}/", json=update_data, cookies=user1_cookies)

        self.assertEqual(response.status_code, 403)

    def test_update_user_invalid_data(self):
        """Test PATCH with invalid data format"""
        # First create and login as a test user with a unique username
        signup_data = {
            "username": f"testuser_{os.urandom(4).hex()}",  # Generate unique username
            "password": "testpass123",
        }
        response = requests.post(f"{self.api_url}/auth/signup/", json=signup_data)
        self.assertEqual(response.status_code, 200)
        user_data = response.json()
        user_id = user_data["id"]
        cookies = response.cookies

        # Test invalid visibility option
        update_data = {"visibility_online_status": "invalid_option"}
        response = requests.patch(f"{self.api_url}/{user_id}/", json=update_data, cookies=cookies)
        self.assertEqual(response.status_code, 400)

        # Test with malformed JSON
        response = requests.patch(
            f"{self.api_url}/{user_id}/", data="not-json", headers={"Content-Type": "application/json"}, cookies=cookies
        )
        self.assertEqual(response.status_code, 400)
