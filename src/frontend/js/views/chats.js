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

  showError(message) {
    const errorContainer = document.getElementById("error-container");
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    errorContainer.innerHTML = "";
    errorContainer.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  }

  async initializeChat() {
    try {
      // First check if we have a stored username
      const storedUsername = localStorage.getItem("username");
      if (!storedUsername) {
        throw new Error("Not logged in");
      }

      const response = await fetch("/api/chat/get_username/");
      if (response.status === 401 || response.status === 403) {
        throw new Error("Not authenticated");
      }
      if (!response.ok) throw new Error("Failed to get username");

      const data = await response.json();
      this.state.currentUsername = data.username;
      this.state.csrfToken = data.csrfToken;

      // Update username display
      const usernameDisplay = document.getElementById(
        "current-username-display"
      );
      const usernameInput = document.getElementById("current-username");

      if (usernameDisplay) {
        usernameDisplay.textContent = this.state.currentUsername;
      }

      if (usernameInput) {
        usernameInput.value = this.state.currentUsername;
      }

      await this.loadUserList();
    } catch (error) {
      this.showError(`Failed to initialize chat: ${error.message}`);
      // Redirect to login if not authenticated
      if (
        error.message === "Not authenticated" ||
        error.message === "Not logged in"
      ) {
        window.location.href = "/accounts/login/";
      }
    }
  }

  async loadUserList() {
    try {
      const response = await fetch("/api/chat/get_user_list/");
      if (!response.ok) throw new Error("Failed to get user list");
      const data = await response.json();

      const usersList = document.getElementById("users-list");
      usersList.innerHTML = "";

      data.users.forEach((user) => {
        const li = document.createElement("li");
        const userDiv = document.createElement("div");
        userDiv.className = "user-item-container";

        const nameSpan = document.createElement("span");
        nameSpan.className = "user-item" + (user.has_chat ? " has-chat" : "");
        nameSpan.textContent = user.username;

        if (!user.has_blocked_you) {
          nameSpan.onclick = () => this.startChatWith(user.username);
        }

        const blockButton = document.createElement("button");
        blockButton.className = "button-small";
        blockButton.textContent = user.is_blocked ? "Unblock" : "Block";
        blockButton.onclick = async (e) => {
          e.stopPropagation();
          await this.toggleBlockUser(user.username, user.is_blocked);
        };

        if (user.has_blocked_you) {
          nameSpan.className += " blocked-by-user";
          nameSpan.title = "This user has blocked you";
        }

        userDiv.appendChild(nameSpan);
        userDiv.appendChild(blockButton);
        li.appendChild(userDiv);
        usersList.appendChild(li);
      });
    } catch (error) {
      this.showError(`Failed to load user list: ${error.message}`);
    }
  }

  async toggleBlockUser(username, isCurrentlyBlocked) {
    try {
      const endpoint = isCurrentlyBlocked
        ? "/api/chat/unblock_user/"
        : "/api/chat/block_user/";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": this.state.csrfToken || this.getCookie("csrftoken"),
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) throw new Error("Failed to toggle block status");

      await this.loadUserList();
      if (!isCurrentlyBlocked && this.state.currentChatPartner === username) {
        if (window.chatSocket) {
          window.chatSocket.close();
        }
        document.getElementById("chat-messages").innerHTML = "";
        this.state.currentChatPartner = "";
      }
    } catch (error) {
      this.showError(`Failed to toggle block status: ${error.message}`);
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
      this.showError("Current user not found");
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
      this.showError(`Failed to create connection: ${error.message}`);
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
      this.showError("WebSocket connection error");
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
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML =
      type === "system" ? message : `<strong>${username}:</strong> ${message}`;
    chatBox.appendChild(messageDiv);
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
        li.className = "user-item";
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
        this.showError(`Failed to send message: ${error.message}`);
      }
    }
  }
}
