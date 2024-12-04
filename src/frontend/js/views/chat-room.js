import { initializeChatWebSocket } from "../services/chatSocketService.js";
import { displayModalError } from "../components/modal.js";

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
      addMessageToChat: (username, message, type) => {
        const template = document.getElementById("chat-message-template");
        const messageElement = document.importNode(template.content, true);

        const messageDiv = messageElement.querySelector(".chat-message");
        messageDiv.classList.add(`chat-message-${type}`);
        const usernameElement = messageDiv.querySelector(
          ".chat-message-username"
        );
        const textElement = messageDiv.querySelector(".chat-message-text");

        usernameElement.textContent = `${username}:`;
        textElement.textContent = message;

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      },
      handleWebSocketMessage: (data) => {
        console.log("Received WebSocket message:", data);
        if (data.type === "chat_message") {
          handlers.addMessageToChat(
            data.username,
            data.message,
            data.username === currentUser ? "self" : "other"
          );
        } else if (data.type === "message_history") {
          console.log("Processing history messages:", data.messages);
          data.messages.forEach((msg) => {
            console.log("Processing message:", msg);
            handlers.addMessageToChat(
              msg.username,
              msg.message,
              msg.username === currentUser ? "self" : "other"
            );
          });
          handlers.state.messageHistoryLoaded = true;
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

  sendButton.onclick = () => sendMessage(chatPartner);
  messageInput.onkeyup = (e) => {
    if (e.key === "Enter") sendMessage(chatPartner);
  };
}
