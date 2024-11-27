import { CONFIG } from "../config/constants.js";
// import { showToast } from '../utils/toast.js';

export function gameSettings() {
  console.log("print from gameSettings");
  // Encapsulated state
  const state = {
    debugEnabled: false,
    gameType: "classic",
    showSettings: false,
    eventLog: document.getElementById("eventLog"),
    formData: {
      playerId: "",
      numPlayers: 2,
      numSides: 4,
      numBalls: 1,
      shape: "regular",
      scoreMode: "classic",
      pongType: "classic",
    },
    gameConfigs: {
      classic: {
        type: "classic",
        sides: 4,
        maxPlayers: 2,
        description: "Classic 2-player pong with 2 paddles and 2 walls",
      },
      regular: {
        type: "classic",
        sides: 4,
        maxPlayers: 4,
        description: "Regular polygon with all sides playable",
      },
      circular: {
        type: "circular",
        sides: 8,
        maxPlayers: 8,
        description: "Circular arena with curved paddles and sides",
      },
      irregular: {
        type: "classic",
        sides: 6,
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

  // Clear existing content in main-content
  const mainContent = document.getElementById("main-content");
  if (mainContent) {
    mainContent.innerHTML = ""; // Clear existing content
  }

  // Render the game settings template
  const settingsTemplate = document.getElementById("game-settings-template");
  if (settingsTemplate) {
    const settingsContent = document.importNode(settingsTemplate.content, true);
    mainContent.appendChild(settingsContent);
  }

  initializeInterface();
  setupEventListeners();

  function initializeInterface() {
    // Set initial form values
    Object.entries(state.formData).forEach(([key, value]) => {
      const element = document.getElementById(key);
      if (element) {
        element.value = value;
      }
    });

    // Initialize game type specific fields
    updateGameTypeFields();

    // Initialize shape description
    updateShapeDescription();
  }

  function setupEventListeners() {
    // Ensure elements exist before adding event listeners
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

    // Game type change handler
    const gameTypeSelect = document.getElementById("gameType");
    if (gameTypeSelect) {
      gameTypeSelect.addEventListener("change", (e) => {
        state.gameType = e.target.value;
        updateGameTypeFields();
      });
    }

    // Shape change handler
    const shapeSelect = document.getElementById("shape");
    if (shapeSelect) {
      shapeSelect.addEventListener("change", (e) => {
        state.formData.shape = e.target.value;
        updateShapeDescription();
      });
    }

    // Form submission
    const gameForm = document.getElementById("gameForm");
    if (gameForm) {
      gameForm.addEventListener("submit", (e) => {
        e.preventDefault();
        submitSettings();
      });
    }

    // Debug mode toggle
    const debugModeCheckbox = document.getElementById("debugMode");
    if (debugModeCheckbox) {
      debugModeCheckbox.addEventListener("change", (e) => {
        state.debugEnabled = e.target.checked;
      });
    }

    // Form input change handlers
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

    // Exit button to clear settings
    const exitButton = document.createElement("button");
    exitButton.textContent = "Exit Settings";
    exitButton.id = "exit-settings-button";
    exitButton.addEventListener("click", () => {
      mainContent.innerHTML = ""; // Clear the settings when exiting
    });
    mainContent.appendChild(exitButton);
  }

  function updateGameTypeFields() {
    const config = state.gameConfigs[state.gameType];
    if (!config) return;

    // Update number of players max value
    const numPlayersInput = document.getElementById("numPlayers");
    if (numPlayersInput) {
      numPlayersInput.max = config.maxPlayers;
      if (parseInt(numPlayersInput.value) > config.maxPlayers) {
        numPlayersInput.value = config.maxPlayers;
        state.formData.numPlayers = config.maxPlayers;
      }
    }

    // Update number of sides based on game type
    const numSidesInput = document.getElementById("numSides");
    if (numSidesInput) {
      numSidesInput.value = config.sides;
      numSidesInput.disabled = state.gameType === "classic";
      // Update min/max based on game type
      if (state.gameType === "circular") {
        numSidesInput.min = 4;
        numSidesInput.max = 12;
      } else {
        numSidesInput.min = 3;
        numSidesInput.max = 8;
      }
      state.formData.numSides = config.sides;
    }

    // Show/hide shape fields
    const shapeFields = document.querySelectorAll(".shape-fields");
    shapeFields.forEach((field) => {
      field.style.display = state.gameType === "irregular" ? "block" : "none";
    });

    // Update sides field visibility
    const sidesField = document.getElementById("sidesField");
    if (sidesField) {
      sidesField.style.display =
        state.gameType !== "classic" ? "block" : "none";
    }

    updateGameDescription();
  }

  function updateGameDescription() {
    const descElement = document.getElementById("gameDescription");
    if (!descElement) return;

    const config = state.gameConfigs[state.gameType];
    if (!config) return;

    descElement.innerHTML = `
            <div class="game-description">
                <p>${config.description}</p>
                <ul>
                    <li>Game Type: ${config.type}</li>
                    <li>Number of Sides: ${config.sides} ${
      state.gameType === "classic" ? "(2 paddles, 2 walls)" : ""
    }</li>
                    <li>Maximum Players: ${config.maxPlayers}</li>
                </ul>
            </div>
        `;
  }

  function updateShapeDescription() {
    const shapeDescElement = document.getElementById("shapeDescription");
    if (!shapeDescElement) return;

    const descriptions = {
      regular: "",
      irregular: "Slightly deformed polygon with balanced sides",
      star: "Star-like shape with alternating long and short sides",
      crazy: "Extreme deformation with sharp transitions",
    };

    shapeDescElement.textContent = descriptions[state.formData.shape] || "";
    shapeDescElement.style.display =
      state.formData.shape === "regular" ? "none" : "block";
  }

  function generateRandomId() {
    return Math.random().toString(36).substring(2, 15);
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

    // Add new entry at the top
    if (state.eventLog.firstChild) {
      state.eventLog.insertBefore(logEntry, state.eventLog.firstChild);
    } else {
      state.eventLog.appendChild(logEntry);
    }

    // Limit the number of log entries (optional)
    while (state.eventLog.children.length > 50) {
      state.eventLog.removeChild(state.eventLog.lastChild);
    }
  }

  async function submitSettings() {
    const config = state.gameConfigs[state.gameType];
    if (!config) {
      // Debugging information
      console.error("Invalid game type selected");
      console.log("Current game type:", state.gameType);
      console.log("Available game types:", Object.keys(state.gameConfigs));

      showStatus("Invalid game type selected", true);
      return;
    }

    const playerId =
      document.getElementById("playerId").value || generateRandomId();
    const numPlayers = parseInt(document.getElementById("numPlayers").value);
    const numSides = parseInt(document.getElementById("numSides").value);
    const numBalls = parseInt(document.getElementById("numBalls").value);
    const shape = document.getElementById("shape").value;
    const scoreMode = document.getElementById("scoreMode").value;
    const debug = document.getElementById("debugMode").checked;

    // Validation
    if (numPlayers < 2 || numPlayers > config.maxPlayers) {
      showStatus(
        `Number of players must be between 2 and ${config.maxPlayers}`,
        true
      );
      return;
    }

    // Validate sides based on game type
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
      showStatus("Number of balls must be between 1 and 4", true);
      return;
    }

    try {
      const userId = localStorage.getItem("pongUserId");
      if (!userId) {
        showStatus("User ID not found in localStorage", true);
        return;
      }

      const mainContent = document.getElementById("main-content");
      if (!mainContent) {
        throw new Error("Main content element not found");
      }

      // Clear existing content and show loading state
      mainContent.innerHTML = '<div class="loading">Creating game...</div>';

      const gameConfig = {
        playerId,
        type: config.type,
        pongType: state.gameType,
        players: numPlayers,
        balls: numBalls,
        debug,
        sides: state.gameType === "classic" ? 4 : numSides,
        shape: state.gameType === "irregular" ? shape : undefined,
        scoreMode,
        userId,
      };

      const response = await fetch(
        `${CONFIG.API_BASE_URL}/api/game/create_new_game/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(gameConfig),
        }
      );

      if (response.ok) {
        console.log("POST request successful");
        const data = await response.json();
        console.log("Data received: ", data);
        const gameId = data.gameId;
        mainContent.innerHTML = `<div class="success">Game created successfully with ID: ${gameId}</div>`;
        logEvent({
          type: "info",
          message: "Game created",
          details: `Game ID: ${gameId}`,
        });
      } else {
        console.log("POST request unsuccesful");
        const errorData = await response.json();
        mainContent.innerHTML = `<div class="error">Error: ${errorData.message}</div>`;
        showStatus(`Error: ${errorData.message}`, true);
      }
    } catch (error) {
      const mainContent = document.getElementById("main-content");
      if (mainContent) {
        mainContent.innerHTML = `<div class="error">Error: ${error.message}</div>`;
      }
      showStatus(`Error: ${error.message}`, true);
      console.error("Game creation error:", error);
    }
  }

  function showStatus(message, isError = false) {
    const status = document.getElementById("status");
    status.textContent = message;
    status.className = `status ${isError ? "error" : "success"}`;
    status.style.display = "block";
  }
}

// Update the instantiation
document.addEventListener("DOMContentLoaded", () => {
  gameSettings(); // Call the function directly
});
