import { fetchWaitingGames, joinGame } from "../services/gameService.js";
import { showToast } from "../utils/toast.js";
import { loadGame3D } from "./game3d.js";
import { loadGameSetupPage } from "./gameSetup.js";

export async function loadGameList() {
  try {
    const template = document.getElementById("game-list-template");
    if (!template) {
      throw new Error("Game list template not found");
    }

    const games = await fetchWaitingGames();
    console.log(games);

    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = "";
    mainContent.appendChild(document.importNode(template.content, true));

    generateGameListHTML(games);

    document.querySelector(".create-game-btn").addEventListener("click", () => {
      loadGameSetupPage();
    });
  } catch (error) {
    console.error("Error loading game list page:", error);
    return;
  }
}

function generateGameListHTML(games) {
  const gameList = document.querySelector(".game-list");
  games.forEach((game, index) => {
    const gameCard = document.createElement("div");
    gameCard.className = "game-card";
    gameCard.innerHTML = `
    <div class="game-info">
        <h3>${index}</h3>
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
        loadGame3D(result.ws_url);
      } catch (error) {
        console.error("Error joining game:", error);
        showToast("Error joining game", CubeTexture);
      }
    });
    gameList.append(gameCard);
  });
}
