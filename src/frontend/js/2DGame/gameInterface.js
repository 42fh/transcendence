import { GameController } from "./gameController.js";
import { CONFIG } from "../config/constants.js";

export class GameInterface2D {
  constructor() {
    this.controller = null;
    this.debugEnabled = false;
    this.gameType = "classic";
    // this.gameConfigs = CONFIG.GAME_CONFIGS;
  }

  /* toggleGameFormFields toggles conditionally  the visibility of the shape and sides fields based on the game type. It was part of the former updateGameTypeFields function which we radically changed*/
  toggleGameFormFields() {
    // Toggle shape fields visibility
    const shapeFields = document.querySelectorAll(".two-d-game__shape-fields");
    shapeFields.forEach((field) => {
      field.style.display = this.gameType === "irregular" ? "block" : "none";
    });

    // Toggle sides field visibility
    const sidesField = document.getElementById("two-d-game__sides-field");
    if (sidesField) {
      field.style.display = this.gameType !== "classic" ? "block" : "none";
    }
  }

  async startGame() {
    const config = this.gameConfigs[this.gameType];
    if (!config) {
      this.showStatus("Invalid game type selected", true);
      return;
    }
    const { numPlayers, numSides, numBalls, shape, scoreMode, debug } = this.collectFormData();

    // Validation
    if (numPlayers < 2 || numPlayers > config.maxPlayers) {
      this.showStatus(`Number of players must be between 2 and ${config.maxPlayers}`, true);
      return;
    }

    try {
      this.controller = new GameController(null, (event) => this.logEvent(event));

      const gameConfig = {
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
          console.log("onMessage", data);
        },
      });

      if (success) {
        // Hide setup and show game
        document.getElementById("2d-game__setup").style.display = "none";
        document.getElementById("2d-game__game").style.display = "block";

        this.updateGameInfo(gameConfig);
        // this.logEvent({
        //   type: "info",
        //   message: "Game started",
        //   details: `Game ID: ${gameId}`,
        // });
        if (gameConfig.gameId && gameConfig.playerId) {
          console.log(`Connected to game ${gameConfig.gameId} as player ${gameConfig.playerId}`);
        } else {
          console.error("Game ID or player ID not found");
        }
        // this.showStatus(`Connected to game ${gameConfig.gameId} as player ${gameConfig.playerId}`);
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
