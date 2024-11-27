import { CONFIG } from "../config/constants.js";
import { gameSettings } from "./gameSettings.js";

let currentView = "home"; // Track the current view, default is 'home'

//TODO: Export call to a dedicated service ?
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
    // console.log("Available games:", data);

    const gamesContainer = document.getElementById("games-container");
    if (gamesContainer) {
      gamesContainer.innerHTML = "";
      gamesContainer.style.display = "none";
    }

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

    // TODO: separate return of get_all_games and settingsButton
    const settingsButton = document.getElementById("cta__button-settings");
    settingsButton.style.display = "block";
    settingsButton.addEventListener("click", () => {
      // Transition to settings view
      currentView = "settings"; // Set the current view to 'settings'
      showSettings();
    });

    gamesContainer.style.display = "block";
  } catch (error) {
    console.error("Error fetching available games:", error);
    throw error;
  }
}

function showSettings() {
  const mainContent = document.getElementById("main-content");
  const settingsButton = document.getElementById("cta__button-settings");
  const gamesContainer = document.getElementById("games-container");

  // Clear current content
  mainContent.innerHTML = "";
  gamesContainer.innerHTML = "";
  settingsButton.style.display = "none"; // Hide the settings button

  // Call gameSettings function to render the settings view
  gameSettings();

  // Now we are in the settings view, so hide the settings button
  settingsButton.style.display = "none";
}

function showGameHome() {
  // Reset to the game home view
  currentView = "home";
  gameHome();
}

// Optional: Handle navigation if you have a "Back" button or navigation mechanism
function goBack() {
  if (currentView === "settings") {
    // If we are in settings, go back to the game home
    showGameHome();
  }
}
