import { CONFIG } from "../config/constants.js";

/**
 * Fetches all available games
 * @returns {Promise<Array>} List of game IDs
 */

export async function fetchGames() {
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
    console.error("Error fetching available games:", error);
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
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/game/join_game/${gameId}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

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
