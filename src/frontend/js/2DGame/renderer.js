import { nastyGlobalRendererState as renderer, gameContext } from "./../store/globals.js";

/**
 * Initializes the renderer with all necessary data from the initial state message
 * @param {Object} message - Initial state message from server
 */
export function initializeRenderer(message) {
  renderer.type = message.game_setup.type;
  // TODO: throw an error if we dont get the vertices
  // Note: Vertices set only in initial state message
  renderer.vertices = message.game_setup.vertices || [];
  renderer.svg = document.getElementById("pongSvg");
  renderer.playerIndex = message.player_index;
  //   renderer.scoreList = document.getElementById("scoreDisplay");
  updateRenderer(message);
  if (!renderer.svg) {
    throw new Error("SVG element not found");
  }
}

/**
 * Updates renderer with initial state data
 * @param {Object} message - Initial state message from server
 */
export function updateRenderer(message) {
  if (!renderer.type) {
    console.warn("Renderer not initialized");
    return;
  }

  renderer.playerIndex = message.player_index;
  renderer.state = message.game_state;
}

/**
 * Updates renderer with new game state
 * @param {RendererState} renderer - The renderer state object
 * @param {Object} gameState - New game state
 */
export function updateRenderer(renderer, gameState) {
  renderer.state = gameState;
  render(renderer);
}

/**
 * Creates an SVG element with given attributes
 * @param {RendererState} renderer - The renderer state object
 * @param {string} type - Type of SVG element
 * @param {Object} attributes - Element attributes
 */
export function createSVGElement(type, attributes) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", type);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  return element;
}

/**
 * Renders the score display
 */
export function renderScores() {
  const scoreDisplay = document.getElementById("two-d-game__score-list");
  if (!scoreDisplay || !gameContext.players.length) {
    console.warn("Score display not found or no players available", {
      scoreDisplay,
      players: gameContext.players,
    });
    return;
  }

  scoreDisplay.innerHTML = "";
  const template = document.getElementById("two-d-game__score-item-template");

  gameContext.players
    .sort((a, b) => a.index - b.index) // Ensure consistent display order
    .forEach((player) => {
      const scoreItem = template.content.cloneNode(true);
      const container = scoreItem.querySelector(".two-d-game__score-item");

      if (player.isCurrentPlayer) {
        container.classList.add("two-d-game__score-item--current");
      }

      container.querySelector(".two-d-game__player-name").textContent = player.isCurrentPlayer
        ? "You"
        : player.username;
      container.querySelector(".two-d-game__player-score").textContent = player.score.toString();

      scoreDisplay.appendChild(scoreItem);
    });
}

/**
 * Renders all balls in the game
 * @param {RendererState} renderer - The renderer state object
 */
export function renderBalls(renderer) {
  if (!renderer.svg || !renderer.state.balls) {
    console.warn("No SVG element or balls available for rendering", {
      svg: renderer.svg,
      balls: renderer.state.balls,
    });
    return;
  }

  renderer.state.balls.forEach((ball) => {
    const ballX = renderer.config.center + ball.x * renderer.config.scale;
    const ballY = renderer.config.center - ball.y * renderer.config.scale;

    renderer.svg.appendChild(
      createSVGElement(renderer, "circle", {
        cx: ballX,
        cy: ballY,
        r: ball.size * renderer.config.scale,
        fill: "yellow",
        stroke: "black",
        "stroke-width": "1",
      })
    );
  });
}

/**
 * Shows game over message
 * @param {RendererState} renderer - The renderer state object
 * @param {boolean} isWinner - Whether the player won
 */
export function showGameOver(renderer, isWinner) {
  if (!renderer.svg) return;

  const message = isWinner ? "YOU WIN!" : "GAME OVER";
  const textElement = createSVGElement(renderer, "text", {
    x: renderer.config.center,
    y: renderer.config.center,
    "text-anchor": "middle",
    "dominant-baseline": "middle",
    "font-size": "24px",
    "font-weight": "bold",
    fill: isWinner ? "green" : "red",
  });
  textElement.textContent = message;
  renderer.svg.appendChild(textElement);
}

/**
 * Main render function that delegates to specific renderers
 * @param {RendererState} renderer - The renderer state object
 */
export function render(renderer) {
  if (renderer.type === "polygon") {
    renderPolygonGame(renderer);
  } else if (renderer.type === "circular") {
    renderCircularGame(renderer);
  }
}

export function renderPolygonGame(renderer) {
  // Validate required data is available
  if (!renderer.state || !renderer.svg || !renderer.vertices || renderer.vertices.length === 0) {
    console.warn("Missing required data for rendering", {
      hasState: !!renderer.state,
      hasSvg: !!renderer.svg,
      verticesLength: renderer.vertices?.length,
    });
    return;
  }

  // Log render debug info
  console.log("Rendering polygon with:", {
    verticesCount: renderer.vertices.length,
    paddlesCount: renderer.state.paddles.length,
    svgElement: renderer.svg.id,
  });

  // Clear previous render
  renderer.svg.innerHTML = "";

  try {
    // Render components
    renderPolygonOutline(renderer);
    renderer.state.paddles.forEach((paddle) => {
      renderPaddle(renderer, paddle, paddle.side_index);
    });
    renderBalls(renderer);
    renderScores(renderer);
  } catch (error) {
    console.error("Error rendering polygon:", error);
    showError(renderer, {
      type: "render",
      message: "Failed to render polygon",
      details: error.message,
      stack: error.stack,
    });
  }
}

function transformVertices(renderer, vertices) {
  return vertices.map((vertex) => ({
    x: renderer.config.center + vertex.x * renderer.config.scale,
    y: renderer.config.center - vertex.y * renderer.config.scale,
  }));
}

export function renderPolygonOutline(renderer) {
  if (!renderer.vertices || renderer.vertices.length === 0) {
    console.warn("No vertices available for polygon outline");
    return;
  }

  const transformedVertices = transformVertices(renderer, renderer.vertices);
  const pathData = transformedVertices.map((vertex, i) => `${i === 0 ? "M" : "L"} ${vertex.x} ${vertex.y}`).join(" ");

  // Draw main polygon outline
  renderer.svg.appendChild(
    createSVGElement(renderer, "path", {
      d: `${pathData} Z`,
      fill: "none",
      stroke: "#808080",
      "stroke-width": "2",
    })
  );

  // Add labels for each side
  transformedVertices.forEach((vertex, i) => {
    const nextVertex = transformedVertices[(i + 1) % transformedVertices.length];

    // Calculate midpoint and offset for label
    const midX = (vertex.x + nextVertex.x) / 2;
    const midY = (vertex.y + nextVertex.y) / 2;
    const dx = nextVertex.x - vertex.x;
    const dy = nextVertex.y - vertex.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const offsetX = (-dy / len) * 20;
    const offsetY = (dx / len) * 20;

    // Add side number label
    const label = createSVGElement(renderer, "text", {
      x: midX + offsetX,
      y: midY + offsetY,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
      "font-size": "14px",
      fill: "gray",
    });
    label.textContent = `side ${i}`;
    renderer.svg.appendChild(label);
  });
}
