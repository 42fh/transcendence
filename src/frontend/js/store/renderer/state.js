// Renderer state

/**
 * @typedef {Object} RendererConfig
 * @property {number} viewboxSize - Size of the SVG viewbox
 * @property {number} scale - Scale factor for rendering
 * @property {number} center - Center point of the rendering area
 */

/**
 * @typedef {Object} RendererState
 * @property {number|null} playerIndex - Current player's index
 * @property {Array<Object>} vertices - Vertex positions for polygon games
 * @property {Object|null} state - Current game state
 * @property {HTMLElement|null} svg - SVG element for rendering
 * @property {string|null} type - Type of renderer ("polygon" or "circular")
 * @property {RendererConfig} config - Renderer configuration
 */

/** @type {RendererState} */
export const nastyGlobalRendererState = {
  // Base attributes
  playerIndex: null,
  vertices: [],
  state: null,
  svg: null,
  type: null,

  // Configuration
  config: {
    viewboxSize: 300,
    scale: 75,
    center: 150,
  },
};
