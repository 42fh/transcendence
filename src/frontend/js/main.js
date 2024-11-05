import { initAuthListeners } from "./views/auth.js";
import { initializeTournaments } from "./config/tournaments.js";
import { initModalListeners } from "./utils/modals.js";
import { initializeHistory } from "./utils/history.js";
// Initialize all listeners and data
document.addEventListener("DOMContentLoaded", () => {
  initModalListeners();
  initAuthListeners();
  initializeTournaments();
  initializeHistory();
});
