import { displayModalError } from "../components/modal.js";
import { ASSETS } from "../config/constants.js";
import { updateActiveNavItem } from "../components/bottom-nav.js";
import { fetchUsers, fetchFriends } from "../services/usersService.js";
import { loadProfilePage } from "./profile.js";
import { applyUsernameTruncation } from "../utils/strings.js";
export async function loadUsersPage(addToHistory = true) {
  try {
    if (addToHistory) {
      history.pushState({ view: "users" }, "");
      updateActiveNavItem("users");
    }
    if (!addToHistory) updateActiveNavItem("users");

    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = "";

    // Get and clone the template
    const usersTemplate = document.getElementById("users-template");
    if (!usersTemplate) {
      throw new Error("Users template not found");
    }

    // Clone the entire template
    const content = document.importNode(usersTemplate.content, true);
    mainContent.appendChild(content);

    // TODO: Get the search input after template is cloned and added
    // const searchInput = document.querySelector(".users-search__input");
    // if (searchInput) {
    //   searchInput.addEventListener(
    //     "input",
    //     debounce((e) => {
    //       loadUsersList(1, 10, e.target.value);
    //     }, 300)
    //   );
    // }

    const filterButtons = document.querySelectorAll(".users-filter__button");
    filterButtons.forEach((button) => {
      button.addEventListener("click", async () => {
        // Don't do anything if button is already active
        if (button.classList.contains("users-filter__button--active")) return;

        // Toggle active state
        filterButtons.forEach((btn) => btn.classList.remove("users-filter__button--active"));
        button.classList.add("users-filter__button--active");

        // Use CSS class to determine type instead of text content
        const showFriendsOnly = button.classList.contains("users-filter__button--friends");
        await loadUsersList(1, 10, "", showFriendsOnly);
      });
    });

    // Initial load of first page
    await loadUsersList(1, 10, "");
  } catch (error) {
    console.error("Error loading users page:", error);
    displayModalError("Failed to load users page");
  }
}

async function loadUsersList(page = 1, perPage = 10, search = "", showFriendsOnly = false) {
  const usersList = document.getElementById("users-list");
  const paginationContainer = document.getElementById("users-pagination");
  const userListItemTemplate = document.getElementById("users-list-item-template");

  if (!usersList || !paginationContainer || !userListItemTemplate) {
    console.error("Required DOM elements not found");
    displayModalError("Failed to initialize users list");
    return;
  }

  try {
    console.log(`Fetching ${showFriendsOnly ? "friends" : "users"} list:`, {
      page,
      perPage,
      search,
      showFriendsOnly,
    });
    const data = showFriendsOnly ? await fetchFriends(page, perPage, search) : await fetchUsers(page, perPage, search);
    console.log("Received data:", data);

    usersList.innerHTML = "";
    const users = showFriendsOnly ? data.friends : data.users;
    // Handle empty state

    if (!users || users.length === 0) {
      console.log("No users found in response");
      // TODO: move to the template and make it beautiful
      usersList.innerHTML = `<div class="users-list__empty">
			  No ${showFriendsOnly ? "friends" : "users"} found
			</div>`;
      return;
    }

    // Render users
    console.log(`Rendering ${users.length} users`);
    users.forEach((user, index) => {
      try {
        const userItem = document.importNode(userListItemTemplate.content, true);
        const userElement = userItem.firstElementChild;
        // const userElement = renderUserItem(user, userListItemTemplate);
        if (!userElement) {
          throw new Error("Invalid template structure");
        }

        const avatarImg = userElement.querySelector(".users-list__avatar");

        avatarImg.src = user.avatar || ASSETS.IMAGES.DEFAULT_AVATAR;
        avatarImg.onerror = function () {
          avatarImg.src = ASSETS.IMAGES.DEFAULT_AVATAR;
          console.warn(`Avatar image failed to load for ${user.username}, using default`);
        };

        const username = userElement.querySelector(".users-list__username");
        applyUsernameTruncation(username, user.username, 15);

        // Set online status
        const statusIndicator = userElement.querySelector(".users-list__status-indicator");
        const isOnline = user.is_active && user.visibility_online_status;
        statusIndicator.classList.add(
          isOnline ? "users-list__status-indicator--online" : "users-list__status-indicator--offline"
        );
        statusIndicator.title = isOnline ? "Online" : "Offline";
        userElement.addEventListener("click", () => {
          const userId = user.id; // Make sure the backend sends this
          loadProfilePage(userId, true);
        });
        usersList.appendChild(userItem);
      } catch (error) {
        console.error(`Error rendering user ${index + 1}:`, user, error);
      }
    });

    if (data.pagination) {
      renderPagination(data.pagination, paginationContainer, showFriendsOnly);
    } else {
      paginationContainer.style.display = "none";
    }
  } catch (error) {
    console.error(`Error loading ${showFriendsOnly ? "friends" : "users"}:`, error);
    displayModalError(`Failed to load ${showFriendsOnly ? "friends" : "users"}: ${error.message}`);

    // Show empty state on error
    usersList.innerHTML = `<div class="users-list__error">
      Unable to load ${showFriendsOnly ? "friends" : "users"}
    </div>`;
  }
}

function renderPagination(pagination, container, showFriendsOnly) {
  console.log("Rendering pagination:", pagination);
  console.log("Container:", container);
  const { total_pages, page, per_page } = pagination;

  const prevButton = container.querySelector(".pagination__button--prev");
  const nextButton = container.querySelector(".pagination__button--next");
  const currentPage = container.querySelector(".pagination__current");
  const totalPages = container.querySelector(".pagination__total");

  if (!prevButton || !nextButton || !currentPage || !totalPages) {
    console.error("Missing pagination elements");
    return;
  }

  // Update page numbers
  currentPage.textContent = page;
  totalPages.textContent = total_pages;

  // Update button states
  prevButton.disabled = page <= 1;
  nextButton.disabled = page >= total_pages;

  // Add click handlers with showFriendsOnly parameter
  prevButton.onclick = () => loadUsersList(page - 1, per_page, "", showFriendsOnly);
  nextButton.onclick = () => loadUsersList(page + 1, per_page, "", showFriendsOnly);

  // Hide pagination if there's only one page
  container.style.display = total_pages <= 1 ? "none" : "flex";
}
