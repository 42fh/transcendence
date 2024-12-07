import { DEFAULT_SVG_VIEWBOX } from "../../config/constants.js";

/**
 * @typedef {Object} DebugConfig
 * @property {boolean} enabled - Whether debug mode is enabled
 * @property {boolean} showPolygonLabels - Whether to show polygon labels
 */

/**
 * @typedef {Object} RenderConfig
 * @property {ViewBoxConfig} viewBox - Viewbox configuration
 * @property {number} scale - Scale factor for rendering
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
const initialState = {
  // Base attributes
  playerIndex: null,
  vertices: [],
  state: null,
  svg: null,
  type: null,

  // Configuration
  config: {
    // viewboxSize: 300,
    // viewBox: {
    //   minX: 0,
    //   minY: 0,
    //   width: 800,
    //   height: 600,
    // },
    viewBox: DEFAULT_SVG_VIEWBOX,
    scale: 75,
    // center: 150,
    centered: true,
    rotation: 0,
    translation: {
      x: 0,
      y: 0,
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
      ...(newState.config || {}),
      viewBox: {
        ...rendererState.config.viewBox,
        ...(newState.config?.viewBox || {}),
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
