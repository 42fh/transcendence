import { displayModalError } from "../components/modal.js";
import { updateActiveNavItem } from "../components/bottom-nav.js";
import { fetchConversationList } from "../services/chatService.js";
import { fetchUsers } from "../services/usersService.js";
import { loadChatRoom } from "./chat-room.js";
import { ASSETS } from "../config/constants.js";
import {
  setupNotificationListener,
  addNotificationToContainer,
} from "./notificationHandler.js";

let conversationUsers = [];
let notificationSocket = null;

const LOCAL_STORAGE_KEYS = {
  USER_ID: "user_id",
};

export async function loadChatPage(addToHistory = true) {
  try {
    if (addToHistory) {
      history.pushState({ view: "chat-home" }, "");
      updateActiveNavItem("chat");
    }

    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = "";

    const template = document.getElementById("chat-home-template");
    if (!template) {
      throw new Error("Chat Home template not found");
    }

    const content = document.importNode(template.content, true);
    mainContent.appendChild(content);

    addNotificationToContainer("test");

    console.log("Whole Local Storage:", localStorage);

    const currentUser = localStorage.getItem("pongUsername");
    if (currentUser) {
      const wsUrlprev = `/ws/notifications/${currentUser}/`;
      const wsUrl =
        window.location.protocol === "https:"
          ? `wss://${window.location.host}/ws/notifications/${currentUser}/`
          : `ws://${window.location.host}/ws/notifications/${currentUser}/`;

      console.log("wsurl:", wsUrl);
      console.log("wsUrlprev:", wsUrlprev);

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

      // Set up new notification socket
      notificationSocket = setupNotificationListener(wsUrl);
    } else {
      console.error("No current user found for notifications");
    }

    await loadChatList(1, 10, "");

    // Load users list (Horizontal scroll), filtering out users in conversations with current user
    await loadUsersList(1, 10, "");
  } catch (error) {
    console.error("Error loading chat home:", error);
    displayModalError("Failed to load chat home");
  }
}

async function loadChatList(page = 1, perPage = 10, search = "") {
  try {
    const data = await fetchConversationList(page, perPage, search);
    if (!data || !data.users) throw new Error("Failed to fetch chat contacts");

    const usersList = document.getElementById("users-list");
    const paginationContainer = document.getElementById("users-pagination");

    usersList.innerHTML = "";

    // console.log("Printing conversation list before", conversationUsers);
    conversationUsers = data.users.filter(
      (user) =>
        user.username !== localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID)
    ); // Exclude the current user from the conversation list
    conversationUsers = conversationUsers.map((user) => user.username); // Only store usernames
    console.log(
      "Printing conversation list from loadChatList",
      conversationUsers
    );

    // Get the user list item template from HTML
    const userTemplate = document.getElementById("user-template");

    // Render chat contacts (Vertical List)
    data.users.forEach((user) => {
      // Clone the hidden user template and populate data
      const userItem = userTemplate.cloneNode(true);
      userItem.style.display = ""; // Make the template visible

      // Populate user data
      const avatarImg = userItem.querySelector(".users-list__avatar");
      avatarImg.src = user.avatarUrl || ASSETS.IMAGES.DEFAULT_AVATAR;
      avatarImg.onerror = function () {
        this.src = ASSETS.IMAGES.DEFAULT_AVATAR;
      };

      const username = userItem.querySelector(".users-list__username");
      username.textContent = user.username;

      const statusIndicator = userItem.querySelector(
        ".users-list__status-indicator"
      );
      // You can add online/offline status logic here if needed

      // Set up click event for the user item
      userItem.addEventListener("click", () => {
        loadChatRoom(user.username);
      });

      // Append user item to the vertical list
      usersList.appendChild(userItem);
    });

    // Update pagination
    const { total_pages = 1, page: currentPage = 1 } = data.pagination || {};
    renderPagination({ total_pages, page: currentPage }, paginationContainer);
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
      "users-horizontal-container"
    );

    usersHorizontalContainer.innerHTML = "";
    const userTemplate = document.getElementById("user-template");

    //TODO: Blocked users should also be filtered out
    data.users.forEach((user) => {
      // do not show users having a conversation with current user
      if (conversationUsers.includes(user.username)) {
        return;
      }

      // Clone the hidden user template and populate data
      const userItem = userTemplate.cloneNode(true);
      userItem.style.display = ""; // Make the template visible

      // Populate user data
      const avatarImg = userItem.querySelector(".users-list__avatar");
      avatarImg.src = user.avatarUrl || ASSETS.IMAGES.DEFAULT_AVATAR;
      avatarImg.onerror = function () {
        this.src = ASSETS.IMAGES.DEFAULT_AVATAR;
      };

      const username = userItem.querySelector(".users-list__username");
      username.textContent = user.username;

      const statusIndicator = userItem.querySelector(
        ".users-list__status-indicator"
      );
      // You can add online/offline status logic here if needed

      // Set up click event for the user item
      userItem.addEventListener("click", () => {
        loadChatRoom(user.username);
      });

      // Modify classes for horizontal display
      userItem.classList.add("chat-users-horizontal-item");
      avatarImg.classList.add("chat-users-horizontal-avatar");
      username.classList.add("chat-users-horizontal-username");

      // Append horizontal user item to the container
      usersHorizontalContainer.appendChild(userItem);
    });
  } catch (error) {
    console.error("Error loading users list:", error);
    displayModalError(`Failed to load users: ${error.message}`);
  }
}

function renderPagination(pagination, container) {
  const { total_pages, page } = pagination;

  const prevButton = container.querySelector(".pagination__button--prev");
  const nextButton = container.querySelector(".pagination__button--next");
  const currentPage = container.querySelector(".pagination__current");
  const totalPages = container.querySelector(".pagination__total");

  currentPage.textContent = page;
  totalPages.textContent = total_pages;

  prevButton.disabled = page <= 1;
  nextButton.disabled = page >= total_pages;

  prevButton.onclick = () => loadChatList(page - 1);
  nextButton.onclick = () => loadChatList(page + 1);

  container.style.display = total_pages <= 1 ? "none" : "flex";
}
