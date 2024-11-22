import { CONFIG } from "/Utils/Config.js";

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
    // Build query parameters
    const queryParams = new URLSearchParams({
      player: this.playerId,
      ...this.options,
    }).toString();
    // ws://localhost:8000/ws/pong/1234/?player=12&gameId=1234&playerId=12&type=polygon&pongType=classic&players=2&balls=1&debug=false&sides=4&shape=undefined&scoreMode=classic
    const url = `${CONFIG.WS_BASE_URL}/pong/${this.gameId}/?${queryParams}`;
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
      // this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
    }
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
