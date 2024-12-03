import { GameController } from "./gameController.js";
import { CONFIG } from "./config.js";

export class GameInterface2D {
  constructor() {
    this.controller = null;
    this.debugEnabled = false;
    this.gameType = "polygon";
    // this.showSettings = false;
    this.showSettings = true;
    this.eventLog = document.getElementById("two-d-game__eventLog");
    this.formData = {
      //   gameId: "",
      //   playerId: "",
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
    console.log("Initializing interface");
    // Set initial form values
    console.log("Setting initial form values");
    Object.entries(this.formData).forEach(([key, value]) => {
      const element = document.getElementById(key);
      if (element) {
        element.value = value;
      }
    });

    // Initialize game type specific fields
    console.log("Updating game type fields");
    this.updateGameTypeFields();

    // Initialize shape description
    console.log("Updating shape description");
    this.updateShapeDescription();
  }

  setupEventListeners() {
    console.log("Setting up event listeners for 2D game");
    // Toggle settings visibility
    const toggleSettingsButton = document.getElementById("two-d-game__toggle-settings");
    if (!toggleSettingsButton) {
      console.error("toggleSettingsButton not found");
      return;
    }
    toggleSettingsButton.replaceWith(toggleSettingsButton.cloneNode(true));
    const newToggleSettingsButton = document.getElementById("two-d-game__toggle-settings");

    newToggleSettingsButton.addEventListener("click", () => {
      console.log("toggleSettingsButton clicked");
      this.showSettings = !this.showSettings;
      const advancedSettings = document.getElementById("two-d-game__advanced-settings");
      const toggleText = document.getElementById("two-d-game__toggle-text");
      const toggleIcon = document.getElementById("two-d-game__toggle-icon");

      //   console.log("Found elements:", {
      //     advancedSettings: !!advancedSettings,
      //     toggleText: !!toggleText,
      //     toggleIcon: !!toggleIcon,
      //   });

      if (advancedSettings) {
        // Force display style
        advancedSettings.style.cssText = this.showSettings ? "display: block !important" : "display: none !important";

        //   advancedSettings.style.display = this.showSettings ? "block" : "none";
        console.log("Advanced settings display:", advancedSettings.style.display);

        // Log computed style
        const computedStyle = window.getComputedStyle(advancedSettings);
        console.log("Computed display:", computedStyle.display);
        console.log("Element visibility:", computedStyle.visibility);
        console.log("Element opacity:", computedStyle.opacity);
        console.log("Element position:", computedStyle.position);

        // Log element dimensions
        console.log("Element dimensions:", {
          offsetHeight: advancedSettings.offsetHeight,
          clientHeight: advancedSettings.clientHeight,
          scrollHeight: advancedSettings.scrollHeight,
        });
      }

      if (toggleText) toggleText.textContent = this.showSettings ? "Hide Settings" : "Show Settings";
      if (toggleIcon) toggleIcon.textContent = this.showSettings ? "▼" : "▶";
    });

    // Game type change handler
    const gameTypeInput = document.getElementById("two-d-game__game-type");
    if (!gameTypeInput) {
      console.error("gameTypeInput not found");
      return;
    }
    gameTypeInput.addEventListener("change", (e) => {
      this.gameType = e.target.value;
      this.updateGameTypeFields();
    });

    // Shape change handler
    const shapeInput = document.getElementById("two-d-game__shape");
    if (!shapeInput) {
      console.error("shapeInput not found");
      return;
    }
    shapeInput.addEventListener("change", (e) => {
      this.formData.shape = e.target.value;
      this.updateShapeDescription();
    });

    // Form submission
    const gameForm = document.getElementById("two-d-game__gameForm");
    if (!gameForm) {
      console.error("gameForm not found");
      return;
    }
    gameForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.startGame();
    });

    // Debug mode toggle
    const debugModeInput = document.getElementById("two-d-game__debug-mode");
    if (!debugModeInput) {
      console.error("debugModeInput not found");
      return;
    }
    debugModeInput.addEventListener("change", (e) => {
      this.debugEnabled = e.target.checked;
    });

