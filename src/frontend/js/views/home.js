import { handleLogout } from "./auth.js";
import { displayLogoutError } from "../utils/errors.js";
import { loadTournamentsPage } from "./tournaments.js";
import { updateActiveNavItem } from "../components/bottomNav.js";
import { loadChatPage } from "./chatHome.js";
import { loadGameHome } from "./game.js";
import { loadGame3D } from "./game3d.js";
import { loadGameSetupPage } from "./gameSetup.js";

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

    const mainContent = document.getElementById("main-content");
    if (!mainContent) {
      throw new Error("Main content element not found");
    }

    mainContent.style.display = "block";
    mainContent.innerHTML = "";

    const template = document.getElementById("home-template");
    if (!template) {
      throw new Error("Home template not found");
    }

    const homeContent = document.importNode(template.content, true);
    mainContent.appendChild(homeContent);

    const bottomNavContainer = document.getElementById("bottom-nav-container");
    if (bottomNavContainer) {
      bottomNavContainer.style.display = "block";
    }

    const logoutButton = document.getElementById("home__button-logout");
    if (logoutButton) {
      logoutButton.addEventListener("click", handleLogout);
    }

    const playButton = document.getElementById("home__button-play");
    if (playButton) {
      playButton.addEventListener("click", loadGame3D);
    }

    const ctaButton = document.getElementById("home__button-cta");
    if (ctaButton) {
      ctaButton.addEventListener("click", loadGameHome);
    }

    const chatsButton = document.getElementById("chats");
    if (chatsButton) {
      chatsButton.addEventListener("click", loadChatPage);
    }

    const tournamentsButton = document.getElementById("tournaments");
    if (tournamentsButton) {
      tournamentsButton.addEventListener("click", loadTournamentsPage);
    }

    console.log("Looking for 2D button...");
    const twoDButton = document.getElementById("home__button-2d");
    console.log("2D button found:", twoDButton); // Should show the button element if found
    if (twoDButton) {
      console.log("Adding click listener to 2D button");
      twoDButton.addEventListener("click", () => {
        console.log("2D button clicked!"); // This should show when button is clicked
        loadGameSetupPage();
      });
    } else {
      console.error("2D button not found in DOM");
    }
  } catch (error) {
    console.error("Error loading home page:", error);
    displayLogoutError("An error occurred while loading the home page.");
  }
}
