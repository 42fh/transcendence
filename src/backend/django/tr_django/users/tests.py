from django.test import TestCase
from django.urls import reverse
from users.models import CustomUser, VisibilityGroup
from django.core.exceptions import ValidationError


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


class CustomUserStatusVisibilityTestCase(TestCase):
    """Test cases for status and visibility fields in CustomUser"""

    def setUp(self):
        # Set up a user instance to use in tests
        self.user = CustomUser.objects.create_user(
            username="testuser", password="password123"
        )

    # Test default values for status and visibility fields
    def test_default_status_and_visibility_values(self):
        """Test that status and visibility fields have expected default values"""
        self.assertEqual(self.user.online_status, CustomUser.STATUS_OFFLINE)
        self.assertEqual(self.user.default_status, CustomUser.STATUS_OFFLINE)
        self.assertEqual(
            self.user.visibility_online_status, CustomUser.VISIBILITY_FRIENDS
        )
        self.assertEqual(
            self.user.visibility_user_profile, CustomUser.VISIBILITY_EVERYONE
        )

    # Test valid choices for online_status
    def test_update_online_status_with_valid_choices(self):
        """Test that online_status can be updated with valid choices"""
        valid_status_choices = [
            CustomUser.STATUS_OFFLINE,
            CustomUser.STATUS_ONLINE,
            CustomUser.STATUS_BUSY,
            CustomUser.STATUS_AWAY,
        ]

        for status in valid_status_choices:
            self.user.online_status = status
            self.user.save()
            self.assertEqual(self.user.online_status, status)

    # Test invalid choice for online_status
    def test_invalid_online_status_choice(self):
        """Test that invalid online_status choice raises an error"""
        with self.assertRaises(ValidationError):
            self.user.online_status = "invalid_status"
            self.user.full_clean()

    # Test valid choices for default_status
    def test_update_default_status_with_valid_choices(self):
        """Test that default_status can be updated with valid choices"""
        valid_default_choices = [CustomUser.STATUS_OFFLINE, CustomUser.STATUS_AWAY]

        for status in valid_default_choices:
            self.user.default_status = status
            self.user.save()
            self.assertEqual(self.user.default_status, status)

    # Test invalid choice for default_status
    def test_invalid_default_status_choice(self):
        """Test that invalid default_status choice raises an error"""
        with self.assertRaises(ValidationError):
            self.user.default_status = "invalid_default"
            self.user.full_clean()

    # Test valid choices for visibility_online_status
    def test_update_visibility_online_status_with_valid_choices(self):
        """Test that visibility_online_status can be updated with valid choices"""
        valid_visibility_choices = [
            CustomUser.VISIBILITY_NONE,
            CustomUser.VISIBILITY_FRIENDS,
            CustomUser.VISIBILITY_EVERYONE,
            CustomUser.VISIBILITY_CUSTOM,
        ]

        for visibility in valid_visibility_choices:
            self.user.visibility_online_status = visibility
            self.user.save()
            self.assertEqual(self.user.visibility_online_status, visibility)

    # Test invalid choice for visibility_online_status
    def test_invalid_visibility_online_status_choice(self):
        """Test that invalid visibility_online_status choice raises an error"""
        with self.assertRaises(ValidationError):
            self.user.visibility_online_status = "invalid_visibility"
            self.user.full_clean()

    # Test valid choices for visibility_user_profile
    def test_update_visibility_user_profile_with_valid_choices(self):
        """Test that visibility_user_profile can be updated with valid choices"""
        valid_visibility_choices = [
            CustomUser.VISIBILITY_NONE,
            CustomUser.VISIBILITY_FRIENDS,
            CustomUser.VISIBILITY_EVERYONE,
            CustomUser.VISIBILITY_CUSTOM,
        ]

        for visibility in valid_visibility_choices:
            self.user.visibility_user_profile = visibility
            self.user.save()
            self.assertEqual(self.user.visibility_user_profile, visibility)

    # Test invalid choice for visibility_user_profile
    def test_invalid_visibility_user_profile_choice(self):
        """Test that invalid visibility_user_profile choice raises an error"""
        self.user.visibility_user_profile = "invalid_visibility"

        # Use assertRaises to verify that ValidationError is raised
        with self.assertRaises(ValidationError) as context:
            self.user.full_clean()

        # Optionally verify the specific error message
        self.assertIn("visibility_user_profile", context.exception.message_dict)
        self.assertIn("is not a valid choice", str(context.exception))


