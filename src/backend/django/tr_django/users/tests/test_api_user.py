from django.test import TestCase, Client
from django.urls import reverse
import json
from users.models import CustomUser
import os
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
import io


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


class APIUserUpdateTests(TestCase):
    """Test suite for PATCH /api/users/<uuid:user_id>/ endpoint"""

    fixtures = ["users.json"]

    def setUp(self):
        self.client = Client()
        self.user_id = "123e4567-e89b-12d3-a456-426614174000"  # ID from fixture
        self.url = reverse("user_detail", kwargs={"user_id": self.user_id})

        # Get the user and log them in
        self.user = CustomUser.objects.get(pk=self.user_id)
        self.client.force_login(self.user)

    def test_update_user_profile(self):
        """Test updating user's own profile"""
        update_data = {
            "first_name": "Updated",
            "last_name": "Name",
            "bio": "Updated bio",
            "telephone_number": "9876543210",
            "pronoun": "they/them",
            "visibility_online_status": "friends",
            "visibility_user_profile": "everyone",
        }

        response = self.client.patch(self.url, data=json.dumps(update_data), content_type="application/json")

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)

        # Verify updated fields
        self.assertEqual(data["bio"], "Updated bio")
        self.assertEqual(data["telephone_number"], "9876543210")
        self.assertEqual(data["pronoun"], "they/them")
        self.assertEqual(data["visibility_online_status"], "friends")
        self.assertEqual(data["visibility_user_profile"], "everyone")

    def test_update_other_user_profile(self):
        """Test attempting to update another user's profile"""
        other_user_id = "223e4567-e89b-12d3-a456-426614174000"  # Another ID from fixture
        other_url = reverse("user_detail", kwargs={"user_id": other_user_id})

        update_data = {
            "bio": "Should not update",
        }

        response = self.client.patch(other_url, data=json.dumps(update_data), content_type="application/json")

        self.assertEqual(response.status_code, 403)

    def test_update_user_profile_unauthenticated(self):
        """Test updating profile while not logged in"""
        self.client.logout()

        update_data = {
            "bio": "Should not update",
        }

        response = self.client.patch(self.url, data=json.dumps(update_data), content_type="application/json")

        self.assertEqual(response.status_code, 401)

    def test_update_invalid_fields(self):
        """Test updating with invalid or non-updatable fields"""
        update_data = {
            "is_staff": True,  # privileged field
            "invalid_field": "value",  # non-existent field
            "bio": "This should update",  # valid field
        }

        response = self.client.patch(self.url, data=json.dumps(update_data), content_type="application/json")

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)

        # Verify only valid fields were updated
        self.assertEqual(data["bio"], "This should update")
        self.assertFalse(data.get("is_staff", False))
        self.assertNotIn("invalid_field", data)


