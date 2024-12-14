import { loadAuthPage } from "../views/auth.js";
import { loadHomePage } from "../views/home.js";
import { loadUsersPage } from "../views/users.js";
import { loadChatPage } from "../views/chatHome.js";
import { loadChatRoom } from "../views/chatRoom.js";
import { loadTournamentsPage } from "../views/tournaments.js";
import { loadTournamentDetailsPage } from "../views/tournamentDetail.js";
import { loadCreateTournamentPage } from "../views/tournamentCreate.js";
import { loadTimetablePage } from "../views/timetable.js";
import { loadProfilePage } from "../views/profile.js";
import { LOCAL_STORAGE_KEYS } from "../config/constants.js";
import { updateActiveNavItem } from "../components/bottomNav.js";
import { loadLocalTournamentSetupPage } from "../views/localTournamentSetup.js";
import { loadLocalTournamentRoundPage } from "../views/localTournamentRound.js";

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
  window.addEventListener("load", () => {
    const username = localStorage.getItem(LOCAL_STORAGE_KEYS.USERNAME);

    const initialView = username ? "home" : "auth";
    history.replaceState({ view: initialView }, "");
    if (username) {
      loadHomePage();
    } else {
      loadAuthPage();
    }
  });

  window.addEventListener("popstate", (event) => {
    event.preventDefault();

    if (event.state) {
      // TODO: Check cache before making API calls in each case
      // If cached data exists and is not stale, use it instead of making new API calls

      const state = event.state || { view: "home" };
      console.log("Navigating to:", state.view);
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
          case "chat-room":
            if (state.chatPartner) {
              loadChatRoom(state.chatPartner, false);
            } else {
              console.error("No chat partner in state");
              loadChatPage(false);
            }
            break;
          case "chat-home":
            loadChatPage(false);
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
            const userId = state.userId || localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);

            loadProfilePage(userId, false);
            break;
          case "local-tournament-setup":
            loadLocalTournamentSetupPage(false);
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

  document.addEventListener("click", (event) => {
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
          loadProfilePage(userId);
          break;
        case "chat-home":
          loadChatPage();
          break;
        case "local-tournament-setup":
          loadLocalTournamentSetupPage();
          break;
        case "local-tournament-round":
          loadLocalTournamentRoundPage();
          break;
        default:
          loadHomePage();
      }
    }
  });
}
