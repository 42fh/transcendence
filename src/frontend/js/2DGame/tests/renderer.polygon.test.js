import { renderPolygonOutline } from "../renderer.js";
// import { rendererState as renderer } from "../../store/renderer/state.js";
import { getRendererState, setRendererState } from "../../store/renderer/state.js";

function initTest() {
  console.group("initTest");
  console.log("renderer", getRendererState());

  // Get and log SVG element
  const svgElement = document.getElementById("polygonTest");
  console.log("SVG Element:", svgElement);
  // Log SVG properties
  console.log("SVG Properties:", {
    width: svgElement.width?.baseVal?.value,
    height: svgElement.height?.baseVal?.value,
    viewBox: svgElement.viewBox?.baseVal,
    getAttribute: {
      width: svgElement.getAttribute("width"),
      height: svgElement.getAttribute("height"),
      viewBox: svgElement.getAttribute("viewBox"),
    },
  });

  // Add test point at corner
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", "400");
  circle.setAttribute("cy", "250");
  circle.setAttribute("r", "5");
  circle.setAttribute("fill", "red");
  circle.setAttribute("stroke", "black");
  svgElement.appendChild(circle);

  // Add coordinate text
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", "400");
  text.setAttribute("y", "250");
  text.setAttribute("font-size", "12px");
  text.setAttribute("fill", "black");
  text.textContent = "(400,250)";
  svgElement.appendChild(text);

  // Add test points at various positions
  const testPoints = [
    { x: 0, y: 0, color: "red" }, // Origin
    { x: 400, y: 0, color: "blue" }, // Top right
    { x: 0, y: 250, color: "green" }, // Bottom left
    { x: 400, y: 250, color: "purple" }, // Bottom right
    { x: 200, y: 125, color: "orange" }, // Center
  ];

  testPoints.forEach((point) => {
    // Add circle
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", point.x);
    circle.setAttribute("cy", point.y);
    circle.setAttribute("r", "10"); // Made bigger
    circle.setAttribute("fill", point.color);
    svgElement.appendChild(circle);

    // Add label
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", point.x + 15);
    text.setAttribute("y", point.y);
    text.setAttribute("font-size", "16px"); // Made bigger
    text.setAttribute("fill", "black");
    text.textContent = `(${point.x},${point.y})`;
    svgElement.appendChild(text);
  });

  // Let's also add a border to see the SVG boundaries
  const border = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  border.setAttribute("x", "0");
  border.setAttribute("y", "0");
  border.setAttribute("width", "400");
  border.setAttribute("height", "250");
  border.setAttribute("fill", "none");
  border.setAttribute("stroke", "black");
  border.setAttribute("stroke-width", "2");
  svgElement.appendChild(border);

  setRendererState({
    svg: document.getElementById("polygonTest"),
    vertices: [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 0, y: -1 },
    ],
    config: {
      rotation: 45,
    },
  });
  console.groupEnd();
  console.group("Rendering Polygon");
  renderPolygonOutline();
  console.groupEnd();
}

window.addEventListener("load", initTest);
