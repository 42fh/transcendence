import { initializeChatWebSocket } from "../services/chatSocketService.js";
import { loadChatPage } from "./chatHome.js";
import { LOCAL_STORAGE_KEYS, ASSETS, CHAT_WS_MSG_TYPE } from "../config/constants.js";

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
    type: CHAT_WS_MSG_TYPE.MESSAGE,
    username: currentUser,
    message: message,
    chatPartner: chatPartner,
  };

  chatSocket.send(JSON.stringify(messageData));

  messageInput.value = "";
}

function initializeChatRoom(chatPartner) {
  const currentUser = LOCAL_STORAGE_KEYS.USERNAME;

  const partnerAvatar = document.getElementById("chat-room-partner-avatar");
  const partnerUsername = document.getElementById("chat-room-partner-username");
  const backButton = document.querySelector(".chat-room-header__back-btn");

  partnerUsername.textContent = chatPartner;

  // TODO: FETCH ACTUAL AVATAR
  partnerAvatar.src = `${ASSETS.IMAGES.DEFAULT_AVATAR}`;
  partnerAvatar.onerror = function () {
    this.src = ASSETS.IMAGES.DEFAULT_AVATAR;
  };

  backButton.addEventListener("click", () => {
    history.pushState({ view: "chat-home" }, ""); // Add chat-home to history
    loadChatPage(false); // Navigate to chat-home
  });
  

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
        const textElement = messageDiv.querySelector(".chat-message-text");

        // Assign message text
        textElement.textContent = message;

        // Apply classes based on message type
        if (username === currentUser) {
          messageDiv.classList.add("chat-message-self");
        } else {
          messageDiv.classList.add("chat-message-other");
        }

        // Append to chat messages container
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      },
      handleWebSocketMessage: (data) => {
        // console.log("Received WebSocket message:", data);
        if (data.type === CHAT_WS_MSG_TYPE.MESSAGE) {
          const isSystemMessage = data.username === CHAT_WS_MSG_TYPE.SYSTEM;

          handlers.addMessageToChat(
            data.username,
            data.message,
            data.username === currentUser ? "self" : CHAT_WS_MSG_TYPE.SYSTEM,
            isSystemMessage
          );
        } else if (data.type === "message_history") {
          console.log("Processing history messages:", data.messages);
          data.messages.forEach((msg) => {
            const isSystemMessage = msg.username === CHAT_WS_MSG_TYPE.SYSTEM;

            handlers.addMessageToChat(
              msg.username,
              msg.message,
              msg.username === currentUser ? "self" : CHAT_WS_MSG_TYPE.SYSTEM,
              isSystemMessage
            );
          });
          handlers.state.messageHistoryLoaded = true;
        } else if (data.type === "send_notification") {
          // Debug: Log the received notification
          console.log("DEBUG: Notification received:", data.notification);

          // This ensures notifications come through as system messages
          handlers.addMessageToChat(
            CHAT_WS_MSG_TYPE.SYSTEM,
            data.notification.message,
            CHAT_WS_MSG_TYPE.SYSTEM,
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
    if (messageInput.value.trim() === "" || currentUser === CHAT_WS_MSG_TYPE.SYSTEM) {
      return;
    }

    sendMessage(chatPartner);
  };

  // Similar prevention for Enter key
  messageInput.onkeyup = (e) => {
    if (e.key === "Enter" && currentUser !== CHAT_WS_MSG_TYPE.SYSTEM) {
      sendMessage(chatPartner);
    }
  };
}
