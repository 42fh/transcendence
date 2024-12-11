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

// Function to initialize game configuration and state - replace the GameController constructor and the GameState constructor
export function initializeGameConfig(gameId, formData) {
  // Initialize game configuration
  gameConfig.gameId = gameId;
  gameConfig.gameType = formData.gameType;
  gameConfig.settings.numPlayers = formData.numPlayers;
  gameConfig.settings.numBalls = formData.numBalls;
  gameConfig.settings.scoreMode = formData.scoreMode;
}
