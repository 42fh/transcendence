import { getRendererState, setRendererState } from "./../store/index.js";
import { getGameContext } from "./../store/game/context.js";
import { DOM_IDS } from "./../config/constants.js";
import { updateScoreDisplays, showGameOver, hideGameOver } from "./utils.js";
/**
 * Initializes the renderer with all necessary data from the initial state message
 * @param {Object} message - Initial state message from server
 */
export function initializeRenderer(message) {
  if (!message.game_setup.vertices || message.game_setup.vertices.length === 0) {
    console.warn("No vertices available for renderer");
    return;
  }
  const vertices = message.game_setup.vertices;
  const boundaries = getGameBoundaries(vertices);
  setRendererState({
    type: message.game_setup.type,
    vertices: vertices,
    boundaries: boundaries,
    svg: document.getElementById(DOM_IDS.GAME_SVG),
    playerIndex: message.player_index,
  });
  initializeSVG();
  updateRenderer(message);
}

/**
 * Analyzes vertices to determine the game area boundaries in normalized coordinate space.
 *
 * This function is crucial for coordinate transformation as it:
 * 1. Determines the actual game area dimensions from the vertices
 * 2. Helps map between normalized game coordinates (-1 to 1) and SVG viewport coordinates
 * 3. Handles different aspect ratios (e.g., 4:3, 16:9) by finding actual min/max values
 *
 * For example, in a 4:3 game:
 * - X might range from -1 to 1
 * - Y might range from -0.5625 to 0.5625
 *
 * @param {Array<{x: number, y: number}>} vertices - Array of vertex coordinates defining the game area
 * @returns {GameBoundaries} Object containing min/max values for x and y coordinates
 * @typedef {Object} GameBoundaries
 * @property {number} xMin - Minimum X coordinate in game space
 * @property {number} xMax - Maximum X coordinate in game space
 * @property {number} yMin - Minimum Y coordinate in game space
 * @property {number} yMax - Maximum Y coordinate in game space
 */

