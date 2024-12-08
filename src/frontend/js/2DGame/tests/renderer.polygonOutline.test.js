// import { renderPolygonOutline } from "../renderer.js";
// import { setRendererState, getRendererState } from "../../store/renderer/state.js";

// // Setup initial state
// setRendererState({
//   svg: document.getElementById("gameSvg"),
//   vertices: [
//     { x: -1, y: 1 }, // Top left
//     { x: 1, y: 1 }, // Top right
//     { x: 1, y: -1 }, // Bottom right
//     { x: -1, y: -1 }, // Bottom left
//   ],
//   config: {
//     viewBox: {
//       minX: 0,
//       minY: 0,
//       width: 400,
//       height: 250,
//     },
//     boundaries: {
//       xMin: -1,
//       xMax: 1,
//       yMin: -1,
//       yMax: 1,
//     },
//     scale: 1,
//   },
// });

// console.log("TEST - Initial state:", getRendererState());
// console.log("TEST - Vertices:", getRendererState().vertices);
// console.log("TEST - ViewBox:", getRendererState().config.viewBox);

// // Render the polygon
// renderPolygonOutline();

import { renderPolygonOutline } from "../renderer.js";
import { setRendererState, getRendererState } from "../../store/renderer/state.js";

// Setup initial state
setRendererState({
  svg: document.getElementById("gameSvg"),
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

// Render first polygon
renderPolygonOutline({
  fill: "#0000ff",
  fillOpacity: 0.5,
  stroke: "#000000",
  strokeWidth: 3,
});

// Change vertices for second polygon (smaller and offset)
setRendererState({
  vertices: [
    { x: -0.5, y: 0.5 }, // Top left
    { x: 0.5, y: 0.5 }, // Top right
    { x: 0.5, y: -0.5 }, // Bottom right
    { x: -0.5, y: -0.5 }, // Bottom left
  ],
});

// Render second polygon
renderPolygonOutline();

// Setup initial state
setRendererState({
  svg: document.getElementById("gameSvg2"),
  vertices: [
    { x: -0.5, y: 0.5 }, // Top left
    { x: 0.5, y: 0.5 }, // Top right
    { x: 0.5, y: -0.5 }, // Bottom right
    { x: -0.5, y: -0.5 }, // Bottom left
  ],
  config: {
    viewBox: {
      minX: 0,
      minY: 0,
      width: 400,
      height: 250,
    },
    boundaries: {
      xMin: -0.5,
      xMax: 0.5,
      yMin: -0.5,
      yMax: 0.5,
    },
    scale: 1,
  },
});

// Render first polygon
renderPolygonOutline();

// Change vertices for second polygon (smaller and offset)

setRendererState({
  vertices: [
    { x: -1, y: 1 }, // Top left
    { x: 1, y: 1 }, // Top right
    { x: 1, y: -1 }, // Bottom right
    { x: -1, y: -1 }, // Bottom left
  ],
});

// Render second polygon
renderPolygonOutline();
