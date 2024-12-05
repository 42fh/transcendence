import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Message, Notification
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger("notifications")


@receiver(post_save, sender=Message)
def create_message_notification(sender, instance, created, **kwargs):
    """
    Signal handler to create a notification and send it via WebSocket
    whenever a new message is created in the database.
    """
    print(f"DEBUG: Signal triggered for Message ID: {instance.id}")
    if created:
        try:
            logger.debug(f"New message detected: {instance.id}, sender: {instance.sender}, room: {instance.room}")

            # Determine the recipient of the message
            recipient = instance.room.user2 if instance.sender == instance.room.user1 else instance.room.user1
            logger.debug(f"Recipient determined: {recipient.username}")

            # Create the notification
            notification = Notification.objects.create(
                user=recipient, message=f"New message from {instance.sender.username}: {instance.content[:50]}"
            )
            logger.info(f"Notification created: {notification.id} for user: {recipient.username}")

            # Send the notification via WebSocket
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
            logger.info(f"Notification sent to WebSocket group: notifications_{recipient.username}")
        except Exception as e:
            logger.error(f"Error creating notification or sending WebSocket message: {str(e)}", exc_info=True)
