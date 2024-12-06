import { updateActiveNavItem } from "../components/bottom-nav.js";
import { GameWebSocket } from "../2DGame/websocket.js";
import { LOCAL_STORAGE_KEYS } from "../config/constants.js";
import { GAME_2D_CONFIG_TYPES } from "../config/gameConfigs.js";
import { createGameSocket, connectGameSocket } from "../services/gameSocketService.js";

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

    // Initialize WebSocket connection immediately
    // const ws = new GameWebSocket(gameId, userId, handleGameMessage, {
    //   type: formData.gameType,
    //   players: formData.numPlayers,
    //   balls: formData.numBalls,
    // });
    // ws.connect();
    const ws = createGameSocket(gameId, userId, handleGameMessage, {
      type: formData.gameType,
      players: formData.numPlayers,
      balls: formData.numBalls,
    });
    connectGameSocket(ws);

    // Initialize game info panel
    updateGameInfo(formData);

    return ws; // Return websocket instance for cleanup
  } catch (error) {
    console.error("Error loading 2D game page:", error);
    throw error;
  }
}

function handleGameMessage(message) {
  // Handle different message types
  const eventLog = document.getElementById("two-d-game__event-log-message");
  if (eventLog) {
    eventLog.textContent = message.text || "Game event received";
  }
}

function updateGameInfo(formData) {
  const gameInfo = document.getElementById("two-d-game__game-info");
  if (gameInfo) {
    gameInfo.innerHTML = `
      <div>Game Type: ${formData.gameType}</div>
      <div>Players: ${formData.numPlayers}</div>
      <div>Balls: ${formData.numBalls}</div>
      <div>Score Mode: ${formData.scoreMode}</div>
    `;
  }
}
