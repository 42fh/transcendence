## Notification System Documentation

---

**TL;DR example:**
Cascading notification system:
1 - A message is added to a model (as instance)
2 - This triggers a signal to add a notification (as a DB entry in the model).
3 - This trigger another signal to send a "new notification" message via WebSocket.
4 - Notifications are fetched and displayed in front-end (chat page)

---

### Overview

This Django app provides a notification system where users receive notifications. Currently only about new messages. It uses Django signals to trigger notifications when a new `Message` is created, and sends these notifications in real-time through a WebSocket.

### Core Components

1. **`Notification` Model**: Stores the notification data in the database.
2. **`create_message_notification` Signal Receiver**: A signal handler that listens for the creation of new `Message` instances and creates corresponding notifications.
3. **`send_notification_websocket` Signal Receiver**: Sends real-time notifications via WebSockets to users using Django Channels.

### Notification Model

The `Notification` model is responsible for storing notification data related to a user. It includes:

- **`user`**: The user who will receive the notification.
- **`message`**: The content of the notification.
- **`created_at`**: Timestamp when the notification was created.
- **`is_read`**: Boolean flag to indicate whether the notification has been read.

### Integration Steps for Another Django App

TL;DR: create a signal handler that will add a notification to the model in the chat app, the rest is handled

If you want to integrate this notification system into another Django app, follow these steps:

- Include and use the `Notification` model in your app.

````python
from notifications.models import Notification

   notification = Notification.objects.create(
       user=some_user,
       message="You've been invited!"
   )
   ```

- Create a signal handler: Add a `@receiver` functions to handle different signals (e.g., `post_save`) in your existing models
Use the `Notification` model** as needed: create notifications, query them, etc.
```python
notification = Notification.objects.create(
    user=dev,
    message="You've been invited"
)
````

- When you create a `Notification` instance, the `post_save` signal defined in the `chat` app will automatically handle sending a WebSocket notification.
