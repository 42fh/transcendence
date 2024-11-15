add .# Chat Notifications System Documentation

## Overview
The chat notifications system provides real-time notifications for users when they receive new messages. It uses Django signals to detect new messages and WebSockets to deliver notifications instantly to the appropriate users.

## Components

### 1. Notification Model
The system stores notifications in the database using the `Notification` model:

```python
class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
```

### 2. Signal Handler
When a new message is created, a Django signal handler creates a notification and sends it through WebSocket:

```python
@receiver(post_save, sender=Message)
def create_message_notification(sender, instance, created, kwargs):
    # Logic for creating a notification
```

### 3. WebSocket Integration
Notifications are delivered in real-time using the existing WebSocket connection in the chat system.

## Features
- Real-time notifications for new messages
- Persistent storage of notifications
- Mark notifications as read
- Automatic cleanup of old notifications
- Error handling and logging

## API Endpoints

### Get Unread Notifications

**GET /api/chat/notifications/**  
Returns a list of unread notifications for the authenticated user.

### Mark Notification as Read

**POST /api/chat/notifications/<notification_id>/read**  
Marks a specific notification as read.

## Frontend Integration

### Notification Display
Notifications appear as pop-up messages in the top-right corner of the screen:

```javascript
function showNotification(notification) {
    // Create notification element
    const notificationElement = document.createElement('div');
    notificationElement.className = 'notification';
    // Add notification content
    notificationElement.innerHTML = `<p>${notification.message}</p> <small>${new Date(notification.created_at).toLocaleTimeString()}</small>`;
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        notificationElement.remove();
    }, 5000);
}
```

## Setup and Configuration

### Enable Signals
Ensure signals are connected by adding this to your chat app's `apps.py`:

```python
class ChatConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chat'

    def ready(self):
        import chat.signals
```

## Error Handling
The system includes comprehensive error handling:
- Database connection errors
- WebSocket delivery failures
- Invalid notification data

Errors are logged using Django's logging system and can be monitored through standard logging channels.

## Best Practices

1. **Performance**
   - Notifications are created asynchronously
   - Old notifications are periodically cleaned up
   - WebSocket connections are reused from the chat system

2. **Security**
   - Notifications are user-specific
   - Authentication is required for all notification endpoints
   - SQL injection protection through Django's ORM

3. **Maintenance**
   - Regular cleanup of old notifications
   - Monitoring of WebSocket connections
   - Error logging for debugging

## Troubleshooting

### Common Issues

1. **Notifications not appearing**
   - Check WebSocket connection
   - Verify signal handler is registered
   - Check browser console for errors

2. **Database Errors**
   - Ensure migrations are applied
   - Check database connection settings
   - Verify user permissions

3. **Performance Issues**
   - Monitor notification count
   - Check WebSocket connection stability
   - Review database indexes

## Future Improvements

1. **Planned Features**
   - Notification preferences
   - Different notification types
   - Mobile push notifications
   - Notification grouping

2. **Technical Debt**
   - Notification cleanup automation
   - Performance optimization
   - Enhanced error reporting

## Related Documentation
- [Django Signals](https://docs.djangoproject.com/en/stable/topics/signals/)
- [WebSocket Implementation](./websockets.md)
- [Database Schema](./database.md)
