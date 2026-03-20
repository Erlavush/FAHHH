import { describe, expect, it } from "vitest";
import {
  ensureRoomStateOwnership,
  createFurniturePlacement,
  createDefaultRoomState,
  DEFAULT_ROOM_LAYOUT_VERSION
} from "../src/lib/roomState";

describe("roomState", () => {
  it("creates the full starter room layout with metadata", () => {
    const roomState = createDefaultRoomState();
    const furnitureIds = roomState.furniture.map((item) => item.id);

    expect(roomState.metadata.roomTheme).toBe("starter-cozy");
    expect(roomState.metadata.layoutVersion).toBe(DEFAULT_ROOM_LAYOUT_VERSION);
    expect(furnitureIds).toEqual(
      expect.arrayContaining([
        "starter-rug",
        "starter-bed",
        "starter-office-desk",
        "starter-office-chair",
        "starter-wardrobe",
        "starter-table",
        "starter-books",
        "starter-vase",
        "starter-window-left",
        "starter-window-back-left",
        "starter-window-back-right",
        "starter-poster",
        "starter-wall-frame"
      ])
    );
    expect(roomState.ownedFurniture).toHaveLength(roomState.furniture.length);
    expect(
      roomState.furniture.every((item) =>
        roomState.ownedFurniture.some(
          (ownedFurniture) => ownedFurniture.id === item.ownedFurnitureId
        )
      )
    ).toBe(true);
    expect(
      roomState.furniture
        .filter((item) => item.surface === "surface")
        .every((item) => typeof item.anchorFurnitureId === "string" && item.surfaceLocalOffset)
    ).toBe(true);
  });

  it("assigns sensible default surfaces when creating furniture instances", () => {
    const chair = createFurniturePlacement("chair", [0, 0, 0]);
    const poster = createFurniturePlacement("poster", [0, 1.8, -7.83]);
    const window = createFurniturePlacement("window", [0, 1.82, -4.83]);
    const vase = createFurniturePlacement("vase", [0, 0.94, 0]);

    expect(chair.surface).toBe("floor");
    expect(chair.rotationY).toBe(0);
    expect(poster.surface).toBe("wall_back");
    expect(poster.rotationY).toBe(0);
    expect(window.surface).toBe("wall_back");
    expect(window.rotationY).toBe(0);
    expect(vase.surface).toBe("surface");
    expect(vase.rotationY).toBe(0);
  });

  it("uses an explicitly provided owned furniture id when creating placements", () => {
    const placement = createFurniturePlacement("desk", [0, 0, 0], "floor", {
      ownedFurnitureId: "owned-desk-test"
    });

    expect(placement.ownedFurnitureId).toBe("owned-desk-test");
  });

  it("backfills ownership records for legacy room placements", () => {
    const normalizedRoomState = ensureRoomStateOwnership({
      metadata: {
        roomId: "legacy-room",
        roomTheme: "starter-cozy",
        layoutVersion: DEFAULT_ROOM_LAYOUT_VERSION,
        unlockedFurniture: ["desk", "chair"]
      },
      furniture: [
        {
          id: "legacy-desk",
          type: "desk",
          surface: "floor",
          position: [0, 0, 0],
          rotationY: 0
        } as any
      ],
      ownedFurniture: []
    });

    expect(normalizedRoomState.furniture[0]?.ownedFurnitureId).toBe("owned-legacy-desk");
    expect(normalizedRoomState.ownedFurniture).toEqual([
      expect.objectContaining({
        id: "owned-legacy-desk",
        type: "desk"
      })
    ]);
  });
});
