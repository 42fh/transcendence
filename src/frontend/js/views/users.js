import { displayModalError } from "../components/modal.js";
import { ASSETS } from "../config/constants.js";
import { updateActiveNavItem } from "../components/bottom-nav.js";
import { fetchUsers } from "../services/usersService.js";
import { loadProfilePage } from "./profile.js";

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

    // Get the search input after template is cloned and added
    // const searchInput = document.querySelector(".users-search__input");
    // if (searchInput) {
    //   searchInput.addEventListener(
    //     "input",
    //     debounce((e) => {
    //       loadUsersList(1, 10, e.target.value);
    //     }, 300)
    //   );
    // }

    // Initial load of first page
    await loadUsersList(1, 10, "");
  } catch (error) {
    console.error("Error loading users page:", error);
    displayModalError("Failed to load users page");
  }
}

async function loadUsersList(page = 1, perPage = 10, search = "") {
  try {
    console.log("Loading users list with page:", page, "and per page:", perPage, "and search:", search);
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

    usersList.innerHTML = "";

    // Render users
    data.users.forEach((user, index) => {
      try {
        const userItem = document.importNode(userListItemTemplate.content, true);
        const userElement = userItem.firstElementChild;
        if (!userElement) {
          throw new Error("Could not find users-list__item in cloned template");
        }

        const avatarImg = userElement.querySelector(".users-list__avatar");

        avatarImg.src = user.avatar || ASSETS.IMAGES.DEFAULT_AVATAR;
        avatarImg.onerror = function () {
          this.src = ASSETS.IMAGES.DEFAULT_AVATAR;
          console.log(`Avatar image failed to load for ${user.username}, using default`);
        };

        const username = userElement.querySelector(".users-list__username");
        username.textContent = user.username;

        const statusIndicator = userElement.querySelector(".users-list__status-indicator");

        if (user.is_active && user.visibility_online_status) {
          statusIndicator.classList.add("users-list__status-indicator--online");
          statusIndicator.title = "Online";
        } else {
          statusIndicator.classList.add("users-list__status-indicator--offline");
          statusIndicator.title = "Offline";
        }
        userElement.addEventListener("click", () => {
          const userId = user.id; // Make sure the backend sends this
          loadProfilePage(userId, true);
        });
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
  console.log("Rendering pagination:", pagination);
  console.log("Container:", container);
  const { total_pages, page, per_page } = pagination;

  const prevButton = container.querySelector(".pagination__button--prev");
  const nextButton = container.querySelector(".pagination__button--next");
  const currentPage = container.querySelector(".pagination__current");
  const totalPages = container.querySelector(".pagination__total");

  console.log("Found elements:", {
    prevButton: prevButton ? "✓" : "✗",
    nextButton: nextButton ? "✓" : "✗",
    currentPage: currentPage ? "✓" : "✗",
    totalPages: totalPages ? "✓" : "✗",
  });

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

  // Add click handlers
  prevButton.onclick = () => loadUsersList(page - 1);
  nextButton.onclick = () => loadUsersList(page + 1);

  // Hide pagination if there's only one page
  container.style.display = total_pages <= 1 ? "none" : "flex";
}
