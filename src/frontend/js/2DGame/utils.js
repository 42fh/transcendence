import { getGameContext } from "../store/index.js";

/**
 * Displays the game over screen with the result
 * @param {boolean} isWinner - Whether the current player won the game
 */
export function showGameOver(isWinner) {
  const gameOverElement = document.getElementById("game-over-display");
  if (!gameOverElement) {
    console.warn("Game over display element not found");
    return;
  }

  // Add appropriate class for styling
  gameOverElement.classList.add("visible");

  // Set the message based on result
  const message = isWinner ? "You Won!" : "Game Over";
  gameOverElement.querySelector(".message").textContent = message;
}

/**
 * Hides the game over display
 */
export function hideGameOver() {
  const gameOverElement = document.getElementById("game-over-display");
  if (gameOverElement) {
    gameOverElement.classList.remove("visible");
  }
}

/**
 * Renders the score display
 */
export function updateScoreDisplays() {
  const gameContext = getGameContext();
  // console.log("gameContext:", gameContext);
  // Get the score display element
  // Mind the the 'external' template is already loaded in the index.html
  const scoreDisplayElement = document.getElementById(
    "two-d-game__score-display"
  );
  if (!scoreDisplayElement) {
    console.warn("Score display not found");
    return;
  }

  // Get the score item template, the nested template
  const gameTemplate = document.getElementById("two-d-game__game-template");
  const scoreItemTemplate = gameTemplate.content.getElementById(
    "two-d-game__score-item-template"
  );
  if (!scoreItemTemplate) {
    console.warn("Score item template not found");
    return;
  }

  if (!scoreDisplayElement || !gameContext.players.length) {
    console.warn("Score display not found or no players available", {
      scoreDisplay: scoreDisplayElement,
      players: gameContext.players,
    });
    return;
  }

  scoreDisplayElement.innerHTML = "";

  gameContext.players
    .sort((a, b) => a.index - b.index) // Ensure consistent display order
    .forEach((player) => {
      const scoreItem = scoreItemTemplate.content.cloneNode(true);
      const scoreItemContainer = scoreItem.querySelector(
        ".two-d-game__score-item"
      );

      if (player.isCurrentPlayer) {
        scoreItemContainer.classList.add("two-d-game__score-item--current");
      }

      scoreItemContainer.querySelector(".two-d-game__player-name").textContent =
        player.isCurrentPlayer ? "You" : player.username;
      scoreItemContainer.querySelector(
        ".two-d-game__player-score"
      ).textContent = player.score.toString();

      scoreDisplayElement.appendChild(scoreItem);
    });
}

/**
 * Updates the game info form data
 * @param {Object} data - The data to update the form with
 */
export function updateGameInfo(data) {
  const gameInfo = document.getElementById("two-d-game__game-info");
  if (!gameInfo) {
    console.warn("Game info container not found");
    return;
  }

  // Get the template
  const gameTemplate = document.getElementById("two-d-game__game-template");
  const infoTemplate = gameTemplate.content.getElementById(
    "two-d-game__game-info-template"
  );
  if (!infoTemplate) {
    console.warn("Game info template not found");
    return;
  }

  // Clear existing content
  gameInfo.innerHTML = "";

  // Create and append each info item
  data.forEach((item) => {
    const infoItem = infoTemplate.content.cloneNode(true);
    const container = infoItem.querySelector(".two-d-game__game-info-item");

    container.querySelector(".two-d-game__game-info-label").textContent =
      item.label;
    container.querySelector(".two-d-game__game-info-value").textContent =
      item.value;

    gameInfo.appendChild(infoItem);
  });
}
