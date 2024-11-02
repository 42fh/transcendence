from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class ChatRoom(models.Model):
    room_id = models.CharField(max_length=255, unique=True)
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chat_user1")
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chat_user2")
    created_at = models.DateTimeField(auto_now_add=True)
    last_message_at = models.DateTimeField(default=timezone.now)

    class Meta:
        indexes = [
            models.Index(fields=["room_id"]),
            models.Index(fields=["user1", "user2"]),
            models.Index(fields=["last_message_at"]),
        ]

    def save(self, *args, **kwargs):
        # sorted usernames to avoid duplicate chat rooms with different names
        if not self.room_id:
            usernames = sorted([self.user1.username, self.user2.username])
            self.room_id = f"{usernames[0]}_{usernames[1]}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Chat between {self.user1.username} and {self.user2.username}"


class Message(models.Model):
    room = models.ForeignKey(
        ChatRoom, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_messages"
    )
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