class CustomUserRelationshipTestCase(TestCase):
    """Test cases for friends, blocked users, and custom visibility group relationships."""

    def setUp(self):
        # Create test users
        self.user1 = CustomUser.objects.create_user(
            username="user1", password="password123"
        )
        self.user2 = CustomUser.objects.create_user(
            username="user2", password="password123"
        )
        self.user3 = CustomUser.objects.create_user(
            username="user3", password="password123"
        )

    # Test Friends and Blocked Users
    def test_friends_and_blocked_users(self):
        """Test adding, removing, and checking friends and blocked users."""

        # Add a friend
        self.user1.friends.add(self.user2)
        # Test is_friend_with method
        self.assertTrue(self.user1.is_friend_with(self.user2))

        # Remove friend and confirm they are no longer friends
        self.user1.friends.remove(self.user2)
        self.assertFalse(self.user1.is_friend_with(self.user2))

        # Add a blocked user
        self.user1.blocked_users.add(self.user3)
        # Test is_blocked_by method
        self.assertTrue(self.user3.is_blocked_by(self.user1))

        # Unblock user and confirm they are no longer blocked
        self.user1.blocked_users.remove(self.user3)
        self.assertFalse(self.user3.is_blocked_by(self.user1))

    # Test Custom Visibility Group
    def test_custom_visibility_group(self):
        """Test adding a user to a custom visibility group and deletion behavior."""

        # Create a visibility group
        visibility_group = VisibilityGroup.objects.create(
            name="Close Friends",
            description="Group for close friends only",
            created_by=self.user1,
        )

        # Assign user to the visibility group
        self.user1.custom_visibility_group = visibility_group
        self.user1.save()

        # Check that the custom_visibility_group is set correctly
        self.assertEqual(self.user1.custom_visibility_group, visibility_group)

        # Delete the visibility group and confirm custom_visibility_group is set to None
        visibility_group.delete()
        self.user1.refresh_from_db()
        self.assertIsNone(self.user1.custom_visibility_group)


class CustomUserRelationshipTestCase(TestCase):
    """Test cases for friends, blocked users, and custom visibility group relationships."""

    def setUp(self):
        # Create test users
        self.user1 = CustomUser.objects.create_user(
            username="user1", password="password123"
        )
        self.user2 = CustomUser.objects.create_user(
            username="user2", password="password123"
        )
        self.user3 = CustomUser.objects.create_user(
            username="user3", password="password123"
        )

    # Test Friends and Blocked Users
    def test_friends_and_blocked_users(self):
        """Test adding, removing, and checking friends and blocked users."""

        # Add a friend
        self.user1.friends.add(self.user2)
        # Test is_friend_with method
        self.assertTrue(self.user1.is_friend_with(self.user2))

        # Remove friend and confirm they are no longer friends
        self.user1.friends.remove(self.user2)
        self.assertFalse(self.user1.is_friend_with(self.user2))

        # Add a blocked user
        self.user1.blocked_users.add(self.user3)
        # Test is_blocked_by method
        self.assertTrue(self.user3.is_blocked_by(self.user1))

        # Unblock user and confirm they are no longer blocked
        self.user1.blocked_users.remove(self.user3)
        self.assertFalse(self.user3.is_blocked_by(self.user1))

    # Test Custom Visibility Group
    def test_custom_visibility_group(self):
        """Test adding a user to a custom visibility group and deletion behavior."""

        # Create a visibility group
        visibility_group = VisibilityGroup.objects.create(
            name="Close Friends",
            description="Group for close friends only",
            created_by=self.user1,
        )

        # Assign user to the visibility group
        self.user1.custom_visibility_group = visibility_group
        self.user1.save()

        # Check that the custom_visibility_group is set correctly
        self.assertEqual(self.user1.custom_visibility_group, visibility_group)

        # Delete the visibility group and confirm custom_visibility_group is set to None
        visibility_group.delete()
        self.user1.refresh_from_db()
        self.assertIsNone(self.user1.custom_visibility_group)


class FriendRequestTests(TestCase):
    def setUp(self):
        # Create test users
        self.user1 = CustomUser.objects.create_user(
            username="user1", password="test123"
        )
        self.user2 = CustomUser.objects.create_user(
            username="user2", password="test123"
        )
        self.user3 = CustomUser.objects.create_user(
            username="user3", password="test123"
        )

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
        self.assertEqual(
            self.user1.friend_requests_sent.filter(id=self.user2.id).count(), 1
        )

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
