import { updateActiveNavItem } from "../components/bottomNav.js";
// import { GameWebSocket } from "../2DGame/websocket.js";
import { LOCAL_STORAGE_KEYS } from "../config/constants.js";
import { GAME_2D_CONFIG_TYPES } from "../config/constants.js";
import { createSocketConfig, connectGameSocket } from "../services/gameSocketService.js";
import { handleGameMessage } from "../2DGame/gameCore.js";
import { updateGameInfo } from "../2DGame/utils.js";

export async function loadGame2DPage(gameId, wsUrl, formData, addToHistory = true) {
  console.log("Entered loadGame2DPage");
  try {
    if (addToHistory) {
      history.pushState(
        {
          view: "game2d",
          gameId,
        },
        ""
      );
      updateActiveNavItem("home");
    }
    // We check if the game type exists
    if (!GAME_2D_CONFIG_TYPES[formData.gameType]) {
      showToast("Invalid game type selected", "error");
      throw new Error("Invalid game type selected");
    }

    const template = document.getElementById("two-d-game__game-template");
    if (!template) {
      throw new Error("2D game template not found");
    }

    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = "";
    mainContent.appendChild(document.importNode(template.content, true));

    const userId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);

    // Initialize game info form data
    // This are data from the form, we want to update them with data from the backend
    const formInfoItems = [
      { label: "Game Type", value: formData.gameType },
      { label: "Players", value: formData.numPlayers },
      { label: "Balls", value: formData.numBalls },
      { label: "Score Mode", value: formData.scoreMode },
    ];
    updateGameInfo(formInfoItems);

    const wsConfig = createSocketConfig(gameId, userId, handleGameMessage, {
      type: formData.gameType,
      players: formData.numPlayers,
      balls: formData.numBalls,
    });
    connectGameSocket(wsConfig);
  } catch (error) {
    console.error("Error loading 2D game page:", error);
    throw error;
  }
}
