import { renderPolygonOutline, renderSingleBall } from "../renderer.js";
import { setRendererState, getRendererState } from "../../store/renderer/state.js";

// Setup initial state
setRendererState({
  svg: document.getElementById("gameTest"),
  vertices: [
    { x: -1, y: 1 }, // Top left
    { x: 1, y: 1 }, // Top right
    { x: 1, y: -1 }, // Bottom right
    { x: -1, y: -1 }, // Bottom left
  ],
  config: {
    viewBox: {
      minX: 0,
      minY: 0,
      width: 400,
      height: 250,
    },
    boundaries: {
      xMin: -1,
      xMax: 1,
      yMin: -1,
      yMax: 1,
    },
    scale: 1,
  },
});

// Render black polygon outline
renderPolygonOutline({
  fill: "#000000",
  stroke: "#808080",
  strokeWidth: 2,
});

// Render a white ball in the center
renderSingleBall({ x: 0, y: 0, size: 5 }, { shape: "square", fill: "#FFFFFF" });
