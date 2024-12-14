import { updateActiveNavItem } from "../components/bottomNav.js";
import GameWebSocket from "../utils/websocket.js";
import { handleGameMessage } from "../2DGame/gameCore.js";

export let websocket = null;

export async function loadGame2D(gameId, wsUrl, addToHistory = true) {
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

    const template = document.getElementById("two-d-game__game-template");
    if (!template) {
      throw new Error("2D game template not found");
    }

    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = "";
    mainContent.appendChild(document.importNode(template.content, true));

    websocket = new GameWebSocket(handleGameMessage);
    websocket.connect(wsUrl);
  } catch (error) {
    console.error("Error loading 2D game page:", error);
    throw error;
  }
}
