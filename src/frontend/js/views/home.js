import { displayLogoutError } from "../utils/errors.js";
import { loadTournamentsPage } from "./tournaments.js";
import { updateActiveNavItem } from "../components/bottomNav.js";
import { loadChatPage } from "./chatHome.js";
import { loadGameList } from "./gameList.js";
import { renderNotifications } from "../components/chatNotification.js";
import { initializeOnlineStatusTracking } from "../utils/onlineStatus.js";
let notificationSocket = null;

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

    try {
      if (notificationSocket) {
        try {
          notificationSocket.close();
        } catch (closeError) {
          console.warn("Error closing existing notification socket:", closeError);
        }
      }
      // notificationSocket = setupNotificationListener();
    } catch (error) {
      console.error("Error with notification in main", error);
    }
    renderNotifications();

    initializeOnlineStatusTracking(); // Initialize for already logged-in users


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

    const playButton = document.getElementById("home__button-play");
    if (playButton) {
      playButton.addEventListener("click", loadGameList);
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
