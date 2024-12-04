export class GameWebSocket {
  constructor(gameId, playerId, onMessage, options = {}) {
    this.gameId = gameId;
    this.playerId = playerId;
    this.onMessage = onMessage;
    this.options = options;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    // Build query parameters
    const queryParams = new URLSearchParams({
      player: this.playerId,
      ...this.options,
    }).toString();

    // Not needed cause the Fetch API is used to get the WebSocket URL and the server is running on the same domain
    // const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
    // const host = window.location.host;
    // const url = `${wsScheme}://${host}/ws/pong/${this.gameId}/?${queryParams}`;
    const wsUrl = `/ws/pong/${this.gameId}/?${queryParams}`;

    console.log("Connection to WebSocket:", wsUrl);

    this.ws = new WebSocket(url);
    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;
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
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = 1000 * this.reconnectAttempts;
      console.log(`Attempting to reconnect in ${delay}ms...`);
      setTimeout(() => this.connect(), delay);
    }
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
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
