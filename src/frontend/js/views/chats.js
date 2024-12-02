import { displayModalError } from "../components/modal.js";
import { fetchUserList, toggleBlockUser } from "../services/chatService.js";
import { initializeChatWebSocket } from "../services/chatSocketService.js";
import { LOCAL_STORAGE_KEYS } from "../config/constants.js";

const chatState = {
  currentUsername: "",
  currentChatPartner: "",
  messageHistoryLoaded: false,
  csrfToken: null,
  isSwitchingRoom: false,
  WEBSOCKET_PORT: "8000",
  MESSAGE_TYPES: {
    CHAT: "chat_message",
    HISTORY: "message_history",
    USER_LIST: "user_list",
  },
};

export function loadChatPage(addToHistory = true) {
  try {
    // Check if user is logged in
    const username = localStorage.getItem(LOCAL_STORAGE_KEYS.USERNAME);
    if (!username) {
      window.location.href = "/accounts/login/";
      return;
    }

    if (addToHistory) {
      history.pushState(
        {
          view: "chat",
        },
        ""
      );
      updateActiveNavItem("chat");
    }

    // Get and clone the template
    const template = document.getElementById("chat-template");
    if (!template) {
      throw new Error("Chat template not found");
    }

    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = "";
    mainContent.appendChild(document.importNode(template.content, true));

    // Initialize chat functionality
    initializeChat();
  } catch (error) {
    console.error("Error loading chat page:", error);
  }
}

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

function initializeEventListeners() {
  document.getElementById("chat-message-submit").onclick = () => sendMessage();
  document.getElementById("chat-message-input").onkeyup = (e) => {
    if (e.key === "Enter") sendMessage();
  };
}

async function initializeChat() {
  try {
    const storedUsername = localStorage.getItem("username");
    if (!storedUsername) {
      throw new Error("Not logged in");
    }

    chatState.currentUsername = storedUsername;

    const usernameDisplay = document.getElementById("current-username-display");
    const usernameInput = document.getElementById("current-username");

    if (usernameDisplay) {
      usernameDisplay.textContent = chatState.currentUsername;
    }

    if (usernameInput) {
      usernameInput.value = chatState.currentUsername;
    }

    initializeEventListeners();
    await loadUserList();
  } catch (error) {
    displayModalError(`Failed to initialize chat: ${error.message}`);
    // Redirect to login if not authenticated
    if (error.message === "Not logged in") {
      window.location.href = "/accounts/login/";
    }
  }
}

async function loadUserList() {
  try {
    const data = await fetchUserList();
    const usersList = document.getElementById("users-list");
    usersList.innerHTML = "";
    const template = document.getElementById("user-list-item-template");

    data.users.forEach((user) => {
      const userElement = document.importNode(template.content, true);
      const nameSpan = userElement.querySelector(".chat-conversation-item");
      const blockButton = userElement.querySelector(".chat-button-small");

      nameSpan.textContent = user.username;
      nameSpan.classList.toggle("has-chat", user.has_chat);

      if (!user.has_blocked_you) {
        nameSpan.onclick = () => startChatWith(user.username);
      } else {
        nameSpan.classList.add("blocked-by-user");
        nameSpan.title = "This user has blocked you";
      }

      blockButton.textContent = user.is_blocked ? "Unblock" : "Block";
      blockButton.onclick = async (e) => {
        e.stopPropagation();
        const wasBlocked = user.is_blocked;

        // Immediately update button text
        blockButton.textContent = wasBlocked ? "Block" : "Unblock";

        try {
          await toggleBlockUser(user.username, wasBlocked);
          user.is_blocked = !wasBlocked;
        } catch (error) {
          blockButton.textContent = wasBlocked ? "Unblock" : "Block";
          displayModalError(
            `Failed to ${wasBlocked ? "unblock" : "block"} user: ${
              error.message
            }`
          );
        }
      };

      usersList.appendChild(userElement);
    });
  } catch (error) {
    displayModalError(`Failed to load user list: ${error.message}`);
  }
}

async function toggleBlockUserAction(username, isCurrentlyBlocked) {
  try {
    const csrfToken = chatState.csrfToken || getCookie("csrftoken");
    await toggleBlockUser(username, isCurrentlyBlocked, csrfToken);
    await loadUserList();
    if (!isCurrentlyBlocked && chatState.currentChatPartner === username) {
      if (window.chatSocket) {
        window.chatSocket.close();
      }
      document.getElementById("chat-messages").innerHTML = "";
      chatState.currentChatPartner = "";
    }
  } catch (error) {
    displayModalError(`Failed to block/unblock user: ${error.message}`);
  }
}

