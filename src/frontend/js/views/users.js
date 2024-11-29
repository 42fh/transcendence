import { displayModalError } from "../components/modal.js";
import { ASSETS } from "../config/constants.js";
import { updateActiveNavItem } from "../components/bottom-nav.js";
import { fetchUsers } from "../services/usersService.js";

export async function loadUsersPage(addToHistory = true) {
  try {
    if (addToHistory) {
      history.pushState(
        {
          view: "users",
        },
        ""
      );
      updateActiveNavItem("users");
    }
    if (!addToHistory) updateActiveNavItem("users");

    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = "";

    // Add users template to index.html first
    const usersTemplate = document.getElementById("users-template");
    if (!usersTemplate) {
      throw new Error("Users template not found");
    }

    mainContent.appendChild(document.importNode(usersTemplate.content, true));

    // Initial load of first page
    await loadUsersList(1);
  } catch (error) {
    console.error("Error loading users page:", error);
    displayModalError("Failed to load users page");
  }
}

async function loadUsersList(page = 1, perPage = 10, search = "") {
  try {
    console.log("Loading users list with page:", page, "and per page:", perPage, "and search:", search);
    // const response = await fetch(`/api/users/?page=${page}&per_page=${perPage}`);
    const data = await fetchUsers(page, perPage, search);
    if (!data) throw new Error("Failed to fetch users");
    console.log("Fetched users:", data);

    const usersList = document.getElementById("users-list");
    const paginationContainer = document.getElementById("users-pagination");
    const userListItemTemplate = document.getElementById("users-list-item-template");

    console.log("Found elements:", {
      usersList: usersList ? "✓" : "✗",
      paginationContainer: paginationContainer ? "✓" : "✗",
      userListItemTemplate: userListItemTemplate ? "✓" : "✗",
    });

    if (!usersList || !paginationContainer || !userListItemTemplate) {
      throw new Error("Users list, pagination container, or user list item template not found");
    }

    if (!userListItemTemplate) {
      console.error("Template HTML:", document.body.innerHTML);
      throw new Error("User list item template not found");
    }

    // Clear existing content
    usersList.innerHTML = "";

    // Render users
    console.log("Rendering users:", data.users);
    data.users.forEach((user, index) => {
      try {
        console.log(`Processing user ${index + 1}:`, user);

        const userItem = document.importNode(userListItemTemplate.content, true);
        console.log(`User ${index + 1} template cloned:`, userItem);

        // const userElement = userItem.querySelector(".users-list__item");
        const userElement = userItem.firstElementChild;
        if (!userElement) {
          throw new Error("Could not find users-list__item in cloned template");
        }
        console.log("Created userItem:", userItem);

        const avatarImg = userElement.querySelector(".users-list__avatar");
        console.log(`User ${index + 1} avatar element:`, avatarImg);

        avatarImg.src = user.avatar || ASSETS.IMAGES.DEFAULT_AVATAR;
        avatarImg.alt = `${user.username}'s avatar`;
        // Add error handler to fallback to default avatar if image fails to load
        avatarImg.onerror = function () {
          this.src = ASSETS.IMAGES.DEFAULT_AVATAR;
          console.log(`Avatar image failed to load for ${user.username}, using default`);
        };

        const username = userElement.querySelector(".users-list__username");
        username.textContent = user.username;
        console.log("Set username:", username.textContent);

        const statusIndicator = userElement.querySelector(".users-list__status-indicator");
        console.log(`User ${index + 1} status indicator:`, statusIndicator);

        if (user.is_active && user.visibility_online_status) {
          statusIndicator.classList.add("users-list__status-indicator--online");
          statusIndicator.title = "Online";
        } else {
          statusIndicator.classList.add("users-list__status-indicator--offline");
          statusIndicator.title = "Offline";
        }
        console.log(`Appending user ${index + 1} to list`);
        usersList.appendChild(userItem);
        console.log(`Users list content after append:`, usersList.innerHTML);
      } catch (error) {
        console.error(`Error rendering user ${index + 1}:`, user, error);
      }
    });

    // Update pagination
    renderPagination(data.pagination, paginationContainer);
  } catch (error) {
    displayModalError(`Failed to load users: ${error.message}`);
  }
}

function renderPagination(pagination, container) {
  const { total_pages, page, per_page } = pagination;
  container.innerHTML = "";

  if (total_pages <= 1) return;

  const createPageButton = (pageNum, label = pageNum, isActive = pageNum === page) => {
    const button = document.createElement("button");
    button.className = `pagination__button ${isActive ? "pagination__button--active" : ""}`;
    button.textContent = label;
    if (typeof pageNum === "number") {
      button.onclick = () => loadUsersList(pageNum, per_page);
    }
    return button;
  };

  // Always show first page, last page, current page, and one page before and after current
  const visiblePages = new Set([1, total_pages, page, Math.max(1, page - 1), Math.min(total_pages, page + 1)]);

  let previousPage = 0;
  for (let i = 1; i <= total_pages; i++) {
    if (visiblePages.has(i)) {
      // Add ellipsis if there's a gap
      if (i - previousPage > 1) {
        container.appendChild(createPageButton(null, "..."));
      }
      container.appendChild(createPageButton(i));
      previousPage = i;
    }
  }
}
