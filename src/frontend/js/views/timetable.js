import { showToast } from "../utils/toast.js";
import { CONFIG, LOCAL_STORAGE_KEYS } from "../config/constants.js";
import { getGlobalTournaments } from "../store/globals.js";
import { tournaments } from "../config/tournaments.js";
import { updateActiveNavItem } from "../components/bottom-nav.js";

export async function loadTimetablePage(tournamentName, addToHistory = true) {
  try {
    if (addToHistory) {
      history.pushState(
        {
          view: "timetable",
          tournamentName: tournamentName,
        },
        ""
      );
      updateActiveNavItem("timetable");
    }
    if (!addToHistory) updateActiveNavItem("timetable");

    // Find tournament with timetable based on data source
    let tournament;
    if (CONFIG.DATA_SOURCE === CONFIG.DATA_SOURCE.API) {
      tournament = getGlobalTournaments()?.find((t) => t.name === tournamentName);
    } else {
      tournament = tournaments.find((t) => t.name === tournamentName);
    }

    if (!tournament || !tournament.timetable) {
      throw new Error("Timetable not found");
    }

    // Get and clone the template
    const template = document.getElementById("tournament-timetable-template");
    if (!template) {
      throw new Error("Timetable template not found");
    }

    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = "";
    const content = document.importNode(template.content, true);

    // Set tournament name and title
    const tournamentNameElement = content.querySelector(".tournament-timetable-tournament-name");
    tournamentNameElement.textContent = tournament.name;

    mainContent.appendChild(content);

    const roundsContainer = document.getElementById("tournament-timetable-rounds");
    const roundTemplate = document.getElementById("tournament-timetable-round-template");
    const gameTemplate = document.getElementById("tournament-timetable-game-template");

    // Populate rounds and games
    tournament.timetable.rounds.forEach((round) => {
      // Clone and populate round template
      const roundElement = document.importNode(roundTemplate.content, true);
      roundElement.querySelector(".tournament-timetable-round-title").textContent = `ROUND ${round.round}`;

      const gamesContainer = roundElement.querySelector(".tournament-timetable-games");

      // Add games to round
      round.games.forEach((game) => {
        const gameElement = document.importNode(gameTemplate.content, true);

        // Format and set date/time
        const gameDate = new Date(game.date);
        gameElement.querySelector(".tournament-timetable-game-date").textContent = gameDate.toLocaleDateString();
        gameElement.querySelector(".tournament-timetable-game-time").textContent = gameDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        // Set players
        const players = gameElement.querySelectorAll(".tournament-timetable-game-player");
        players[0].textContent = game.player1 || "TBD";
        players[1].textContent = game.player2 || "TBD";

        // Set result if exists
        if (game.score) {
          gameElement.querySelector(".tournament-timetable-game-result").textContent = game.score;
        }

        // Set status
        const statusElement = gameElement.querySelector(".tournament-timetable-game-status");
        if (game.winner) {
          statusElement.textContent = "Completed";
          // Highlight winner
          const winnerIndex = game.winner === game.player1 ? 0 : 1;
          players[winnerIndex].classList.add("tournament-timetable-game-player--winner");
        } else {
          const now = new Date();
          statusElement.textContent = now > gameDate ? "In Progress" : "Scheduled";
        }

        // Highlight current user's games
        const currentUser = localStorage.getItem(LOCAL_STORAGE_KEYS.USERNAME);

        if (game.player1 === currentUser || game.player2 === currentUser) {
          gameElement.querySelector(".tournament-timetable-game").classList.add("tournament-timetable-game--user-game");
        }

        gamesContainer.appendChild(gameElement);
      });

      roundsContainer.appendChild(roundElement);
    });
  } catch (error) {
    console.error("Error loading timetable:", error);
    showToast("Failed to load timetable", true);
  }
}