function startChatWith(otherUser) {
  // Don't start a new chat if we're already chatting with this user
  if (chatState.currentChatPartner === otherUser) {
    return;
  }

  // If we're already switching rooms, don't allow another switch
  if (chatState.isSwitchingRoom) {
    return;
  }

  // Clear existing messages before switching
  const chatMessages = document.getElementById("chat-messages");
  if (chatMessages) {
    chatMessages.innerHTML = "";
  }

  // Set switching state and update current chat partner
  chatState.isSwitchingRoom = true;
  chatState.currentChatPartner = otherUser;
  chatState.messageHistoryLoaded = false;

  const currentUser = document.getElementById("current-username").value;
  if (!currentUser) {
    displayModalError("No username found");
    chatState.isSwitchingRoom = false;
    return;
  }

  const roomName = [currentUser, otherUser].sort().join("_");
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.hostname || "localhost";
  const wsUrl = `${wsProtocol}//${host}:${chatState.WEBSOCKET_PORT}/ws/chat/${roomName}/`;

  try {
    // Create handlers object with bound functions
    const handlers = {
      handleWebSocketMessage: handleWebSocketMessage.bind(this),
      addMessageToChat: addMessageToChat.bind(this),
      startChatWith: startChatWith.bind(this),
      state: chatState,
    };

    initializeChatWebSocket(wsUrl, otherUser, handlers);
  } catch (error) {
    displayModalError(`Failed to connect to chat: ${error.message}`);
    chatState.isSwitchingRoom = false;
  }
}

function handleWebSocketMessage(data) {
  if (data.type === chatState.MESSAGE_TYPES.CHAT) {
    const messageType =
      data.username === "System"
        ? "system"
        : data.username === chatState.currentUsername
        ? "self"
        : "other";
    addMessageToChat(data.username, data.message, messageType);
  } else if (
    data.type === chatState.MESSAGE_TYPES.HISTORY &&
    !chatState.messageHistoryLoaded
  ) {
    data.messages.forEach((msg) => {
      const messageType =
        msg.username === chatState.currentUsername ? "self" : "other";
      addMessageToChat(msg.username, msg.message, messageType);
    });
    chatState.messageHistoryLoaded = true;
  } else if (data.type === chatState.MESSAGE_TYPES.USER_LIST) {
    updateUserList(data.users);
  }
}

function addMessageToChat(username, message, type = "other") {
  const chatBox = document.getElementById("chat-messages");
  const template = document.getElementById("chat-message-template");

  if (!chatBox || !template) {
    console.error("Required chat elements not found");
    return;
  }

  const messageElement = document.importNode(template.content, true);
  const messageDiv = messageElement.querySelector(".chat-message");
  messageDiv.classList.add(`chat-message-${type}`);

  if (type === "system") {
    messageDiv.textContent = message;
  } else {
    const usernameElement = messageDiv.querySelector(".chat-message-username");
    const textElement = messageDiv.querySelector(".chat-message-text");

    if (usernameElement && textElement) {
      usernameElement.textContent = username + ":";
      textElement.textContent = message;
    }
  }

  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function updateUserList(users) {
  const userList = document.getElementById("users-list");
  const currentItems = Array.from(userList.children);

  users.forEach((username) => {
    const existingItem = currentItems.find(
      (item) => item.textContent === username
    );
    if (!existingItem) {
      const li = document.createElement("li");
      li.className = "chat-conversation-item";
      li.textContent = username;
      li.onclick = () => startChatWith(username);
      userList.appendChild(li);
    }
  });

  currentItems.forEach((item) => {
    if (!users.includes(item.textContent)) {
      item.remove();
    }
  });
}

function sendMessage() {
  const messageInput = document.getElementById("chat-message-input");
  const message = messageInput.value.trim();

  if (
    message &&
    window.chatSocket &&
    window.chatSocket.readyState === WebSocket.OPEN
  ) {
    try {
      window.chatSocket.send(JSON.stringify({ message }));
      messageInput.value = "";
    } catch (error) {
      displayModalError(`Failed to send message: ${error.message}`);
    }
  }
}
