import { displayErrorMessageModalModal } from "../utils/modals.js";
import { fetchUserList, toggleBlockUser } from "../services/chatService.js";

export function loadChatPage(addToHistory = true) {
  try {
    // Check if user is logged in
    const username = localStorage.getItem("username");
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
    const chatView = new ChatView();
    chatView.init();
  } catch (error) {
    console.error("Error loading chat page:", error);
  }
}

export class ChatView {
  constructor() {
    // State management
    this.state = {
      currentUsername: "",
      currentChatPartner: "",
      messageHistoryLoaded: false,
      csrfToken: null,
      isSwitchingRoom: false,
    };

    // Constants
    this.WEBSOCKET_PORT = "8000";
    this.MESSAGE_TYPES = {
      CHAT: "chat_message",
      HISTORY: "message_history",
      USER_LIST: "user_list",
    };
  }

  async init() {
    // Initialize event listeners
    this.initializeEventListeners();
    await this.initializeChat();
  }

  initializeEventListeners() {
    document.getElementById("chat-message-submit").onclick = () =>
      this.sendMessage();
    document.getElementById("chat-message-input").onkeyup = (e) => {
      if (e.key === "Enter") this.sendMessage();
    };
  }

  getCookie(name) {
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

  async initializeChat() {
    try {
      const storedUsername = localStorage.getItem("username");
      if (!storedUsername) {
        throw new Error("Not logged in");
      }
  
      this.state.currentUsername = storedUsername;
  
      const usernameDisplay = document.getElementById("current-username-display");
      const usernameInput = document.getElementById("current-username");
  
      if (usernameDisplay) {
        usernameDisplay.textContent = this.state.currentUsername;
      }
  
      if (usernameInput) {
        usernameInput.value = this.state.currentUsername;
      }
  
      await this.loadUserList();
    } catch (error) {
      displayErrorMessageModalModal(`Failed to initialize chat: ${error.message}`);
      // Redirect to login if not authenticated
      if (error.message === "Not logged in") {
        window.location.href = "/accounts/login/";
      }
    }
  }

  
  async loadUserList() {
    try {
      const data = await fetchUserList();
      const usersList = document.getElementById("users-list");
      usersList.innerHTML = "";
      const template = document.getElementById("user-list-item-template");

      data.users.forEach((user) => {
        const userElement = document.importNode(template.content, true);
        const nameSpan = userElement.querySelector(".chat-user-item");
        const blockButton = userElement.querySelector(".chat-button-small");

        nameSpan.textContent = user.username;
        nameSpan.classList.toggle("has-chat", user.has_chat);

        if (!user.has_blocked_you) {
          nameSpan.onclick = () => this.startChatWith(user.username);
        } else {
          nameSpan.classList.add("blocked-by-user");
          nameSpan.title = "This user has blocked you";
        }

        blockButton.textContent = user.is_blocked ? "Unblock" : "Block";
        blockButton.onclick = async (e) => {
          e.stopPropagation();
          await this.toggleBlockUser(user.username, user.is_blocked);
        };

        usersList.appendChild(userElement);
      });
    } catch (error) {
      displayErrorMessageModalModal(`Failed to load user list: ${error.message}`);
    }
  }
  


  async toggleBlockUser(username, isCurrentlyBlocked) {
    try {
      const csrfToken = this.state.csrfToken || this.getCookie("csrftoken");
      await toggleBlockUser(username, isCurrentlyBlocked, csrfToken);
      await this.loadUserList();
      if (!isCurrentlyBlocked && this.state.currentChatPartner === username) {
        if (window.chatSocket) {
          window.chatSocket.close();
        }
        document.getElementById("chat-messages").innerHTML = "";
        this.state.currentChatPartner = "";
      }
    } catch (error) {
      displayErrorMessageModalModal(`Failed to block/unblock user: ${error.message}`);
    }
  }

  startChatWith(otherUser) {
    if (
      this.state.currentChatPartner === otherUser ||
      this.state.isSwitchingRoom
    ) {
      return;
    }

    this.state.isSwitchingRoom = true;
    this.state.currentChatPartner = otherUser;
    const currentUser = document.getElementById("current-username").value;
    if (!currentUser) {
      displayErrorMessageModalModal("No username found");
      this.state.isSwitchingRoom = false;
      return;
    }

    const roomName = [currentUser, otherUser].sort().join("_");

    if (window.chatSocket && window.chatSocket.readyState === WebSocket.OPEN) {
      this.state.currentChatPartner = "";
      window.chatSocket.close(1000, "Switching rooms");
    }

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname || "localhost";
    const wsUrl = `${wsProtocol}//${host}:${this.WEBSOCKET_PORT}/ws/chat/${roomName}/`;

    try {
      this.initializeWebSocket(wsUrl, otherUser);
    } catch (error) {
      displayErrorMessageModalModal(`Failed to connect to chat: ${error.message}`);
      this.state.isSwitchingRoom = false;
    }
  }

  initializeWebSocket(wsUrl, otherUser) {
    window.chatSocket = new WebSocket(wsUrl);

    window.chatSocket.onopen = () => {
      document.getElementById("chat-messages").innerHTML = "";
      this.addMessageToChat(
        "System",
        `Connected to chat with ${otherUser}`,
        "system"
      );
      this.state.messageHistoryLoaded = false;
      this.state.isSwitchingRoom = false;
    };

    window.chatSocket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      this.handleWebSocketMessage(data);
    };

    window.chatSocket.onclose = () => {
      if (this.state.currentChatPartner === otherUser) {
        this.addMessageToChat(
          "System",
          "Connection closed. Attempting to reconnect...",
          "system"
        );
        setTimeout(() => this.startChatWith(otherUser), 3000);
      }
      this.state.isSwitchingRoom = false;
    };

    window.chatSocket.onerror = () => {
      displayErrorMessageModalModal("Failed to connect to chat");
      this.state.isSwitchingRoom = false;
    };
  }

