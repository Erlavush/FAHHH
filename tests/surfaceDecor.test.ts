import { describe, expect, it } from "vitest";
import {
  clampSurfaceOffsetToHost,
  getSurfaceWorldPosition
} from "../src/lib/surfaceDecor";
import type { RoomFurniturePlacement } from "../src/lib/roomState";

const deskHost: RoomFurniturePlacement = {
  id: "desk-1",
  type: "desk",
  surface: "floor",
  position: [0, 0, 0],
  rotationY: 0
};

describe("surface decor", () => {
  it("snaps to quadrant centers when grid snap is on", () => {
    expect(
      clampSurfaceOffsetToHost(deskHost, "vase", [0.12, 0.16], 0, true)
    ).toEqual([0.25, 0.25]);
  });

  it("allows free placement anywhere on the surface when grid snap is off", () => {
    expect(
      clampSurfaceOffsetToHost(deskHost, "vase", [0.12, 0.16], 0, false)
    ).toEqual([0.12, 0.16]);
  });

  it("resolves anchored world positions on top of the host surface", () => {
    expect(getSurfaceWorldPosition(deskHost, [0.25, -0.25])).toEqual([0.25, 0.94, -0.25]);
  });
});
