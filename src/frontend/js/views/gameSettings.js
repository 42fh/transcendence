import { CONFIG } from "../config/constants.js";
import { createNewGame } from "../services/gameSettingsService.js";
import { displayModalError } from "../components/modal.js";

export function gameSettings() {
  console.log("print from inside gameSettings");
  const state = {
    gameType: "classic",
    showSettings: false,
    eventLog: document.getElementById("eventLog"),
    formData: {
      playerId: "",
      numPlayers: 2,
      numSides: 22,
      numBalls: 1,
      shape: "regular",
      scoreMode: "classic",
      pongType: "classic",
      mode: "regular",
    },
    gameConfigs: {
      classic: {
        type: "classic",
        sides: 10,
        maxPlayers: 2,
        description: "Classic 2-player pong with 2 paddles and 2 walls",
      },
      regular: {
        type: "classic",
        sides: 11,
        maxPlayers: 4,
        description: "Regular polygon with all sides playable",
      },
      circular: {
        type: "circular",
        sides: 12,
        maxPlayers: 8,
        description: "Circular arena with curved paddles and sides",
      },
      irregular: {
        type: "classic",
        sides: 13,
        maxPlayers: 6,
        description: "Irregular polygon shape with customizable sides",
        shapes: {
          regular: "Standard polygon",
          irregular: "Slightly deformed polygon with balanced sides",
          star: "Star-like shape with alternating long and short sides",
          crazy: "Extreme deformation with sharp transitions",
        },
      },
    },
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

  console.log("Before initializeInterface");
  initializeInterface();
  setupEventListeners();

  function initializeInterface() {
    console.log("inside initializeInterface");

    Object.entries(state.formData).forEach(([key, value]) => {
      const element = document.getElementById(key);
      if (element) {
        element.value = value;
      }
    });

    updateGameTypeFields();
  }

  function setupEventListeners() {
    console.log("print from setupEventListeners");
    const toggleSettingsButton = document.getElementById("toggleSettings");
    if (toggleSettingsButton) {
      toggleSettingsButton.addEventListener("click", () => {
        state.showSettings = !state.showSettings;
        const advancedSettings = document.getElementById("advancedSettings");
        const toggleText = document.getElementById("toggleText");
        const toggleIcon = document.getElementById("toggleIcon");

        advancedSettings.style.display = state.showSettings ? "block" : "none";
        toggleText.textContent = state.showSettings
          ? "Hide Settings"
          : "Show Settings";
        toggleIcon.textContent = state.showSettings ? "▼" : "▶";
      });
    }

    const gameTypeSelect = document.getElementById("gameType");
    if (gameTypeSelect) {
      gameTypeSelect.addEventListener("change", (e) => {
        state.gameType = e.target.value;
        updateGameTypeFields();
      });
    }

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

    const numSidesInput = document.getElementById("numSides");
    if (numSidesInput) {
      numSidesInput.addEventListener("change", (e) => {
        state.formData.numSides = parseInt(e.target.value);
      });
    }

    const exitButton = document.createElement("button");
    exitButton.textContent = "Exit Settings";
    exitButton.id = "exit-settings-button";
    exitButton.addEventListener("click", () => {
      mainContent.innerHTML = "";
    });
    mainContent.appendChild(exitButton);
  }

  function updateGameTypeFields() {
    console.log("print from updateGameTypeFields");

    const config = state.gameConfigs[state.gameType];
    if (!config) return;

    const numPlayersInput = document.getElementById("numPlayers");
    if (numPlayersInput) {
      numPlayersInput.addEventListener("change", (e) => {
        const newNumPlayers = parseInt(e.target.value);
        if (
          newNumPlayers >= 2 &&
          newNumPlayers <= state.gameConfigs[state.gameType].maxPlayers
        ) {
          state.formData.numPlayers = newNumPlayers;
        } else {
          console.error(
            "Number of players must be between 2 and " +
              state.gameConfigs[state.gameType].maxPlayers
          );
        }
      });
    }

    const numSidesInput = document.getElementById("numSides");
    if (numSidesInput) {
      numSidesInput.addEventListener("change", (e) => {
        const newSides = parseInt(e.target.value);
        state.formData.numSides = newSides;
        console.log("Sides updated in state:", state.formData.numSides);
      });
    }

    const shapeFields = document.querySelectorAll(".shape-fields");
    shapeFields.forEach((field) => {
      field.style.display = state.gameType === "irregular" ? "block" : "none";
    });

    const sidesField = document.getElementById("sidesField");
    if (sidesField) {
      sidesField.style.display =
        state.gameType !== "classic" ? "block" : "none";
    }
  }

  function logEvent(event) {
    if (!state.eventLog) return;

    const logEntry = document.createElement("div");
    logEntry.className = `log-entry ${event.type}`;

    const timestamp = new Date().toLocaleTimeString();

    logEntry.innerHTML = `
            <span class="log-timestamp">[${timestamp}]</span>
            <span class="log-message">${event.message}</span>
            ${
              event.details
                ? `<div class="log-details">${event.details}</div>`
                : ""
            }
        `;

    if (state.eventLog.firstChild) {
      state.eventLog.insertBefore(logEntry, state.eventLog.firstChild);
    } else {
      state.eventLog.appendChild(logEntry);
    }

    while (state.eventLog.children.length > 50) {
      state.eventLog.removeChild(state.eventLog.lastChild);
    }
  }

  function showStatus(message, isError = false) {
    const status = document.getElementById("status");
    status.textContent = message;
    status.className = isError ? "error" : "success";
    status.style.display = "block";

    // Hide after 5 seconds
    setTimeout(() => {
      status.style.display = "none";
    }, 5000);
  }

  async function submitSettings() {
    console.log("Inside submitSettings");
    // console.log("Current state:", JSON.stringify(state, null, 2));

    const config = state.gameConfigs[state.gameType];
    if (!config) {
      console.error("Invalid game type selected");
      console.log("Current game type:", state.gameType);
      displayModalError("Invalid game type selected");
      return;
    }

    const playerId = document.getElementById("playerId").value;
    const numPlayers = parseInt(document.getElementById("numPlayers").value);
    const numSides = parseInt(document.getElementById("numSides").value);
    const numBalls = parseInt(document.getElementById("numBalls").value);
    const shape = document.getElementById("shape").value;
    const scoreMode = document.getElementById("scoreMode").value;

    // console.log("Submitting numSides:", numSides);

    if (numPlayers < 2 || numPlayers > config.maxPlayers) {
      showStatus(
        `Number of players must be between 2 and ${config.maxPlayers}`,
        true
      );
      return;
    }

    if (state.gameType === "circular") {
      if (numSides < 4 || numSides > 12) {
        showStatus("Circular mode requires between 4 and 12 sides", true);
        return;
      }
    } else if (state.gameType !== "classic") {
      if (numSides < 3 || numSides > 8) {
        showStatus(
          "Number of sides must be between 3 and 8 for polygon modes",
          true
        );
        return;
      }
    }

    if (numBalls < 1 || numBalls > 4) {
      displayModalError("Number of balls must be between 1 and 4");
      return;
    }

    try {
      const userId = localStorage.getItem("pongUserId");
      if (!userId) {
        displayModalError("User ID not found in localStorage");
        return;
      }

      const mainContent = document.getElementById("main-content");
      if (!mainContent) {
        throw new Error("Main content element not found");
      }

      mainContent.innerHTML = '<div class="loading">Creating game...</div>';

      const gameConfig = {
        playerId,
        mode: state.formData.mode,
        type: config.type,
        pongType: state.gameType,
        players: numPlayers,
        balls: numBalls,
        sides: numSides,
        shape: state.gameType === "irregular" ? shape : undefined,
        scoreMode,
        userId,
      };

      console.log(
        "Submitting gameConfig:",
        JSON.stringify(gameConfig, null, 2)
      );

      const data = await createNewGame(gameConfig);
      const gameId = data.gameId;
      mainContent.innerHTML = `<div class="success">Game created successfully with ID: ${gameId}</div>`;
      logEvent({
        type: "info",
        message: "Game created",
        details: `Game ID: ${gameId}`,
      });
    } catch (error) {
      const mainContent = document.getElementById("main-content");
      if (mainContent) {
        mainContent.innerHTML = `<div class="error">Error: ${error.message}</div>`;
      }
      displayModalError(`Error: ${error.message}`);
      console.error("Game creation error:", error);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  gameSettings();
});
// test
