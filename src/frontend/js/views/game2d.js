import { updateActiveNavItem } from "../components/bottom-nav.js"; // Add this import

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

    // mainContent.innerHTML = "<h1>2D Game</h1><p>Hello World - 2D Game Integration Coming Soon!</p>";
  } catch (error) {
    console.error("Error loading 2D game page:", error);
  }
}
