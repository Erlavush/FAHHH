import { describe, expect, it } from "vitest";
import type { RoomFurniturePlacement } from "../src/lib/roomState";
import {
  applyPlacementToItem,
  getPreferredWallSurface,
  resolveFloorPlacement,
  resolveFurnitureRotation,
  resolveSpawnPosition,
  resolveSurfacePlacementOnHost,
  resolveWallPlacement
} from "../src/components/room-view/placementResolvers";

const deskHost: RoomFurniturePlacement = {
  id: "desk-1",
  type: "desk",
  surface: "floor",
  position: [0, 0, 0],
  rotationY: 0,
  ownedFurnitureId: "owned-desk-1"
};

describe("room view placement resolvers", () => {
  it("snaps floor placements to the room grid", () => {
    expect(resolveFloorPlacement(0.12, -0.16, "table", true)).toEqual({
      position: [0.5, 0, -0.5],
      rotationY: Math.PI / 2,
      surface: "floor"
    });
  });

  it("locks fixed-height wall openings to their authored center", () => {
    const placement = resolveWallPlacement("wall_back", 99, 0.1, "window", true);

    expect(placement.position[0]).toBeCloseTo(3.91);
    expect(placement.position[1]).toBeCloseTo(1.82);
    expect(placement.position[2]).toBeCloseTo(-4.83);
    expect(placement.rotationY).toBe(0);
    expect(placement.surface).toBe("wall_back");
  });

  it("resolves snapped surface decor placements against a host", () => {
    expect(resolveSurfacePlacementOnHost(deskHost, "vase", [0.12, 0.16], 0, true)).toEqual({
      position: [0.25, 0.94, 0.25],
      rotationY: 0,
      surface: "surface",
      anchorFurnitureId: "desk-1",
      surfaceLocalOffset: [0.25, 0.25]
    });
  });

  it("falls back to a free-floating preview position when spawning surface decor without hosts", () => {
    expect(resolveSpawnPosition("vase", "surface", [1.25, 0, -0.75], 0, 0, [], true)).toEqual({
      position: [1.25, 0.9, -0.75],
      rotationY: 0,
      surface: "surface",
      anchorFurnitureId: undefined,
      surfaceLocalOffset: undefined
    });
  });

  it("keeps the item rotation while applying floor and surface placements", () => {
    const item: RoomFurniturePlacement = {
      id: "chair-1",
      type: "chair",
      surface: "floor",
      position: [0, 0, 0],
      rotationY: 1.23,
      ownedFurnitureId: "owned-chair-1"
    };

    expect(
      applyPlacementToItem(item, {
        position: [1, 0, 2],
        rotationY: 0,
        surface: "floor"
      })
    ).toEqual({
      ...item,
      position: [1, 0, 2],
      rotationY: 1.23,
      surface: "floor"
    });
  });

  it("snaps furniture rotation and chooses the nearest wall for wall spawns", () => {
    expect(resolveFurnitureRotation(0.9, true)).toBeCloseTo(Math.PI / 2);
    expect(getPreferredWallSurface([-4.2, 0, -0.8])).toBe("wall_left");
    expect(getPreferredWallSurface([0.2, 0, -4.2])).toBe("wall_back");
  });
});
