import { tournamentState } from "../store/tournament/state.js";
import { showToast } from "../utils/toast.js";
import { loadLocalTournamentRoundPage } from "./localTournamentRound.js";
import { getRoundWinners } from "../store/tournament/state.js";
export function loadLocalTournamentSetupPage(addToHistory = true) {
  try {
    if (addToHistory) {
      history.pushState({ view: "local-tournament-setup" }, "");
    }

    const template = document.getElementById("local-tournament-setup-template");
    const mainContent = document.getElementById("main-content");

    mainContent.innerHTML = template.innerHTML;

    //    Display tournament info from state
    document.getElementById("display-tournament-name").textContent = tournamentState.tournamentInfo.name;
    document.getElementById("display-players-count").textContent = tournamentState.tournamentInfo.playersNumber;
    document.getElementById("display-rounds").textContent = tournamentState.tournamentInfo.totalRounds;

    console.log("tournamentState", tournamentState);
    console.log("Players Number", tournamentState.tournamentInfo.playersNumber);

    // Generate player input fields based on the number of players
    generatePlayerInputsFields(tournamentState.tournamentInfo.playersNumber);

    // Add form submit handler
    const form = document.querySelector(".local-tournament-setup__form");
    form.addEventListener("submit", handlePlayerRegistration);

    // Add cancel button handler
    const cancelButton = document.getElementById("cancel-local-setup");
    cancelButton.addEventListener("click", () => {
      loadCreateTournamentPage();
    });
  } catch (error) {
    console.error("Error loading local tournament setup:", error);
    showToast("Failed to load local tournament setup", true);
  }
}

function generatePlayerInputsFields(numberOfPlayers) {
  const container = document.getElementById("players-inputs");
  const template = document.getElementById("player-input-template");

  container.innerHTML = ""; // Clear any existing inputs

  for (let i = 1; i <= numberOfPlayers; i++) {
    // Clone the template
    const playerInput = template.content.cloneNode(true);

    // Replace the placeholder ${number} with actual number
    const label = playerInput.querySelector("label");
    label.textContent = label.textContent.replace("${number}", i);

    const input = playerInput.querySelector("input");
    input.name = input.name.replace("${number}", i);

    container.appendChild(playerInput);
  }
}

async function handlePlayerRegistration(event) {
  event.preventDefault();
  const formData = new FormData(event.target);

  // Collect all player names
  const playerNames = Array.from(formData.values());

  // Validate unique names
  if (new Set(playerNames).size !== playerNames.length) {
    showToast("All players must have unique names", true);
    return;
  }

  // Add players to tournament state
  tournamentState.players = playerNames.map((name, index) => ({
    id: index + 1,
    name: name,
  }));

  // Update tournament status
  tournamentState.tournamentInfo.status = "in_progress";
  tournamentState.tournamentInfo.currentRound = 1;

  // Generate first round
  generateRound(1);

  // Load tournament bracket page
  //   loadTournamentBracketPage();
  loadLocalTournamentRoundPage();
}

export function generateRound(roundNumber) {
  // Array of players for the round
  const players =
    roundNumber === 1
      ? [...tournamentState.players] // First round uses all players
      : getRoundWinners(roundNumber - 1); // Subsequent rounds use previous winners

  const shuffledPlayers = players.sort(() => Math.random() - 0.5);
  const numberOfGames = players.length / 2;

  const round = {
    roundNumber,
    games: [],
    numberOfGames,
  };

  for (let i = 0; i < shuffledPlayers.length; i += 2) {
    const game = {
      id: round.games.length + 1,
      players: [shuffledPlayers[i], shuffledPlayers[i + 1]],
      winner: null,
      roundNumber,
    };
    round.games.push(game);
  }

  tournamentState.rounds.push(round);
  return round;
}
