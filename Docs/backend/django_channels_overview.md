# Django Channels Overview

**Django Channels** extends Django to handle WebSockets, long-running connections, and asynchronous protocols, enabling real-time features in Django applications.

**Daphne** 
We use Daphne as the ASGI server to handle both HTTP and WebSocket connections. It acts as the interface between the Django app and the client, managing the lifecycle of WebSocket connections and routing requests to the appropriate handlers.



### Key Features:
We need it in transcendance fo **WebSocket Support**: bi-directional, real-time communication (useful for the chat and game itself)

### Architecture:
- **Consumers**: Similar to Django views, but handle specific connection types (e.g., WebSocket consumer).
- **Channels**: Messaging system between consumers and workers for task delegation.
- **Layers**: Interface between consumers and the underlying messaging system (e.g., Redis).


### Consumers:
A **consumer** in Django Channels is similar to a Django view but is designed to handle specific types of connections like WebSockets. Essentially group-based WebSocket communication where multiple clients can connect, send, and receive messages.
Our `GameConsumer` class inherits from `AsyncWebsocketConsumer` that provides the foundational WebSocket handling logic such as `accept()`, `send()`, and group management methods like `group_add()` and `group_send()`.

- **`connect(self)`**: When a WebSocket connection is opened, this method is called. 
- **`disconnect(self, close_code)`**: This method is called when the WebSocket disconnects.
- **`receive(self, text_data)`**: When a message is received via WebSocket, this method is triggered.
- **`game_message(self, event)`**: This method handles messages sent to the group. It receives the event (containing the message) and sends it back to the WebSocket in JSON format.


### Layers:
For initial development we will avoid relying on Reddis and use In-Memory Channel Layer:

```python
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer"
    }
}
```
> **Quote from [Django Channels Documentation relative to layers](https://channels.readthedocs.io/en/stable/topics/channel_layers.html).**
> 
> **Do Not Use In Production**
> 
> In-memory channel layers operate with each process as a separate layer. This means that no cross-process messaging is possible. As the core value of channel layers is to provide distributed messaging, in-memory usage will result in sub-optimal performance, and ultimately data-loss in a multi-instance environment.



For more, check the official [Django Channels Documentation](https://channels.readthedocs.io/).


