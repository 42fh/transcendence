import { fetchUserProfile, formatWinRatio, renderMatchHistory } from "../services/usersService.js";
import { showToast } from "../utils/toast.js";

export async function loadProfilePage(addToHistory = true) {
  try {
    if (addToHistory) {
      history.pushState(
        {
          view: "profile",
        },
        ""
      );
    }

    const mainContent = document.getElementById("main-content");
    if (!mainContent) {
      throw new Error("Main content element not found");
    }

    mainContent.style.display = "block";
    mainContent.innerHTML = ""; // Clear existing content

    // Add loading state
    mainContent.innerHTML = '<div class="loading">Loading profile...</div>';

    // Get current user's ID from localStorage
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      throw new Error("User ID not found");
    }

    // Fetch user data
    const userData = await fetchUserProfile(userId);

    // Clone and populate template
    const template = document.getElementById("profile-template");
    const content = document.importNode(template.content, true);

    // Populate user data
    content.querySelector(".profile__avatar").src = userData.avatar || "/static/images/default-avatar.png";
    content.querySelector(".profile__username").textContent = userData.username;
    content.querySelector(".profile__name").textContent =
      `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || "No name set";
    content.querySelector(".profile__email").textContent = userData.email || "No email set";
    content.querySelector(".profile__phone").textContent = userData.telephone_number || "No phone set";
    content.querySelector(".profile__bio-text").textContent = userData.bio || "No bio available";

    // Populate stats
    content.querySelector(".profile__stats-wins").textContent = userData.stats.wins;
    content.querySelector(".profile__stats-losses").textContent = userData.stats.losses;
    content.querySelector(".profile__stats-ratio").textContent = formatWinRatio(
      userData.stats.wins,
      userData.stats.losses
    );

    // Add content to main container
    mainContent.appendChild(content);

    // Render match history
    const matchesContainer = mainContent.querySelector(".profile__matches-list");
    renderMatchHistory(userData.recent_matches, matchesContainer);

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
