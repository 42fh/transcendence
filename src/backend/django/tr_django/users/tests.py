from django.test import TestCase
from django.urls import reverse
from users.models import CustomUser


class SignupTestCase(TestCase):
    """Test signup functionality using both direct model operations and HTTP layer"""

    def test_successful_signup_direct(self):
        """Test user creation directly using the CustomUser model
        This is a simple unit test that bypasses the HTTP layer"""

        user = CustomUser.objects.create_user(
            username="testuser", password="password123"
        )
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
