import { describe, expect, it } from "vitest";
import { Ray, Vector3 } from "three";
import type { RoomFurniturePlacement } from "../src/lib/roomState";
import {
  CEILING_SURFACE_Y,
  FRONT_WALL_SURFACE_Z,
  RIGHT_WALL_SURFACE_X
} from "../src/components/room-view/constants";
import {
  applyPlacementToItem,
  getPreferredWallSurface,
  resolveCeilingPlacement,
  resolveFloorPlacement,
  resolveFurnitureRotation,
  resolvePlacementFromDragRay,
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

  it("snaps ceiling placements to the room grid and keeps them on the ceiling surface", () => {
    expect(resolveCeilingPlacement(0.12, -0.16, "table", true)).toEqual({
      position: [0.5, CEILING_SURFACE_Y, -0.5],
      rotationY: Math.PI / 2,
      surface: "ceiling"
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

  it("resolves front and right wall placements with the correct locked axis", () => {
    const frontPlacement = resolveWallPlacement("wall_front", 0.6, 1.4, "poster", true);
    const rightPlacement = resolveWallPlacement("wall_right", 0.6, 1.4, "poster", true);

    expect(frontPlacement).toEqual({
      position: [0.5, 1.7, FRONT_WALL_SURFACE_Z],
      rotationY: Math.PI,
      surface: "wall_front"
    });
    expect(rightPlacement).toEqual({
      position: [RIGHT_WALL_SURFACE_X, 1.7, 0.5],
      rotationY: -Math.PI / 2,
      surface: "wall_right"
    });
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
    expect(getPreferredWallSurface([4.2, 0, 0.2])).toBe("wall_right");
    expect(getPreferredWallSurface([0.2, 0, 4.2])).toBe("wall_front");
  });

  it("projects drag rays onto the correct wall plane for each wall surface", () => {
    const frontPlacement = resolvePlacementFromDragRay(
      new Ray(new Vector3(1.2, 1.6, 0), new Vector3(0, 0, 1)),
      {
        furnitureId: "poster-front",
        type: "poster",
        surface: "wall_front",
        rotationY: Math.PI
      },
      [],
      true
    );
    const rightPlacement = resolvePlacementFromDragRay(
      new Ray(new Vector3(0, 1.6, 1.2), new Vector3(1, 0, 0)),
      {
        furnitureId: "poster-right",
        type: "poster",
        surface: "wall_right",
        rotationY: -Math.PI / 2
      },
      [],
      true
    );

    expect(frontPlacement).toEqual({
      position: [1.5, 1.7, FRONT_WALL_SURFACE_Z],
      rotationY: Math.PI,
      surface: "wall_front"
    });
    expect(rightPlacement).toEqual({
      position: [RIGHT_WALL_SURFACE_X, 1.7, 1.5],
      rotationY: -Math.PI / 2,
      surface: "wall_right"
    });
  });

  it("projects drag rays onto the ceiling plane", () => {
    const ceilingPlacement = resolvePlacementFromDragRay(
      new Ray(new Vector3(1.2, CEILING_SURFACE_Y + 2, -1.1), new Vector3(0, -1, 0)),
      {
        furnitureId: "ceiling-preview",
        type: "table",
        surface: "ceiling",
        rotationY: Math.PI / 2
      },
      [],
      true
    );

    expect(ceilingPlacement).toEqual({
      position: [1.5, CEILING_SURFACE_Y, -1.5],
      rotationY: Math.PI / 2,
      surface: "ceiling"
    });
  });

  it("wraps wall dragging across corners onto adjacent walls", () => {
    const backToRightPlacement = resolvePlacementFromDragRay(
      new Ray(new Vector3(1, 1.8, 0), new Vector3(1, 0, -1).normalize()),
      {
        furnitureId: "poster-wrap-1",
        type: "poster",
        surface: "wall_back",
        rotationY: 0
      },
      [],
      true
    );
    const rightToFrontPlacement = resolvePlacementFromDragRay(
      new Ray(new Vector3(0, 1.8, 1), new Vector3(1, 0, 1).normalize()),
      {
        furnitureId: "poster-wrap-2",
        type: "poster",
        surface: "wall_right",
        rotationY: -Math.PI / 2
      },
      [],
      true
    );

    expect(backToRightPlacement?.surface).toBe("wall_right");
    expect(backToRightPlacement?.position[0]).toBe(RIGHT_WALL_SURFACE_X);
    expect(rightToFrontPlacement?.surface).toBe("wall_front");
    expect(rightToFrontPlacement?.position[2]).toBe(FRONT_WALL_SURFACE_Z);
  });
});
