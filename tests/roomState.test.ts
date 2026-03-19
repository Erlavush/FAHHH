import { describe, expect, it } from "vitest";
import {
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
        "starter-desk",
        "starter-chair",
        "starter-table",
        "starter-poster",
        "starter-wall-frame"
      ])
    );
  });

  it("assigns sensible default surfaces when creating furniture instances", () => {
    const chair = createFurniturePlacement("chair", [0, 0, 0]);
    const poster = createFurniturePlacement("poster", [0, 1.8, -7.83]);
    const vase = createFurniturePlacement("vase", [0, 0.94, 0]);

    expect(chair.surface).toBe("floor");
    expect(chair.rotationY).toBe(0);
    expect(poster.surface).toBe("wall_back");
    expect(poster.rotationY).toBe(0);
    expect(vase.surface).toBe("surface");
    expect(vase.rotationY).toBe(0);
  });
});