function getGameBoundaries(vertices) {
  // Start with extreme initial values
  let boundaries = {
    xMin: Infinity,
    xMax: -Infinity,
    yMin: Infinity,
    yMax: -Infinity,
  };

  // Check each vertex
  vertices.forEach((vertex) => {
    // Update xMin if we find a smaller x
    boundaries.xMin = Math.min(boundaries.xMin, vertex.x);
    // Update xMax if we find a larger x
    boundaries.xMax = Math.max(boundaries.xMax, vertex.x);
    // Update yMin if we find a smaller y
    boundaries.yMin = Math.min(boundaries.yMin, vertex.y);
    // Update yMax if we find a larger y
    boundaries.yMax = Math.max(boundaries.yMax, vertex.y);
  });

  return boundaries;
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
 * Renders a single ball
 * @param {Object} ball - Ball properties
 * @param {number} ball.x - X coordinate (-1 to 1)
 * @param {number} ball.y - Y coordinate (-1 to 1)
 * @param {number} ball.size - Ball radius
 * @param {Object} options - Rendering options
 * @param {string} [options.shape='circle'] - 'circle' or 'square'
 * @param {string} [options.fill='yellow'] - Ball color
 * @param {string} [options.stroke='black'] - Border color
 */

export function renderSingleBall(ball, options = {}) {
  const renderer = getRendererState();
  if (!renderer.svg) return;

  const { shape = "circle", fill = "yellow", stroke = "black" } = options;

  const transformedPoint = transformVertices([{ x: ball.x, y: ball.y }])[0];
  const ballX = transformedPoint.x;
  const ballY = transformedPoint.y;

  if (shape === "square") {
    const squareSize = ball.size * renderer.config.scale * Math.SQRT2;
    renderer.svg.appendChild(
      createSVGElement("rect", {
        x: ballX - squareSize / 2,
        y: ballY - squareSize / 2,
        width: squareSize,
        height: squareSize,
        fill,
        stroke,
        "stroke-width": "1",
      })
    );
  } else {
    renderer.svg.appendChild(
      createSVGElement("circle", {
        cx: ballX,
        cy: ballY,
        r: ball.size * renderer.config.scale,
        fill,
        stroke,
        "stroke-width": "1",
      })
    );
  }
}

export function renderBalls() {
  const renderer = getRendererState();
  if (!renderer.svg || !renderer.state.balls) return;

  renderer.state.balls.forEach((ball) => {
    renderSingleBall(ball, {
      shape: renderer.config.ball?.shape,
    });
  });
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
  console.log(renderer);

  // Validate required data is available
  if (!renderer.state || !renderer.svg || !renderer.vertices || renderer.vertices.length === 0) {
    console.warn("Missing required data for rendering", {
      hasState: !!renderer.state,
      hasSvg: !!renderer.svg,
      verticesLength: renderer.vertices?.length,
    });
    return;
  }
  console.group("Game Area Debug");
  console.log("Game Area Debug:", {
    // SVG Container
    viewBox: renderer.config.viewBox,
    svgElement: {
      width: renderer.svg.clientWidth,
      height: renderer.svg.clientHeight,
    },
    // Game Boundaries
    boundaries: renderer.config.boundaries,
    // Scale and other configs
    scale: renderer.config.scale,
    centered: renderer.config.centered,
    // Vertices
    originalVertices: renderer.vertices,
    transformedVertices: transformVertices(),
  });
  console.groupEnd();

  renderer.svg.innerHTML = "";

  try {
    // We can pass an option object into it.
    renderPolygonOutline();
    renderPaddles();
    renderBalls();
    updateScoreDisplays();
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
 * Transforms game coordinates to SVG viewport coordinates.
 *
 * This function converts from:
 * - Cartesian normalized space (-1 to 1)
 * - To SVG graphic space (0 to viewport dimensions) through the Viewport normalization
 *
 * Example:
 * In a 4:3 game with boundaries {xMin: -1, xMax: 1, yMin: -0.5625, yMax: 0.5625}:
 * - Cartesian (-1, 0.5625) → SVG (0, 0)
 * - Cartesian (1, -0.5625) → SVG (400, 250)
 *
 * @param {number} x - X coordinate in cartesian space (-1 to 1)
 * @param {number} y - Y coordinate in cartesian space (-1 to 1)
 * @param {ViewBoxConfig} viewBox - SVG viewport configuration
 * @param {GameBoundaries} boundaries - Game coordinate boundaries
 * @param {{xRange: number, yRange: number}} ranges - Precalculated coordinate ranges
 * @returns {{x: number, y: number}} Coordinates in SVG viewport space
 */
function denormalizeCoordinates(x, y, viewBox, boundaries) {
  // Convert X and Y from cartesian normalized space (-1,1) to SVG graphic space (0,1)
  const cartesianToGraphicX = (x - boundaries.xMin) / (boundaries.xMax - boundaries.xMin);
  const cartesianToGraphicY = 1 - (y - boundaries.yMin) / (boundaries.yMax - boundaries.yMin); // Flip Y axis

  // Scale to viewport dimensions
  const viewportWidth = viewBox.width - viewBox.minX;
  const viewportHeight = viewBox.height - viewBox.minY;

  return {
    x: cartesianToGraphicX * viewportWidth,
    y: cartesianToGraphicY * viewportHeight,
  };
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
export function transformVertices(vertices = []) {
  const renderer = getRendererState();
  if (vertices.length === 0) {
    vertices = renderer.vertices;
  }

  // Convert rotation to radians
  const angleInRadians = ((renderer.config.rotation || 0) * Math.PI) / 180;

  // Get translation if it exists, otherwise use {x: 0, y: 0}
  const translation = renderer.config.translation || { x: 0, y: 0 };
  const ranges = {
    xRange: renderer.config.boundaries.xMax - renderer.config.boundaries.xMin,
    yRange: renderer.config.boundaries.yMax - renderer.config.boundaries.yMin,
  };

  return vertices.map((vertex) => {
    // 1. First rotate in cartesian space
    const rotatedX = vertex.x * Math.cos(angleInRadians) - vertex.y * Math.sin(angleInRadians);
    const rotatedY = vertex.x * Math.sin(angleInRadians) + vertex.y * Math.cos(angleInRadians);

    // 2. Apply scale if needed
    const scaledX = rotatedX * renderer.config.scale;
    const scaledY = rotatedY * renderer.config.scale;

    // 3. Denormalize to SVG space (this handles Y-flip)
    const denormalized = denormalizeCoordinates(
      scaledX,
      scaledY,
      renderer.config.viewBox,
      renderer.config.boundaries,
      ranges
    );

    // 4. Apply any additional translation
    const transformed = {
      x: denormalized.x + translation.x,
      y: denormalized.y + translation.y,
    };

    return transformed;
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
  debug = true;
  if (!paddle.active || !renderer.vertices) return;
  if (debug)
    console.log("renderPaddle - debug inog:", {
      debug,
      paddle,
      sideIndex,
      active: paddle.active,
      hasVertices: !!renderer.vertices,
    });
  // Transform vertices
  const transformedVertices = transformVertices();
  const startVertex = transformedVertices[sideIndex];
  const endVertex = transformedVertices[(sideIndex + 1) % transformedVertices.length];

  console.log("Geometry:", {
    startVertex,
    endVertex,
    sideLength: Math.sqrt(Math.pow(endVertex.x - startVertex.x, 2) + Math.pow(endVertex.y - startVertex.y, 2)),
  });

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
  const paddleWidth = renderer.state.dimensions.paddle_width * sideLength;
  const hitZoneWidth =
    (renderer.state.dimensions.paddle_width + (renderer.state.dimensions.ball_size || 0.1) * 2) * renderer.config.scale;

  console.log("Paddle Dimensions:", {
    sideLength, // Should be ~140 pixels
    paddleLength, // Should be ~28 pixels (20% of side)
    paddleWidth, // Should be ~4.2 pixels (3% of side)
    hitZoneWidth, // Should be ~7 pixels (paddle + 2*ball)
    position: paddle.position, // Should be between 0-1
  });

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

  // After calculating paddle points
  console.log("Paddle Points:", {
    paddleX,
    paddleY,
    paddleLength,
    paddleWidth,
    points: paddlePoints,
  });

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
export function renderPaddles() {
  // 1. Find out the expected values of the paddles.
  // Width and length are in the renderer.state.dimensions object.
  // Position is in the renderer.state.paddles object.
  // Side index is in the renderer.state.paddles object.
  // Active is in the renderer.state.paddles object.
  // 2. Be aware of teh dimension of the game area

  const renderer = getRendererState();
  if (!renderer.state?.paddles) {
    console.warn("No paddles available for rendering");
    return;
  }

  renderer.state.paddles.forEach((paddle) => {
    renderPaddle(renderer, paddle, paddle.side_index, renderer.config.debug);
  });
}

function calculatePaddlePoints(x, y, normalizedSideX, normalizedSideY, normalX, normalY, length, width) {
  // OLD version (going outward)
  //   return [
  //     `${x - (normalizedSideX * length) / 2},${y - (normalizedSideY * length) / 2}`,
  //     `${x + (normalizedSideX * length) / 2},${y + (normalizedSideY * length) / 2}`,
  //     `${x + (normalizedSideX * length) / 2 + normalX * width},${y + (normalizedSideY * length) / 2 + normalY * width}`,
  //     `${x - (normalizedSideX * length) / 2 + normalX * width},${y - (normalizedSideY * length) / 2 + normalY * width}`,
  //   ].join(" ");

  // NEW version (going inward)
  return [
    `${x - (normalizedSideX * length) / 2},${y - (normalizedSideY * length) / 2}`,
    `${x + (normalizedSideX * length) / 2},${y + (normalizedSideY * length) / 2}`,
    `${x + (normalizedSideX * length) / 2 - normalX * width},${y + (normalizedSideY * length) / 2 - normalY * width}`,
    `${x - (normalizedSideX * length) / 2 - normalX * width},${y - (normalizedSideY * length) / 2 - normalY * width}`,
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
 * Renders a polygon outline using SVG path elements with customizable styling
 *
 * @param {Object} options - Styling options for the polygon
 * @param {string} [options.fill="#000000"] - Fill color of the polygon
 * @param {number} [options.fillOpacity=1] - Opacity of the fill (0-1)
 * @param {string} [options.stroke="#808080"] - Stroke/outline color
 * @param {number} [options.strokeWidth=2] - Width of the stroke in pixels
 * @param {number} [options.strokeOpacity=1] - Opacity of the stroke (0-1)
 *
 *
 * @requires getRendererState - Function to get current renderer state
 * @requires transformVertices - Function to transform vertex coordinates
 * @requires createSVGElement - Function to create SVG elements
 * @requires renderPolygonDebugLabels - Function for debug label rendering
 */
export function renderPolygonOutline(options = {}) {
  console.log("Entering renderPolygonOutline");
  const defaultOptions = {
    // fill: "#000000", // Default black fill
    fill: "#000033", // Dark blue fill
    fillOpacity: 1, // Fully opaque
    stroke: "#808080", // Gray outline
    strokeWidth: 2,
    strokeOpacity: 1,
  };
  // Merge default options with provided options
  const renderOptions = { ...defaultOptions, ...options };
  const renderer = getRendererState();
  if (!renderer.vertices || renderer.vertices.length === 0) {
    console.warn("No vertices available for polygon outline");
    return;
  }

  const transformedVertices = transformVertices();

  const pathData = transformedVertices.map((vertex, i) => `${i === 0 ? "M" : "L"} ${vertex.x} ${vertex.y}`).join(" ");

  // Draw main polygon outline
  renderer.svg.appendChild(
    createSVGElement("path", {
      d: `${pathData} Z`,
      fill: renderOptions.fill,
      "fill-opacity": renderOptions.fillOpacity,
      stroke: renderOptions.stroke,
      "stroke-width": renderOptions.strokeWidth,
      "stroke-opacity": renderOptions.strokeOpacity,
    })
  );

  if (renderer.debug?.enabled && renderer.debug?.showPolygonLabels) {
    renderPolygonDebugLabels(renderer);
  }
}