    // Form input change handlers
    const inputFields = [
      "two-d-game__game-id",
      "two-d-game__player-id",
      "two-d-game__num-players",
      "two-d-game__num-sides",
      "two-d-game__num-balls",
      "two-d-game__shape",
      "two-d-game__score-mode",
    ];
    inputFields.forEach((fieldId) => {
      const element = document.getElementById(fieldId);
      if (element) {
        element.addEventListener("change", (e) => {
          this.formData[fieldId] = e.target.type === "number" ? parseInt(e.target.value) : e.target.value;
        });
      }
    });

    // Setup keyboard controls
    document.addEventListener("keydown", (e) => {
      if (!this.controller) return;

      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          this.controller.movePaddle("left");
          break;
        case "ArrowRight":
        case "d":
        case "D":
          this.controller.movePaddle("right");
          break;
      }
    });
  }

  updateGameTypeFields() {
    const config = this.gameConfigs[this.gameType];
    if (!config) return;

    // Update number of players max value
    const numPlayersInput = document.getElementById("two-d-game__num-players");
    if (numPlayersInput) {
      numPlayersInput.max = config.maxPlayers;
      if (parseInt(numPlayersInput.value) > config.maxPlayers) {
        numPlayersInput.value = config.maxPlayers;
        this.formData.numPlayers = config.maxPlayers;
      }
    }

    // Update number of sides based on game type
    const numSidesInput = document.getElementById("two-d-game__num-sides");
    if (numSidesInput) {
      numSidesInput.value = config.sides;
      numSidesInput.disabled = this.gameType === "classic";
      // Update min/max based on game type
      if (this.gameType === "circular") {
        numSidesInput.min = 2;
        numSidesInput.max = 12;
      } else {
        numSidesInput.min = 3;
        numSidesInput.max = 8;
      }
      this.formData.numSides = config.sides;
    }

    // Show/hide shape fields
    const shapeFields = document.querySelectorAll(".two-d-game__shape-fields");
    shapeFields.forEach((field) => {
      field.style.display = this.gameType === "irregular" ? "block" : "none";
    });

    // Update sides field visibility
    const sidesField = document.getElementById("two-d-game__sides-field");
    if (sidesField) {
      sidesField.style.display = this.gameType !== "classic" ? "block" : "none";
    }

    this.updateGameDescription();
  }

  updateGameDescription() {
    const descElement = document.getElementById("two-d-game__game-description");
    if (!descElement) return;

    const config = this.gameConfigs[this.gameType];
    if (!config) return;

    descElement.innerHTML = `
            <div class="two-d-game__game-description">
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
    const shapeDescElement = document.getElementById("two-d-game__shape-description");
    if (!shapeDescElement) return;

    const descriptions = {
      regular: "",
      irregular: "Slightly deformed polygon with balanced sides",
      star: "Star-like shape with alternating long and short sides",
      crazy: "Extreme deformation with sharp transitions",
    };

    shapeDescElement.textContent = descriptions[this.formData.shape] || "";
    shapeDescElement.style.display = this.formData.shape === "regular" ? "none" : "block";
  }

  //   generateRandomId() {
  //     return Math.random().toString(36).substring(2, 15);
  //   }

  logEvent(event) {
    if (!this.eventLog) return;

    const logEntry = document.createElement("div");
    logEntry.className = `log-entry ${event.type}`;

    const timestamp = new Date().toLocaleTimeString();

    logEntry.innerHTML = `
            <span class="two-d-game__log-timestamp">[${timestamp}]</span>
            <span class="two-d-game__log-message">${event.message}</span>
            ${event.details ? `<div class="two-d-game__log-details">${event.details}</div>` : ""}
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

  async startGame() {
    const config = this.gameConfigs[this.gameType];
    if (!config) {
      this.showStatus("Invalid game type selected", true);
      return;
    }
    // const gameId = document.getElementById("two-d-game__game-id").value || this.generateRandomId();
    // const playerId = document.getElementById("two-d-game__player-id").value || this.generateRandomId();
    const numPlayers = parseInt(document.getElementById("two-d-game__num-players").value);
    const numSides = parseInt(document.getElementById("two-d-game__num-sides").value);
    const numBalls = parseInt(document.getElementById("two-d-game__num-balls").value);
    const shape = document.getElementById("two-d-game__shape").value;
    const scoreMode = document.getElementById("two-d-game__score-mode").value;
    const debug = document.getElementById("two-d-game__debug-mode").checked;

    // Validation
    if (numPlayers < 2 || numPlayers > config.maxPlayers) {
      this.showStatus(`Number of players must be between 2 and ${config.maxPlayers}`, true);
      return;
    }

    // Validate sides based on game type
    if (this.gameType === "circular") {
      if (numSides < 2 || numSides > 12) {
        this.showStatus("Circular mode requires between 4 and 12 sides", true);
        return;
      }
    } else if (this.gameType !== "classic") {
      if (numSides < 3 || numSides > 8) {
        this.showStatus("Number of sides must be between 3 and 8 for polygon modes", true);
        return;
      }
    }

    if (numBalls < 1 || numBalls > 4) {
      this.showStatus("Number of balls must be between 1 and 4", true);
      return;
    }

    try {
      this.controller = new GameController(null, (event) => this.logEvent(event));

      const gameConfig = {
        // gameId,
        // playerId,
        type: config.type, // 'polygon' or 'circular'
        pongType: this.gameType, // actual game variant
        players: numPlayers,
        balls: numBalls,
        debug,
        sides: this.gameType === "classic" ? 4 : numSides,
        shape: this.gameType === "irregular" ? shape : undefined,
        scoreMode,
      };

      const success = await this.controller.directConnect(gameId, {
        ...gameConfig,
        onMessage: (data) => {
          this.logEvent(JSON.stringify(data));
        },
      });

      if (success) {
        // Hide setup and show game
        document.getElementById("2d-game__setup").style.display = "none";
        document.getElementById("2d-game__game").style.display = "block";

        this.updateGameInfo(gameConfig);
        this.logEvent({
          type: "info",
          message: "Game started",
          details: `Game ID: ${gameId}`,
        });
        this.showStatus(`Connected to game ${gameId} as player ${playerId}`);
      } else {
        this.showStatus("Failed to connect to game", true);
      }
    } catch (error) {
      this.showStatus(`Error: ${error.message}`, true);
      console.error("Game initialization error:", error);
    }
  }

  updateGameInfo(config) {
    const gameInfo = document.getElementById("two-d-game__game-info");
    gameInfo.innerHTML = `
            <div class="two-d-game__game-info-item">
                <span class="two-d-game__game-info-label">Game ID:</span>
                <span>${config.gameId}</span>
            </div>
            <div class="two-d-game__game-info-item">
                <span class="two-d-game__game-info-label">Player ID:</span>
                <span>${config.playerId}</span>
            </div>
            <div class="two-d-game__game-info-item">
                <span class="two-d-game__game-info-label">Game Type:</span>
                <span>${config.type}</span>
            </div>
            <div class="two-d-game__game-info-item">
                <span class="two-d-game__game-info-label">Players:</span>
                <span>${config.players}</span>
            </div>
            ${
              config.sides
                ? `
            <div class="two-d-game__game-info-item">
                <span class="two-d-game__game-info-label">Sides:</span>
                <span>${config.sides}</span>
            </div>
            `
                : ""
            }
            <div class="two-d-game__game-info-item">
                <span class="two-d-game__game-info-label">Balls:</span>
                <span>${config.balls}</span>
            </div>
            <div class="two-d-game__game-info-item">
                <span class="two-d-game__game-info-label">Score Mode:</span>
                <span>${config.scoreMode}</span>
            </div>
            ${
              config.shape
                ? `
            <div class="two-d-game__game-info-item">
                <span class="two-d-game__game-info-label">Shape:</span>
                <span>${config.shape}</span>
            </div>
            `
                : ""
            }
        `;
  }

  showStatus(message, isError = false) {
    const status = document.getElementById("two-d-game__status");
    status.textContent = message;
    status.className = `status ${isError ? "error" : "success"}`;
    status.style.display = "block";
  }

  setupDebugHandler() {
    if (this.controller.gameState) {
      const stateObserver = {
        updateState: (newState) => {
          if (this.debugEnabled) {
            this.logEvent(`State update: ${JSON.stringify(newState)}`, "debug");
          }
        },
      };

      this.controller.gameState.addObserver?.(stateObserver);
    }
  }
}

// Initialize when DOM is loaded
// We don't want this anymore because we're using the template now
// We want to initlaize the event listeners only when we click on the 2D game button
// document.addEventListener("DOMContentLoaded", () => {
//   new GameInterface2D();
// });
