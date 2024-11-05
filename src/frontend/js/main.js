import { CONFIG } from "./config/constants.js";
import { loadAuthPage, initAuthListeners } from "./views/auth.js";
import { showToast } from "./utils/toast.js";
import { initializeTournaments } from "./config/tournaments.js";
import { initModalListeners } from "./utils/modals.js";

// Initialize all listeners and data
document.addEventListener("DOMContentLoaded", () => {
  initModalListeners();
  initAuthListeners();
  initializeTournaments();
});
