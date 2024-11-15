import { loadAuthPage } from "../views/auth.js";
import { loadHomePage } from "../views/home.js";
import { loadTournamentsPage } from "../views/tournaments.js";
import { loadTournamentDetailsPage } from "../views/tournament-detail.js";
import { loadCreateTournamentPage } from "../views/tournament-create.js";
import { loadTimetablePage } from "../views/timetable.js";

export function initializeHistory() {
  // Initial state on load
  window.addEventListener("load", () => {
    const username = localStorage.getItem("username");
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
      switch (event.state.view) {
        case "auth":
          loadAuthPage(false);
          break;
        case "home":
          loadHomePage(false);
          break;
        case "tournaments":
          loadTournamentsPage(false);
          break;
        case "tournament-detail":
          if (event.state.tournament) {
            loadTournamentDetailsPage(event.state.tournament, false);
          } else {
            console.error("No tournament data in state");
            loadTournamentsPage(false);
          }
          break;
        case "create-tournament":
          loadCreateTournamentPage(false);
          break;
        case "timetable":
          if (event.state.tournamentName) {
            loadTimetablePage(event.state.tournamentName, false);
          } else {
            console.error("No tournament name in state");
            loadTournamentsPage(false);
          }
          break;
        default:
          loadHomePage(false);
      }
    } else {
      const username = localStorage.getItem("username");
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
        default:
          loadHomePage();
      }
    }
  });
}
