import { updateActiveNavItem } from "../components/bottomNav.js";
import { GameInterface2D } from "../2DGame/gameInterface.js";
import { GAME_2D_CONFIG_TYPE_DEFAULT } from "../config/constants.js";
import { showToast } from "../utils/toast.js";
import {
  fetchWaitingGames,
  createGame,
  findMatchingGame,
} from "../services/gameService.js";
import { loadGame2DPage } from "./game2D.js";
import { initializeGameConfig } from "../store/index.js";
import { loadGame3D } from "./game3d.js";

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

    mainContent.innerHTML = "";

    const template = document.getElementById("two-d-game__setup-template");
    if (!template) {
      throw new Error("2D game template not found");
    }

    const gameContent = document.importNode(template.content, true);
    mainContent.appendChild(gameContent);

    // The most popular type of game
    const formData = {
      name: "My game",
      "game-type": "circular",
      "num-players": 2,
      "num-sides": 2,
      "num-balls": 1,
      "score-mode": "classic",
      "debug-mode": false,
    };
    updateAllFormElements("two-d-game__", formData);

    document.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = collectFormData();
      if (validateFormData(formData)) {
        console.log("Form data:", formData);

        const data = {
          mode: formData.gameType,
          name: formData.name,
          gameType: formData.gameType,
          num_players: Number(formData.numPlayers),
          sides: Number(formData.numSides),
          num_balls: Number(formData.numBalls),
          score_mode: formData.scoreMode,
          debug: true,
        };

        let result = await createGame(data);
        console.log("Game creation result:", result);

        loadGame3D(result.ws_url);
      }
    });
  } catch (error) {
    console.error("Error loading game creation:", error);
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
  } else {
    console.warn(`Element or form data not found for: ${elementId}`);
  }
}

function updateAllFormElements(prefix, formData) {
  Object.keys(formData).forEach((key) => {
    updateFormElement(prefix, key, formData);
  });
}

function collectFormData() {
  const gameType = document.getElementById("two-d-game__game-type").value;
  const numPlayers = parseInt(
    document.getElementById("two-d-game__num-players").value
  );
  // const numSides = parseInt(
  //   document.getElementById("two-d-game__num-sides").value
  // );
  // while only circular mode is ready
  const name = document.getElementById("two-d-game__name").value;
  const numSides = numPlayers;
  const numBalls = parseInt(
    document.getElementById("two-d-game__num-balls").value
  );
  const scoreMode = document.getElementById("two-d-game__score-mode").value;
  const debug = true;
  return { gameType, numPlayers, numSides, numBalls, scoreMode, debug, name };
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
      showToast(
        "Number of sides must be between 3 and 8 for polygon modes",
        true
      );
      return false;
    }
  }

  if (numBalls < 1 || numBalls > 4) {
    showToast("Number of balls must be between 1 and 4", true);
    return false;
  }
  return true;
}
