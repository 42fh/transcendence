import {
  fetchUserProfile,
  formatWinRatio,
  renderMatchHistory,
} from "../services/usersService.js";
import { showToast } from "../utils/toast.js";
import { ASSETS, LOCAL_STORAGE_KEYS } from "../config/constants.js";
import { updateActiveNavItem } from "../components/bottom-nav.js";
import { loadHomePage } from "./home.js";
import { loadProfileEditPage } from "./profileEdit.js";
import { load2FAPage } from "./2fa.js";

export async function loadProfilePage(userId = null, addToHistory = true) {
  const loggedInUserId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);
  if (!loggedInUserId) {
    localStorage.clear();
    loadAuthPage();
    return;
  }

  // If no userId is provided, use currentUserId (own profile)
  const targetUserId = userId === undefined ? loggedInUserId : userId;

  if (!targetUserId) {
    throw new Error("User ID not found");
  }
  const isOwnProfile = targetUserId === loggedInUserId;
  try {
    if (addToHistory) {
      history.pushState(
        {
          view: "profile",
          userId: targetUserId,
        },
        ""
      );
      updateActiveNavItem(isOwnProfile ? "profile" : null);
    }
    if (!addToHistory) updateActiveNavItem("profile");

    const mainContent = document.getElementById("main-content");
    if (!mainContent) {
      throw new Error("Main content element not found");
    }
    // TODO: Make it beautiful
    mainContent.innerHTML = '<div class="loading">Loading profile...</div>';

    // const userId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);
    // if (!userId) {
    //   throw new Error("User ID not found");
    // }

    // Fetch result and handle errors
    const result = await fetchUserProfile(targetUserId);

    if (!result.success) {
      if (result.status === 404 && isOwnProfile) {
        localStorage.clear();
        loadAuthPage();
        return;
      }

      if (result.error === "NETWORK_ERROR") {
        showToast("Network error. Please check your connection.", "error");
        return;
      }

      throw new Error(result.message || "Failed to load profile");
    }

    const userData = result.data;
    if (!userData) {
      if (isOwnProfile) {
        // If user doesn't exist, clear localStorage and redirect to auth
        // We redirect only in the case that the user is trying to check his own profile but for some reason hte userId is not set.
        localStorage.clear();
        loadAuthPage();
        return;
      }
      throw new Error("User not found");
    }

    // Clone and populate template
    const profileTemplate = document.getElementById("profile-template");
    const content = document.importNode(profileTemplate.content, true);

    // Add the appropriate class to control visibility on the child classes
    content
      .querySelector(".profile")
      .classList.add(isOwnProfile ? "profile--private" : "profile--public");
    // Populate all profile data
    populateProfileHTML(content, userData, isOwnProfile);

    // Add content to main container and render match history
    mainContent.innerHTML = "";
    mainContent.appendChild(content);
    const matchesContainer = mainContent.querySelector(
      ".profile__matches-list"
    );
    renderMatchHistory(userData.recent_matches, matchesContainer);

    // Add edit button handler only for own profile
    if (isOwnProfile) {
      const editButton = mainContent.querySelector(".profile__button--edit");
      if (editButton) {
        editButton.addEventListener("click", () => {
          loadProfileEditPage(userData);
        });
      }
      // Add 2FA button handler
      const TwoFAButton = mainContent.querySelector(".profile__button--2fa");
      TwoFAButton.addEventListener("click", () => {
        console.log("2FA button clicked");
        load2FAPage(userData);
      });
    }

    // TODO: probably we don't need this
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

function populateProfileHTML(content, userData, isOwnProfile) {
  const avatarElement = content.querySelector(".profile__avatar");
  const avatarSrc = userData.avatar || ASSETS.IMAGES.DEFAULT_AVATAR;
  avatarElement.onerror = function () {
    console.log("Avatar failed to load, falling back to default");
    avatarElement.src = ASSETS.IMAGES.DEFAULT_AVATAR; // using the variable instead
  };

  //   content.querySelector(".profile__avatar").src = userData.avatar || ASSETS.IMAGES.DEFAULT_AVATAR;
  content.querySelector(".profile__username").textContent = userData.username;
  content.querySelector(".profile__bio-text").textContent =
    userData.bio || "No bio available";
  content.querySelector(".profile__info-item--name").textContent =
    `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
    "No name set";

  // Private info (only visible on own profile)
  const emailElement = content.querySelector(".profile__info-item--email");
  const phoneElement = content.querySelector(".profile__info-item--phone");

  if (isOwnProfile) {
    emailElement.textContent = userData.email || "No email set";
    phoneElement.textContent = userData.telephone_number || "No phone set";
  } else {
    // Hide private info elements instead of removing them
    emailElement.style.display = "none";
    phoneElement.style.display = "none";
  }

  // Stats (always visible)
  if (userData.stats) {
    content.querySelector(".profile__stats-wins").textContent =
      userData.stats.wins;
    content.querySelector(".profile__stats-losses").textContent =
      userData.stats.losses;
    content.querySelector(".profile__stats-ratio").textContent = formatWinRatio(
      userData.stats.wins,
      userData.stats.losses
    );
  }
}
