from unittest import TestCase
import requests
import os

BASE_URL = os.getenv("API_URL", "http://localhost:8000/api")


class TestUserAPI(TestCase):
    def setUp(self):
        self.api_url = f"{BASE_URL}/users"

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
