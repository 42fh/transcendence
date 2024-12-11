import { renderPolygonGame } from "../renderer.js";
import { getGameContext } from "../../store/game/context.js";

// Set up test data
const context = getGameContext();

// Mock game state for ball physics testing
const mockBallState = {
  type: "polygon",
  dimensions: {
    ball_size: 0.05,
  },
  paddles: [], // No paddles in this test
  balls: [], // Start empty, will add ball with random velocity
  scores: [],
  collision: null,
  players: [{ index: 0, username: "Test", score: 0 }],
  scoreDisplay: document.createElement("div"),
};

let isPaused = false;
let animationFrame;
const BOUNCE_FACTOR = 0.98;
const WALL_BOUNDARY = 0.85; // Slightly reduced to make bouncing more visible
const INITIAL_SPEED = 0.03; // Reduced initial speed for better control

function createBallTestRenderer(svgId) {
  const svg = document.getElementById(svgId);
  if (!svg) {
    console.error(`SVG element with id ${svgId} not found`);
    return null;
  }

  // Create a dummy score display element
  const scoreDisplay = document.createElement("div");
  scoreDisplay.id = "two-d-game__score-list";
  document.body.appendChild(scoreDisplay);

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
    state: {
      ...mockBallState,
      scoreDisplay: scoreDisplay,
    },
    playerIndex: 0,
  };
}

function checkDiamondCollision(x, y) {
  // Diamond boundary equation: |x| + |y| = 1 (for unit diamond)
  return Math.abs(x) + Math.abs(y) >= WALL_BOUNDARY;
}

function getReflectionVector(x, y) {
  // Determine which side of the diamond we hit
  const absX = Math.abs(x);
  const absY = Math.abs(y);

  if (absX > absY) {
    // Hit left or right side
    return { x: -1, y: 1 };
  } else {
    // Hit top or bottom side
    return { x: 1, y: -1 };
  }
}

function animateBall(renderer) {
  if (isPaused) {
    return;
  }

  renderer.state.balls.forEach((ball) => {
    // Store previous position
    const prevX = ball.x;
    const prevY = ball.y;

    // Update ball position
    ball.x += ball.velocity.x;
    ball.y += ball.velocity.y;

    // Diamond collision detection
    if (checkDiamondCollision(ball.x, ball.y)) {
      // Get reflection vector
      const reflection = getReflectionVector(ball.x, ball.y);

      // Reset to previous position
      ball.x = prevX;
      ball.y = prevY;

      // Apply reflection and bounce factor
      ball.velocity.x *= reflection.x * BOUNCE_FACTOR;
      ball.velocity.y *= reflection.y * BOUNCE_FACTOR;
    }
  });

  // Clear and redraw
  renderer.svg.innerHTML = "";
  renderPolygonGame(renderer);

  // Update status
  document.getElementById("ballCount").textContent = renderer.state.balls.length;

  // Continue animation
  animationFrame = requestAnimationFrame(() => animateBall(renderer));
}

// Add ball with random direction
function addRandomBall(renderer) {
  const speed = INITIAL_SPEED;
  const angle = Math.random() * Math.PI * 2;

  renderer.state.balls.push({
    x: 0,
    y: 0,
    size: 0.05,
    velocity: {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    },
  });
}

function runBallTest() {
  try {
    const renderer = createBallTestRenderer("ballPhysics");
    if (renderer) {
      // Initialize with random direction
      addRandomBall(renderer);
      animateBall(renderer);

      // Add Pause button
      const pauseButton = document.createElement("button");
      pauseButton.id = "pauseBall";
      pauseButton.textContent = "Pause";
      pauseButton.style.background = "#ff9800";
      document.querySelector(".control-group").appendChild(pauseButton);

      // Pause button handler
      document.getElementById("pauseBall").onclick = () => {
        isPaused = !isPaused;
        pauseButton.textContent = isPaused ? "Resume" : "Pause";
        if (!isPaused) {
          animateBall(renderer);
        }
      };

      // Set up controls
      document.getElementById("resetBall").onclick = () => {
        renderer.state.balls.forEach((ball) => {
          ball.x = 0;
          ball.y = 0;
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.04;
          ball.velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed,
          };
        });
      };

      document.getElementById("addBall").onclick = () => {
        addRandomBall(renderer);
      };

      document.getElementById("clearBalls").onclick = () => {
        renderer.state.balls = [];
        addRandomBall(renderer); // Keep at least one ball
      };

      let gravityEnabled = false;
      document.getElementById("toggleGravity").onclick = () => {
        gravityEnabled = !gravityEnabled;
        document.getElementById("gravityStatus").textContent = gravityEnabled ? "On" : "Off";
        if (gravityEnabled) {
          function applyGravity() {
            renderer.state.balls.forEach((ball) => {
              ball.velocity.y -= 0.001;
            });
            if (gravityEnabled) {
              requestAnimationFrame(applyGravity);
            }
          }
          applyGravity();
        }
      };

      document.getElementById("speedControl").oninput = (e) => {
        const speedFactor = e.target.value / 100;
        document.getElementById("speedValue").textContent = `${e.target.value}%`;
        renderer.state.balls.forEach((ball) => {
          const currentSpeed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
          const angle = Math.atan2(ball.velocity.y, ball.velocity.x);
          ball.velocity.x = Math.cos(angle) * currentSpeed * speedFactor;
          ball.velocity.y = Math.sin(angle) * currentSpeed * speedFactor;
        });
      };
    }
  } catch (error) {
    console.error("Ball physics test failed:", error);
  }
}

// Run test when page loads
window.addEventListener("load", runBallTest);

// Cleanup on page unload
window.addEventListener("unload", () => {
  cancelAnimationFrame(animationFrame);
});
