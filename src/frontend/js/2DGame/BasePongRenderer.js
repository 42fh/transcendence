// BasePongRenderer.js
export class BasePongRenderer {
  constructor(
    config = {
      viewboxSize: 300,
      scale: 75,
      center: 150,
    }
  ) {
    this.config = config;
    this.svg = null;
    this.scoreList = null;
    this.playerIndex = null;
    this.state = null;
  }

  initialize(gameState) {
    this.svg = document.getElementById("pongSvg");
    this.scoreList = document.getElementById("scoreDisplay");

    if (!this.svg) {
      throw new Error("SVG element not found");
    }
    this.update(gameState);
  }

  update(gameState) {
    this.state = gameState;
    this.render();
  }

  createSVGElement(type, attributes) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", type);
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, value);
    }
    return element;
  }

  renderScores() {
    if (!this.scoreList || !this.state.scores) return;

    this.scoreList.innerHTML = "<h3>Scores</h3>";
    this.state.scores.forEach((score, index) => {
      const scoreItem = document.createElement("div");
      scoreItem.className = "two-d-game__score-item";
      if (index === this.playerIndex) {
        scoreItem.classList.add("current-player");
      }
      scoreItem.innerHTML = `Player ${index + 1}: ${score}`;
      this.scoreList.appendChild(scoreItem);
    });
  }

  renderBalls() {
    this.state.balls.forEach((ball) => {
      const ballX = this.config.center + ball.x * this.config.scale;
      const ballY = this.config.center - ball.y * this.config.scale;

      this.svg.appendChild(
        this.createSVGElement("circle", {
          cx: ballX,
          cy: ballY,
          r: ball.size * this.config.scale,
          fill: "yellow",
          stroke: "black",
          "stroke-width": "1",
        })
      );
    });
  }

  showGameOver(isWinner) {
    const message = isWinner ? "YOU WIN!" : "GAME OVER";
    const textElement = this.createSVGElement("text", {
      x: this.config.center,
      y: this.config.center,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
      "font-size": "24px",
      "font-weight": "bold",
      fill: isWinner ? "green" : "red",
    });
    textElement.textContent = message;
    this.svg.appendChild(textElement);
  }

  render() {
    throw new Error("Method 'render' must be implemented");
  }
}
