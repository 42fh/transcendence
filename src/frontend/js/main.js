import { initAuthListeners } from "./views/auth.js";
import { initializeTournaments } from "./config/tournaments.js";
import { initModalListeners } from "./utils/modals.js";
import { initializeHistory } from "./utils/history.js";
import { CONFIG } from "./config/constants.js";

// Initialize all listeners and data
document.addEventListener("DOMContentLoaded", () => {
  initModalListeners();
  initAuthListeners();
  initializeTournaments(CONFIG.CURRENT_SOURCE);
  initializeHistory();
});
