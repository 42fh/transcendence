import { handleLogout } from "./auth.js";
import { displayLogoutError } from "../utils/errors.js";
import { loadTournamentsPage } from "./tournaments.js";
// import { LOCAL_STORAGE_KEYS } from "../config/constants.js";
import { updateActiveNavItem } from "../components/bottom-nav.js";
import { loadChatPage } from "./chats.js";
import { gameHome } from "./game.js";


export function loadHomePage(addToHistory = true) {
  try {
    if (addToHistory) {
      history.pushState(
        {
          view: "home",
        },
        ""
      );
      if (!addToHistory) updateActiveNavItem("home");
    }

    // Show main-content and load the home template
    const mainContent = document.getElementById("main-content");
    if (!mainContent) {
      throw new Error("Main content element not found");
    }

    mainContent.style.display = "block";
    mainContent.innerHTML = ""; // Clear any existing content

    const template = document.getElementById("home-template");
    if (!template) {
      throw new Error("Home template not found");
    }

    const homeContent = document.importNode(template.content, true);
    mainContent.appendChild(homeContent);

    // Make sure bottom nav is visible
    const bottomNavContainer = document.getElementById("bottom-nav-container");
    if (bottomNavContainer) {
      bottomNavContainer.style.display = "block";
    }

    // Add event listeners only if elements exist
    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
      logoutButton.addEventListener("click", handleLogout);
    }

    const playButton = document.getElementById("home__button-play");
    if (playButton) {
      playButton.addEventListener("click", function () {
        mainContent.innerHTML = "<h2>A first game is built here</h2>";
      });
    }


    const ctaButton = document.getElementById("home__button-cta");
    if (ctaButton) {
      ctaButton.addEventListener("click", gameHome);
    }
    

    const chatsButton = document.getElementById("chats");
    if (chatsButton) {
      chatsButton.addEventListener("click", loadChatPage);
    }

    const tournamentsButton = document.getElementById("tournaments");
    if (tournamentsButton) {
      tournamentsButton.addEventListener("click", loadTournamentsPage);
    }
  } catch (error) {
    console.error("Error loading home page:", error);
    displayLogoutError("An error occurred while loading the home page.");
  }
}
