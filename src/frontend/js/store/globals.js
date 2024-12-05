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

// Game state
/**
 * @typedef {Object} GameState
 * @property {Array<Object>} balls - Array of ball objects with positions and states
 * @property {Array<Object>} paddles - Array of paddle objects with positions and states
 * @property {Array<number>} scores - Array of player scores
 * @property {Array<Object>} [vertices] - Optional array of vertex positions for polygon games
 * @property {Map<string, Player>} players - Map of players by ID
 * @property {Player} currentPlayer - The player using this client
 */

/** @type {GameState} */
export const gameState = {
  balls: [],
  paddles: [],
  scores: [],
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

/**
 * Updates the current game state.
 * @param {Object} newState - The new state of the game.
 */
export function updateGameState(newState) {
  gameState.currentState = newState;
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
