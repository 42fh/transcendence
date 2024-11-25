import { CONFIG } from "../config/constants.js";

export async function gameHome() {
    try {
      console.log("gameHome");
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/game/get_all_games/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      console.log("received -->", response);
  
      const mainContent = document.getElementById("main-content");
      mainContent.innerHTML = "";
  
      if (!response.ok) {
        console.log("response not ok");
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response received:", text);
        throw new TypeError("Expected JSON response");
      }
  
      const data = await response.json();
      console.log("Available games:", data);
  
      // Parse and render games
      const gamesContainer = document.getElementById("games-container");
      if (!gamesContainer) {
        throw new Error("#games-container element not found");
      }
      gamesContainer.innerHTML = ""; // Clear existing content
  
      const games = JSON.parse(data.games); // Parse the stringified array
      games.forEach((gameId) => {
        const template = document.getElementById("game-item-template");
        if (!template) {
          throw new Error("#game-item-template element not found");
        }
  
        const gameItem = document.importNode(template.content, true);
        gameItem.querySelector(".game-id").textContent = gameId;
        // Add other placeholders like mode, date, duration, winner as needed
        gamesContainer.appendChild(gameItem);
      });
  
      // Ensure gamesContainer is displayed
      gamesContainer.style.display = "block";
  
      return data;
    } catch (error) {
      console.error("Error fetching available games:", error);
      throw error;
    }
  }
  