import { updateActiveNavItem } from "../components/bottom-nav.js";
import { GameInterface2D } from "../2DGame/gameInterface.js";
import { GAME_2D_CONFIG_TYPES, GAME_2D_CONFIG_TYPE_DEFAULT } from "../config/constants.js";
import { showToast } from "../utils/toast.js";
import { fetchWaitingGames, createGame } from "../services/gameService.js";
import { loadGame2DPage } from "./game2D.js";
import { initializeGameStructs } from "../store/globals.js";

export function loadGameSetupPage(addToHistory = true) {
  console.log("loadGameSetupPage function called");

  try {
    if (addToHistory) {
      history.pushState(
        {
          view: "game2d",
        },
        ""
      );
      updateActiveNavItem("home");
    }

    const mainContent = document.getElementById("main-content");
    if (!mainContent) {
      throw new Error("Main content element not found");
    }

    // Clear the main content
    mainContent.innerHTML = "";

    // Get the template
    const template = document.getElementById("two-d-game__setup-template");
    if (!template) {
      throw new Error("2D game template not found");
    }

    // Clone the template content
    const gameContent = document.importNode(template.content, true);

    // Add it to the main content
    mainContent.appendChild(gameContent);

    updateGameFormInputConstraints(GAME_2D_CONFIG_TYPE_DEFAULT);
    // toggleGameFormFields();

    // We shoudl take this from the config
    const formData = {
      "game-type": "classic",
      "num-players": 2,
      "num-sides": 4,
      "num-balls": 1,
      "score-mode": "classic",
      "debug-mode": false,
    };
    updateAllFormElements("two-d-game__", formData);

    const gameInterface = new GameInterface2D();

    setupEventListeners(gameInterface);
  } catch (error) {
    console.error("Error loading 2D game page:", error);
  }
  document.getElementById("two-d-game__game-type").addEventListener("change", (e) => {
    const selectedGameType = e.target.value;
    updateGameFormInputConstraints(selectedGameType);
    // toggleGameFormFields();
  });
}

/* with updateGameTypeFields we were updating the configuration based on the HTML */
/* now we are updating the HTML based on the configuration */
//   updateGameTypeFields() {
function updateGameFormInputConstraints(gameType = GAME_2D_CONFIG_TYPE_DEFAULT) {
  //   const config = this.gameConfigs[this.gameType];d
  const gameConfig = GAME_2D_CONFIG_TYPES[gameType];
  if (!gameConfig) {
    console.error("No game type found");
    return;
  }

  const defaultConstraints = GAME_2D_CONFIG_TYPES[GAME_2D_CONFIG_TYPE_DEFAULT].input_constraints;

  // Update number of players max value
  const numPlayersInputElement = document.getElementById("two-d-game__num-players");
  if (numPlayersInputElement) {
    const playerConstraint = gameConfig.inputConstraints?.players || defaultConstraints.players;
    numPlayersInputElement.min = playerConstraint.min;
    numPlayersInputElement.max = playerConstraint.max;
    numPlayersInputElement.value = playerConstraint.value;
    numPlayersInputElement.disabled = playerConstraint.disabled;
    const helpTextElement = numPlayersInputElement.nextElementSibling;
    if (helpTextElement) {
      helpTextElement.textContent = playerConstraint.getHelpText();
    }
  }

  // Update number of sides
  const numSidesInputElement = document.getElementById("two-d-game__num-sides");
  if (numSidesInputElement) {
    const sidesConstraints = gameConfig.inputConstraints?.sides || defaultConstraints.sides;
    numSidesInputElement.min = sidesConstraints.min;
    numSidesInputElement.max = sidesConstraints.max;
    numSidesInputElement.value = sidesConstraints.value;
    numSidesInputElement.disabled = sidesConstraints.disabled;
    const helpTextElement = numSidesInputElement.nextElementSibling;
    if (helpTextElement) {
      helpTextElement.textContent = sidesConstraints.getHelpText();
    }
  }
}

