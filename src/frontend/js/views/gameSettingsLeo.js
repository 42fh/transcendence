// import { createNewGame } from "../services/gameSettingsService.js";
import { createGame } from "../services/gameService.js";

export function gameSettings() {
  console.log("Entering gameSettings");
  const state = {
    showSettings: false,
    eventLog: document.getElementById("two-d-game__event-log"),
    formData: {
      playerId: "",
      numPlayers: 2,
      numSides: 22,
      numBalls: 1,
      shape: "regular",
      scoreMode: "classic",
      mode: "regular", // This is the correct reference for the game type
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

  // The game settings temp
  const settingsTemplate = document.getElementById("game-settings-template");
  if (settingsTemplate) {
    const settingsContent = document.importNode(settingsTemplate.content, true);
    mainContent.appendChild(settingsContent);
  }

  console.log("Before initializeInterface");
  initializeInterface();
  setupEventListeners();

  console.log("Game settings initialized with state:", state);

  function initializeInterface() {
    console.log("Initializing interface with form data:", state.formData);
    console.log("inside initializeInterface");

    Object.entries(state.formData).forEach(([key, value]) => {
      const element = document.getElementById(key);
      if (element) {
        element.value = value;
      }
    });

    updatePongTypeFields();
  }

  function setupEventListeners() {
    console.log("Setting up event listeners");
    console.log("print    from setupEventListeners");
    // const toggleSettingsButton = document.getElementById("toggleSettings");
    // if (toggleSettingsButton) {
    //   toggleSettingsButton.addEventListener("click", () => {
    //     state.showSettings = !state.showSettings;
    //     const advancedSettings = document.getElementById("advancedSettings");
    //     const toggleText = document.getElementById("toggleText");
    //     const toggleIcon = document.getElementById("toggleIcon");

    //     if (advancedSettings) {
    //       advancedSettings.style.display = state.showSettings ? "block" : "none";
    //     }
    //     if (toggleText) {
    //       toggleText.textContent = state.showSettings ? "Hide Settings" : "Show Settings";
    //     }
    //     if (toggleIcon) {
    //       toggleIcon.textContent = state.showSettings ? "▼" : "▶";
    //     }
    //   });
    // }

    const shapeSelect = document.getElementById("shape");
    if (shapeSelect) {
      shapeSelect.addEventListener("change", (e) => {
        console.log("Shape changed to:", e.target.value);
        state.formData.shape = e.target.value;
      });
    }

    const modeSelect = document.getElementById("mode");
    if (modeSelect) {
      modeSelect.addEventListener("change", (e) => {
        const selectedMode = e.target.value;
        console.log("Mode changed to:", selectedMode);
        state.formData.mode = selectedMode;
      });
    }

    const tournamentGameForm = document.getElementById("tournament-gameForm");
    if (tournamentGameForm) {
      tournamentGameForm.addEventListener("submit", (e) => {
        e.preventDefault();
        submitSettings();
      });
    }

    ["playerId", "numPlayers", "numSides", "numBalls", "shape", "scoreMode"].forEach((fieldId) => {
      const element = document.getElementById(fieldId);
      if (element) {
        element.addEventListener("change", (e) => {
          state.formData[fieldId] = e.target.type === "number" ? parseInt(e.target.value) : e.target.value;
        });
      }
    });

    const exitButton = document.createElement("button");
    exitButton.textContent = "Exit Settings";
    exitButton.id = "exit-settings-button";
    exitButton.addEventListener("click", () => {
      console.log("Exiting settings");
      if (mainContent) {
        mainContent.innerHTML = "";
      }
    });
    mainContent.appendChild(exitButton);
  }

  function updatePongTypeFields() {
    console.log("print from updatePongTypeFields");

    const config = state.gameConfigs[state.formData.mode]; // Corrected to use state.formData.mode
    if (!config) {
      console.error("Invalid game type selected");
      console.log("Current game type:", state.formData.mode);
      showStatus("Invalid game type selected", 1);
      return;
    }

    const sidesField = document.getElementById("sidesField");
    if (sidesField) {
      sidesField.style.display = state.formData.mode === "classic" ? "none" : "block";
    }

    const shapeFields = document.querySelectorAll(".shape-fields");
    shapeFields.forEach((field) => {
      field.style.display = state.formData.mode === "irregular" ? "block" : "none";
    });
  }

  function showStatus(message, isError = false) {
    const status = document.getElementById("status");
    if (!status) {
      console.error("Status element not found");
      return;
    }

    status.textContent = message;
    status.className = isError ? "error" : "success";
    status.style.display = "block";

    // Hide after 5 seconds
    setTimeout(() => {
      status.style.display = "none";
    }, 5000);
  }

  async function submitSettings() {
    // console.log("Submitting settings with current state:", state.formData);

    const config = state.gameConfigs[state.formData.mode];
    if (!config) {
      console.error("ERROR: Invalid game type selected");
      showStatus("Invalid game type selected");
      return;
    }

    const playerId = document.getElementById("playerId").value;
    const numPlayers = parseInt(document.getElementById("numPlayers").value);
    const numSides = parseInt(document.getElementById("numSides").value);
    const numBalls = parseInt(document.getElementById("numBalls").value);
    const shape = document.getElementById("shape").value;
    const scoreMode = document.getElementById("scoreMode").value;

    // Validation before call
    if (!playerId) {
      console.error("ERROR: Player ID is required");
      showStatus("Player ID is required.", 1);
      return;
    }

    if (numPlayers < 1 || numPlayers > state.gameConfigs[state.formData.mode].maxPlayers) {
      showStatus(`Number of players must be between 1 and ${state.gameConfigs[state.formData.mode].maxPlayers}.`);
      console.error(
        "ERROR: Invalid number of players. Please enter a number between 1 and",
        state.gameConfigs[state.formData.mode].maxPlayers
      );
      return;
    }

    const settings = {
      playerId,
      numPlayers,
      numSides,
      numBalls,
      shape,
      scoreMode,
      pongType: state.formData.mode,
      mode: state.formData.mode,
    };

    console.log("DEBUG: Prepared settings to submit:", settings);

    try {
      //   const response = await createNewGame(settings);
      const response = await createGame(settings);

      if (response.success) {
        console.log("SUCCESS: Game created successfully:", response);
        showStatus("Game created successfully!", 0);
      } else {
        console.error("ERROR: Failed to create game:", response.message || "Unknown error");
        showStatus(response.message || "Failed to create game.", 1);
      }
    } catch (error) {
      console.error("ERROR: Exception while creating game:", error);
      showStatus("Error creating game: " + error.message, 1);
    }
  }
}
