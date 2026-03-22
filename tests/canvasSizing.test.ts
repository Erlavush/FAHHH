import { describe, expect, it } from "vitest";
import {
  isCanvasDprConstrained,
  resolveCanvasDpr,
  type ViewportMetrics
} from "../src/components/room-view/canvasSizing";

function createViewportMetrics(overrides: Partial<ViewportMetrics> = {}): ViewportMetrics {
  return {
    width: 1920,
    height: 1080,
    devicePixelRatio: 1,
    ...overrides
  };
}

describe("resolveCanvasDpr", () => {
  it("respects the browser device pixel ratio when it is already below the cap", () => {
    expect(
      resolveCanvasDpr(1.5, createViewportMetrics({ devicePixelRatio: 0.75 }))
    ).toBeCloseTo(0.75);
  });

  it("reduces dpr for oversized zoomed-out viewports", () => {
    const viewport = createViewportMetrics({
      width: 5760,
      height: 3240,
      devicePixelRatio: 1
    });
    const resolvedDpr = resolveCanvasDpr(1.5, viewport);

    expect(resolvedDpr).toBeLessThan(1);
    expect(isCanvasDprConstrained(resolvedDpr, 1.5, viewport)).toBe(true);
  });

  it("keeps dpr within safe bounds even with extreme viewport sizes", () => {
    const viewport = createViewportMetrics({
      width: 20000,
      height: 12000,
      devicePixelRatio: 2
    });
    const resolvedDpr = resolveCanvasDpr(1.5, viewport);

    expect(resolvedDpr).toBeGreaterThan(0);
    expect(resolvedDpr).toBeLessThan(0.5);
  });
});
