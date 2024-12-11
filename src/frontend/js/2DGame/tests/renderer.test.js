import { renderPolygonGame } from "../renderer.js";
import { getGameContext } from "../../store/game/context.js";

// Set up test data
const context = getGameContext();
context.players = [
  { index: 0, username: "Player 1", score: 0, isCurrentPlayer: true },
  { index: 1, username: "Player 2", score: 0, isCurrentPlayer: false },
  { index: 2, username: "Player 3", score: 0, isCurrentPlayer: false },
];

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

// Animation state
let normalAnimationFrame;
let collisionAnimationFrame;
let ballSpeed = { x: 0.02, y: 0.02 };

function createTestRenderer(svgId, withCollision = false) {
  const svg = document.getElementById(svgId);
  if (!svg) {
    console.error(`SVG element with id ${svgId} not found`);
    return null;
  }

  const state = { ...mockGameState };
  if (withCollision) {
    state.collision = {
      side_index: 0,
      type: "paddle",
      position: 0.5,
      time: Date.now(),
    };
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
    state: state,
    playerIndex: 0,
  };
}

function animate(renderer, isCollision = false) {
  // Move ball
  renderer.state.balls[0].x += ballSpeed.x;
  renderer.state.balls[0].y += ballSpeed.y;

  // Simple boundary checking
  if (Math.abs(renderer.state.balls[0].x) > 0.8) {
    ballSpeed.x *= -1;
    if (isCollision) {
      renderer.state.collision = {
        side_index: renderer.state.balls[0].x > 0 ? 0 : 2,
        type: "paddle",
        position: renderer.state.paddles[0].position,
        time: Date.now(),
      };
    }
  }
  if (Math.abs(renderer.state.balls[0].y) > 0.8) {
    ballSpeed.y *= -1;
    if (isCollision) {
      renderer.state.collision = {
        side_index: renderer.state.balls[0].y > 0 ? 1 : 3,
        type: "paddle",
        position: renderer.state.paddles[1].position,
        time: Date.now(),
      };
    }
  }

  // Move paddles with oscillation
  renderer.state.paddles.forEach((paddle, index) => {
    paddle.position = 0.5 + Math.sin(Date.now() * 0.002 + (index * Math.PI) / 2) * 0.3;
  });

  // Clear and redraw
  renderer.svg.innerHTML = "";
  renderPolygonGame(renderer);

  // Continue animation
  if (isCollision) {
    collisionAnimationFrame = requestAnimationFrame(() => animate(renderer, true));
  } else {
    normalAnimationFrame = requestAnimationFrame(() => animate(renderer, false));
  }
}

// Run tests
function runTests() {
  try {
    // Test normal state
    const normalRenderer = createTestRenderer("normalState");
    if (normalRenderer) {
      animate(normalRenderer, false);
    }

    // Test collision state
    const collisionRenderer = createTestRenderer("collisionState", true);
    if (collisionRenderer) {
      animate(collisionRenderer, true);
    }

    // Add control buttons
    const controls = document.createElement("div");
    controls.innerHTML = `
      <button id="speedUp">Speed Up</button>
      <button id="slowDown">Slow Down</button>
      <button id="toggleAnimation">Pause/Resume</button>
      <button id="triggerCollision">Trigger Collision</button>
    `;
    document.body.appendChild(controls);

    let isPaused = false;

    document.getElementById("speedUp").onclick = () => {
      ballSpeed.x *= 1.5;
      ballSpeed.y *= 1.5;
    };

    document.getElementById("slowDown").onclick = () => {
      ballSpeed.x *= 0.75;
      ballSpeed.y *= 0.75;
    };

    document.getElementById("toggleAnimation").onclick = () => {
      isPaused = !isPaused;
      if (isPaused) {
        cancelAnimationFrame(normalAnimationFrame);
        cancelAnimationFrame(collisionAnimationFrame);
      } else {
        animate(normalRenderer, false);
        animate(collisionRenderer, true);
      }
    };

    document.getElementById("triggerCollision").onclick = () => {
      collisionRenderer.state.collision = {
        side_index: Math.floor(Math.random() * 4),
        type: "paddle",
        position: 0.5,
        time: Date.now(),
      };
    };
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run tests when page loads
window.addEventListener("load", runTests);

// Cleanup on page unload
window.addEventListener("unload", () => {
  cancelAnimationFrame(normalAnimationFrame);
  cancelAnimationFrame(collisionAnimationFrame);
});
