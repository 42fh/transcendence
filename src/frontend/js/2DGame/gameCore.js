import { gameState, gameConfig, updateGameState } from "../store/index.js";
import { initializeRenderer, updateRenderer } from "./renderer.js";
import { showGameOver } from "./utils.js";
import { updateGameContext, getGameContext } from "../store/index.js";
import { updateGameInfo } from "./utils.js";
import { websocket } from "../views/game2D.js";

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
        // Add specific handling for paddle movement errors
        if (message.message.includes("move")) {
          console.warn("Paddle movement error:", message.message);
        }
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

  const gameContext = getGameContext();

  console.log("Initializing controls for player:", gameContext.player_index);

  if (gameContext.role === "player") {
    initializeControls();
  }

  const INVALID_VALUE = "❌"; // or "???" or "—" or "N/A"
  if (!gameContext) {
    console.warn("Game context is not available");
    return;
  }
  if (
    !gameContext.player_index ||
    !gameContext.game_setup.type ||
    !gameContext.players.length ||
    !gameContext.game_state.balls.length
  ) {
    console.warn({
      "gameContext.player_index": gameContext.player_index,
      "gameContext.game_setup.type": gameContext.game_setup.type,
      "gameContext.players.length": gameContext.players.length,
      "gameContext.game_state.balls.length":
        gameContext.game_state.balls.length,
    });
    return;
  }
  const gameContextInfoItems = [
    { label: "Player ID", value: gameContext.player_index },
    { label: "Game Type", value: gameContext.game_setup.type },
    { label: "Players", value: gameContext.players.length || INVALID_VALUE },
    {
      label: "Balls",
      value: gameContext.game_state.balls.length || INVALID_VALUE,
    },
  ];

  if (gameContext.game_setup.sides) {
    gameContextInfoItems.push({
      label: "Sides",
      value: gameContext.game_setup.sides || INVALID_VALUE,
    });
  }
  if (gameContext.game_setup.shape) {
    gameContextInfoItems.push({
      label: "Shape",
      value: gameContext.game_setup.shape || INVALID_VALUE,
    });
  }

  updateGameInfo(gameContextInfoItems);
  initializeRenderer(message);

  //   console.warn("Disconnecting game socket after receiving initial state - Just for testing");
  // Disconnect after receiving initial state
  //   disconnectGameSocket();

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
  //   if (renderer?.type) {
  //     renderer.update(message.game_state);
  //   }
  updateRenderer(message);

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
  // if (renderer?.type) {
  //   renderer.update(message.game_state);
  // }

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
  websocket.disconnect();

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

export function initializeControls(debug = false) {
  debug = true;
  if (debug) {
    console.log("Initializing controls");
  }

  document.addEventListener("keydown", (event) => {
    let direction = null;
    if (event.key === "ArrowLeft" || event.key === "a") {
      direction = "left";
    } else if (event.key === "ArrowRight" || event.key === "d") {
      direction = "right";
    }

    if (direction) {
      console.log("Sending paddle move:", direction);
      sendPaddleMove(direction);
    }
  });
}

let lastMoveTime = 0;
const MOVE_COOLDOWN = 0.1; // seconds, should come from player_values

function sendPaddleMove(direction, debug = false) {
  const gameContext = getGameContext();
  const currentTime = Date.now() / 1000; // Convert to seconds

  // Check cooldown
  if (currentTime - lastMoveTime < MOVE_COOLDOWN) {
    return;
  }

  console.log("gameContext:", gameContext);
  websocket.sendMessage({
    action: "move_paddle",
    direction,
    user_id: gameContext.player_id,
  });

  lastMoveTime = currentTime;
}

// Add error handling in handleGameMessage
