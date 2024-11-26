import { CONFIG } from "../config/constants.js";
import { gameSettings } from "./gameSettings.js";

export async function gameHome() {
  try {
    console.log("gameHome");
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/api/game/get_all_games/`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("received -->", response);

    const mainContent = document.getElementById("main-content");
    if (!mainContent) {
      throw new Error("Main content element not found");
    }
    mainContent.innerHTML = "";
    mainContent.style.display = "block";

    if (!response.ok) {
      console.log("response not ok");
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Non-JSON response received:", text);
      throw new TypeError("Expected JSON response");
    }

    const data = await response.json();
    console.log("Available games:", data);

    const gamesContainer = document.getElementById("games-container");
    if (!gamesContainer) {
      throw new Error("#games-container element not found");
    }
    gamesContainer.innerHTML = ""; // Clear existing content

    const games = JSON.parse(data.games);
    games.forEach((gameId) => {
      const template = document.getElementById("game-item-template");
      if (!template) {
        throw new Error("#game-item-template element not found");
      }

      const gameItem = document.importNode(template.content, true);
      gameItem.querySelector(".game-id").textContent = gameId;

      gamesContainer.appendChild(gameItem);
    });

    // Only show the settings button if there are games
    if (games.length > 0) {
      const settingsButton = document.getElementById("cta__button-settings");
      settingsButton.style.display = "block"; // Show the button
      settingsButton.addEventListener("click", () => {
        // Render the game settings template before calling gameSettings
        const settingsTemplate = document.getElementById(
          "game-settings-template"
        );
        const mainContent = document.getElementById("main-content");
        if (settingsTemplate && mainContent) {
          const settingsContent = document.importNode(
            settingsTemplate.content,
            true
          );
          mainContent.innerHTML = ""; // Clear existing content
          mainContent.appendChild(settingsContent);
          gameSettings(); // Now call gameSettings after rendering the template
        }
      });
    }

    gamesContainer.style.display = "block";

    // ... rest of the code ...
  } catch (error) {
    console.error("Error fetching available games:", error);
    throw error;
  }
}
