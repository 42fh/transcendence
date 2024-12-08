import { describe, it } from "node:test";
import assert from "node:assert/strict";
// Change the import to use default import
import renderer from "../renderer.js";
const { transformVertices } = renderer;
import { mockRenderer } from "./setup.js";

describe("transformVertices", () => {
  it("should apply scale only", () => {
    mockRenderer.config = {
      scale: 100,
      rotation: 0,
      translation: { x: 0, y: 0 },
    };

    const vertices = [
      { x: 1, y: 1 },
      { x: -1, y: -1 },
    ];

    const result = transformVertices(vertices);

    assert.deepEqual(result, [
      { x: 100, y: -100 },
      { x: -100, y: 100 },
    ]);
  });

  it("should apply rotation of 90 degrees", () => {
    mockRenderer.config = {
      scale: 1,
      rotation: 90,
      translation: { x: 0, y: 0 },
    };

    const vertices = [{ x: 1, y: 0 }];
    const result = transformVertices(vertices);

    // After 90-degree rotation, (1,0) should become approximately (0,-1)
    assert.ok(Math.abs(result[0].x) < 0.00001, "x should be close to 0");
    assert.ok(Math.abs(result[0].y - 1) < 0.00001, "y should be close to 1");
  });

  it("should apply translation", () => {
    mockRenderer.config = {
      scale: 1,
      rotation: 0,
      translation: { x: 100, y: 100 },
    };

    const vertices = [{ x: 1, y: 1 }];
    const result = transformVertices(vertices);

    assert.deepEqual(result, [{ x: 101, y: 99 }]);
  });

  it("should apply scale, rotation, and translation combined", () => {
    mockRenderer.config = {
      scale: 100,
      rotation: 45,
      translation: { x: 400, y: 300 },
    };

    const vertices = [{ x: 1, y: 0 }];
    const result = transformVertices(vertices);

    const expectedX = 470.71;
    const expectedY = 229.29;

    assert.ok(
      Math.abs(result[0].x - expectedX) < 0.1 && Math.abs(result[0].y - expectedY) < 0.1,
      "Combined transformation values should be within 0.1 of expected values"
    );
  });

  it("should use default vertices from renderer state if none provided", () => {
    mockRenderer.config = {
      scale: 1,
      rotation: 0,
      translation: { x: 0, y: 0 },
    };
    mockRenderer.vertices = [{ x: 1, y: 1 }];

    const result = transformVertices();

    assert.deepEqual(result, [{ x: 1, y: -1 }]);
  });

  it("should handle missing config values", () => {
    mockRenderer.config = {};

    const vertices = [{ x: 1, y: 1 }];
    const result = transformVertices(vertices);

    assert.deepEqual(result, [{ x: 1, y: -1 }], "Should use default values when config is missing");
  });
});
