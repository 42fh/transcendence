import { loadAuthPage } from "./views/auth.js";
import { loadHomePage } from "./views/home.js";
import { initializeTournaments } from "./config/tournaments.js";
import { initializeHistory } from "./utils/history.js";
import { CONFIG, LOCAL_STORAGE_KEYS } from "./config/constants.js";
import { initBottomNav } from "./components/bottomNav.js";
import { setupNotificationListener } from "./utils/notifications.js";
// import { fetchNotifications } from "./services/chatNotificationService.js";

let notificationSocket = null;


// deleting a cookie must be done by setting expiration to a past time
const deleteCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// needed when using sing in with 42
const getCookie_none = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
};

// Initialize all listeners and data
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded");

  // Check if user is logged in
  const userId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);
  const username = localStorage.getItem(LOCAL_STORAGE_KEYS.USERNAME);
  const cookie_userId = getCookie_none("pongUserId");
  const cookie_username = getCookie_none("pongUsername");

  // when logging in with 42 user id and name from cookie are move to localstorage
  if ((!userId || !username) && cookie_userId && cookie_username) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_ID, cookie_userId);
    localStorage.setItem(LOCAL_STORAGE_KEYS.USERNAME, cookie_username);
    deleteCookie("pongUserId");
    deleteCookie("pongUsername");
    loadHomePage();
  } else if (!userId || !username) {
    // User not logged in, show auth page
    loadAuthPage();
  } else {
    // User is logged in, load notiication and show home page




    ///////////////////////////     moved notifications from chatHome
    try {
      if (notificationSocket) {
        try {
          notificationSocket.close();
        } catch (closeError) {
          console.warn(
            "Error closing existing notification socket:",
            closeError
          );
        }
      }
        
      const currentUser = LOCAL_STORAGE_KEYS.USERNAME;
      if (currentUser) {
        const wsUrl = `/ws/notifications/${currentUser}/`;
    
        notificationSocket = setupNotificationListener(wsUrl);
      } else {
        console.error("No current user found for notifications");
      }
  
    } catch (error) {
          console.error("Error with notification in main", error);
          // displayModalError("Failed to load chat home");
        }

    ///////////////////////////     moved notifications from chatHome






    loadHomePage();
  }

  initializeTournaments(CONFIG.CURRENT_SOURCE);
  initializeHistory();
  // TODO: is initBottomBav the correct name, and should be initialised anyway also if loadAuthPage?
  initBottomNav();
});
