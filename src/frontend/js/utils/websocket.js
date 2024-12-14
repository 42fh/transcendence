export let ws = null;

export default class GameWebSocket {
  constructor(onMessage) {
    this.onMessage = onMessage;
  }

  connect(url) {
    ws = new WebSocket(url);
    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.onMessage(data);
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  sendMessage(message) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  disconnect() {
    if (ws) {
      ws.close();
    }
  }
}
