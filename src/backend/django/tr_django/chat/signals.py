from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Message, Notification
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

# triggered  by the post_save signal of the Message model
@receiver(post_save, sender=Message)
def create_message_notification(sender, instance, created, **kwargs):
     """
    Signal handler to create a notification and send it via WebSocket
    whenever a new message is created in the database.
    """
    if created:  # new message instance was created
        # Create notification for message recipient
        recipient = instance.room.user2 if instance.sender == instance.room.user1 else instance.room.user1

        notification = Notification.objects.create(
            user=recipient, message=f"New message from {instance.sender.username}: {instance.content[:50]}"
        )

        # Send notification through WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"notifications_{recipient.username}",
            {
                "type": "send_notification",
                "notification": {
                    "id": notification.id,
                    "message": notification.message,
                    "created_at": notification.created_at.isoformat(),
                },
            },
        )
