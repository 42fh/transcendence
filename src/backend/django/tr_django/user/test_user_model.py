from django.contrib.auth.models import User
from django.test import TestCase
from .models import UserProfile


class UserProfileTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username="testuser1", password="12345")
        self.user2 = User.objects.create_user(username="testuser2", password="54321")
        self.user_profile1 = UserProfile.objects.create(
            user=self.user1, bio="Test bio 1", location="Location 1", level=1
        )
        self.user_profile2 = UserProfile.objects.create(
            user=self.user2, bio="Test bio 2", location="Location 2", level=2
        )

    def test_user_profile_creation(self):
        """Test that the UserProfile is created correctly."""
        self.assertEqual(self.user_profile1.user.username, "testuser1")
        self.assertEqual(self.user_profile1.bio, "Test bio 1")
        self.assertEqual(self.user_profile1.location, "Location 1")
        self.assertEqual(self.user_profile1.level, 1)

    def test_add_friend(self):
        """Test adding a friend to a UserProfile."""
        self.user_profile1.add_friend(self.user_profile2)
        self.assertIn(self.user_profile2, self.user_profile1.friends.all())

    def test_add_self_as_friend(self):
        self.user_profile1.send_friend_request(self.user_profile2)
        with self.assertRaises(ValueError) as context:
            self.user_profile1.add_friend(self.user_profile1)
        self.assertEqual(str(context.exception), "You cannot add yourself as a friend.")

    def test_friends_symmetry(self):
        """Test that friendship is symmetrical."""
        self.user_profile1.add_friend(self.user_profile2)
        self.assertIn(self.user_profile1, self.user_profile2.friends.all())

    def test_user_profile_string_representation(self):
        """Test the string representation of UserProfile."""
        self.assertEqual(str(self.user_profile1), "testuser1")
        self.assertEqual(str(self.user_profile2), "testuser2")

    def test_send_friend_request(self):
        """Test sending a friend request."""
        self.user_profile1.send_friend_request(self.user_profile2)
        self.assertIn(self.user_profile2, self.user_profile1.friend_requests_sent.all())
        self.assertIn(
            self.user_profile1, self.user_profile2.friend_requests_received.all()
        )

    def test_send_friend_request_to_self(self):
        """Test that a user cannot send a friend request to themselves."""
        with self.assertRaises(ValueError) as context:
            self.user_profile1.send_friend_request(self.user_profile1)
        self.assertEqual(
            str(context.exception), "A user cannot send a friend request to themselves."
        )

    def test_accept_friend_request(self):
        self.user_profile1.send_friend_request(self.user_profile2)
        self.user_profile2.accept_friend_request(self.user_profile1)

    def test_accept_nonexistent_friend_request(self):
        """Test that accepting a non-existent friend request raises an error."""
        with self.assertRaises(ValueError) as context:
            self.user_profile2.accept_friend_request(self.user_profile1)
        self.assertEqual(str(context.exception), "No friend request from this user.")

    def tearDown(self):
        """Clean up after tests."""
        self.user_profile1.delete()
        self.user_profile2.delete()
        self.user1.delete()
        self.user2.delete()
