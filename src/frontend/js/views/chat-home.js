import { displayModalError } from "../components/modal.js";
import { updateActiveNavItem } from "../components/bottom-nav.js";
import { fetchUserList } from "../services/chatService.js";
import { loadChatRoom } from "./chat-room.js";
import { ASSETS } from "../config/constants.js";

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

    await loadChatList(1, 10, "");
  } catch (error) {
    console.error("Error loading chat home:", error);
    displayModalError("Failed to load chat home");
  }
}

async function loadChatList(page = 1, perPage = 10, search = "") {
  try {
    const data = await fetchUserList(page, perPage, search);
    if (!data) throw new Error("Failed to fetch chat contacts");

    const usersList = document.getElementById("users-list");
    const paginationContainer = document.getElementById("users-pagination");
    const userListItemTemplate = document.getElementById("users-list-item-template");

    usersList.innerHTML = "";

    // Render chat contacts
    data.users.forEach((user) => {
      const userItem = document.importNode(userListItemTemplate.content, true);
      const userElement = userItem.firstElementChild;

      const avatarImg = userElement.querySelector(".users-list__avatar");
      avatarImg.src = user.avatarUrl || ASSETS.IMAGES.DEFAULT_AVATAR;
      avatarImg.onerror = function () {
        this.src = ASSETS.IMAGES.DEFAULT_AVATAR;
      };

      const username = userElement.querySelector(".users-list__username");
      username.textContent = user.username;

      const statusIndicator = userElement.querySelector(".users-list__status-indicator");
      // Add online/offline status logic if needed

      userElement.addEventListener("click", () => {
        loadChatRoom(user.username);
      });

      usersList.appendChild(userItem);
    });

    // Update pagination
    renderPagination(data.pagination, paginationContainer);
  } catch (error) {
    console.error("Error loading chat list:", error);
    displayModalError(`Failed to load chat contacts: ${error.message}`);
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