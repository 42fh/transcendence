import { handleLogout } from "./auth.js";
import { displayLogoutError } from "../utils/errors.js";
import { loadTournamentsPage } from "./tournaments.js";

export function loadHomePage(addToHistory = true) {
  try {
    if (addToHistory) {
      history.pushState(
        {
          view: "home",
        },
        ""
      );
    }

    // Hide the initial container
    const container = document.getElementById("container");
    if (container) {
      container.style.display = "none";
    }

    // Show main-content and load the home template
    const mainContent = document.getElementById("main-content");
    if (!mainContent) {
      throw new Error("Main content element not found");
    }

    mainContent.style.display = "block";
    mainContent.innerHTML = ""; // Clear any existing content

    const template = document.getElementById("home-template");
    if (!template) {
      throw new Error("Home template not found");
    }

    const homeContent = document.importNode(template.content, true);
    mainContent.appendChild(homeContent);

    // Make sure bottom nav is visible
    const bottomNavContainer = document.getElementById("bottom-nav-container");
    if (bottomNavContainer) {
      bottomNavContainer.style.display = "block";
    }

    // Get the username from localStorage and set the greeting message
    const username = localStorage.getItem("username");
    const greetingElement = document.getElementById("greeting");
    if (greetingElement && username) {
      greetingElement.innerHTML = `Hello ${username}! 👋`;
    }

    // Add event listeners only if elements exist
    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
      logoutButton.addEventListener("click", handleLogout);
    }

    const playButton = document.getElementById("play");
    if (playButton) {
      playButton.addEventListener("click", function () {
        const baseUrl = window.location.origin;
        fetch(`${baseUrl}/play.html`)
          .then((response) => response.text())
          .then((html) => {
            mainContent.innerHTML = html;
            const script = document.createElement("script");
            script.src = "play.js";
            document.body.appendChild(script);
          })
          .catch((err) => console.warn("Failed to load play.html", err));
      });
    }

    const threejsButton = document.getElementById("threejs");
    if (threejsButton) {
      threejsButton.addEventListener("click", function () {
        const baseUrl = window.location.origin;
        fetch(`${baseUrl}/threejs_11.html`)
          .then((response) => response.text())
          .then((html) => {
            mainContent.innerHTML = html;
          })
          .catch((err) => console.warn("Failed to load threejs_11.html", err));
      });
    }

    const tournamentsButton = document.getElementById("tournaments");
    if (tournamentsButton) {
      tournamentsButton.addEventListener("click", loadTournamentsPage);
    }
  } catch (error) {
    console.error("Error loading home page:", error);
    displayLogoutError("An error occurred while loading the home page.");
  }
}
