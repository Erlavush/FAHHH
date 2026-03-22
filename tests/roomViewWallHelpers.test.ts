import { describe, expect, it } from "vitest";
import {
  getActiveAxes,
  getGizmoOffset,
  getNextWallSurface,
  getPlacementActionOffset,
  getWallParallelCoordinate
} from "../src/components/room-view/helpers";
import type { RoomFurniturePlacement } from "../src/lib/roomState";

function createWallItem(
  surface: RoomFurniturePlacement["surface"],
  type: RoomFurniturePlacement["type"] = "poster"
): RoomFurniturePlacement {
  return {
    id: `${type}-${surface}`,
    type,
    surface,
    position: [1.5, 1.5, -0.5],
    rotationY: 0,
    ownedFurnitureId: `owned-${type}-${surface}`
  };
}

describe("room view wall helpers", () => {
  it("cycles wall surfaces in the configured swap order", () => {
    expect(getNextWallSurface("wall_back")).toBe("wall_left");
    expect(getNextWallSurface("wall_left")).toBe("wall_front");
    expect(getNextWallSurface("wall_front")).toBe("wall_right");
    expect(getNextWallSurface("wall_right")).toBe("wall_back");
  });

  it("reads the parallel coordinate from the correct world axis for each wall", () => {
    expect(getWallParallelCoordinate("wall_back", [2.5, 1.4, -1.5])).toBe(2.5);
    expect(getWallParallelCoordinate("wall_front", [2.5, 1.4, -1.5])).toBe(2.5);
    expect(getWallParallelCoordinate("wall_left", [2.5, 1.4, -1.5])).toBe(-1.5);
    expect(getWallParallelCoordinate("wall_right", [2.5, 1.4, -1.5])).toBe(-1.5);
  });

  it("uses local-space gizmo axes for all wall surfaces", () => {
    ["wall_back", "wall_left", "wall_front", "wall_right"].forEach((surface) => {
      const wallPoster = createWallItem(surface as RoomFurniturePlacement["surface"]);
      const wallWindow = createWallItem(surface as RoomFurniturePlacement["surface"], "window");

      expect(getActiveAxes(wallPoster)).toEqual([true, true, false]);
      expect(getActiveAxes(wallWindow)).toEqual([true, false, false]);
      expect(getGizmoOffset(wallPoster)).toEqual([0, 0.56, 0.16]);
    });
  });

  it("pushes placement actions toward the room interior for all wall surfaces", () => {
    expect(getPlacementActionOffset(createWallItem("wall_back"))).toEqual([0, 1.28, 0.14]);
    expect(getPlacementActionOffset(createWallItem("wall_left"))).toEqual([0.14, 1.28, 0]);
    expect(getPlacementActionOffset(createWallItem("wall_front"))).toEqual([0, 1.28, -0.14]);
    expect(getPlacementActionOffset(createWallItem("wall_right"))).toEqual([-0.14, 1.28, 0]);
  });
});
