export function initializeChatWebSocket(wsUrl, otherUser, chatView) {
    window.chatSocket = new WebSocket(wsUrl);
  
    window.chatSocket.onopen = () => {
      document.getElementById("chat-messages").innerHTML = "";
      chatView.addMessageToChat(
        "System",
        `Connected to chat with ${otherUser}`,
        "system"
      );
      chatView.state.messageHistoryLoaded = false;
      chatView.state.isSwitchingRoom = false;
    };
  
    window.chatSocket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      chatView.handleWebSocketMessage(data);
    };
  
    window.chatSocket.onclose = () => {
      if (chatView.state.currentChatPartner === otherUser) {
        chatView.addMessageToChat(
          "System",
          "Connection closed. Attempting to reconnect...",
          "system"
        );
        setTimeout(() => chatView.startChatWith(otherUser), 3000);
      }
      chatView.state.isSwitchingRoom = false;
    };
  
    window.chatSocket.onerror = () => {
      displayErrorMessageModalModal("Failed to connect to chat");
      chatView.state.isSwitchingRoom = false;
    };
  }