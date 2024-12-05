export class GameWebSocket {
  constructor(gameId, playerId, onMessage, options = {}) {
    console.log("GameWebSocket constructor params:", {
      gameId,
      playerId,
      options,
    });

    this.gameId = gameId;
    this.playerId = playerId;
    this.onMessage = onMessage;
    this.options = options;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    console.log("GameWebSocket connecting with:", {
      gameId: this.gameId,
      playerId: this.playerId,
      options: this.options,
    });
    // Build query parameters
    // Validate required parameters
    if (!this.gameId || this.gameId === "undefined") {
      console.error("Invalid game ID. Connection aborted.");
      if (this.options.onReconnectFail) {
        this.options.onReconnectFail();
      }
      return;
    }

    if (!this.playerId) {
      console.error("Invalid player ID. Connection aborted.");
      if (this.options.onReconnectFail) {
        this.options.onReconnectFail();
      }
      return;
    }
    const queryParams = new URLSearchParams({
      player: this.playerId,
      ...this.options,
    }).toString();

    const wsUrl = `/ws/pong/${this.gameId}/?${queryParams}`;

    console.log("Connection to WebSocket:", wsUrl);

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      console.warn("WebSocket is already open or connecting");
      return;
    }

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;

      // Start a heartbeat mechanism
      this.heartbeatInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.sendMessage({ type: "heartbeat" });
        }
      }, 30000); // Send heartbeat every 30 seconds
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.onMessage(data);
      } catch (error) {
        console.error("Error processing message:", error);
      }
    };

    this.ws.onclose = () => {
      console.log("WebSocket closed");
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      if (this.options.onReconnectFail) {
        this.options.onReconnectFail();
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = 1000 * this.reconnectAttempts;
    console.log(`Attempting to reconnect in ${delay}ms...`);
    setTimeout(() => this.connect(), delay);
  }

  sendMessage(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error("Error sending WebSocket message:", error);
      }
    } else {
      console.warn("WebSocket is not open, message not sent");
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      clearInterval(this.heartbeatInterval);
    }
  }
}
