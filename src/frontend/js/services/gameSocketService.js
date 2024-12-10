let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let heartbeatInterval = null;

/**
 * Creates a configuration object for WebSocket connection
 * @param {string} gameId - The unique identifier for the game
 * @param {string} playerId - The unique identifier for the player
 * @param {Function} onMessage - Callback function to handle incoming WebSocket messages
 * @param {Object} options - Additional options for the game
 * @typedef {Object} GameOptions
 * @property {string} type - Game type (e.g., 'classic')
 * @property {number} players - Number of players
 * @property {number} balls - Number of balls
 *
 * @returns {Object} WebSocket configuration object
 *
 * @todo Consider removing this function and creating the config object directly
 * since it's just returning a simple object without any additional logic
 */
export function createSocketConfig(gameId, playerId, onMessage, options = {}) {
  console.log("Creating socket config with:", { gameId, playerId, options });

  return {
    gameId,
    playerId,
    onMessage,
    options,
  };
}

export function connectGameSocket(wsConfig) {
  console.log("Connecting game socket - wsConfig:", wsConfig);

  // Validate required parameters
  if (!wsConfig.gameId || wsConfig.gameId === "undefined") {
    console.error("Invalid game ID. Connection aborted.");
    if (wsConfig.options.onReconnectFail) {
      wsConfig.options.onReconnectFail();
    }
    return;
  }

  if (!wsConfig.playerId) {
    console.error("Invalid player ID. Connection aborted.");
    if (wsConfig.options.onReconnectFail) {
      wsConfig.options.onReconnectFail();
    }
    return;
  }

  // Build query parameters
  const queryParams = new URLSearchParams({
    player: wsConfig.playerId,
    ...wsConfig.options,
  }).toString();

  const wsUrl = `/ws/pong/${wsConfig.gameId}/?${queryParams}`;
  console.log("Connection to WebSocket:", wsUrl);
  // This check prevents multiple connections
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
      wsConfig.onMessage(data);
    } catch (error) {
      console.error("Error processing message:", error);
    }
  };

  ws.onclose = () => {
    console.log("WebSocket closed");
    // handleGameSocketReconnect(wsConfig);
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
}

// NOTE: this is never used, cause we don't allow to the websocket to reconnect

function handleGameSocketReconnect(wsConfig) {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error("Max reconnection attempts reached");
    if (wsConfig.options.onReconnectFail) {
      wsConfig.options.onReconnectFail();
    }
    return;
  }

  reconnectAttempts++;
  const delay = 1000 * reconnectAttempts;
  console.log(`Attempting to reconnect in ${delay}ms...`);
  setTimeout(() => connectGameSocket(wsConfig), delay);
}

export function sendGameMessage(message) {
  if (ws?.readyState === WebSocket.OPEN) {
    try {
      console.log("Sending WebSocket message:", message);
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
