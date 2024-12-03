// PolygonRenderer.js
import { BasePongRenderer } from "../js/2DGame/BasePongRenderer.js";

export class PolygonRenderer extends BasePongRenderer {
  constructor(config) {
    super(config);
    this.vertices = [];
    this.playerIndex = null;
    this.initialized = false;
  }

  initialize(gameState) {
    super.initialize(gameState);
    this.initialized = true;
  }

  // Transform backend coordinate system to screen coordinates
  transformVertices(vertices) {
    return vertices.map((vertex) => ({
      x: this.config.center + vertex.x * this.config.scale,
      y: this.config.center - vertex.y * this.config.scale,
    }));
  }

  update(gameState) {
    this.state = gameState;
    this.render();
  }

  renderPolygonOutline() {
    if (!this.vertices || this.vertices.length === 0) {
      console.warn("No vertices available for polygon outline");
      return;
    }

    const transformedVertices = this.transformVertices(this.vertices);

    // Draw main polygon outline
    const pathData = transformedVertices.map((vertex, i) => `${i === 0 ? "M" : "L"} ${vertex.x} ${vertex.y}`).join(" ");

    this.svg.appendChild(
      this.createSVGElement("path", {
        d: `${pathData} Z`,
        fill: "none",
        stroke: "#808080",
        "stroke-width": "2",
      })
    );

    // Add labels for each side
    transformedVertices.forEach((vertex, i) => {
      const nextVertex = transformedVertices[(i + 1) % transformedVertices.length];

      // Calculate midpoint of side
      const midX = (vertex.x + nextVertex.x) / 2;
      const midY = (vertex.y + nextVertex.y) / 2;

      // Calculate offset for label positioning
      const dx = nextVertex.x - vertex.x;
      const dy = nextVertex.y - vertex.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const offsetX = (-dy / len) * 20; // Perpendicular offset
      const offsetY = (dx / len) * 20;

      // Add side number label
      this.svg.appendChild(
        this.createSVGElement("text", {
          x: midX + offsetX,
          y: midY + offsetY,
          "text-anchor": "middle",
          "dominant-baseline": "middle",
          "font-size": "14px",
          fill: "gray",
        })
      ).textContent = `side ${i}`;
    });
  }

  renderPaddle(paddle, sideIndex) {
    if (!paddle.active || !this.vertices) return;

    const transformedVertices = this.transformVertices(this.vertices);
    const startVertex = transformedVertices[sideIndex];
    const endVertex = transformedVertices[(sideIndex + 1) % transformedVertices.length];

    // Calculate paddle geometry
    const sideX = endVertex.x - startVertex.x;
    const sideY = endVertex.y - startVertex.y;
    const sideLength = Math.sqrt(sideX * sideX + sideY * sideY);

    // Calculate normalized vectors
    const normalizedSideX = sideX / sideLength;
    const normalizedSideY = sideY / sideLength;
    const normalX = sideY / sideLength; // Normal vector perpendicular to side
    const normalY = -sideX / sideLength;

    // Calculate paddle position and dimensions
    const paddleX = startVertex.x + sideX * paddle.position;
    const paddleY = startVertex.y + sideY * paddle.position;
    const paddleLength = this.state.dimensions.paddle_length * sideLength;
    const paddleWidth = this.state.dimensions.paddle_width * this.config.scale;
    const hitZoneWidth =
      (this.state.dimensions.paddle_width + (this.state.dimensions.ball_size || 0.1) * 2) * this.config.scale;

    // Determine paddle state
    const isCurrentPlayer = this.state.paddles.indexOf(paddle) === this.playerIndex;
    const isColliding = this.state.collision?.side_index === paddle.side_index;

    // Calculate hit zone points
    const hitZonePoints = [
      `${paddleX - (normalizedSideX * paddleLength) / 2},${paddleY - (normalizedSideY * paddleLength) / 2}`,
      `${paddleX + (normalizedSideX * paddleLength) / 2},${paddleY + (normalizedSideY * paddleLength) / 2}`,
      `${paddleX + (normalizedSideX * paddleLength) / 2 + normalX * hitZoneWidth},${
        paddleY + (normalizedSideY * paddleLength) / 2 + normalY * hitZoneWidth
      }`,
      `${paddleX - (normalizedSideX * paddleLength) / 2 + normalX * hitZoneWidth},${
        paddleY - (normalizedSideY * paddleLength) / 2 + normalY * hitZoneWidth
      }`,
    ].join(" ");

    // Render hit zone
    this.svg.appendChild(
      this.createSVGElement("polygon", {
        points: hitZonePoints,
        fill: isColliding ? "rgba(255,0,0,0.1)" : "rgba(0,255,0,0.1)",
        stroke: isColliding ? "red" : "green",
        "stroke-width": "1",
        "stroke-dasharray": "4",
      })
    );

    // Calculate paddle points
    const paddlePoints = [
      `${paddleX - (normalizedSideX * paddleLength) / 2},${paddleY - (normalizedSideY * paddleLength) / 2}`,
      `${paddleX + (normalizedSideX * paddleLength) / 2},${paddleY + (normalizedSideY * paddleLength) / 2}`,
      `${paddleX + (normalizedSideX * paddleLength) / 2 + normalX * paddleWidth},${
        paddleY + (normalizedSideY * paddleLength) / 2 + normalY * paddleWidth
      }`,
      `${paddleX - (normalizedSideX * paddleLength) / 2 + normalX * paddleWidth},${
        paddleY - (normalizedSideY * paddleLength) / 2 + normalY * paddleWidth
      }`,
    ].join(" ");

    // Render paddle
    this.svg.appendChild(
      this.createSVGElement("polygon", {
        points: paddlePoints,
        fill: isCurrentPlayer ? "rgba(255,165,0,0.6)" : "rgba(0,0,255,0.6)",
        stroke: isCurrentPlayer ? "orange" : "blue",
        "stroke-width": "1",
      })
    );

    // Add paddle label
    const labelX = paddleX + normalX * (hitZoneWidth + 20);
    const labelY = paddleY + normalY * (hitZoneWidth + 20);
    const playerIndex = this.state.paddles.indexOf(paddle);

    this.svg.appendChild(
      this.createSVGElement("text", {
        x: labelX,
        y: labelY,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        fill: isCurrentPlayer ? "orange" : "blue",
        "font-size": "12px",
      })
    ).textContent = `P${playerIndex + 1}`;
  }

  render() {
    // Validate required data is available
    if (!this.state || !this.svg || !this.vertices || this.vertices.length === 0) {
      console.warn("Missing required data for rendering", {
        hasState: !!this.state,
        hasSvg: !!this.svg,
        verticesLength: this.vertices?.length,
      });
      return;
    }

    // Log render debug info
    console.log("Rendering polygon with:", {
      verticesCount: this.vertices.length,
      paddlesCount: this.state.paddles.length,
      svgElement: this.svg.id,
    });

    // Clear previous render
    this.svg.innerHTML = "";

    try {
      // Render components
      this.renderPolygonOutline();

      this.state.paddles.forEach((paddle) => {
        this.renderPaddle(paddle, paddle.side_index);
      });

      this.renderBalls();
      this.renderScores();
    } catch (error) {
      console.error("Error rendering polygon:", error);
      this.showError({
        type: "render",
        message: "Failed to render polygon",
        details: error.message,
        stack: error.stack,
      });
    }
  }
}
