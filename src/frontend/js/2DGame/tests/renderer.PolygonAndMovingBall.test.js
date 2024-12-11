import { handleGameMessage } from "../gameCore.js";
import { setRendererState } from "../../store/renderer/state.js";

let animationFrameId = null;
const FPS = 60;
const FRAME_DURATION = 1000 / FPS;
let lastFrameTime = 0;

// Initial setup of the game state
const initialState = {
  type: "initial_state",
  message: "Initial state message",
  role: "player",
  player_values: {
    move_cooldown: 0.1, // 100ms between moves
    move_speed: 0.05, // Base movement speed
    move_speed_boost: 1.0, // No boost by default
    paddle_length: 0.3, // Matches dimensions.paddle_length
  },
  game_setup: {
    type: "polygon", // Specified game type
    vertices: [
      { x: -1, y: 1 }, // Added is_player flag
      { x: 1, y: 1 },
      { x: 1, y: -1 },
      { x: -1, y: -1 },
    ],
  },
  game_state: {
    balls: [
      {
        x: 0,
        y: 0,
        velocity_x: 0.01, // Reasonable initial velocity
        velocity_y: 0.01,
        size: 2,
      },
    ],
    paddles: [],
    scores: [0],
    dimensions: {
      paddle_length: 0.3,
      paddle_width: 0.2,
    },
    game_type: "classic",
  },
};

// Setup renderer state
setRendererState({
  svg: document.getElementById("gameTest"),
  vertices: [
    { x: -1, y: 1 }, // Top left
    { x: 1, y: 1 }, // Top right
    { x: 1, y: -1 }, // Bottom right
    { x: -1, y: -1 }, // Bottom left
  ],
  config: {
    viewBox: {
      minX: 0,
      minY: 0,
      width: 400,
      height: 250,
    },
    boundaries: {
      xMin: -1,
      xMax: 1,
      yMin: -1,
      yMax: 1,
    },
    scale: 1,
  },
});

// Initialize game with initial state
handleGameMessage(initialState);

function createGameStateUpdate(timestamp) {
  // Calculate ball position based on velocity and time
  const ball = initialState.game_state.balls[0];
  const elapsedSeconds = timestamp / 1000;

  return {
    type: "game_state",
    game_state: {
      balls: [
        {
          x: Math.sin(elapsedSeconds) * 0.8, // Move in circular pattern
          y: Math.cos(elapsedSeconds) * 0.8,
          velocity_x: ball.velocity_x,
          velocity_y: ball.velocity_y,
          size: ball.size,
        },
      ],
      paddles: [],
      scores: [0],
      dimensions: initialState.game_state.dimensions,
      game_type: "classic",
    },
  };
}

function animate(timestamp) {
  if (timestamp - lastFrameTime >= FRAME_DURATION) {
    const gameState = createGameStateUpdate(timestamp);
    handleGameMessage(gameState);
    lastFrameTime = timestamp;
  }

  animationFrameId = requestAnimationFrame(animate);
}

// Event Listeners
document.getElementById("startButton").addEventListener("click", () => {
  if (!animationFrameId) {
    animate(0);
  }
});

document.getElementById("stopButton").addEventListener("click", () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
});
