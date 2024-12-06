import { renderPolygonGame } from "./renderer.js";

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
    state: { ...mockGameState }, // Clone the state
    playerIndex: 0,
  };
}

// Run tests
function runTests() {
  // Test normal state
  const normalRenderer = createTestRenderer("normalState");
  renderPolygonGame(normalRenderer);

  // Test collision state
  const collisionRenderer = createTestRenderer("collisionState");
  collisionRenderer.state.collision = { side_index: 0, type: "paddle" };
  renderPolygonGame(collisionRenderer);
}

// Run tests when page loads
window.addEventListener("load", runTests);
