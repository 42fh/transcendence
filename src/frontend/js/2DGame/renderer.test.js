import { renderPolygonGame } from "./renderer.js";

window.gameContext = {
  players: [
    { index: 0, username: "Player 1", score: 0, isCurrentPlayer: true },
    { index: 1, username: "Player 2", score: 0, isCurrentPlayer: false },
    { index: 2, username: "Player 3", score: 0, isCurrentPlayer: false },
  ],
};

// Mock game state for testing
const mockGameState = {
  type: "polygon",
  dimensions: {
    paddle_length: 0.2,
    paddle_width: 0.1,
    ball_size: 0.05,
  },
  paddles: [
    { active: true, position: 0.5, side_index: 0 },
    { active: true, position: 0.5, side_index: 1 },
    { active: true, position: 0.5, side_index: 2 },
  ],
  balls: [{ x: 0, y: 0, size: 0.05 }],
  scores: [0, 0, 0],
  collision: null,
};

// Create two test renderers for different states
function createTestRenderer(svgId) {
  const svg = document.getElementById(svgId);
  if (!svg) {
    console.error(`SVG element with id ${svgId} not found`);
    return null;
  }
  return {
    type: "polygon",
    config: {
      viewboxSize: 300,
      scale: 75,
      center: 150,
      debug: true,
    },
    svg: svg,
    vertices: [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 0, y: -1 },
    ],
    state: { ...mockGameState },
    playerIndex: 0,
    showError: (msg) => console.error(msg), // Add error handler
  };
}

// Run tests
function runTests() {
  try {
    console.log("Before tests - gameContext:", window.gameContext);

    // Test normal state
    const normalRenderer = createTestRenderer("normalState");
    if (normalRenderer) {
      console.log("Before rendering normal - gameContext:", window.gameContext);
      renderPolygonGame(normalRenderer);
      console.log("After rendering normal - gameContext:", window.gameContext);
    }

    // Test collision state
    const collisionRenderer = createTestRenderer("collisionState");
    if (collisionRenderer) {
      console.log("Before rendering collision - gameContext:", window.gameContext);
      collisionRenderer.state.collision = { side_index: 0, type: "paddle" };
      renderPolygonGame(collisionRenderer);
      console.log("After rendering collision - gameContext:", window.gameContext);
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run tests when page loads
window.addEventListener("load", runTests);
