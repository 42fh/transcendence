export function loadChatPage(addToHistory = true) {
  try {
    // Check if user is logged in
    const username = localStorage.getItem("username");
    if (!username) {
      window.location.href = "/accounts/login/";
      return;
    }

    if (addToHistory) {
      history.pushState({ view: "chat" }, "");
    }

    // Get and clone the template
    const template = document.getElementById("chat-template");
    if (!template) throw new Error("Chat template not found");

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
    try {
      // Initialize username and user list
      await this.initializeUser();
      await this.loadUserList();
      this.initializeEventListeners();
    } catch (error) {
      this.showError(`Initialization error: ${error.message}`);
    }
  }

  initializeEventListeners() {
    const messageSubmit = document.getElementById("chat-message-submit");
    const messageInput = document.getElementById("chat-message-input");

    messageSubmit.onclick = () => this.sendMessage();
    messageInput.onkeyup = (e) => {
      if (e.key === "Enter") this.sendMessage();
    };
  }

  getCookie(name) {
    const cookies = document.cookie.split(";").map((cookie) => cookie.trim());
    const match = cookies.find((c) => c.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.split("=")[1]) : null;
  }

  showError(message) {
    const errorContainer = document.getElementById("error-container");
    errorContainer.innerHTML = `<div class="error-message">${message}</div>`;
    setTimeout(() => (errorContainer.innerHTML = ""), 5000);
  }

  async initializeUser() {
    const storedUsername = localStorage.getItem("username");
    if (!storedUsername) throw new Error("Not logged in");

    const response = await fetch("/api/chat/get_username/");
    if (!response.ok) throw new Error("Failed to get username");

    const { username, csrfToken } = await response.json();
    this.state.currentUsername = username;
    this.state.csrfToken = csrfToken;

    document.getElementById("current-username-display").textContent = username;
    document.getElementById("current-username").value = username;
  }

  async loadUserList() {
    const response = await fetch("/api/chat/get_user_list/");
    if (!response.ok) throw new Error("Failed to load user list");

    const data = await response.json();
    const usersList = document.getElementById("users-list");
    const userTemplate = document.getElementById("user-item-template");

    usersList.innerHTML = "";
    data.users.forEach((user) => {
      const userItem = document.importNode(userTemplate.content, true);
      const nameSpan = userItem.querySelector(".user-item");
      const blockButton = userItem.querySelector(".button-small");

      nameSpan.textContent = user.username;
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

      usersList.appendChild(userItem);
    });
  }

  async toggleBlockUser(username, isBlocked) {
    try {
      const endpoint = isBlocked
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

      if (!isBlocked && this.state.currentChatPartner === username) {
        this.endCurrentChat();
      }
    } catch (error) {
      this.showError(`Failed to toggle block status: ${error.message}`);
    }
  }

  startChatWith(otherUser) {
    if (this.state.isSwitchingRoom || this.state.currentChatPartner === otherUser) return;

    this.state.isSwitchingRoom = true;
    this.state.currentChatPartner = otherUser;

    const currentUser = this.state.currentUsername;
    const roomName = [currentUser, otherUser].sort().join("_");

    if (window.chatSocket) window.chatSocket.close();

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}:${this.WEBSOCKET_PORT}/ws/chat/${roomName}/`;

    this.initializeWebSocket(wsUrl, otherUser);
  }

  initializeWebSocket(wsUrl, otherUser) {
    window.chatSocket = new WebSocket(wsUrl);

    window.chatSocket.onopen = () => {
      document.getElementById("chat-messages").innerHTML = "";
      this.addMessageToChat("System", `Connected to chat with ${otherUser}`, "system");
      this.state.messageHistoryLoaded = false;
      this.state.isSwitchingRoom = false;
    };

    window.chatSocket.onmessage = (e) => this.handleWebSocketMessage(JSON.parse(e.data));
    window.chatSocket.onclose = () => this.endCurrentChat();
    window.chatSocket.onerror = () => this.showError("WebSocket connection error");
  }

  handleWebSocketMessage(data) {
    if (data.type === this.MESSAGE_TYPES.CHAT) {
      const type = data.username === this.state.currentUsername ? "self" : "other";
      this.addMessageToChat(data.username, data.message, type);
    } else if (data.type === this.MESSAGE_TYPES.HISTORY && !this.state.messageHistoryLoaded) {
      data.messages.forEach((msg) => {
        const type = msg.username === this.state.currentUsername ? "self" : "other";
        this.addMessageToChat(msg.username, msg.message, type);
      });
      this.state.messageHistoryLoaded = true;
    }
  }

  addMessageToChat(username, message, type = "other") {
    const chatBox = document.getElementById("chat-messages");
    const messageTemplate = document.getElementById("chat-message-template");

    const messageItem = document.importNode(messageTemplate.content, true);
    const messageText = messageItem.querySelector(".message");
    messageText.innerHTML = `<strong>${username}:</strong> ${message}`;
    messageText.classList.add(type);

    chatBox.appendChild(messageItem);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  sendMessage() {
    const input = document.getElementById("chat-message-input");
    const message = input.value.trim();

    if (message && window.chatSocket?.readyState === WebSocket.OPEN) {
      window.chatSocket.send(JSON.stringify({ message }));
      input.value = "";
    }
  }

  endCurrentChat() {
    this.state.currentChatPartner = "";
    this.state.isSwitchingRoom = false;
    if (window.chatSocket) window.chatSocket.close();
    document.getElementById("chat-messages").innerHTML = "";
  }
}
