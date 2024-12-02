import { loadAuthPage } from "../views/auth.js";
import { loadHomePage } from "../views/home.js";
import { loadTournamentsPage } from "../views/tournaments.js";
import { loadTournamentDetailsPage } from "../views/tournament-detail.js";
import { loadCreateTournamentPage } from "../views/tournament-create.js";
import { loadTimetablePage } from "../views/timetable.js";
import { loadProfilePage } from "../views/profile.js";
import { LOCAL_STORAGE_KEYS } from "../config/constants.js";
import { updateActiveNavItem } from "../components/bottom-nav.js";

// TODO: Implement state management system to cache API responses
// Consider using:
// 1. In-memory cache for current session
// 2. localStorage for persistent cache
// 3. Cache invalidation strategy (time-based or event-based)
// Example structure:
// const pageCache = {
//   profile: { [userId]: { data, timestamp } },
//   tournaments: { data, timestamp },
//   ...
// };

export function initializeHistory() {
  // Initial state on load
  window.addEventListener("load", () => {
    const username = localStorage.getItem(LOCAL_STORAGE_KEYS.USERNAME);

    const initialView = username ? "home" : "auth";
    history.replaceState({ view: initialView }, "");

    // Load initial view
    if (username) {
      loadHomePage();
    } else {
      loadAuthPage();
    }
  });

  // Handle browser back/forward
  window.addEventListener("popstate", (event) => {
    event.preventDefault();

    if (event.state) {
      // TODO: Check cache before making API calls in each case
      // If cached data exists and is not stale, use it instead of making new API calls

      const state = event.state || { view: "home" };
      if (state && state.view) {
        // Update active nav state
        updateActiveNavItem(state.view);

        switch (state.view) {
          case "auth":
            loadAuthPage(false);
            break;
          case "home":
            loadHomePage(false);
            break;
          case "tournaments":
            // TODO: Consider caching tournament list with timestamp
            loadTournamentsPage(false);
            break;
          case "tournament-detail":
            // TODO: Cache tournament details by ID
            if (state.tournament) {
              loadTournamentDetailsPage(state.tournament, false);
            } else {
              console.error("No tournament data in state");
              loadTournamentsPage(false);
            }
            break;
          case "create-tournament":
            loadCreateTournamentPage(false);
            break;
          case "timetable":
            // TODO: Cache timetable data with invalidation on tournament updates
            if (state.tournamentName) {
              loadTimetablePage(state.tournamentName, false);
            } else {
              console.error("No tournament name in state");
              loadTournamentsPage(false);
            }
            break;
          case "users":
            loadUsersPage(false);
            break;
          case "profile":
            // TODO: Implement profile data caching
            // Cache user profiles with timestamp for invalidation
            // Consider different cache durations for own profile vs other users
            const userId = state.userId || localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);

            // loadProfilePage(userId, false);
            loadProfilePage(false);
            break;
          default:
            loadHomePage(false);
        }
      }
    } else {
      const username = localStorage.getItem(LOCAL_STORAGE_KEYS.USERNAME);

      if (username) {
        loadHomePage(false);
      } else {
        loadAuthPage(false);
      }
    }
  });

  // Prevent default link behavior for navigation
  document.addEventListener("click", (event) => {
    // Check if the clicked element is a navigation link
    if (event.target.matches("[data-nav]")) {
      event.preventDefault();
      const view = event.target.getAttribute("data-nav");
      // TODO: Same caching logic as above should be applied here
      switch (view) {
        case "home":
          loadHomePage();
          break;
        case "tournaments":
          loadTournamentsPage();
          break;
        case "tournament-detail":
          loadTournamentDetailsPage(event.target.dataset.tournament);
          break;
        case "timetable":
          loadTimetablePage(event.target.dataset.tournamentName);
          break;
        case "profile":
          const userId = event.target.dataset.userId || localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);

          // loadProfilePage(userId);
          loadProfilePage();
          break;
        default:
          loadHomePage();
      }
    }
  });
}
