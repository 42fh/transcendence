// Simple global state - will evolve into proper store later (maybe)

// Static game configuration
/**
 * @typedef {Object} GameConfig
 * @property {string} gameId - Unique identifier for the game
 * @property {string} gameType - Type of game (e.g., "classic", "circular")
 * @property {Object} settings - Game settings
 * @property {number} settings.players - Number of players
 * @property {number} settings.balls - Number of balls
 * @property {string} settings.scoreMode - Scoring mode
 */

/** @type {GameConfig} */
export const gameConfig = {
  gameId: "",
  gameType: "",
  settings: {
    numPlayers: 0,
    numBalls: 0,
    scoreMode: "",
  },
};

/**
 * @typedef {Object} Ball
 * @property {number} x - X coordinate of the ball
 * @property {number} y - Y coordinate of the ball
 * @property {number} velocity_x - Velocity in X direction
 * @property {number} velocity_y - Velocity in Y direction
 * @property {number} size - Size of the ball
 */

/** @type {Ball} */
export const defaultBall = {
  x: 0.0,
  y: 0.0,
  velocity_x: 0.0,
  velocity_y: 0.0,
  size: 0.1,
};

/**
 * @typedef {Object} Paddle
 * @property {number} position - Position along the side (0 to 1)
 * @property {boolean} active - Whether the paddle is active
 * @property {number} side_index - Index of the side this paddle is on
 */

/** @type {Paddle} */
export const defaultPaddle = {
  position: 0.5,
  active: true,
  side_index: 0,
};

/**
 * @typedef {Object} Dimensions
 * @property {number} paddle_length - Length of the paddle
 * @property {number} paddle_width - Width of the paddle
 */

/**
 * @typedef {Object} GameState
 * @property {Array<Ball>} balls - Array of ball objects with positions and velocities
 * @property {Array<Paddle>} paddles - Array of paddle objects with positions and states
 * @property {Array<number>} scores - Array of player scores
 * @property {Dimensions} dimensions - Game dimensions and measurements
 */

/** @type {GameState} */
export const gameState = {
  balls: [defaultBall],
  paddles: [defaultPaddle],
  scores: [0],
  dimensions: {
    paddle_length: 0.3,
    paddle_width: 0.2,
  },
};

/**
 * @typedef {Object} GameContext
 * @property {GameState} game_state - The current state of the game
 * @property {string} role - Player role ("player" or "spectator")
 * @property {number|null} player_index - Player's position in the game (null for spectators)
 * @property {string} message - System message for the player
 * @property {PlayerValues} player_values - Player-specific settings
 * @property {GameSetup} game_setup - Initial game configuration
 */

/** @type {GameContext} */
export const gameContext = {
  game_state: gameState,
  role: "spectator",
  player_index: null,
  message: "Welcome to the game!",
  player_values: {
    move_speed: 0.05,
    move_speed_boost: 1.0,
    move_cooldown: 0.1,
    paddle_length: 0.3,
  },
  game_setup: {
    type: "classic",
    vertices: [],
  },
};

// Function to initialize game configuration and state - replace the GameController constructor and the GameState constructor
export function initializeGameStructs(gameId, formData) {
  // Initialize game configuration
  gameConfig.gameId = gameId;
  gameConfig.gameType = formData.gameType;
  gameConfig.settings.numPlayers = formData.numPlayers;
  gameConfig.settings.numBalls = formData.numBalls;
  gameConfig.settings.scoreMode = formData.scoreMode;

  // Initialize game state
  gameState.currentPlayer.id = localStorage.getItem("pongUserId");
  gameState.currentPlayer.values = { score: 0 };
}

/**
 * Updates the current game state
 * @param {GameState} newState - The new state of the game
 */
export function updateGameState(newState) {
  gameState.balls = newState.balls;
  gameState.paddles = newState.paddles;
  gameState.scores = newState.scores;
  gameState.dimensions = newState.dimensions;
}

/**
 * @typedef {Object} PlayerValues
 * @property {number} move_speed - Base movement speed
 * @property {number} move_speed_boost - Speed multiplier
 * @property {number} move_cooldown - Minimum time between moves
 * @property {number} paddle_length - Size of the paddle
 */

/**
 * Updates the player values
 * @param {PlayerValues} values - The new player values
 */
export function updatePlayerValues(values) {
  if (!values) return;

  gameContext.player_values = {
    move_speed: values.move_speed,
    move_speed_boost: values.move_speed_boost,
    move_cooldown: values.move_cooldown,
    paddle_length: values.paddle_length,
  };
}

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
 * @property {HTMLElement|null} scoreList - Element for displaying scores
 * @property {string|null} type - Type of renderer ("polygon" or "circular")
 * @property {RendererConfig} config - Renderer configuration
 */

/** @type {RendererState} */
export const renderer = {
  // Base attributes
  playerIndex: null,
  vertices: [],
  state: null,
  svg: null,
  scoreList: null,
  type: null,

  // Configuration
  config: {
    viewboxSize: 300,
    scale: 75,
    center: 150,
  },
};

/**
 * Initializes the renderer with all necessary data from the initial state message
 * @param {Object} message - Initial state message from server
 */
export function initializeRenderer(message) {
  renderer.type = message.game_setup.type;
  renderer.playerIndex = message.player_index;
  renderer.vertices = message.game_setup.vertices || message.game_state?.vertices || [];
  renderer.state = message.game_state;
  renderer.svg = document.getElementById("pongSvg");
  renderer.scoreList = document.getElementById("scoreDisplay");

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
  renderer.vertices = message.game_setup.vertices || message.game_state?.vertices;
  renderer.state = message.game_state;
}

// Tournament state

let globalTournaments = null;

export function updateGlobalTournaments(tournaments) {
  globalTournaments = tournaments;
}

export function getGlobalTournaments() {
  return globalTournaments;
}

/**
 * Updates the player values in the game state.
 * @param {Object} values - An object containing player values keyed by player ID.
 */
export function updatePlayerValues(values) {
  if (!values) return;

  // Update current player values if they exist
  if (values[gameState.currentPlayer.id]) {
    gameState.currentPlayer.values = values[gameState.currentPlayer.id];
  }

  // Update all player values in the map
  Object.entries(values).forEach(([playerId, playerValues]) => {
    if (!gameState.players.has(playerId)) {
      gameState.players.set(playerId, {
        id: playerId,
        values: playerValues,
        active: true,
      });
    } else {
      const player = gameState.players.get(playerId);
      player.values = playerValues;
    }
  });
}
