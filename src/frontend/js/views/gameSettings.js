import {
  GAME_MODES,
  DEFAULT_GAME_SETTINGS,
  PLAYER_LIMITS,
  GAME_CONFIGS,
} from "../config/constants.js";
import { createNewGame } from "../services/gameSettingsService.js";

export function loadGameSettings() {
  const state = {
    formData: { ...DEFAULT_GAME_SETTINGS },
    gameConfigs: GAME_CONFIGS,
  };

  const mainContent = document.getElementById("main-content");
  if (mainContent) {
    mainContent.innerHTML = "";
  }

  const settingsTemplate = document.getElementById("game-settings-template");
  if (settingsTemplate) {
    const settingsContent = document.importNode(settingsTemplate.content, true);
    mainContent.appendChild(settingsContent);
  }

  initializeInterface();
  setupEventListeners();

  function initializeInterface() {
    Object.entries(state.formData).forEach(([key, value]) => {
      const element = document.getElementById(key);
      if (element) {
        element.value = value;
      }
    });

    updatePongTypeFields();
  }

  function setupEventListeners() {
    const shapeSelect = document.getElementById("shape");
    if (shapeSelect) {
      shapeSelect.addEventListener("change", (e) => {
        state.formData.shape = e.target.value;
      });
    }

    const modeSelect = document.getElementById("mode");
    if (modeSelect) {
      modeSelect.addEventListener("change", (e) => {
        state.formData.mode = e.target.value;
        updatePongTypeFields();
      });
    }

    const gameForm = document.getElementById("gameForm");
    if (gameForm) {
      gameForm.addEventListener("submit", (e) => {
        e.preventDefault();
        submitSettings();
      });
    }

    [
      "playerId",
      "numPlayers",
      "numSides",
      "numBalls",
      "shape",
      "scoreMode",
    ].forEach((fieldId) => {
      const element = document.getElementById(fieldId);
      if (element) {
        element.addEventListener("change", (e) => {
          state.formData[fieldId] =
            e.target.type === "number"
              ? parseInt(e.target.value)
              : e.target.value;
        });
      }
    });
  }

  function updatePongTypeFields() {
    const config = state.gameConfigs[state.formData.mode];
    if (!config) {
      showStatus("Invalid game type selected", true);
      return;
    }

    const sidesField = document.getElementById("sidesField");
    if (sidesField) {
      sidesField.style.display =
        state.formData.mode === "classic" ? "none" : "block";
    }

    const shapeFields = document.querySelectorAll(".shape-fields");
    shapeFields.forEach((field) => {
      field.style.display =
        state.formData.mode === "irregular" ? "block" : "none";
    });
  }

  function showStatus(message, isError = false) {
    const status = document.getElementById("status");
    if (!status) return;

    status.textContent = message;
    status.className = isError ? "error" : "success";
    status.style.display = "block";

    setTimeout(() => {
      status.style.display = "none";
    }, 5000);
  }

  async function submitSettings() {
    const config = state.gameConfigs[state.formData.mode];
    if (!config) {
      showStatus("Invalid game type selected", true);
      return;
    }

    const settings = { ...state.formData };

    if (!settings.playerId) {
      showStatus("Player ID is required.", true);
      return;
    }

    if (
      settings.numPlayers < PLAYER_LIMITS.min ||
      settings.numPlayers > config.maxPlayers
    ) {
      showStatus(
        `Number of players must be between ${PLAYER_LIMITS.min} and ${config.maxPlayers}.`,
        true
      );
      return;
    }

    try {
      const response = await createNewGame(settings);

      if (response.success) {
        showStatus("Game created successfully!", false);

        // ws_url is stored in localStorage
        localStorage.setItem("ws_url", response.ws_url);
        // Show websocket address for visual debugging
        showStatus(`WebSocket address: ${response.ws_url}`, false);
      } else {
        showStatus(response.message || "Failed to create game.", true);
      }
    } catch (error) {
      showStatus("Error creating game: " + error.message, true);
    }

  }
}