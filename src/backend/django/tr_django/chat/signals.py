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
    Signal handler to create a notification in the database
    whenever a new message is created in the database.
    """
    if created:
        try:
            # Determine the recipient of the message
            recipient = instance.room.user2 if instance.sender == instance.room.user1 else instance.room.user1

            # Create the notification
            notification = Notification.objects.create(
                user=recipient,
                type="message",
                content=instance.content[:50],
            )
            logger.info(f"Notification created: {notification.id} for user: {recipient.username}")
        except Exception as e:
            logger.error(f"Error creating notification: {str(e)}", exc_info=True)


@receiver(post_save, sender=Notification)
def send_notification_websocket(sender, instance, created, **kwargs):
    """
    Signal handler to send a notification via WebSocket
    whenever a new notification is created in the database.
    """
    if created:
        try:
            recipient = instance.user
            channel_layer = get_channel_layer()

            # Send the notification via WebSocket
            async_to_sync(channel_layer.group_send)(
                f"notifications_{recipient.username}",
                {
                    "type": "send_notification",
                    "notification": {
                        "id": instance.id,
                        "message": instance.message,
                        "created_at": instance.created_at.isoformat(),
                    },
                },
            )
            logger.info(f"Notification sent to WebSocket group: notifications_{recipient.username}")
        except Exception as e:
            logger.error(f"Error sending WebSocket notification: {str(e)}", exc_info=True)