class APIUserAvatarTests(TestCase):
    """Test suite for POST /api/users/<uuid:user_id>/avatar/ endpoint"""

    fixtures = ["users.json"]

    def setUp(self):
        self.client = Client()
        self.user_id = "123e4567-e89b-12d3-a456-426614174000"  # ID from fixture
        self.url = reverse("user_avatar", kwargs={"user_id": self.user_id})

        # Get the user and log them in
        self.user = CustomUser.objects.get(pk=self.user_id)
        self.client.force_login(self.user)

    def test_avatar_upload(self):
        """Test uploading a user avatar"""
        # Create a test image
        image = Image.new("RGB", (100, 100), color="red")
        img_io = io.BytesIO()
        image.save(img_io, "JPEG")
        img_io.seek(0)

        avatar_file = SimpleUploadedFile(name="test_avatar.jpg", content=img_io.getvalue(), content_type="image/jpeg")

        response = self.client.post(self.url, {"avatar": avatar_file}, format="multipart")

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)

        self.assertIn("avatar", data)
        self.assertIsNotNone(data["avatar"])
        self.assertTrue(data["avatar"].startswith("/media/avatars/"))

        # Verify the file exists on disk
        user = CustomUser.objects.get(pk=self.user_id)
        self.assertTrue(user.avatar)
        self.assertTrue(os.path.exists(user.avatar.path))

    def test_avatar_upload_invalid_file(self):
        """Test uploading an invalid avatar file"""
        invalid_file = SimpleUploadedFile(name="test.txt", content=b"not an image", content_type="text/plain")

        response = self.client.post(self.url, {"avatar": invalid_file}, format="multipart")

        self.assertEqual(response.status_code, 400)

    def test_avatar_upload_too_large(self):
        """Test uploading an avatar that exceeds size limit"""
        large_file = SimpleUploadedFile(
            name="large.jpg", content=b"0" * (2 * 1024 * 1024 + 1), content_type="image/jpeg"  # 2MB + 1 byte
        )

        response = self.client.post(self.url, {"avatar": large_file}, format="multipart")

        self.assertEqual(response.status_code, 400)

    def test_avatar_upload_unauthenticated(self):
        """Test uploading avatar while not logged in"""
        self.client.logout()

        image = Image.new("RGB", (100, 100), color="red")
        img_io = io.BytesIO()
        image.save(img_io, "JPEG")
        img_io.seek(0)

        avatar_file = SimpleUploadedFile(name="test_avatar.jpg", content=img_io.getvalue(), content_type="image/jpeg")

        response = self.client.post(self.url, {"avatar": avatar_file}, format="multipart")

        self.assertEqual(response.status_code, 401)

    def test_avatar_upload_other_user(self):
        """Test uploading avatar to another user's profile"""
        other_user_id = "223e4567-e89b-12d3-a456-426614174000"
        other_url = reverse("user_avatar", kwargs={"user_id": other_user_id})

        image = Image.new("RGB", (100, 100), color="red")
        img_io = io.BytesIO()
        image.save(img_io, "JPEG")
        img_io.seek(0)

        avatar_file = SimpleUploadedFile(name="test_avatar.jpg", content=img_io.getvalue(), content_type="image/jpeg")

        response = self.client.post(other_url, {"avatar": avatar_file}, format="multipart")

        self.assertEqual(response.status_code, 403)


class FriendsListViewTests(TestCase):
    def setUp(self):
        # Create test users
        self.user1 = CustomUser.objects.create_user(
            id="123e4567-e89b-12d3-a456-426614174000", username="testuser1", password="test123"
        )
        self.user2 = CustomUser.objects.create_user(
            id="223e4567-e89b-12d3-a456-426614174000", username="testuser2", password="test123"
        )
        self.user3 = CustomUser.objects.create_user(
            id="323e4567-e89b-12d3-a456-426614174000", username="testuser3", password="test123"
        )

        # Add friends
        self.user1.friends.add(self.user2, self.user3)

        self.client = Client()
        self.base_url = f"/api/users/{self.user1.id}/friends/"

    def test_get_friends_list(self):
        """Test basic friend list retrieval"""
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(len(data["friends"]), 2)
        friend_usernames = {friend["username"] for friend in data["friends"]}
        self.assertEqual(friend_usernames, {"testuser2", "testuser3"})

    def test_friends_list_pagination(self):
        """Test pagination of friends list"""
        response = self.client.get(f"{self.base_url}?page=1&per_page=1")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(len(data["friends"]), 1)
        self.assertEqual(data["pagination"]["total"], 2)
        self.assertEqual(data["pagination"]["total_pages"], 2)

    def test_friends_list_search(self):
        """Test search functionality in friends list"""
        response = self.client.get(f"{self.base_url}?search=user2")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(len(data["friends"]), 1)
        self.assertEqual(data["friends"][0]["username"], "testuser2")

    def test_invalid_user_id(self):
        """Test response for non-existent user"""
        response = self.client.get("/api/users/nonexistent-id/friends/")
        self.assertEqual(response.status_code, 404)
