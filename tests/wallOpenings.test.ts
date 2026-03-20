import { describe, expect, it } from "vitest";
import { createWallOpeningLayout } from "../src/lib/wallOpenings";

describe("wallOpenings", () => {
  it("creates segmented middle and rail spans around placed windows", () => {
    const layout = createWallOpeningLayout(
      [
        { center: -3, width: 1.4, centerY: 1.82, height: 1.72 },
        { center: 1, width: 1.4, centerY: 1.82, height: 1.72 }
      ],
      {
        wallMin: -5.1,
        wallMax: 5.1,
        wallBottomY: 0,
        wallTopY: 4.4,
        railY: 1.58
      }
    );

    expect(layout.lowerBandHeight).toBeCloseTo(0.96, 5);
    expect(layout.openingBandHeight).toBeCloseTo(1.72, 5);
    expect(layout.upperBandHeight).toBeCloseTo(1.72, 5);
    expect(layout.middleSegments).toHaveLength(3);
    expect(layout.middleSegments[0]?.center).toBeCloseTo(-4.4, 5);
    expect(layout.middleSegments[0]?.span).toBeCloseTo(1.4, 5);
    expect(layout.middleSegments[1]?.center).toBeCloseTo(-1, 5);
    expect(layout.middleSegments[1]?.span).toBeCloseTo(2.6, 5);
    expect(layout.middleSegments[2]?.center).toBeCloseTo(3.4, 5);
    expect(layout.middleSegments[2]?.span).toBeCloseTo(3.4, 5);
    expect(layout.railSegments).toEqual(layout.middleSegments);
  });

  it("keeps the wall unsegmented when there are no window openings", () => {
    const layout = createWallOpeningLayout([], {
      wallMin: -5.1,
      wallMax: 5.1,
      wallBottomY: 0,
      wallTopY: 4.4,
      railY: 1.58
    });

    expect(layout.lowerBandHeight).toBeCloseTo(4.4, 5);
    expect(layout.middleSegments).toEqual([]);
    expect(layout.railSegments).toEqual([{ center: 0, span: 10.2 }]);
  });
});
