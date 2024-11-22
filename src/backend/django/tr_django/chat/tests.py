from django.test import TestCase
from unittest.mock import patch
from users.models import CustomUser
from .models import ChatRoom, Message, BlockedUser
from django.utils import timezone
from django.db import IntegrityError
from django.core.exceptions import ObjectDoesNotExist
from datetime import timedelta
from django.db.models import Q


class ChatTestCase(TestCase):
    @classmethod
    def setUpClass(cls):
        # Start patching before any tests run
        cls.patcher = patch("game.signals.create_player_profile")
        cls.patcher.start()
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        # Stop patching after all tests complete
        cls.patcher.stop()
        super().tearDownClass()

    def setUp(self):
        """Set up test users if they don't already exist"""
        super().setUp()  # Call TestCase's setUp first

        # Add a unique identifier for each test class AND method to prevent collisions
        suffix = f"test_{self.__class__.__name__}_{self._testMethodName}"

        # Create test users with unique names
        self.user1 = CustomUser.objects.create_user(
            username=f"user1_{suffix}", email=f"user1_{suffix}@example.com", password="testpass123"
        )
        self.user2 = CustomUser.objects.create_user(
            username=f"user2_{suffix}", email=f"user2_{suffix}@example.com", password="testpass123"
        )
        self.user3 = CustomUser.objects.create_user(
            username=f"user3_{suffix}", email=f"user3_{suffix}@example.com", password="testpass123"
        )

        # Clean up any existing chat rooms for these users
        ChatRoom.objects.filter(
            Q(user1__in=[self.user1, self.user2, self.user3]) | Q(user2__in=[self.user1, self.user2, self.user3])
        ).delete()


class ChatRoomCreationTestCase(ChatTestCase):
    """Test cases specifically for chat room creation logic"""

    def test_chatroom_unique_pairs(self):
        """Test that ChatRooms are unique for user pairs regardless of order"""
        room1, created1 = ChatRoom.objects.create_room(self.user1, self.user2)
        room2, created2 = ChatRoom.objects.create_room(self.user2, self.user1)

        # Second creation should not create a new room
        self.assertTrue(created1)
        self.assertFalse(created2)
        self.assertEqual(room1.id, room2.id)


class MessageTestCase(ChatTestCase):
    def setUp(self):
        """Set up test users and chatroom"""
        super().setUp()
        # Only create the chat room if we're not running the unique pairs test
        if self._testMethodName != "test_chatroom_unique_pairs":
            self.chat_room, _ = ChatRoom.objects.create_room(self.user1, self.user2)

    def test_message_creation(self):
        """Test creating a message"""
        message = Message.objects.create(room=self.chat_room, sender=self.user1, content="Hello, World!")
        self.assertEqual(message.content, "Hello, World!")
        self.assertFalse(message.is_read)

    def test_message_ordering(self):
        """Test that messages are ordered by timestamp"""
        # Create messages with different timestamps
        message1 = Message.objects.create(room=self.chat_room, sender=self.user1, content="First message")

        # Create a message with an earlier timestamp
        earlier_time = timezone.now() - timedelta(minutes=5)
        message2 = Message.objects.create(room=self.chat_room, sender=self.user2, content="Earlier message")
        message2.timestamp = earlier_time
        message2.save()

        # Get messages in order
        messages = Message.objects.filter(room=self.chat_room)
        self.assertEqual(messages[0], message2)  # Earlier message should be first
        self.assertEqual(messages[1], message1)  # Later message should be second

    def test_last_message_update(self):
        """Test that last_message_at is updated when a new message is created"""
        initial_last_message = self.chat_room.last_message_at

        # Wait a moment to ensure different timestamp
        Message.objects.create(room=self.chat_room, sender=self.user1, content="New message")

        self.chat_room.refresh_from_db()
        self.assertGreater(self.chat_room.last_message_at, initial_last_message)

    def test_message_str_representation(self):
        """Test the string representation of Message"""
        message = Message.objects.create(room=self.chat_room, sender=self.user1, content="Test message")
        expected_str = f"Message from {self.user1.username} at {message.timestamp}"
        self.assertEqual(str(message), expected_str)


