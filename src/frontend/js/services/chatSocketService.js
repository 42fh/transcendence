export function initializeChatWebSocket(wsUrl, otherUser, handlers) {
  // If there's an existing connection, close it properly first
  if (window.chatSocket) {
      window.chatSocket.close();
  }

  // Create new WebSocket connection
  window.chatSocket = new WebSocket(wsUrl);

  window.chatSocket.onopen = () => {
      // Clear existing messages
      const chatMessages = document.getElementById("chat-messages");
      if (chatMessages) {
          chatMessages.innerHTML = "";
      }
      
      // Use the passed handlers.addMessageToChat function
      if (typeof handlers.addMessageToChat === 'function') {
          handlers.addMessageToChat(
              "System",
              `Connected to chat with ${otherUser}`,
              "system"
          );
      }
      
      handlers.state.messageHistoryLoaded = false;
      handlers.state.isSwitchingRoom = false;
  };

  window.chatSocket.onmessage = (e) => {
      try {
          const data = JSON.parse(e.data);
          if (typeof handlers.handleWebSocketMessage === 'function') {
              handlers.handleWebSocketMessage(data);
          }
      } catch (error) {
          console.error('Error processing message:', error);
      }
  };

  window.chatSocket.onclose = () => {
      if (handlers.state.currentChatPartner === otherUser && !handlers.state.isSwitchingRoom) {
          if (typeof handlers.addMessageToChat === 'function') {
              handlers.addMessageToChat(
                  "System",
                  "Connection closed. Attempting to reconnect...",
                  "system"
              );
          }
          setTimeout(() => {
              if (typeof handlers.startChatWith === 'function') {
                  handlers.startChatWith(otherUser);
              }
          }, 3000);
      }
  };

  window.chatSocket.onerror = () => {
      handlers.state.isSwitchingRoom = false;
      if (typeof displayErrorMessageModalModal === 'function') {
          displayErrorMessageModalModal("Failed to connect to chat");
      }
  };
}