  handleWebSocketMessage(data) {
    if (data.type === this.MESSAGE_TYPES.CHAT) {
      const messageType =
        data.username === "System"
          ? "system"
          : data.username === this.state.currentUsername
          ? "self"
          : "other";
      this.addMessageToChat(data.username, data.message, messageType);
    } else if (
      data.type === this.MESSAGE_TYPES.HISTORY &&
      !this.state.messageHistoryLoaded
    ) {
      data.messages.forEach((msg) => {
        const messageType =
          msg.username === this.state.currentUsername ? "self" : "other";
        this.addMessageToChat(msg.username, msg.message, messageType);
      });
      this.state.messageHistoryLoaded = true;
    } else if (data.type === this.MESSAGE_TYPES.USER_LIST) {
      this.updateUserList(data.users);
    }
  }

  addMessageToChat(username, message, type = "other") {
    const chatBox = document.getElementById("chat-messages");
    const template = document.getElementById("chat-message-template");
    const messageElement = document.importNode(template.content, true);
    
    const messageDiv = messageElement.querySelector(".chat-message");
    messageDiv.classList.add(`chat-message-${type}`);
  
    if (type === "system") {
      messageDiv.textContent = message;
    } else {
      messageDiv.querySelector(".chat-message-username").textContent = username + ":";
      messageDiv.querySelector(".chat-message-text").textContent = message;
    }
  
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}
  

  updateUserList(users) {
    const userList = document.getElementById("users-list");
    const currentItems = Array.from(userList.children);

    users.forEach((username) => {
      const existingItem = currentItems.find(
        (item) => item.textContent === username
      );
      if (!existingItem) {
        const li = document.createElement("li");
        li.className = "chat-user-item";
        li.textContent = username;
        li.onclick = () => this.startChatWith(username);
        userList.appendChild(li);
      }
    });

    currentItems.forEach((item) => {
      if (!users.includes(item.textContent)) {
        item.remove();
      }
    });
  }

  sendMessage() {
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
        displayErrorMessageModalModal(`Failed to send message: ${error.message}`);
      }
    }
  }
}
