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

    mainContent.innerHTML = "<h1>2D Game</h1><p>Hello World - 2D Game Integration Coming Soon!</p>";
  } catch (error) {
    console.error("Error loading 2D game page:", error);
  }
}
