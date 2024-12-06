import { CONFIG } from "./config3d.js";

export default class GameWebSocket {
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
    const queryParams = new URLSearchParams({
      player: this.playerId,
      ...this.options,
    }).toString();
    const url = `${CONFIG.WS_BASE_URL}/pong/${this.gameId}/?${queryParams}`;
    console.log("Connecting to WebSocket:", url);
    this.ws = new WebSocket(url);
    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.onMessage(data);
    };

    this.ws.onclose = () => {
      console.log("WebSocket closed");
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  sendMessage(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
