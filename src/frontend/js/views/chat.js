import { updateActiveNavItem } from "../components/bottom-nav.js";

export function loadChatPage(addToHistory = true) {
  try {
    if (addToHistory) {
      history.pushState(
        {
          view: "chat",
        },
        ""
      );
      updateActiveNavItem("chat");
    }

    const mainContent = document.getElementById("main-content");
    if (!mainContent) {
      throw new Error("Main content element not found");
    }

    mainContent.style.display = "block";
    mainContent.innerHTML = "<h1>Chat Page</h1>"; // Temporary content

    // Make sure bottom nav is visible
    const bottomNavContainer = document.getElementById("bottom-nav-container");
    if (bottomNavContainer) {
      bottomNavContainer.style.display = "block";
    }
  } catch (error) {
    console.error("Error loading chat page:", error);
  }
}
