import { DEFAULT_SVG_VIEWBOX } from "../../config/constants.js";

/**
 * @typedef {Object} DebugConfig
 * @property {boolean} enabled - Whether debug mode is enabled
 * @property {boolean} showPolygonLabels - Whether to show polygon labels
 */

/**
 * @typedef {Object} RenderConfig
 * @property {ViewBoxConfig} viewBox - Viewbox configuration
 * @property {number} scale - Scale factor for rendering from 0 to 1
 * @property {boolean} centered - Whether if we want to center the polygon on the svg
 * @property {number} [rotation=0] - Rotation in degrees (clockwise)
 */

/**
 * @typedef {Object} ViewBoxConfig
 * @property {number} minX - Minimum X coordinate of the viewport
 * @property {number} minY - Minimum Y coordinate of the viewport
 * @property {number} width - Width of the viewport
 * @property {number} height - Height of the viewport
 */

/**
 * @typedef {Object} RendererState
 * @property {number|null} playerIndex - Current player's index
 * @property {Array<Object>} vertices - Vertex positions for polygon games
 * @property {Object|null} state - Current game state (borrowed from game)
 * @property {HTMLElement|null} svg - SVG element for rendering
 * @property {string|null} type - Type of renderer ("polygon" or "circular")
 * @property {RenderConfig} config - Render configuration
 * @property {DebugConfig} debug - Debug configuration
 */

/** @type {RendererState} */
// TODO: Change the name to config or renderConfig.
// TODO: Think about the state object, this is a copy of the state object in the game. Instead of having a copy, we could just have a reference to the game state, or maybe a function that returns the state object.
// TODO: rethink 'centered'. The property should eventualy center the Viewbox in the SVG Element. If we have a viewbox 1:1 and a SVG Element 2:1, the cntered would bring the Viewbox in the middle of the element. Otherwise it would start top-left
const initialState = {
  // Base attributes
  playerIndex: null,
  vertices: [],
  state: null,
  svg: null,
  type: null,

  // Configuration
  config: {
    viewBox: DEFAULT_SVG_VIEWBOX,
    boundaries: {
      xMin: -1,
      xMax: 1,
      yMin: -1,
      yMax: 1,
    },
    // from 0 to 1
    scale: 1,
    // centered: true,
    rotation: 0,
    translation: {
      x: 0,
      y: 0,
    },
    ball: {
      // circle or square
      shape: "circle",
    },
  },
  // Debug settings
  debug: {
    enabled: false,
    showPolygonLabels: false,
  },
};

// private variable of this module
let rendererState = initialState;

/**
 * Gets the current renderer state
 * @returns {RendererState} The current renderer state
 */
export function getRendererState() {
  return rendererState;
}

/**
 * Updates the renderer state
 * @param {Partial<RendererState>} newState - Partial state to merge with current state
 * @returns {RendererState} The updated renderer state
 */
export function setRendererState(newState) {
  rendererState = {
    ...rendererState,
    ...newState,
    config: {
      ...rendererState.config,
      ...(newState.config || {}), // Spread empty object to keep existing config if not provided
      viewBox: {
        ...rendererState.config.viewBox,
        ...(newState.config?.viewBox || {}), // Spread empty object to keep existing viewBox if not provided
      },
      boundaries: {
        ...rendererState.config.boundaries,
        ...(newState.config?.boundaries || {}),
      },
      ball: {
        ...rendererState.config.ball,
        ...(newState.config?.ball || {}), // Spread empty object to keep existing ball shape if not provided
      },
    },
  };

  // Verify and apply viewBox to SVG if it exists
  if (rendererState.svg) {
    const viewBox = rendererState.config.viewBox;
    rendererState.svg.setAttribute("viewBox", `${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`);
  }
}

// Attach getter/setter methods to window for debugging
if (typeof window !== "undefined") {
  window.__rendererState = {
    get: () => rendererState, // Returns the actual rendererState
    set: (newState) => {
      // Modifies the actual rendererState
      rendererState = {
        ...rendererState,
        ...newState,
      };
      return rendererState;
    },
  };
}