class ChatRoomQueryTestCase(ChatTestCase):
    def setUp(self):
        """Set up test users and chatrooms"""
        super().setUp()

        # Create chat rooms
        self.room1, _ = ChatRoom.objects.create_room(self.user1, self.user2)
        self.room2, _ = ChatRoom.objects.create_room(self.user1, self.user3)

    def test_user_chatrooms(self):
        """Test querying chatrooms for a specific user"""
        user1_rooms = ChatRoom.objects.filter(user1=self.user1) | ChatRoom.objects.filter(user2=self.user1)
        self.assertEqual(user1_rooms.count(), 2)

        user2_rooms = ChatRoom.objects.filter(user1=self.user2) | ChatRoom.objects.filter(user2=self.user2)
        self.assertEqual(user2_rooms.count(), 1)

    def test_unread_messages(self):
        """Test querying unread messages"""
        # Create some messages
        Message.objects.create(room=self.room1, sender=self.user2, content="Hello")
        Message.objects.create(room=self.room1, sender=self.user2, content="Hi again")

        # Count unread messages
        unread_count = Message.objects.filter(room=self.room1, is_read=False).count()
        self.assertEqual(unread_count, 2)

        # Mark one message as read
        message = Message.objects.filter(room=self.room1).first()
        message.is_read = True
        message.save()

        # Recount unread messages
        unread_count = Message.objects.filter(room=self.room1, is_read=False).count()
        self.assertEqual(unread_count, 1)


class ChatModelUserTest(ChatTestCase):
    def test_chatroom_user_model(self):
        """Test that ChatRoom uses CustomUser model"""
        chat_room = ChatRoom.objects.create(user1=self.user1, user2=self.user2)

        # Verify that the users are instances of CustomUser
        self.assertIsInstance(chat_room.user1, CustomUser)
        self.assertIsInstance(chat_room.user2, CustomUser)

        # Test message creation with CustomUser
        message = Message.objects.create(room=chat_room, sender=self.user1, content="Test message")
        self.assertIsInstance(message.sender, CustomUser)


class BlockedUserTestCase(ChatTestCase):
    def test_block_user_creation(self):
        """Test creating a blocked user relationship"""
        block = BlockedUser.objects.create(user=self.user1, blocked_user=self.user2)
        self.assertEqual(block.user, self.user1)
        self.assertEqual(block.blocked_user, self.user2)
        self.assertIsNotNone(block.created_at)

    def test_unique_block_constraint(self):
        """Test that a user cannot block another user multiple times"""
        BlockedUser.objects.create(user=self.user1, blocked_user=self.user2)

        # Attempt to create duplicate block
        with self.assertRaises(IntegrityError):
            BlockedUser.objects.create(user=self.user1, blocked_user=self.user2)

    def test_multiple_blocks(self):
        """Test that a user can block multiple users"""
        block1 = BlockedUser.objects.create(user=self.user1, blocked_user=self.user2)
        block2 = BlockedUser.objects.create(user=self.user1, blocked_user=self.user3)

        blocked_users = BlockedUser.objects.filter(user=self.user1)
        self.assertEqual(blocked_users.count(), 2)

    def test_bidirectional_blocking(self):
        """Test that two users can block each other"""
        block1 = BlockedUser.objects.create(user=self.user1, blocked_user=self.user2)
        block2 = BlockedUser.objects.create(user=self.user2, blocked_user=self.user1)

        self.assertTrue(BlockedUser.objects.filter(user=self.user1, blocked_user=self.user2).exists())
        self.assertTrue(BlockedUser.objects.filter(user=self.user2, blocked_user=self.user1).exists())

    def test_str_representation(self):
        """Test the string representation of BlockedUser"""
        block = BlockedUser.objects.create(user=self.user1, blocked_user=self.user2)
        expected_str = f"{self.user1.username} blocked {self.user2.username}"
        self.assertEqual(str(block), expected_str)

    def test_cascade_deletion(self):
        """Test that blocked user entries are deleted when a user is deleted"""
        block = BlockedUser.objects.create(user=self.user1, blocked_user=self.user2)
        self.user1.delete()

        with self.assertRaises(ObjectDoesNotExist):
            BlockedUser.objects.get(id=block.id)

    def test_blocked_users_query(self):
        """Test querying blocked users for a specific user"""
        BlockedUser.objects.create(user=self.user1, blocked_user=self.user2)
        BlockedUser.objects.create(user=self.user1, blocked_user=self.user3)

        # Test blocked_users related name
        blocked_users = self.user1.blocked_users.all()
        self.assertEqual(blocked_users.count(), 2)

        # Test blocking_users related name
        blocking_users = self.user2.blocking_users.all()
        self.assertEqual(blocking_users.count(), 1)
        self.assertEqual(blocking_users.first().user, self.user1)
