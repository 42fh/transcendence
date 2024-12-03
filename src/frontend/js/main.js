import { loadAuthPage } from "./views/auth.js";
import { loadHomePage } from "./views/home.js";
import { initializeTournaments } from "./config/tournaments.js";
import { initializeHistory } from "./utils/history.js";
import { CONFIG, LOCAL_STORAGE_KEYS } from "./config/constants.js";
import { initBottomNav } from "./components/bottom-nav.js";

// Initialize all listeners and data
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded");

  // Check if user is logged in
  const userId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);
  const username = localStorage.getItem(LOCAL_STORAGE_KEYS.USERNAME);
  // TODO: decide if we should check for both userId and username or just one of them, and which one
  if (!userId || !username) {
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
