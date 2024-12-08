// TODO: Implement game controller functional
// TODO: Rename maybe to gameCore.js
// Import necessary dependencies
import { gameState, gameConfig, updateGameState } from "../store/index.js";
import { initializeRenderer, updateRenderer } from "./renderer.js";
import { disconnectGameSocket } from "../services/gameSocketService.js";
import { showGameOver } from "./utils.js";
import { updateGameContext } from "../store/index.js";

export function handleGameMessage(message, onEvent = null) {
  try {
    switch (message.type) {
      case "initial_state":
        handleInitialState(message, onEvent);
        break;

      case "game_state":
        handleGameState(message, onEvent);
        break;

      case "game_event":
        handleGameEvent(message, onEvent);
        break;

      case "game_finished":
        handleGameFinished(message, onEvent);
        break;

      case "error":
        handleError(message, onEvent);
        break;
    }
  } catch (error) {
    console.error("Error handling message:", error);
  }
}

function handleInitialState(message, onEvent) {
  console.log("Initial game state received:", message);
  console.log("onEvent:", onEvent);
  // Players are still missing
  updateGameContext(message);
  initializeRenderer(message);

  console.warn("Disconnecting game socket after receiving initial state - Just for testing");
  // Disconnect after receiving initial state
  disconnectGameSocket();

  if (onEvent) {
    onEvent({
      type: "info",
      message: "Game initialized",
      details: `Player ${gameState.currentPlayer.id} joined game ${gameConfig.gameId}`,
    });
  }
}

function handleGameState(message, onEvent) {
  // Update game state
  updateGameState(message.game_state);

  // Update renderer if available
  if (renderer?.type) {
    renderer.update(message.game_state);
  }

  // Could add onEvent here if needed
  if (onEvent) {
    onEvent({
      type: "state",
      message: "Game state updated",
      details: "", // Could add specific details if needed
    });
  }
}

export function handleGameEvent(message, onEvent) {
  // Update game state if provided
  if (message.game_state) {
    updateGameState(message.game_state);
  }

  // Update renderer if available
  if (renderer?.type) {
    renderer.update(message.game_state);
  }

  // Notify through callback
  if (onEvent) {
    onEvent({
      type: "game",
      message: `Game Event: ${message.event_type}`,
      details: message.details || "",
    });
  }
}

export function handleGameFinished(message, onEvent) {
  updateGameState(message.game_state);

  // Show game over in renderer
  showGameOver(message.winner === "you");
  updateRenderer(message);
  disconnectGameSocket();

  if (onEvent) {
    onEvent({
      type: "info",
      message: "Game finished",
      details: `Winner: ${message.winner}`,
    });
  }
}

function handleError(message, onEvent) {
  console.error("Game Error:", message.message || "Unknown error");

  if (onEvent) {
    onEvent({
      type: "error",
      message: message.message || "Unknown error",
      details: message.details || "",
    });
  }
}
