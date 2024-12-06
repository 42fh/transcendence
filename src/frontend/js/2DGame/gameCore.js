// TODO: Implement game controller functional
// TODO: Rename maybe to gameCore.js
// Import necessary dependencies
import { gameState, gameConfig, updateGameState, initializeRenderer } from "../store/globals.js";

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
  gameState.currentState = message.game_state;

  initializeRenderer(message.game_setup.type);

  if (onEvent) {
    onEvent({
      type: "info",
      message: "Game initialized",
      details: `Player ${gameState.currentPlayer.id} joined game ${gameConfig.gameId}`,
    });
  }
}

function handleGameState(message) {
  //   gameState.currentState = message.game_state;
  updateGameState(message.game_state);
  if (renderer.type) renderer.update(message.game_state);
}

function handleGameEvent(message, onEvent) {
  console.log("Game Event:", message.game_state.type);

  if (onEvent) {
    onEvent({
      type: "game",
      message: `Game Event: ${message.game_state.type}`,
      details: "not set",
    });
  }
}

function handleGameFinished(message, onEvent) {
  gameState.currentState = message.game_state;

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
