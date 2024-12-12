import { getRendererState, setRendererState } from "../../store/renderer/state.js";
import { renderSingleBall, transformVertices, createSVGElement } from "../renderer.js";

// Initialize renderer state
function initTest() {
  const svg = document.getElementById("ballTest");
  if (!svg) {
    console.error("Could not find SVG element with id 'ballTest'");
    return;
  }

  // Add test points at corners and center to verify coordinate system
  const testPoints = [
    { x: -1, y: 1, color: "olive" }, // Top left
    { x: 1, y: 1, color: "olive" }, // Top right
    { x: 1, y: -1, color: "olive" }, // Bottom right
    { x: -1, y: -1, color: "olive" }, // Bottom left
    { x: 0, y: 0, color: "yellow" }, // Center circle
    { x: 0.2, y: 0, color: "black" }, // Slightly right of center square
  ];

  setRendererState({
    svg: svg,
    config: {
      viewBox: {
        minX: 0,
        minY: 0,
        width: 400,
        height: 250,
      },
      //   scale: 75,
      scale: 1,
      //   centered: true,
    },
  });

  // Set viewBox on SVG
  const renderer = getRendererState();
  const viewBox = renderer.config.viewBox;
  renderer.svg.setAttribute("viewBox", `${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`);

  console.group("Test Points");
  testPoints.forEach((point) => {
    // Log original coordinates
    console.log(`Original Point: (${point.x}, ${point.y})`);

    // Get transformed coordinates
    const transformedPoint = transformVertices([{ x: point.x, y: point.y }])[0];
    console.log(`Transformed Point: (${transformedPoint.x}, ${transformedPoint.y})`);

    // Render the ball
    renderSingleBall(
      { x: point.x, y: point.y, size: 0.1 },
      { shape: point.x === 0 && point.y === 0 ? "circle" : "square", fill: point.color }
    );

    // Add a small reference dot at the exact coordinate
    const rendererState = getRendererState(); // Get fresh renderer state
    rendererState.svg.appendChild(
      createSVGElement("circle", {
        cx: point.x,
        cy: point.y,
        r: 0.02,
        fill: "red",
        stroke: "none",
      })
    );
  });
  console.groupEnd();

  // Setup input listeners
  setupInputListeners();
  // Render test points
  testPoints.forEach((point) => {
    renderSingleBall(
      { x: point.x, y: point.y, size: 0.1 },
      { shape: point.x === 0 && point.y === 0 ? "circle" : "square", fill: point.color }
    );
  });

  // Add coordinate axes for reference
  //   const renderer = getRendererState();
  renderer.svg.appendChild(
    createSVGElement("line", {
      x1: -1,
      y1: 0,
      x2: 1,
      y2: 0,
      stroke: "rgba(0,0,0,0.2)",
      "stroke-width": "0.02",
    })
  );
  renderer.svg.appendChild(
    createSVGElement("line", {
      x1: 0,
      y1: -1,
      x2: 0,
      y2: 1,
      stroke: "rgba(0,0,0,0.2)",
      "stroke-width": "0.02",
    })
  );
}

function setupInputListeners() {
  // Update value displays
  ["posX", "posY", "size"].forEach((id) => {
    const input = document.getElementById(id);
    const valueSpan = document.getElementById(id + "Value");
    input.addEventListener("input", () => {
      valueSpan.textContent = input.value;
    });
  });
}

window.addCurrentBall = function () {
  const ball = {
    x: parseFloat(document.getElementById("posX").value),
    y: parseFloat(document.getElementById("posY").value),
    size: parseFloat(document.getElementById("size").value),
  };

  const options = {
    shape: document.getElementById("shape").value,
    fill: document.getElementById("fillColor").value,
  };

  renderSingleBall(ball, options);
};

window.clearBalls = function () {
  const renderer = getRendererState();
  renderer.svg.innerHTML = "";
};

// Initialize on load
window.addEventListener("load", initTest);
