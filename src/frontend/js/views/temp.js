import { CONFIG } from "../config/constants.js";

export async function createNewGame(gameSettings) {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/create_new_game/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gameSettings),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Game created successfully:", data);
    return data;
  } catch (error) {
    console.error("Error creating new game:", error);
    throw error;
  }
}

export async function fetchAvailableGames() {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/get_all_games/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new TypeError("Expected JSON response");
    }

    const data = await response.json();
    console.log("Available games:", data);
    return data;
  } catch (error) {
    console.error("Error fetching available games:", error);
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