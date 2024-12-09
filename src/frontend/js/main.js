import { loadAuthPage } from "./views/auth.js";
import { loadHomePage } from "./views/home.js";
import { initializeTournaments } from "./config/tournaments.js";
import { initializeHistory } from "./utils/history.js";
import { CONFIG, LOCAL_STORAGE_KEYS } from "./config/constants.js";
import { initBottomNav } from "./components/bottom-nav.js";

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
  if ((!userId || !username) && cookie_userId && cookie_username)
  {
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_ID, cookie_userId);
    localStorage.setItem(LOCAL_STORAGE_KEYS.USERNAME, cookie_username);
    deleteCookie("pongUserId");
    deleteCookie("pongUsername");
    loadHomePage();
  }
  else if (!userId || !username) {
    // User not logged in, show auth page
    loadAuthPage();
  } else {
    // User is logged in, show home page
    loadHomePage();
  }

  initializeTournaments(CONFIG.CURRENT_SOURCE);
  initializeHistory();
  // TODO: is initBottomBav the correct name, and should be initialised anywaay also if loadAuthPage?
  initBottomNav();
});
