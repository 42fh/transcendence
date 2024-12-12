import { renderPolygonGame } from "../renderer.js";

function createRenderer(svgId) {
  console.log("Creating renderer for SVG:", svgId);

  const svg = document.getElementById(svgId);
  console.log("Found SVG element:", svg);

  const renderer = {
    type: "polygon",
    config: {
      viewboxSize: 800,
      scale: 200,
      center: 400,
      //   debug: true,
      debug: false,
    },
    svg: svg,
    vertices: [
      { x: 5, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 0, y: -1 },
    ],
    state: {
      type: "polygon",
      dimensions: {
        ball_size: 0.05,
      },
      balls: [
        {
          x: 0,
          y: 0,
          size: 0.05,
        },
      ],
      paddles: [],
      scores: [],
      collision: null,
    },
  };

  console.log("Created renderer:", renderer);
  return renderer;
}

function initGame() {
  console.log("Initializing game...");
  const renderer = createRenderer("pongGame");
  console.log("About to render game with renderer:", renderer);
  renderPolygonGame();
  console.log("Game rendered");
}

window.addEventListener("load", () => {
  console.log("Page loaded, starting game...");
  initGame();
});
