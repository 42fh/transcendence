# Websockets
WebSockets are a protocol that enables real-time bidirectional communication between a client (such as a web browser) and a server over a single, long-lived connection. They are commonly used for various purposes where real-time data exchange is required.

## Live-chat solution
1. Client subscribes to an event (global or personal chat)
2. Server stores connected clients and when an event occurs broadcasts a message to them

## How to test?

### 1. Create a virtual enviroment 
`python3 -m venv path/to/venv`

### 2. Activate the virtual enviroment
`source path/to/venv/bin/activate`

### 3. Install all the neccesary libraries
`pip install asyncio websockets`

### 4. Run server
`python3 server.py`

### 5. Create HTTP server because of CORS
`python3 -m http.server`

### 6. Open client.html in the browser and press ctrl+shift+I
`http://localhost:8000/client.html`

### 7. Press on Start WebSocket, join chat and send a message
`The chat should have a message displayed`

### 8. Open second tab in the browser, press on start WebSocket, join chat and send a message

### Congrats! Now you can chat with your tabs!

