from django.test import TestCase, Client
from django.urls import reverse
import json


class APIUserListGetTests(TestCase):
    """Test suite for GET /api/users/ endpoint (basic user listing)"""

    fixtures = ["users.json"]

    def setUp(self):
        self.client = Client()
        self.url = reverse("users_list")

    def test_basic_functionality(self):
        """Test basic endpoint functionality and response structure"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.content)
        self.assertIn("users", data)
        self.assertIn("pagination", data)

        # Check pagination data structure
        pagination = data["pagination"]
        self.assertIn("total", pagination)
        self.assertIn("page", pagination)
        self.assertIn("per_page", pagination)
        self.assertIn("total_pages", pagination)

    def test_user_basic_data(self):
        """Test that user basic data is correct"""
        response = self.client.get(self.url)
        data = json.loads(response.content)
        user = data["users"][0]

        # Check only basic fields are present
        required_fields = {
            "id",
            "username",
            "avatar",
            "is_active",
            "visibility_online_status",
            "visibility_user_profile",
        }
        self.assertTrue(all(field in user for field in required_fields))

        # Verify sensitive/detailed data is not exposed
        sensitive_fields = {"email", "bio", "telephone_number", "pronoun", "stats", "recent_matches"}
        self.assertTrue(all(field not in user for field in sensitive_fields))

    def test_search_functionality(self):
        """Test search functionality with various parameters"""
        # Test username search
        response = self.client.get(f"{self.url}?search=user1")
        data = json.loads(response.content)
        self.assertEqual(len(data["users"]), 1)
        self.assertEqual(data["users"][0]["username"], "testuser1")

        # Test case insensitive search
        response = self.client.get(f"{self.url}?search=TESTUSER")
        data = json.loads(response.content)
        self.assertGreater(len(data["users"]), 0)

        # Test empty search returns all users
        response = self.client.get(f"{self.url}?search=")
        data = json.loads(response.content)
        self.assertEqual(len(data["users"]), 3)

    def test_pagination(self):
        """Test pagination functionality"""
        # Test custom page size
        response = self.client.get(f"{self.url}?per_page=2")
        data = json.loads(response.content)
        self.assertEqual(len(data["users"]), 2)
        self.assertEqual(data["pagination"]["total_pages"], 2)

        # Test second page
        response = self.client.get(f"{self.url}?page=2&per_page=2")
        data = json.loads(response.content)
        self.assertEqual(len(data["users"]), 1)
        self.assertEqual(data["pagination"]["page"], 2)


class APIUserDetailGetTests(TestCase):
    """Test suite for GET /api/users/<uuid:user_id>/ endpoint"""

    fixtures = ["users.json"]

    def setUp(self):
        self.client = Client()
        self.user_id = "123e4567-e89b-12d3-a456-426614174000"  # ID from fixture
        self.url = reverse("user_detail", kwargs={"user_id": self.user_id})

    def test_basic_functionality(self):
        """Test basic endpoint functionality"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)

        data = json.loads(response.content)
        self.assertIsInstance(data, dict)

    def test_user_detail_data(self):
        """Test that user detail data is complete"""
        response = self.client.get(self.url)
        data = json.loads(response.content)

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

    def test_game_statistics(self):
        """Test that game statistics are correct"""
        response = self.client.get(self.url)
        data = json.loads(response.content)
        stats = data["stats"]

        self.assertEqual(stats["wins"], 3)
        self.assertEqual(stats["losses"], 2)
        self.assertEqual(stats["win_ratio"], 0.6)
        self.assertEqual(stats["display_name"], "Player1")

    def test_match_history(self):
        """Test that match history is correct and properly ordered"""
        response = self.client.get(self.url)
        data = json.loads(response.content)
        matches = data["recent_matches"]

        self.assertLessEqual(len(matches), 5)

        first_match = matches[0]
        required_match_fields = {"game_id", "date", "score", "won", "game_type", "opponent"}
        self.assertTrue(all(field in first_match for field in required_match_fields))

        # Verify matches are ordered by date
        for i in range(len(matches) - 1):
            current_date = matches[i]["date"]
            next_date = matches[i + 1]["date"]
            self.assertGreater(current_date, next_date)

    def test_not_found(self):
        """Test response for non-existent user"""
        url = reverse("user_detail", kwargs={"user_id": "123e4567-e89b-12d3-a456-426614174999"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)
