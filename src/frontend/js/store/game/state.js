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
 * Updates the current game state
 * @param {GameState} newState - The new state of the game
 */
export function updateGameState(newState) {
  gameState.balls = newState.balls;
  gameState.paddles = newState.paddles;
  gameState.scores = newState.scores;
  gameState.dimensions = newState.dimensions;
}
