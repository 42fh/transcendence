import { CONFIG } from "../config/constants.js";
// import { showToast } from '../utils/toast.js';

export class gameSettings {
  constructor() {
    this.debugEnabled = false;
    this.gameType = "polygon";
    this.showSettings = false;
    this.eventLog = document.getElementById("eventLog");
    this.formData = {
      playerId: "",
      numPlayers: 2,
      numSides: 4,
      numBalls: 1,
      shape: "regular",
      scoreMode: "classic",
      pongType: "classic",
    };
    // Game type configurations
    this.gameConfigs = {
      classic: {
        type: "polygon",
        sides: 4,
        maxPlayers: 2,
        description: "Classic 2-player pong with 2 paddles and 2 walls",
      },
      regular: {
        type: "polygon",
        sides: 4,
        maxPlayers: 4,
        description: "Regular polygon with all sides playable",
      },
      circular: {
        type: "circular",
        sides: 8, // Default number of sides for circular
        maxPlayers: 8,
        description: "Circular arena with curved paddles and sides",
      },
      irregular: {
        type: "polygon",
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
    };
    this.setupEventListeners();
    this.initializeInterface();
  }

  initializeInterface() {
    // Set initial form values
    Object.entries(this.formData).forEach(([key, value]) => {
      const element = document.getElementById(key);
      if (element) {
        element.value = value;
      }
    });

    // Initialize game type specific fields
    this.updateGameTypeFields();

    // Initialize shape description
    this.updateShapeDescription();
  }

  setupEventListeners() {
    // Toggle settings visibility
    document.getElementById("toggleSettings").addEventListener("click", () => {
      this.showSettings = !this.showSettings;
      const advancedSettings = document.getElementById("advancedSettings");
      const toggleText = document.getElementById("toggleText");
      const toggleIcon = document.getElementById("toggleIcon");

      advancedSettings.style.display = this.showSettings ? "block" : "none";
      toggleText.textContent = this.showSettings
        ? "Hide Settings"
        : "Show Settings";
      toggleIcon.textContent = this.showSettings ? "▼" : "▶";
    });

    // Game type change handler
    document.getElementById("gameType").addEventListener("change", (e) => {
      this.gameType = e.target.value;
      this.updateGameTypeFields();
    });

    // Shape change handler
    document.getElementById("shape").addEventListener("change", (e) => {
      this.formData.shape = e.target.value;
      this.updateShapeDescription();
    });

    // Form submission
    document.getElementById("gameForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.submitSettings();
    });

    // Debug mode toggle
    document.getElementById("debugMode").addEventListener("change", (e) => {
      this.debugEnabled = e.target.checked;
    });

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
          this.formData[fieldId] =
            e.target.type === "number"
              ? parseInt(e.target.value)
              : e.target.value;
        });
      }
    });
  }

  updateGameTypeFields() {
    const config = this.gameConfigs[this.gameType];
    if (!config) return;

    // Update number of players max value
    const numPlayersInput = document.getElementById("numPlayers");
    if (numPlayersInput) {
      numPlayersInput.max = config.maxPlayers;
      if (parseInt(numPlayersInput.value) > config.maxPlayers) {
        numPlayersInput.value = config.maxPlayers;
        this.formData.numPlayers = config.maxPlayers;
      }
    }

    // Update number of sides based on game type
    const numSidesInput = document.getElementById("numSides");
    if (numSidesInput) {
      numSidesInput.value = config.sides;
      numSidesInput.disabled = this.gameType === "classic";
      // Update min/max based on game type
      if (this.gameType === "circular") {
        numSidesInput.min = 4;
        numSidesInput.max = 12;
      } else {
        numSidesInput.min = 3;
        numSidesInput.max = 8;
      }
      this.formData.numSides = config.sides;
    }

    // Show/hide shape fields
    const shapeFields = document.querySelectorAll(".shape-fields");
    shapeFields.forEach((field) => {
      field.style.display = this.gameType === "irregular" ? "block" : "none";
    });

    // Update sides field visibility
    const sidesField = document.getElementById("sidesField");
    if (sidesField) {
      sidesField.style.display = this.gameType !== "classic" ? "block" : "none";
    }

    this.updateGameDescription();
  }

  updateGameDescription() {
    const descElement = document.getElementById("gameDescription");
    if (!descElement) return;

    const config = this.gameConfigs[this.gameType];
    if (!config) return;

    descElement.innerHTML = `
            <div class="game-description">
                <p>${config.description}</p>
                <ul>
                    <li>Game Type: ${config.type}</li>
                    <li>Number of Sides: ${config.sides} ${
      this.gameType === "classic" ? "(2 paddles, 2 walls)" : ""
    }</li>
                    <li>Maximum Players: ${config.maxPlayers}</li>
                </ul>
            </div>
        `;
  }

  updateShapeDescription() {
    const shapeDescElement = document.getElementById("shapeDescription");
    if (!shapeDescElement) return;

    const descriptions = {
      regular: "",
      irregular: "Slightly deformed polygon with balanced sides",
      star: "Star-like shape with alternating long and short sides",
      crazy: "Extreme deformation with sharp transitions",
    };

    shapeDescElement.textContent = descriptions[this.formData.shape] || "";
    shapeDescElement.style.display =
      this.formData.shape === "regular" ? "none" : "block";
  }

  generateRandomId() {
    return Math.random().toString(36).substring(2, 15);
  }

  logEvent(event) {
    if (!this.eventLog) return;

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
    if (this.eventLog.firstChild) {
      this.eventLog.insertBefore(logEntry, this.eventLog.firstChild);
    } else {
      this.eventLog.appendChild(logEntry);
    }

    // Limit the number of log entries (optional)
    while (this.eventLog.children.length > 50) {
      this.eventLog.removeChild(this.eventLog.lastChild);
    }
  }

  async submitSettings() {
    const config = this.gameConfigs[this.gameType];
    if (!config) {
      this.showStatus("Invalid game type selected", true);
      return;
    }

    const playerId =
      document.getElementById("playerId").value || this.generateRandomId();
    const numPlayers = parseInt(document.getElementById("numPlayers").value);
    const numSides = parseInt(document.getElementById("numSides").value);
    const numBalls = parseInt(document.getElementById("numBalls").value);
    const shape = document.getElementById("shape").value;
    const scoreMode = document.getElementById("scoreMode").value;
    const debug = document.getElementById("debugMode").checked;

    // Validation
    if (numPlayers < 2 || numPlayers > config.maxPlayers) {
      this.showStatus(
        `Number of players must be between 2 and ${config.maxPlayers}`,
        true
      );
      return;
    }

    // Validate sides based on game type
    if (this.gameType === "circular") {
      if (numSides < 4 || numSides > 12) {
        this.showStatus("Circular mode requires between 4 and 12 sides", true);
        return;
      }
    } else if (this.gameType !== "classic") {
      if (numSides < 3 || numSides > 8) {
        this.showStatus(
          "Number of sides must be between 3 and 8 for polygon modes",
          true
        );
        return;
      }
    }

    if (numBalls < 1 || numBalls > 4) {
      this.showStatus("Number of balls must be between 1 and 4", true);
      return;
    }

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        this.showStatus("User ID not found in localStorage", true);
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
        pongType: this.gameType,
        players: numPlayers,
        balls: numBalls,
        debug,
        sides: this.gameType === "classic" ? 4 : numSides,
        shape: this.gameType === "irregular" ? shape : undefined,
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
        const data = await response.json();
        const gameId = data.gameId;
        mainContent.innerHTML = `<div class="success">Game created successfully with ID: ${gameId}</div>`;
        this.logEvent({
          type: "info",
          message: "Game created",
          details: `Game ID: ${gameId}`,
        });
      } else {
        const errorData = await response.json();
        mainContent.innerHTML = `<div class="error">Error: ${errorData.message}</div>`;
        this.showStatus(`Error: ${errorData.message}`, true);
      }
    } catch (error) {
      const mainContent = document.getElementById("main-content");
      if (mainContent) {
        mainContent.innerHTML = `<div class="error">Error: ${error.message}</div>`;
      }
      this.showStatus(`Error: ${error.message}`, true);
      console.error("Game creation error:", error);
    }
  }

  showStatus(message, isError = false) {
    const status = document.getElementById("status");
    status.textContent = message;
    status.className = `status ${isError ? "error" : "success"}`;
    status.style.display = "block";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new gameSettings();
});
