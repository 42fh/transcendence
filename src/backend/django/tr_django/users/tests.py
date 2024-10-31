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


from django.test import TestCase
from users.models import CustomUser
from uuid import UUID


class CustomUserModelTestCase(TestCase):
    """Test cases for basic CRUD operations on CustomUser fields"""

    def setUp(self):
        # Creating an initial user instance for basic tests
        self.user = CustomUser.objects.create_user(
            username="testuser",
            password="password123",
            bio="This is a test bio.",
            telephone_number="123456789",
            pronoun="they/them",
        )

    # UUID Test
    def test_uuid_field(self):
        """Verify that the UUID is correctly assigned and accessible."""
        # Check that the user has a valid UUID assigned
        self.assertIsInstance(self.user.id, UUID)

    # Create Test for Simple Fields
    def test_create_user_with_simple_fields(self):
        """Test that the user is created with specified simple fields."""
        self.assertEqual(self.user.bio, "This is a test bio.")
        self.assertEqual(self.user.telephone_number, "123456789")
        self.assertEqual(self.user.pronoun, "they/them")

    # Retrieve Test for Simple Fields
    def test_retrieve_user_fields(self):
        """Test that the user's fields can be retrieved correctly."""
        user = CustomUser.objects.get(username="testuser")
        self.assertEqual(user.bio, "This is a test bio.")
        self.assertEqual(user.telephone_number, "123456789")
        self.assertEqual(user.pronoun, "they/them")

    # Update Test for Simple Fields
    def test_update_user_fields(self):
        """Test that the user's fields can be updated successfully."""
        self.user.bio = "Updated bio."
        self.user.telephone_number = "987654321"
        self.user.pronoun = "she/her"
        self.user.save()

        updated_user = CustomUser.objects.get(username="testuser")
        self.assertEqual(updated_user.bio, "Updated bio.")
        self.assertEqual(updated_user.telephone_number, "987654321")
        self.assertEqual(updated_user.pronoun, "she/her")

    # Delete Test for Simple Fields
    def test_delete_user_fields(self):
        """Test that the user's fields can be set to None (where allowed)."""
        self.user.bio = None
        self.user.telephone_number = None
        self.user.pronoun = None
        self.user.save()

        user = CustomUser.objects.get(username="testuser")
        self.assertIsNone(user.bio)
        self.assertIsNone(user.telephone_number)
        self.assertIsNone(user.pronoun)

    # Test for Avatar Field (CRUD)
    def test_avatar_field(self):
        """Test that avatar can be set, retrieved, and updated."""
        # Create: Initially should be None
        self.assertIsNone(self.user.avatar or None)

        # Update: Assign an avatar
        self.user.avatar = "avatars/test_avatar.png"
        self.user.save()

        updated_user = CustomUser.objects.get(username="testuser")
        self.assertEqual(updated_user.avatar, "avatars/test_avatar.png")

        # Delete: Set avatar to None
        self.user.avatar = None
        self.user.save()
        self.assertIsNone(self.user.avatar or None)
