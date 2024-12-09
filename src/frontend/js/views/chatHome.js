import { displayModalError } from "../components/modal.js";
import { updateActiveNavItem } from "../components/bottomNav.js";
import { fetchConversationList } from "../services/chatService.js";
import { fetchUsers } from "../services/usersService.js";
import { loadChatRoom } from "./chatRoom.js";
import { ASSETS } from "../config/constants.js";
import { setupNotificationListener } from "../utils/notifications.js";
import { showToast } from "../utils/toast.js";
import { renderNotifications } from "./chatNotification.js";
import { LOCAL_STORAGE_KEYS } from "../config/constants.js";

let conversationUsers = [];
let notificationSocket = null;

export async function loadChatPage(addToHistory = true) {
  try {
    if (addToHistory) {
      history.pushState({ view: "chat-home" }, "Chat Home");
      updateActiveNavItem("chat");
    }

    try {
      const chatHomeTemplate = document.querySelector("#chat-home-template");
      const chatHomeContent = chatHomeTemplate.content.cloneNode(true);
      document.getElementById("main-content").appendChild(chatHomeContent);
      await renderNotifications();
    } catch (error) {
      console.error("Error with renderNotifications");
    }

    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = "";

    const template = document.getElementById("chat-home-template");
    if (!template) {
      throw new Error("Chat Home template not found");
    }

    const content = document.importNode(template.content, true);
    mainContent.appendChild(content);

    const currentUser = LOCAL_STORAGE_KEYS.USERNAME;
    if (currentUser) {
      const wsUrl = `/ws/notifications/${currentUser}/`;

      if (notificationSocket) {
        try {
          notificationSocket.close();
        } catch (closeError) {
          console.warn(
            "Error closing existing notification socket:",
            closeError
          );
        }
      }

      notificationSocket = setupNotificationListener(wsUrl);
    } else {
      console.error("No current user found for notifications");
    }
    await loadChatList(1, 10, "");

    // Load users list (Horizontal scroll), filtering out users in conversations with current user
    await loadUsersList(1, 10, "");

    const markAllReadButton = document.getElementById(
      "notification-mark-all-read"
    );
    if (markAllReadButton) {
      markAllReadButton.addEventListener("click", markAllNotificationsRead);
    }
  } catch (error) {
    console.error("Error loading chat home:", error);
    displayModalError("Failed to load chat home");
  }
}

async function loadChatList(page = 1, perPage = 10, search = "") {
  try {
    const data = await fetchConversationList(page, perPage, search);
    if (!data || !data.users) throw new Error("Failed to fetch chat contacts");

    const usersList = document.getElementById("chat-conversations-list");

    usersList.innerHTML = "";

    conversationUsers = data.users.filter(
      (user) =>
        user.username !== localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID)
    );
    conversationUsers = conversationUsers.map((user) => user.username);
    // console.log(
    //   "Printing conversation list from loadChatList",
    //   conversationUsers
    // );

    const chatHomeTemplate = document.getElementById("chat-home-template");
    const userTemplate = chatHomeTemplate.content.getElementById(
      "chat-conversations-list-item"
    );

    data.users.forEach((user) => {
      if (!userTemplate) {
        console.error("User template not found");
        return;
      }

      const userItem = userTemplate.cloneNode(true);
      userItem.style.display = "";

      const avatarImg = userItem.querySelector(
        ".chat-conversations-list__avatar"
      );
      // const avatarImg = document.getElementById("chat-avatar");
      avatarImg.src = user.avatarUrl || ASSETS.IMAGES.DEFAULT_AVATAR;
      avatarImg.onerror = function () {
        this.src = ASSETS.IMAGES.DEFAULT_AVATAR;
      };

      const username = userItem.querySelector(
        ".chat-conversations-list__username"
      );
      username.textContent = user.username;

      userItem.addEventListener("click", () => {
        loadChatRoom(user.username);
      });

      usersList.appendChild(userItem);
    });
  } catch (error) {
    console.error("Error loading chat list:", error);
    displayModalError(`Failed to load chat contacts: ${error.message}`);
  }
}

async function loadUsersList(page = 1, perPage = 10, search = "") {
  try {
    const data = await fetchUsers(page, perPage, search);
    if (!data || !data.users) throw new Error("Failed to fetch users");

    const usersHorizontalContainer = document.getElementById(
      "chat-users-horizontal-container"
    );

    usersHorizontalContainer.innerHTML = "";

    const chatHomeTemplate = document.querySelector("#chat-home-template");
    const userTemplate = chatHomeTemplate.content.querySelector(
      ".chat-users-horizontal-item"
    );

    data.users.forEach((user) => {
      if (!userTemplate) {
        console.error("User template not found");
        return;
      }

      // Do not show users already in conversations with the current user
      if (conversationUsers.includes(user.username)) {
        return;
      }

      const userItem = userTemplate.cloneNode(true);
      userItem.style.display = "";

      // Populate user data
      const avatarImg = userItem.querySelector(".chat-users-list__avatar");
      avatarImg.src = user.avatarUrl || ASSETS.IMAGES.DEFAULT_AVATAR;
      avatarImg.onerror = function () {
        this.src = ASSETS.IMAGES.DEFAULT_AVATAR;
      };

      const username = userItem.querySelector(".chat-users-list__username");
      username.textContent =
        user.username.length > 4
          ? user.username.substring(0, 3) + "..."
          : user.username;

      userItem.addEventListener("click", () => {
        loadChatRoom(user.username);
      });

      usersHorizontalContainer.appendChild(userItem);
    });
  } catch (error) {
    console.error("Error loading users list:", error);
    displayModalError(`Failed to load users: ${error.message}`);
  }
}

async function markAllNotificationsRead() {
  try {
    console.log("presed markAllNotificationsRead");
    const response = await fetch("/api/chat/notifications/", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ is_read: true }),
    });

    const data = await response.json();
    if (data.status === "success") {
      showToast("All notifications marked as read", false);
      await renderNotifications();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    showToast("Failed to mark notifications as read", true);
  }
}
