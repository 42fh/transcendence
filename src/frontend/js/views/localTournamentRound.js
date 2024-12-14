import { tournamentState } from "../store/tournament/state.js";
import { showToast } from "../utils/toast.js";
import { loadLocalTournamentSetupPage } from "./localTournamentSetup.js";

export function loadLocalTournamentRoundPage(addToHistory = true) {
  try {
    if (addToHistory) {
      history.pushState({ view: "tournament-round" }, "");
    }

    const template = document.getElementById("tournament-round-template");
    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = template.innerHTML;
    // After setting mainContent.innerHTML
    const title = document.querySelector(".tournament-round__title");
    title.textContent = `ROUND ${tournamentState.tournamentInfo.currentRound}`;

    // Get current round games
    const currentRound = tournamentState.rounds[tournamentState.tournamentInfo.currentRound - 1];
    if (!currentRound) {
      showToast("No round data available", true);
      return;
    }

    const gamesContainer = document.querySelector(".tournament-round__games");
    const gameTemplate = document.getElementById("tournament-game-template");

    // Display each game
    currentRound.games.forEach((game) => {
      const gameElement = gameTemplate.content.cloneNode(true);

      //   // Set player names
      //   gameElement.querySelector(".tournament-game__player:first-child").textContent = game.players[0].name;
      //   gameElement.querySelector(".tournament-game__player:last-child").textContent = game.players[1].name;

      // Set player names with IDs
      const player1Element = gameElement.getElementById("tournament-game__player1");
      const player2Element = gameElement.getElementById("tournament-game__player2");

      player1Element.textContent = game.players[0].name;
      player2Element.textContent = game.players[1].name;

      // Add play button or show result
      // Handle completed games
      if (game.winner) {
        const playButton = gameElement.querySelector(".tournament-game__play-btn");
        playButton.textContent = "COMPLETED";
        playButton.disabled = true;

        // Highlight winner
        if (game.winner.id === game.players[0].id) {
          player1Element.classList.add("winner");
        } else {
          player2Element.classList.add("winner");
        }
      } else {
        const playButton = gameElement.querySelector(".tournament-game__play-btn");
        playButton.addEventListener("click", () => handlePlayGame(game));
      }

      gamesContainer.appendChild(gameElement);
    });
  } catch (error) {
    console.error("Error loading tournament round:", error);
    showToast("Failed to load tournament round", true);
  }
}

function handlePlayGame(game) {
  // Save current game state
  tournamentState.currentGame = game;

  // Load the offline game page
  const template = document.getElementById("gameoffline-template");
  const mainContent = document.getElementById("main-content");
  mainContent.innerHTML = template.innerHTML;

  // Initialize game with these players
  initializeOfflineGame(game.players[0].name, game.players[1].name);
}
