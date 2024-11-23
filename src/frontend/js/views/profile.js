import { fetchUserProfile, formatWinRatio, renderMatchHistory } from "../services/usersService.js";
import { showToast } from "../utils/toast.js";
import { ASSETS, LOCAL_STORAGE_KEYS } from "../config/constants.js";
import { updateActiveNavItem } from "../components/bottom-nav.js";
import { loadHomePage } from "./home.js";
import { loadProfileEditPage } from "./profileEdit.js";

export async function loadProfilePage(addToHistory = true) {
  try {
    if (addToHistory) {
      history.pushState(
        {
          view: "profile",
        },
        ""
      );
      updateActiveNavItem("profile");
    }
    if (!addToHistory) updateActiveNavItem("profile");

    const mainContent = document.getElementById("main-content");
    if (!mainContent) {
      throw new Error("Main content element not found");
    }
    // TODO: Make it beautiful
    mainContent.innerHTML = '<div class="loading">Loading profile...</div>';

    const userId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);
    if (!userId) {
      throw new Error("User ID not found");
    }

    // Fetch user data
    const userData = await fetchUserProfile(userId);
    if (!userData) {
      // If user doesn't exist, clear localStorage and redirect to auth
      localStorage.clear();
      loadAuthPage();
      return;
    }

    // Clone and populate template
    const profileTemplate = document.getElementById("profile-template");
    const content = document.importNode(profileTemplate.content, true);

    // Populate user data
    content.querySelector(".profile__avatar").src = userData.avatar || ASSETS.IMAGES.DEFAULT_AVATAR;
    content.querySelector(".profile__username").textContent = userData.username;
    content.querySelector(".profile__info-item--name").textContent =
      `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || "No name set";
    content.querySelector(".profile__info-item--email").textContent = userData.email || "No email set";
    content.querySelector(".profile__info-item--phone").textContent = userData.telephone_number || "No phone set";
    content.querySelector(".profile__bio-text").textContent = userData.bio || "No bio available";

    // Populate stats
    content.querySelector(".profile__stats-wins").textContent = userData.stats.wins;
    content.querySelector(".profile__stats-losses").textContent = userData.stats.losses;
    content.querySelector(".profile__stats-ratio").textContent = formatWinRatio(
      userData.stats.wins,
      userData.stats.losses
    );

    // Add content to main container and render match history
    mainContent.innerHTML = "";
    mainContent.appendChild(content);
    const matchesContainer = mainContent.querySelector(".profile__matches-list");
    renderMatchHistory(userData.recent_matches, matchesContainer);

    // Add edit button handler
    const editButton = mainContent.querySelector(".profile__button--edit");
    editButton.addEventListener("click", () => {
      loadProfileEditPage();
    });

    // Make sure bottom nav is visible
    const bottomNavContainer = document.getElementById("bottom-nav-container");
    if (bottomNavContainer) {
      bottomNavContainer.style.display = "block";
    }
  } catch (error) {
    console.error("Error loading profile page:", error);
    showToast("Failed to load profile", true);
    loadHomePage();
  }
}
