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

// Dynamic game state
/**
 * @typedef {Object} Player
 * @property {string} id - Player's unique identifier
 * @property {number} position - Player's position in the game
 * @property {boolean} active - Whether the player is currently active
 * @property {Object} values - Player-specific values (e.g., score, health)
 */

/**
 * @typedef {Object} DynamicGameState
 * @property {Object} currentState - Current game state (positions, scores, etc.)
 * @property {Map<string, Player>} players - Map of players by ID
 * @property {Player} currentPlayer - The player using this client
 */

/** @type {DynamicGameState} */
export const gameState = {
  currentState: {
    balls: [],
    paddles: [],
    scores: [],
  },
  players: new Map(),
  currentPlayer: {
    id: "",
    position: 0,
    active: true,
    values: {},
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

// Tournament state

let globalTournaments = null;

export function updateGlobalTournaments(tournaments) {
  globalTournaments = tournaments;
}

export function getGlobalTournaments() {
  return globalTournaments;
}
