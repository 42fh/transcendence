import { CONFIG } from "../config/constants.js";

/**
 * Fetches all waiting games from the server
 *
 * @returns {Promise<Array<GameInfo>>} Array of game information objects
 *
 * @typedef {Object} GameInfo
 * @property {string} game_id - Unique identifier for the game
 * @property {string} mode - Game mode (classic, circular, regular)
 * @property {string} type - Game type (polygon or circular)
 * @property {number} sides - Number of sides in the game arena
 * @property {Object} score - Score configuration
 * @property {number} num_players - Total number of players needed
 * @property {number} min_players - Minimum players required to start
 * @property {number} initial_ball_speed - Initial speed of the ball
 * @property {number} paddle_length - Length of the paddles
 * @property {number} paddle_width - Width of the paddles
 * @property {number} ball_size - Size of the ball
 * @property {Object} players - Current player counts
 * @property {number} players.current - Number of currently connected players
 * @property {number} players.reserved - Number of players with reservations
 * @property {number} players.total_needed - Total players needed for the game
 *
 * @throws {Error} If the server request fails
 *
 * @example
 * try {
 *   const games = await fetchWaitingGames();
 *   console.log(games[0].mode); // "classic"
 *   console.log(games[0].players.current); // 1
 * } catch (error) {
 *   console.error("Failed to fetch games:", error);
 * }
 */
export async function fetchWaitingGames() {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/game/waiting/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Non-JSON response received:", text);
      throw new TypeError("Expected JSON response");
    }

    const data = await response.json();
    return JSON.parse(data.games);
  } catch (error) {
    console.error("Error fetching waiting games:", error);
    throw error;
  }
}

/**
 * Creates a new game
 * @param {Object} gameConfig - Game configuration object
 * @returns {Promise<Object>} Game creation response
 */
export async function createGame(gameConfig) {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/game/games/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gameConfig),
    });

    const data = await response.json();

    return {
      success: response.ok,
      ...data,
    };
  } catch (error) {
    console.error("Game creation error:", error);
    throw error;
  }
}

/**
 * Joins an existing game
 * @param {string} gameId - ID of the game to join
 * @returns {Promise<Object>} Response containing join status and connection details
 */
export async function joinGame(gameId) {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/api/game/${gameId}/join`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    return {
      success: response.ok,
      ...data,
    };
  } catch (error) {
    console.error("Error joining game:", error);
    throw error;
  }
}

/**
 * Finds a matching game from available games based on form data
 * @param {Array<GameInfo>} games - Array of available games
 * @param {Object} formData - Form data with game preferences
 * @returns {string|null} gameId of matching game or null if no match found
 */
export function findMatchingGame(games, formData) {
  console.log("findMatchingGame", games, formData);
  const matchingGame =
    games.find(
      (game) =>
        // Match game mode
        game.mode === formData.gameType &&
        // Match number of players
        game.num_players === formData.num_players &&
        // Match number of sides (for non-classic modes)
        (formData.gameType === "classic" || game.sides === formData.sides) &&
        // TODO: Future matching criteria could include:
        // && game.score.max === formData.scoreLimit
        // && game.initial_ball_speed === formData.ballSpeed
        // && game.paddle_length === formData.paddleLength
        // && game.ball_size === formData.ballSize
        // && game.score_mode === formData.scoreMode
        // Ensure there's room for more players
        game.players.current + game.players.reserved < game.players.total_needed
    )?.game_id || null;
  console.log("matchingGame", matchingGame);
  return matchingGame;
}

export async function showAvailableGames() {
  try {
    const games = await fetchAvailableGames();
    const gamesContainer = document.getElementById("games-container");

    if (!gamesContainer) {
      throw new Error("Games container element not found");
    }

    gamesContainer.innerHTML = ""; // Clear any existing content

    const template = document.getElementById("game-item-template");
    if (!template) {
      throw new Error("Game item template not found");
    }

    games.forEach((game) => {
      const gameElement = document.importNode(template.content, true);
      gameElement.querySelector(".game-id").textContent = game.id;
      gameElement.querySelector(".game-mode").textContent = game.mode;
      gameElement.querySelector(".game-date").textContent = game.date;
      gameElement.querySelector(".game-duration").textContent = game.duration;
      gameElement.querySelector(".game-winner").textContent = game.winner;

      gamesContainer.appendChild(gameElement);
    });
  } catch (error) {
    console.error("Error showing available games:", error);
  }
}
