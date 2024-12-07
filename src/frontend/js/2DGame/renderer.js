// import { rendererState as renderer, getGameContext } from "./../store/index.js";
import { getRendererState, setRendererState } from "./../store/index.js";
import { getGameContext } from "./../store/game/context.js";
/**
 * Initializes the renderer with all necessary data from the initial state message
 * @param {Object} message - Initial state message from server
 */
export function initializeRenderer(message) {
  const renderer = getRendererState();
  setRendererState({
    type: message.game_setup.type,
    vertices: message.game_setup.vertices || [],
    svg: document.getElementById("pongSvg"),
    playerIndex: message.player_index,
  });
  initializeSVG();
  updateRenderer(message);
}

function initializeSVG() {
  const renderer = getRendererState();
  if (!renderer.svg) {
    console.error("SVG element not found");
    return;
  }

  // Set viewBox from config
  const viewBox = renderer.config.viewBox;
  renderer.svg.setAttribute("viewBox", `${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`);

  // Log verification
  console.log("ViewBox verification:", {
    config: renderer.config.viewBox,
    svgAttribute: renderer.svg.getAttribute("viewBox"),
    svgViewBox: renderer.svg.viewBox.baseVal,
  });
  verifyViewBoxConsistency();
}

// This function is used to verifty that the values of the SVG viewBox are consistent with the values in the config
function verifyViewBoxConsistency() {
  const renderer = getRendererState();
  const config = renderer.config.viewBox;
  const svg = renderer.svg;
  const svgViewBox = svg.viewBox.baseVal;

  const isConsistent =
    config.minX === svgViewBox.x &&
    config.minY === svgViewBox.y &&
    config.width === svgViewBox.width &&
    config.height === svgViewBox.height;

  if (!isConsistent) {
    console.error("ViewBox mismatch:", {
      config,
      svg: {
        x: svgViewBox.x,
        y: svgViewBox.y,
        width: svgViewBox.width,
        height: svgViewBox.height,
      },
    });
  }

  return isConsistent;
}

/**
 * Updates renderer with initial state data
 * @param {Object} message - Initial state message from server
 */
export function updateRenderer(message) {
  const renderer = getRendererState();
  if (!renderer.type) {
    console.warn("Renderer not initialized");
    return;
  }
  setRendererState({
    playerIndex: message.player_index,
    state: message.game_state,
  });

  // Update scores in game context
  if (message.game_state.scores) {
    const gameContext = getGameContext();
    gameContext.players.forEach((player) => {
      player.score = message.game_state.scores[player.index] || 0;
    });
  }
  // TODO: Probably we should call getRendererState() inside render()
  render();
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
 */
export function renderBalls() {
  const renderer = getRendererState();
  if (!renderer.svg || !renderer.state.balls) {
    console.warn("No SVG element or balls available for rendering", {
      svg: renderer.svg,
      balls: renderer.state.balls,
    });
    return;
  }
  const centerX = renderer.config.centered ? renderer.config.viewBox.width / 2 : 0;
  const centerY = renderer.config.centered ? renderer.config.viewBox.height / 2 : 0;

  renderer.state.balls.forEach((ball) => {
    const ballX = centerX + ball.x * renderer.config.scale;
    const ballY = centerY - ball.y * renderer.config.scale;

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
 * @param {boolean} isWinner - Whether the player won
 */
export function showGameOver(isWinner) {
  const renderer = getRendererState();
  if (!renderer.svg) return;

  const centerX = renderer.config.centered ? renderer.config.viewBox.width / 2 : 0;
  const centerY = renderer.config.centered ? renderer.config.viewBox.height / 2 : 0;

  const message = isWinner ? "YOU WIN!" : "GAME OVER";
  const textElement = createSVGElement("text", {
    x: centerX,
    y: centerY,
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
export function render() {
  const renderer = getRendererState();
  if (!renderer.type) {
    console.warn("Renderer not initialized");
    return;
  }

  try {
    switch (renderer.type) {
      case "polygon":
        renderPolygonGame();
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
export function renderPolygonGame() {
  const renderer = getRendererState();
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
    // renderBalls(renderer);
    renderBalls();
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

/**
 * Transforms normalized game coordinates from backend (-1 to 1) to SVG viewBox coordinates.
 * This transformation is used for all game elements (vertices/polygon, paddles, balls).
 *
 * The transformation pipeline:
 * 1. Input: Normalized coordinates from backend (-1 to 1 range)
 * 2. Rotation: Apply any game rotation
 * 3. Scaling: Scale to match SVG size using config.scale
 * 4. Translation: Move to SVG position (centered or not based on config)
 *
 * @param {Object} renderer - The renderer object containing configuration
 * @param {Array<{x: number, y: number}>} vertices - Array of normalized coordinates from backend
 * @returns {Array<{x: number, y: number}>} Transformed coordinates in SVG viewBox space
 *
 * @example
 * // Backend sends: [{x: 1, y: 1}, {x: -1, y: -1}]
 * // With scale: 100, centered: true, viewBox: 800x600
 * // Returns: [{x: 500, y: 200}, {x: 300, y: 400}]
 *
 * @todo Rename function to better reflect its purpose (e.g., mapBackendToSVGCoordinates or mapBakendGameNormalizedCoordinatesAkaVerticesToSVGViewboxCoordinates)
 */
function transformVertices() {
  const renderer = getRendererState();
  const vertices = renderer.vertices;

  // Convert rotation to radians
  const angleInRadians = ((renderer.config.rotation || 0) * Math.PI) / 180;
  // Get center point if centered is true
  const centerX = renderer.config.centered ? renderer.config.viewBox.width / 2 : 0;
  const centerY = renderer.config.centered ? renderer.config.viewBox.height / 2 : 0;

  return vertices.map((vertex) => {
    // 1. First rotate
    const rotatedX = vertex.x * Math.cos(angleInRadians) - vertex.y * Math.sin(angleInRadians);
    const rotatedY = vertex.x * Math.sin(angleInRadians) + vertex.y * Math.cos(angleInRadians);

    // 2. Then scale
    const scaledX = rotatedX * renderer.config.scale;
    const scaledY = rotatedY * renderer.config.scale;

    // 3. Then translate (including both center offset and translation)
    return {
      x: centerX + scaledX + renderer.config.translation.x,
      y: centerY - scaledY + renderer.config.translation.y, // Note the minus for Y to match SVG coordinates
    };
  });
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
  const transformedVertices = transformVertices();
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

function renderPolygonDebugLabels(renderer) {
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

/**
 * Renders the polygon outline
 */
export function renderPolygonOutline() {
  const renderer = getRendererState();
  if (!renderer.vertices || renderer.vertices.length === 0) {
    console.warn("No vertices available for polygon outline");
    return;
  }

  console.log("renderer:", renderer);

  const transformedVertices = transformVertices();
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

  if (renderer.debug?.enabled && renderer.debug?.showPolygonLabels) {
    renderPolygonDebugLabels(renderer);
  }
}
