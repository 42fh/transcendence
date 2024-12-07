import { gameState } from "./state.js";

/**
 * @typedef {Object} Player
 * @property {string} id - Player ID
 * @property {string} username - Player username
 * @property {number} index - Player's position index in the game (0-based)
 * @property {number} score - Player's score
 * @property {string} role - Player role ("player" or "spectator")
 * @property {boolean} isCurrentPlayer - Whether the player is the current player
 * @property {boolean} isActive - Whether the player is active
 *
 * @example
 * const player = {
 *   id: "123",
 *   username: "John Doe",
 *   index: 0,
 *   score: 0,
 *   role: "player",
 *   isCurrentPlayer: false,
 *   isActive: true,
 * };
 */

export const defaultPlayer = {
  id: "",
  username: "",
  index: 0,
  score: 0,
  role: "player",
  isCurrentPlayer: false,
  isActive: false,
};

/**
 * @typedef {Object} GameContext
 * @property {GameState} game_state - The current state of the game
 * @property {string} role - Player role ("player" or "spectator")
 * @property {Array<Player>} players - Array of player objects
 * @property {Array<Player>} spectators - Array of spectator objects
 * @property {number|null} player_index - Player's position in the game (null for spectators)
 * @property {string} message - System message for the player
 * @property {PlayerValues} player_values - Player-specific settings
 * @property {GameSetup} game_setup - Initial game configuration
 */

/** @type {GameContext} */
export const gameContext = {
  game_state: gameState,
  role: "spectator",
  players: [],
  spectators: [],
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

/**
 * Updates the game context with values from the initial state message
 * @param {Object} message - Initial state message from server containing:
 * - game_state: Current state of the game (balls, paddles, scores, dimensions)
 * - role: Player role ("player" or "spectator")
 * - player_index: Index of the current player
 * - message: Game status message
 * - player_values: Player specific values (move speed, cooldown, etc)
 * - game_setup: Game configuration (type, vertices)
 */
export function updateGameContext(message) {
  if (!message) return;

  // Update game state
  if (message.game_state) {
    gameContext.game_state = message.game_state;
  }

  // Update role and player index
  if (message.role) gameContext.role = message.role;
  if (message.player_index !== undefined) gameContext.player_index = message.player_index;

  // Update message
  if (message.message) gameContext.message = message.message;

  // Update player values
  if (message.player_values) {
    gameContext.player_values = {
      move_cooldown: message.player_values.move_cooldown,
      move_speed: message.player_values.move_speed,
      move_speed_boost: message.player_values.move_speed_boost,
      reverse_controls: message.player_values.reverse_controls,
      paddle_length: message.player_values.paddle_length,
    };
  }

  // Update game setup
  if (message.game_setup) {
    gameContext.game_setup = {
      type: message.game_setup.type,
      vertices: message.game_setup.vertices || [],
    };
  }
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
