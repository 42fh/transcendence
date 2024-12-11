// Simple coordinate transformation test
function denormalizeCoordinates(x, y, viewBox, boundaries) {
  // Convert X and Y from cartesian normalized space (-1,1) to SVG graphic space (0,1)
  const cartesianToGraphicX = (x - boundaries.xMin) / (boundaries.xMax - boundaries.xMin);
  const cartesianToGraphicY = 1 - (y - boundaries.yMin) / (boundaries.yMax - boundaries.yMin); // Flip Y axis

  // Scale to viewport dimensions
  const viewportWidth = viewBox.width - viewBox.minX;
  const viewportHeight = viewBox.height - viewBox.minY;

  return {
    x: cartesianToGraphicX * viewportWidth,
    y: cartesianToGraphicY * viewportHeight,
  };
}

function testDenormalizeCoordinates() {
  console.group("Testing denormalizeCoordinates");

  // Test setup
  const viewBox = {
    minX: 0,
    minY: 0,
    width: 400,
    height: 250,
  };

  const boundaries = {
    xMin: -1,
    xMax: 1,
    yMin: -1,
    yMax: 1,
  };

  // Test cases
  const testCases = [
    {
      input: { x: -1, y: 1 },
      expected: { x: 0, y: 0 },
      name: "Top Left",
    },
    {
      input: { x: 1, y: 1 },
      expected: { x: 400, y: 0 },
      name: "Top Right",
    },
    {
      input: { x: 1, y: -1 },
      expected: { x: 400, y: 250 },
      name: "Bottom Right",
    },
    {
      input: { x: -1, y: -1 },
      expected: { x: 0, y: 250 },
      name: "Bottom Left",
    },
  ];

  // Run tests
  testCases.forEach((testCase) => {
    console.group(`Testing ${testCase.name}`);

    const result = denormalizeCoordinates(testCase.input.x, testCase.input.y, viewBox, boundaries);

    console.log("Input:", testCase.input);
    console.log("Expected:", testCase.expected);
    console.log("Actual:", result);

    const passed = result.x === testCase.expected.x && result.y === testCase.expected.y;

    console.log(passed ? "✅ PASSED" : "❌ FAILED");
    console.groupEnd();
  });

  console.groupEnd();
}

// Run tests
testDenormalizeCoordinates();
