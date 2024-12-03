import { updateActiveNavItem } from "../components/bottom-nav.js";
import { GameInterface2D } from "../2DGame/gameInterface.js";
export function load2DGame(addToHistory = true) {
  console.log("load2DGame function called");

  try {
    if (addToHistory) {
      history.pushState(
        {
          view: "game2d",
        },
        ""
      );
      updateActiveNavItem("home");
    }

    const mainContent = document.getElementById("main-content");
    if (!mainContent) {
      throw new Error("Main content element not found");
    }

    // Clear the main content
    mainContent.innerHTML = "";

    // Get the template
    const template = document.getElementById("two-d-game-template");
    if (!template) {
      throw new Error("2D game template not found");
    }

    // Clone the template content
    const gameContent = document.importNode(template.content, true);

    // Add it to the main content
    mainContent.appendChild(gameContent);

    // Verify elements exist after append
    console.log("Checking for toggle settings button:", document.getElementById("two-d-game__toggle-settings"));

    // Small delay to ensure DOM is updated
    // requestAnimationFrame(() => {
    //   console.log("Initializing game interface...");
    //   const gameInterface = new GameInterface2D();

    //   // Only initialize if the required elements exist
    //   const toggleButton = document.getElementById("two-d-game__toggle-settings");
    //   if (toggleButton) {
    //     gameInterface.initializeInterface();
    //     gameInterface.setupEventListeners();
    //   } else {
    //     console.error("Required game elements not found after template load");
    //   }
    // });

    const gameInterface = new GameInterface2D();
    console.log("gameInterface initialized");
    gameInterface.initializeInterface();
    console.log("gameInterface initializedInterface");
    gameInterface.setupEventListeners();
    console.log("gameInterface setupEventListeners");
  } catch (error) {
    console.error("Error loading 2D game page:", error);
  }
}
