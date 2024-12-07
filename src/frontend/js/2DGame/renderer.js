import { nastyGlobalRendererState as renderer, getGameContext } from "./../store/index.js";
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

  // Update scores in game context
  if (message.game_state.scores) {
    const gameContext = getGameContext();
    gameContext.players.forEach((player) => {
      player.score = message.game_state.scores[player.index] || 0;
    });
  }
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
      createSVGElement("circle", {
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
  const textElement = createSVGElement("text", {
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
  if (!renderer.type) {
    console.warn("Renderer not initialized");
    return;
  }

  try {
    switch (renderer.type) {
      case "polygon":
        renderPolygonGame(renderer);
        break;
      case "circular":
        // renderCircularGame(renderer);
        console.warn("Circular game not implemented");
        break;
      default:
        console.warn(`Unknown renderer type: ${renderer.type}`);
    }
  } catch (error) {
    console.error("Error in render:", error);
    showError(renderer, {
      type: "render",
      message: "Failed to render game",
      details: error.message,
    });
  }
}

/**
 * Renders the polygon game type
 * @param {RendererState} renderer - The renderer state object
 */
export function renderPolygonGame(renderer) {
  console.log("Entering renderPolygonGame");
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
  //   console.log("Rendering polygon with:", {
  //     verticesCount: renderer.vertices.length,
  //     paddlesCount: renderer.state.paddles.length,
  //     svgElement: renderer.svg.id,
  //   });

  // Clear previous render
  renderer.svg.innerHTML = "";

  try {
    // Render components
    renderPolygonOutline(renderer);
    // renderer.state.paddles.forEach((paddle) => {
    //   renderPaddle(renderer, paddle, paddle.side_index);
    // });
    renderPaddles(renderer);
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

/**
 * Renders a single paddle on its assigned side
 * @param {RendererState} renderer - The renderer state object
 * @param {Object} paddle - Paddle data from game state
 * @param {number} sideIndex - Index of the side where paddle should be rendered
 * @param {boolean} debug - Flag to show debug information
 */
export function renderPaddle(renderer, paddle, sideIndex, debug = false) {
  // Skip inactive paddles
  if (!paddle.active || !renderer.vertices) return;

  // Transform vertices
  const transformedVertices = transformVertices(renderer, renderer.vertices);
  const startVertex = transformedVertices[sideIndex];
  const endVertex = transformedVertices[(sideIndex + 1) % transformedVertices.length];

  // Calculate paddle geometry
  const sideX = endVertex.x - startVertex.x;
  const sideY = endVertex.y - startVertex.y;
  const sideLength = Math.sqrt(sideX * sideX + sideY * sideY);

  // Calculate normalized vectors
  const normalizedSideX = sideX / sideLength;
  const normalizedSideY = sideY / sideLength;
  const normalX = sideY / sideLength;
  const normalY = -sideX / sideLength;

  // Calculate paddle position and dimensions
  const paddleX = startVertex.x + sideX * paddle.position;
  const paddleY = startVertex.y + sideY * paddle.position;
  const paddleLength = renderer.state.dimensions.paddle_length * sideLength;
  const paddleWidth = renderer.state.dimensions.paddle_width * renderer.config.scale;
  const hitZoneWidth =
    (renderer.state.dimensions.paddle_width + (renderer.state.dimensions.ball_size || 0.1) * 2) * renderer.config.scale;

  // Determine paddle state
  const isCurrentPlayer = renderer.state.paddles.indexOf(paddle) === renderer.playerIndex;

  // Render paddle
  const paddlePoints = calculatePaddlePoints(
    paddleX,
    paddleY,
    normalizedSideX,
    normalizedSideY,
    normalX,
    normalY,
    paddleLength,
    paddleWidth
  );

  renderer.svg.appendChild(
    createSVGElement("polygon", {
      points: paddlePoints,
      fill: isCurrentPlayer ? "rgba(255,165,0,0.6)" : "rgba(0,0,255,0.6)",
      stroke: isCurrentPlayer ? "orange" : "blue",
      "stroke-width": "1",
    })
  );

  if (debug) {
    const isColliding = renderer.state.collision?.side_index === paddle.side_index;

    // Render hit zone if debug mode is on
    const hitZonePoints = calculatePaddlePoints(
      paddleX,
      paddleY,
      normalizedSideX,
      normalizedSideY,
      normalX,
      normalY,
      paddleLength,
      hitZoneWidth
    );

    renderer.svg.appendChild(
      createSVGElement("polygon", {
        points: hitZonePoints,
        fill: isColliding ? "rgba(255,0,0,0.1)" : "rgba(0,255,0,0.1)",
        stroke: isColliding ? "red" : "green",
        "stroke-width": "1",
        "stroke-dasharray": "4",
      })
    );

    // Add paddle label
    const labelX = paddleX + normalX * (hitZoneWidth + 20);
    const labelY = paddleY + normalY * (hitZoneWidth + 20);
    const playerIndex = renderer.state.paddles.indexOf(paddle);

    renderer.svg.appendChild(
      createSVGElement("text", {
        x: labelX,
        y: labelY,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        fill: isCurrentPlayer ? "orange" : "blue",
        "font-size": "12px",
        textContent: `P${playerIndex + 1}`,
      })
    );
  }
}

// Update the renderPaddles function to pass the debug flag
export function renderPaddles(renderer) {
  if (!renderer.state?.paddles) {
    console.warn("No paddles available for rendering");
    return;
  }

  renderer.state.paddles.forEach((paddle) => {
    renderPaddle(renderer, paddle, paddle.side_index, renderer.config.debug);
  });
}

/**
 * Helper function to calculate paddle points
 */
function calculatePaddlePoints(x, y, normalizedSideX, normalizedSideY, normalX, normalY, length, width) {
  return [
    `${x - (normalizedSideX * length) / 2},${y - (normalizedSideY * length) / 2}`,
    `${x + (normalizedSideX * length) / 2},${y + (normalizedSideY * length) / 2}`,
    `${x + (normalizedSideX * length) / 2 + normalX * width},${y + (normalizedSideY * length) / 2 + normalY * width}`,
    `${x - (normalizedSideX * length) / 2 + normalX * width},${y - (normalizedSideY * length) / 2 + normalY * width}`,
  ].join(" ");
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
    createSVGElement("path", {
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
    const label = createSVGElement("text", {
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
