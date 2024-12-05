import { initializeChatWebSocket } from "../services/chatSocketService.js";

export function loadChatRoom(chatPartner) {
  history.pushState(
    {
      view: "chat-room",
      chatPartner,
    },
    ""
  );

  const mainContent = document.getElementById("main-content");
  mainContent.innerHTML = "";

  const template = document.getElementById("chat-room-template");
  if (!template) {
    throw new Error("Chat Room template not found");
  }

  mainContent.appendChild(document.importNode(template.content, true));
  console.log("Chat room template loaded");

  initializeChatRoom(chatPartner);
}

function sendMessage(chatPartner) {
  const messageInput = document.getElementById("chat-message-input");
  const message = messageInput.value.trim();

  if (message === "") {
    return;
  }

  const currentUser = localStorage.getItem("username");
  const messageData = {
    type: "chat_message",
    username: currentUser,
    message: message,
    chatPartner: chatPartner,
  };

  chatSocket.send(JSON.stringify(messageData));

  messageInput.value = "";
}

function initializeChatRoom(chatPartner) {
  const currentUser = localStorage.getItem("pongUsername");
  console.log("pongUsername:", currentUser);
  console.log("Chat Partner:", chatPartner);

  const roomName = [currentUser, chatPartner].sort().join("_");
  console.log("Room Name:", roomName);

  const wsUrl = `/ws/chat/${roomName}/`;

  const chatMessages = document.getElementById("chat-messages");
  const messageInput = document.getElementById("chat-message-input");
  const sendButton = document.getElementById("chat-message-submit");

  try {
    const handlers = {
      addMessageToChat: (username, message, type, isSystemMessage = false) => {
        const template = document.getElementById("chat-message-template");
        const messageElement = document.importNode(template.content, true);

        const messageDiv = messageElement.querySelector(".chat-message");

        // Special styling for system messages
        if (isSystemMessage) {
          messageDiv.classList.add("chat-message-system");
          type = "system";
        }

        messageDiv.classList.add(`chat-message-${type}`);
        const usernameElement = messageDiv.querySelector(
          ".chat-message-username"
        );
        const textElement = messageDiv.querySelector(".chat-message-text");

        // Hide username for system messages
        if (isSystemMessage) {
          usernameElement.style.display = "none";
        } else {
          usernameElement.textContent = `${username}:`;
        }

        textElement.textContent = message;

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      },
      handleWebSocketMessage: (data) => {
        console.log("Received WebSocket message:", data);
        if (data.type === "chat_message") {
          const isSystemMessage = data.username === "system";

          handlers.addMessageToChat(
            data.username,
            data.message,
            data.username === currentUser ? "self" : "other",
            isSystemMessage
          );
        } else if (data.type === "message_history") {
          console.log("Processing history messages:", data.messages);
          data.messages.forEach((msg) => {
            const isSystemMessage = msg.username === "system";

            handlers.addMessageToChat(
              msg.username,
              msg.message,
              msg.username === currentUser ? "self" : "other",
              isSystemMessage
            );
          });
          handlers.state.messageHistoryLoaded = true;
        } else if (data.type === "send_notification") {
          // Debug: Log the received notification
          console.log("DEBUG: Notification received:", data.notification);

          // This ensures notifications come through as system messages
          handlers.addMessageToChat(
            "system",
            data.notification.message,
            "system",
            true
          );
        }
      },
      state: {
        currentChatPartner: chatPartner,
        messageHistoryLoaded: false,
        isSwitchingRoom: false,
      },
    };

    initializeChatWebSocket(wsUrl, chatPartner, handlers);
  } catch (error) {
    displayModalError(`Failed to connect to chat: ${error.message}`);
  }

  // Prevent system user from sending messages
  sendButton.onclick = () => {
    const messageInput = document.getElementById("chat-message-input");
    const message = messageInput.value.trim();

    if (message === "" || currentUser === "system") {
      return;
    }

    const messageData = {
      type: "chat_message",
      username: currentUser,
      message: message,
      chatPartner: chatPartner,
    };

    chatSocket.send(JSON.stringify(messageData));
    messageInput.value = "";
  };

  // Similar prevention for Enter key
  messageInput.onkeyup = (e) => {
    if (e.key === "Enter" && currentUser !== "system") {
      sendMessage(chatPartner);
    }
  };
}