function updateFormElement(prefix, key, formData) {
  const elementId = `${prefix}${key}`;
  const element = document.getElementById(elementId);

  if (element && formData[key] !== undefined) {
    if (element.type === "checkbox") {
      element.checked = formData[key];
    } else {
      element.value = formData[key];
    }
    console.log(`Updated ${elementId} with value: ${formData[key]}`);
  } else {
    console.warn(`Element or form data not found for: ${elementId}`);
  }
}

function updateAllFormElements(prefix, formData) {
  Object.keys(formData).forEach((key) => {
    updateFormElement(prefix, key, formData);
  });
}

function setupEventListeners(gameInterface) {
  console.log("Setting up event listeners for 2D game");

  const gameTypeInput = document.getElementById("two-d-game__game-type");
  if (!gameTypeInput) {
    console.error("gameTypeInput not found");
    return;
  }
  gameTypeInput.addEventListener("change", (e) => {
    gameInterface.gameType = e.target.value;
    updateGameFormInputConstraints(gameInterface.gameType);
  });

  // Shape change handler
  //   const shapeInput = document.getElementById("two-d-game__shape");
  //   if (!shapeInput) {
  //     console.error("shapeInput not found");
  //     return;
  //   }

  //   shapeInput.addEventListener("change", (e) => {
  //     gameInterface.formData.shape = e.target.value;
  //     //   this.updateShapeDescription();
  //   });

  // Form submission
  const gameForm = document.getElementById("two-d-game__form");
  if (!gameForm) {
    console.error("gameForm not found");
    return;
  }
  gameForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleStartGame(gameInterface);
  });

  // Debug mode toggle
  const debugModeInput = document.getElementById("two-d-game__debug-mode");
  if (!debugModeInput) {
    console.error("debugModeInput not found");
    return;
  }
  debugModeInput.addEventListener("change", (e) => {
    gameInterface.debugEnabled = e.target.checked;
  });

  // Form input change handlers
  const inputFields = [
    "two-d-game__game-id",
    "two-d-game__player-id",
    "two-d-game__num-players",
    "two-d-game__num-sides",
    "two-d-game__num-balls",
    "two-d-game__shape",
    "two-d-game__score-mode",
  ];
  inputFields.forEach((fieldId) => {
    const element = document.getElementById(fieldId);
    if (element) {
      element.addEventListener("change", (e) => {
        gameInterface.formData[fieldId] = e.target.type === "number" ? parseInt(e.target.value) : e.target.value;
      });
    }
  });

  // Setup keyboard controls
  document.addEventListener("keydown", (e) => {
    if (!gameInterface.controller) return;

    switch (e.key) {
      case "ArrowLeft":
      case "a":
      case "A":
        gameInterface.controller.movePaddle("left");
        break;
      case "ArrowRight":
      case "d":
      case "D":
        gameInterface.controller.movePaddle("right");
        break;
    }
  });
}

function collectFormData() {
  const gameType = document.getElementById("two-d-game__game-type").value;
  const numPlayers = parseInt(document.getElementById("two-d-game__num-players").value);
  const numSides = parseInt(document.getElementById("two-d-game__num-sides").value);
  const numBalls = parseInt(document.getElementById("two-d-game__num-balls").value);
  //   const shape = document.getElementById("two-d-game__shape").value;
  const scoreMode = document.getElementById("two-d-game__score-mode").value;
  const debug = document.getElementById("two-d-game__debug-mode").checked;
  return { gameType, numPlayers, numSides, numBalls, scoreMode, debug };
}

