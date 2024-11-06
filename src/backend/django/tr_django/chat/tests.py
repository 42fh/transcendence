from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from users.models import CustomUser
from .models import ChatRoom, Message


class ChatRoomTestCase(TestCase):
    def setUp(self):
        """Set up test users"""
        self.user1 = CustomUser.objects.create_user(username="user1", email="user1@example.com", password="testpass123")
        self.user2 = CustomUser.objects.create_user(username="user2", email="user2@example.com", password="testpass123")
        self.user3 = CustomUser.objects.create_user(username="user3", email="user3@example.com", password="testpass123")

    def test_chatroom_creation(self):
        """Test that a ChatRoom is created with correct room_id"""
        room = ChatRoom.objects.create(user1=self.user1, user2=self.user2)
        expected_room_id = f"{self.user1.username}_{self.user2.username}"
        self.assertEqual(room.room_id, expected_room_id)

    def test_chatroom_unique_pairs(self):
        """Test that ChatRooms are unique for user pairs regardless of order"""
        room1 = ChatRoom.objects.create(user1=self.user1, user2=self.user2)
        room2 = ChatRoom.objects.create(user1=self.user2, user2=self.user1)

        # Both rooms should have the same room_id
        self.assertEqual(room1.room_id, room2.room_id)

    def test_chatroom_str_representation(self):
        """Test the string representation of ChatRoom"""
        room = ChatRoom.objects.create(user1=self.user1, user2=self.user2)
        expected_str = f"Chat between {self.user1.username} and {self.user2.username}"
        self.assertEqual(str(room), expected_str)


class MessageTestCase(TestCase):
    def setUp(self):
        """Set up test users and chatroom"""
        self.user1 = CustomUser.objects.create_user(username="user1", email="user1@example.com", password="testpass123")
        self.user2 = CustomUser.objects.create_user(username="user2", email="user2@example.com", password="testpass123")
        self.chat_room = ChatRoom.objects.create(user1=self.user1, user2=self.user2)

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
        message = Message.objects.create(room=self.chat_room, sender=self.user1, content="New message")

        self.chat_room.refresh_from_db()
        self.assertGreater(self.chat_room.last_message_at, initial_last_message)

    def test_message_str_representation(self):
        """Test the string representation of Message"""
        message = Message.objects.create(room=self.chat_room, sender=self.user1, content="Test message")
        expected_str = f"Message from {self.user1.username} at {message.timestamp}"
        self.assertEqual(str(message), expected_str)


class ChatRoomQueryTestCase(TestCase):
    def setUp(self):
        """Set up test users and chatrooms"""
        self.user1 = CustomUser.objects.create_user(username="user1")
        self.user2 = CustomUser.objects.create_user(username="user2")
        self.user3 = CustomUser.objects.create_user(username="user3")

        # Create chat rooms
        self.room1 = ChatRoom.objects.create(user1=self.user1, user2=self.user2)
        self.room2 = ChatRoom.objects.create(user1=self.user1, user2=self.user3)

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


class ChatModelUserTest(TestCase):
    def setUp(self):
        """Set up test users using CustomUser model"""
        self.user1 = CustomUser.objects.create_user(
            username="testuser1", email="test1@example.com", password="testpass123"
        )
        self.user2 = CustomUser.objects.create_user(
            username="testuser2", email="test2@example.com", password="testpass123"
        )

    def test_chatroom_user_model(self):
        """Test that ChatRoom uses CustomUser model"""
        chat_room = ChatRoom.objects.create(user1=self.user1, user2=self.user2)

        # Verify that the users are instances of CustomUser
        self.assertIsInstance(chat_room.user1, CustomUser)
        self.assertIsInstance(chat_room.user2, CustomUser)

        # Test message creation with CustomUser
        message = Message.objects.create(room=chat_room, sender=self.user1, content="Test message")
        self.assertIsInstance(message.sender, CustomUser)
