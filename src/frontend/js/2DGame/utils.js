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
  const scoreDisplay = document.getElementById("two-d-game__score-list");
  if (!scoreDisplay || !gameContext.players.length) {
    console.warn("Score display not found or no players available", {
      scoreDisplay,
      players: gameContext.players,
    });
    return;
  }

  scoreDisplay.innerHTML = "";
  const template = document.getElementById("two-d-game__score-item-template");

  gameContext.players
    .sort((a, b) => a.index - b.index) // Ensure consistent display order
    .forEach((player) => {
      const scoreItem = template.content.cloneNode(true);
      const container = scoreItem.querySelector(".two-d-game__score-item");

      if (player.isCurrentPlayer) {
        container.classList.add("two-d-game__score-item--current");
      }

      container.querySelector(".two-d-game__player-name").textContent = player.isCurrentPlayer
        ? "You"
        : player.username;
      container.querySelector(".two-d-game__player-score").textContent = player.score.toString();

      scoreDisplay.appendChild(scoreItem);
    });
}
