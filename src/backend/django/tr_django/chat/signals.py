from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Message, ChatNotification


@receiver(post_save, sender=Message)
def create_notification(sender, instance, created, **kwargs):
    """Create notification when a new message is created"""
    if created:  # Only create notification for new messages
        chat_room = instance.room
        recipient = chat_room.user2 if chat_room.user1 == instance.sender else chat_room.user1

        # Create the notification
        ChatNotification.objects.create(
            recipient=recipient,
            sender=instance.sender,
            message=instance.content[:50] + "..." if len(instance.content) > 50 else instance.content,
            chat_room=chat_room,
        )
