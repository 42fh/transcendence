_______________________________________________________________________________

⚠️
⚠️
⚠️
⚠️                     DOCUMENTATION NOT FULLY WRITTEN YET
⚠️
⚠️
⚠️
_______________________________________________________________________________



## Notification System Documentation

_______________________________________________________________________________

**TL;DR example:**
Cascading notification system:
1 - Add a message to the model (as instance) 
2 - This triggers a signal to add a notification.
3 - This trigger another signal to send a "new notification" via WebSocket.

_______________________________________________________________________________

### Overview
This Django app provides a notification system where users receive notifications. Currently only about new messages. It uses Django signals to trigger notifications when a new `Message` is created, and sends these notifications in real-time through a WebSocket.

### Core Components
1. **`Notification` Model**: Stores the notification data in the database.
2. **`create_message_notification` Signal Receiver**: A signal handler that listens for the creation of new `Message` instances and creates corresponding notifications.
3. **WebSocket Integration**: Sends real-time notifications via WebSockets to users using Django Channels.

### Notification Model

The `Notification` model is responsible for storing notification data related to a user. It includes:

- **`user`**: The user who will receive the notification.
- **`message`**: The content of the notification.
- **`created_at`**: Timestamp when the notification was created.
- **`is_read`**: Boolean flag to indicate whether the notification has been read.


### WebSocket Integration

Notifications are pushed to users in real-time through WebSockets. When a new notification is created, it is sent to the recipient's WebSocket.

**Group Send**: The notification is sent to the `notifications_{recipient.username}` group.
**WebSocket Message**: The message includes the notification ID, message content, and timestamp.

**WebSocket Group Sending:**
```python
channel_layer.group_send(
    f"notifications_{recipient.username}",
    {
        "type": "send_notification",
        "notification": {
            "id": notification.id,
            "message": notification.message,
            "created_at": notification.created_at.isoformat(),
        },
    }
)
```

### Example Signal: `create_message_notification`

The signal handler listens for the `post_save` signal on the `Message` model. When a new message is created, the handler creates a corresponding notification and sends it to the recipient via WebSocket.

- **Sender**: The `Message` model.
- **Recipient Determination**: The recipient of the notification is determined based on the room, i.e., if the sender is `user1`, the recipient is `user2`, and vice versa.
- **Notification Creation**: A new `Notification` instance is created for the recipient with a brief message about the new message.
- **WebSocket Notification**: The notification is sent to the recipient’s WebSocket group using Django Channels.


**the `post_save` signal on the `Message` model**
The `post_save` signal is sent after a `Model.save()` method is called for a particular model instance. This includes both when a new object is created **or** an existing object is updated.



### Integration Steps for Another Django App

If you want to integrate this notification system into another Django app, follow these steps:

   - Include the `Notification` model in the `models.py` of your app.
   ```python
   from notifications.models import Notification
    ```
   - Use the `Notification` model** as needed: create notifications, query them, etc.
   ```python
   notification = Notification.objects.create(
       user=some_user, 
       message="New message from user X"
   )
   ```
    
   - Define a similar `post_save` receiver for your model to handle notification creation.

   
4. **WebSocket Consumer**
   - You need to implement a WebSocket consumer that listens to the `notifications_{username}` group and handles receiving notifications.

   Example consumer:
   ```python
   from channels.generic.websocket import AsyncWebsocketConsumer
   import json

   class NotificationConsumer(AsyncWebsocketConsumer):
       async def connect(self):
           self.user = self.scope['user']
           self.group_name = f"notifications_{self.user.username}"
           await self.channel_layer.group_add(
               self.group_name,
               self.channel_name
           )
           await self.accept()

       async def disconnect(self, close_code):
           await self.channel_layer.group_discard(
               self.group_name,
               self.channel_name
           )

       async def receive(self, text_data):
           data = json.loads(text_data)
           notification = data['notification']
           await self.send(text_data=json.dumps({
               'type': 'notification',
               'notification': notification
           }))
   ```

5. **Configure WebSocket URLs**
   - Define WebSocket URL routing in your `routing.py`.

   Example:
   ```python
   from django.urls import re_path
   from .consumers import NotificationConsumer

   websocket_urlpatterns = [
       re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),
   ]
   ```

6. **Channel Layer Configuration**
   - Configure the channel layer to use Redis or another backend in `settings.py`.

   Example:
   ```python
   CHANNEL_LAYERS = {
       'default': {
           'BACKEND': 'channels_redis.core.RedisChannelLayer',
           'CONFIG': {
               "hosts": [('127.0.0.1', 6379)],
           },
       },
   }
   ```

### Extending the System

If you want to extend the notification system to support more types of notifications (e.g., friend requests, post likes, etc.), you can:

1. **Create New Models**: Add new models for different notification types, following a similar pattern.
2. **Create New Signal Handlers**: Add more `@receiver` functions to handle different signals (e.g., `post_save` for other models).
3. **Extend WebSocket Consumers**: Modify the WebSocket consumer to handle multiple types of notifications or to include richer data (e.g., links, images).

### Troubleshooting

- **No Notifications Sent**: Ensure Django Channels is correctly set up and running. Verify your Redis configuration for the channel layer.
- **Database Errors**: Check if the `Notification` model is properly migrated and the database is accessible.
- **WebSocket Errors**: Ensure that the WebSocket server is running and that connections are being established.

---

This documentation will help other developers integrate this notification system into their Django apps and understand how it works. It also provides clear steps for extending and customizing the functionality.