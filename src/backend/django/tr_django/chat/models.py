import logging
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.db.models.signals import pre_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# class ChatRoomManager(models.Manager):
#     def create_room(self, user1, user2):
#         """Create a chat room with consistent room_id generation"""
#         # Sort usernames for room_id
#         usernames = sorted([user1.username, user2.username])
#         room_id_former = f"{usernames[0]}_{usernames[1]}"
#         room_id = f"{user1.id}_{user2.id}"
#         logger.debug("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx")
#         logger.debug("room_id_former :", room_id_former)
#         logger.debug("room_id :", room_id)

#         # Check if room exists with either user order
#         existing_room = self.filter(
#             models.Q(room_id=room_id) | models.Q(user1=user1, user2=user2) | models.Q(user1=user2, user2=user1)
#         ).first()

#         if existing_room:
#             return existing_room, False

#         # Sort users to match username order for consistency
#         if user2.username == usernames[0]:
#             user1, user2 = user2, user1

#         room = self.create(room_id=room_id, user1=user1, user2=user2)
#         return room, True


class ChatRoomManager(models.Manager):
    def create_room(self, user1, user2):
        """Create a chat room with consistent room_id generation"""
        # Sort users by their IDs to ensure consistent room_id generation
        # room_id = sorted([user1.id, user2.id])
        room_id = f"{min(user1.id, user2.id)}_{max(user1.id, user2.id)}"  # Ensure the room_id is consistent
        # room_id = f"{user_ids[0]}_{user_ids[1]}"  # Create room_id using user IDs

        logger.debug("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx")
        # logger.debug("room_id :", room_id)
        print("YYYYYYYYYYYXXXXXXXXXXXXXXXXXYYYYYYYYYYXXXXXXXXXXYYYYYYYY")
        print(room_id)

        # Check if room exists with either user order
        existing_room = self.filter(
            models.Q(room_id=room_id) | models.Q(user1=user1, user2=user2) | models.Q(user1=user2, user2=user1)
        ).first()

        if existing_room:
            return existing_room, False

        # Create a new chat room
        room = self.create(room_id=room_id, user1=user1, user2=user2)
        return room, True


class ChatRoom(models.Model):
    room_id = models.CharField(max_length=255, unique=True)
    user1 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_user1")
    user2 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_user2")
    created_at = models.DateTimeField(auto_now_add=True)
    last_message_at = models.DateTimeField(default=timezone.now)

    objects = ChatRoomManager()

    class Meta:
        indexes = [
            models.Index(fields=["room_id"]),
            models.Index(fields=["user1", "user2"]),
            models.Index(fields=["last_message_at"]),
        ]

    def __str__(self):
        return f"Chat between {self.user1.username} and {self.user2.username}"


class Message(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages")
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["room", "timestamp"]),
            models.Index(fields=["sender", "timestamp"]),
            models.Index(fields=["is_read"]),
        ]
        ordering = ["timestamp"]

    def save(self, *args, **kwargs):
        self.room.last_message_at = timezone.now()
        self.room.save(update_fields=["last_message_at"])
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Message from {self.sender.username} at {self.timestamp}"


@receiver(pre_save, sender=ChatRoom)
def ensure_room_id(sender, instance, **kwargs):
    """Ensure room_id is consistently generated before save"""
    if not instance.room_id:
        usernames = sorted([instance.user1.username, instance.user2.username])
        instance.room_id = f"{usernames[0]}_{usernames[1]}"


class BlockedUser(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blocked_users")
    blocked_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blocking_users")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "blocked_user")
        indexes = [
            models.Index(fields=["user", "blocked_user"]),
        ]

    def __str__(self):
        return f"{self.user.username} blocked {self.blocked_user.username}"


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"Notification for {self.user.username}: {self.message[:50]}"