function validateFormData(formData) {
  const { gameType, numSides, numBalls } = formData;
  // Validate sides based on game type
  if (gameType === "circular") {
    if (numSides < 2 || numSides > 12) {
      showToast("Circular mode requires between 4 and 12 sides", true);
      return false;
    }
  } else if (gameType !== "classic") {
    if (numSides < 3 || numSides > 8) {
      showToast("Number of sides must be between 3 and 8 for polygon modes", true);
      return false;
    }
  }

  if (numBalls < 1 || numBalls > 4) {
    showToast("Number of balls must be between 1 and 4", true);
    return false;
  }
  return true;
}

/**
 * Finds a matching game from available games based on form data
 * @param {Array<GameInfo>} games - Array of available games
 * @param {Object} formData - Form data with game preferences
 * @returns {string|null} gameId of matching game or null if no match found
 */
function findMatchingGame(games, formData) {
  console.log("findMatchingGame", games, formData);
  const matchingGame =
    games.find(
      (game) =>
        // Match game mode
        game.mode === formData.gameType &&
        // Match number of players
        game.num_players === formData.numPlayers &&
        // Match number of sides (for non-classic modes)
        (formData.gameType === "classic" || game.sides === formData.numSides) &&
        // TODO: Future matching criteria could include:
        // && game.score.max === formData.scoreLimit
        // && game.initial_ball_speed === formData.ballSpeed
        // && game.paddle_length === formData.paddleLength
        // && game.ball_size === formData.ballSize
        // && game.score_mode === formData.scoreMode
        // Ensure there's room for more players
        game.players.current + game.players.reserved < game.players.total_needed
    )?.game_id || null;
  console.log("matchingGame", matchingGame);
  return matchingGame;
}
// Note this fucntion is meant to be used if you want to join or create a certain type of game not to join a specific waiting gamej
async function handleStartGame(gameInterface) {
  const formData = collectFormData();
  const isValid = validateFormData(formData);
  if (!isValid) {
    showToast("Invalid form data", true);
    return;
  }
  try {
    const result = await findOrCreateGame(formData);
    await handleStartGameAndJoinGameResult(result, formData);
  } catch (error) {
    console.error("Error handling start game:", error);
    showToast("Error handling start game", true);
  }
}

// For joining existing games from the game list
async function handleJoinGame(gameId, formData) {
  try {
    const result = await joinGame(gameId);
    await initializeAndLoadGame(result, formData);
  } catch (error) {
    console.error("Error joining game:", error);
    showToast("Error joining game", true);
  }
}

async function findOrCreateGame(formData) {
  const games = await fetchWaitingGames();
  const matchingGameId = findMatchingGame(games, formData);

  if (matchingGameId) {
    return await joinGame(matchingGameId);
  }

  return await createGame({
    mode: formData.gameType,
    num_players: formData.numPlayers,
    num_sides: formData.numSides,
    num_balls: formData.numBalls,
    score_mode: formData.scoreMode,
    debug: formData.debug,
  });
}

async function handleStartGameAndJoinGameResult(result, formData) {
  if (result.success) {
    try {
      initializeGameStructs(result.game_id, formData);
      await loadGame2DPage(result.game_id, result.ws_url, formData);
    } catch (error) {
      console.error("Error loading 2D game page:", error);
      showToast("Error loading 2D game page", true);
      throw error;
    }
  } else {
    showToast("Failed to join game", true);
    throw new Error("Failed to join game");
  }
}

// TODO: implement this in the game setup page
function createGameList(games) {
  const gamesList = document.getElementById("games-list");
  gamesList.innerHTML = "";

  games.forEach((game) => {
    const gameElement = document.createElement("div");
    gameElement.className = "game-item";
    gameElement.innerHTML = `
            <span>Game ${game.id}</span>
            <button class="join-button">Join</button>
        `;

    gameElement.querySelector(".join-button").addEventListener("click", async () => {
      // Get form data based on game settings
      const formData = {
        gameType: game.mode,
        numPlayers: game.num_players,
        numBalls: game.num_balls,
        scoreMode: game.score_mode,
      };

      await handleJoinGame(game.id, formData);
    });

    gamesList.appendChild(gameElement);
  });
}
