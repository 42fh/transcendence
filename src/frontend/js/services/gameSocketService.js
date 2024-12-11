let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let heartbeatInterval = null;

export function createGameSocket(gameId, playerId, onMessage, options = {}) {
  console.log("Creating game socket with:", { gameId, playerId, options });
  
  return {
    gameId,
    playerId,
    onMessage,
    options
  };
}

export function connectGameSocket(socket) {
  console.log("Connecting game socket:", {
    gameId: socket.gameId,
    playerId: socket.playerId,
    options: socket.options,
  });

  // Validate required parameters
  if (!socket.gameId || socket.gameId === "undefined") {
    console.error("Invalid game ID. Connection aborted.");
    if (socket.options.onReconnectFail) {
      socket.options.onReconnectFail();
    }
    return;
  }

  if (!socket.playerId) {
    console.error("Invalid player ID. Connection aborted.");
    if (socket.options.onReconnectFail) {
      socket.options.onReconnectFail();
    }
    return;
  }

  // Build query parameters
  const queryParams = new URLSearchParams({
    player: socket.playerId,
    ...socket.options,
  }).toString();

  const wsUrl = `/ws/pong/${socket.gameId}/?${queryParams}`;
  console.log("Connection to WebSocket:", wsUrl);

  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    console.warn("WebSocket is already open or connecting");
    return;
  }

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log("WebSocket connected");
    reconnectAttempts = 0;

    // Start heartbeat
    heartbeatInterval = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        sendGameMessage({ type: "heartbeat" });
      }
    }, 30000);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      socket.onMessage(data);
    } catch (error) {
      console.error("Error processing message:", error);
    }
  };

  ws.onclose = () => {
    console.log("WebSocket closed");
    handleGameSocketReconnect(socket);
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
}

function handleGameSocketReconnect(socket) {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error("Max reconnection attempts reached");
    if (socket.options.onReconnectFail) {
      socket.options.onReconnectFail();
    }
    return;
  }

  reconnectAttempts++;
  const delay = 1000 * reconnectAttempts;
  console.log(`Attempting to reconnect in ${delay}ms...`);
  setTimeout(() => connectGameSocket(socket), delay);
}

export function sendGameMessage(message) {
  if (ws?.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error("Error sending WebSocket message:", error);
    }
  } else {
    console.warn("WebSocket is not open, message not sent");
  }
}

export function disconnectGameSocket() {
  if (ws) {
    ws.close();
    ws = null;
    clearInterval(heartbeatInterval);
  }
}