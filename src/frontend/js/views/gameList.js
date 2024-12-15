import {
  fetchWaitingGames,
  joinGame,
  fetchRunningGames,
} from "../services/gameService.js";
import { showToast } from "../utils/toast.js";
import { loadGame3D } from "./game3d.js";
import { loadGameSetupPage } from "./gameSetup.js";
import { loadGame2D } from "./game2D.js";
import { loadGameOffline } from "./gameOffline.js";

export async function loadGameList(addToHistory = true) {
  try {
    const template = document.getElementById("game-list-template");
    if (!template) {
      throw new Error("Game list template not found");
    }

    const games = await fetchWaitingGames();
    const runningGames = await fetchRunningGames();
    console.log(games, runningGames);

    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = "";
    mainContent.appendChild(document.importNode(template.content, true));

    generateGameListHTML(games, runningGames);

    document.querySelector(".create-game-btn").addEventListener("click", () => {
      loadGameSetupPage();
    });
    document
      .querySelector(".offline-game-btn")
      .addEventListener("click", () => {
        loadGameOffline();
      });

    if (addToHistory) {
      history.pushState(
        {
          view: "game-list",
        },
        ""
      );
    }
  } catch (error) {
    console.error("Error loading game list page:", error);
    return;
  }
}

function generateGameListHTML(games, runningGames) {
  const gameList = document.querySelector(".game-list");
  games.forEach((game, index) => {
    const gameCard = document.createElement("div");
    gameCard.className = "game-card";
    gameCard.innerHTML = `
    <div class="game-info">
        <h3>${game.name}</h3>
        <p class="player-count">Players: <span>${game.players.current}/${
      game.players.total_needed
    }</span></p>
        <div class="mode-line">
            <p class="game-mode">${game.mode}</p>
            <p class="dimension-type">${
              game.mode == "circular" ? "3D" : "2D"
            }</p>
        </div>
    </div>
`;
    gameCard.addEventListener("click", async () => {
      try {
        const result = await joinGame(game.game_id);
        if (game.mode === "circular") {
          loadGame3D(result.ws_url);
        } else {
          loadGame2D(result.game_id, result.ws_url);
        }
      } catch (error) {
        console.error("Error joining game:", error);
        showToast("Error joining game", CubeTexture);
      }
    });
    gameList.append(gameCard);
  });

  runningGames.forEach((game, index) => {
    const gameCard = document.createElement("div");
    gameCard.className = "game-card";
    gameCard.innerHTML = `
    <div class="game-info">
        <h3>${game.name}</h3>
        <h3>Game is running</h3>
        <p class="player-count">Players: <span>${game.players.current}/${
      game.players.total_needed
    }</span></p>
        <div class="mode-line">
            <p class="game-mode">${game.mode}</p>
            <p class="dimension-type">${
              game.mode == "circular" ? "3D" : "2D"
            }</p>
        </div>
    </div>
`;
    gameCard.addEventListener("click", async () => {
      try {
        const result = await joinGame(game.game_id);
        if (game.mode === "circular") {
          loadGame3D(result.ws_url);
        } else {
          loadGame2D(result.game_id, result.ws_url);
        }
      } catch (error) {
        console.error("Error joining game:", error);
        showToast("Error joining game", CubeTexture);
      }
    });
    gameList.append(gameCard);
  });
}
