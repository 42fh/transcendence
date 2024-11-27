import { CONFIG } from "../config/constants.js";
import { gameSettings } from "./gameSettings.js";
import { updateActiveNavItem } from "../components/bottom-nav.js";

let currentView = "home";

// Add a function to initialize the settings button
function initializeSettingsButton() {
  const settingsButton = document.getElementById("cta__button-settings");
  if (settingsButton) {
    // Remove any existing event listeners to prevent multiple bindings
    settingsButton.removeEventListener("click", handleSettingsClick);
    settingsButton.addEventListener("click", handleSettingsClick);
    settingsButton.style.display = "block";
  }
}

function handleSettingsClick() {
  currentView = "settings";
  showSettings();
}

export async function loadGameHome(addToHistory = true) {
  try {
    if (addToHistory) {
      history.pushState(
        {
          view: "chat",
        },
        ""
      );
      updateActiveNavItem("home");
    }

    const template = document.getElementById("game-item-template");
    if (!template) {
      throw new Error("Chat template not found");
    }

    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = "";
    mainContent.appendChild(document.importNode(template.content, true));

    // Initialize settings button before fetching games
    initializeSettingsButton();

    await initializegameHome();
  } catch (error) {
    console.error("Error loading game page", error);
  }
}

async function initializegameHome() {
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
      gameItem.getElementById("game-id").textContent = gameId;

      gamesContainer.appendChild(gameItem);
    });

    gamesContainer.style.display = "block";
  } catch (error) {
    console.error("Error fetching available games:", error);
    throw error;
  }
}

function showSettings() {
  const mainContent = document.getElementById("main-content");
  const gamesContainer = document.getElementById("games-container");
  const settingsButton = document.getElementById("cta__button-settings");

  mainContent.innerHTML = "";
  gamesContainer.innerHTML = "";
  settingsButton.style.display = "none";

  gameSettings();
}
