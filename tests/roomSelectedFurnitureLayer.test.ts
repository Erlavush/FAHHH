import { describe, expect, it } from "vitest";
import { isSelectedFurnitureVisible } from "../src/components/room-view/RoomSelectedFurnitureLayer";
import type { RoomFurniturePlacement } from "../src/lib/roomState";

function createPlacement(
  overrides: Partial<RoomFurniturePlacement> = {}
): RoomFurniturePlacement {
  return {
    id: "selected-item",
    type: "ceiling_light",
    ownedFurnitureId: "owned-selected-item",
    position: [0, 4.22, 0],
    rotationY: 0,
    surface: "ceiling",
    ...overrides
  };
}

describe("isSelectedFurnitureVisible", () => {
  it("keeps a selected ceiling item visible during build-mode editing", () => {
    expect(
      isSelectedFurnitureVisible({
        buildModeEnabled: true,
        selectedFurniture: createPlacement(),
        wallVisibility: {
          wall_back: true,
          wall_left: true,
          wall_front: true,
          wall_right: true,
          ceiling: false
        }
      })
    ).toBe(true);
  });

  it("hides selected ceiling items again once build mode is off", () => {
    expect(
      isSelectedFurnitureVisible({
        buildModeEnabled: false,
        selectedFurniture: createPlacement(),
        wallVisibility: {
          wall_back: true,
          wall_left: true,
          wall_front: true,
          wall_right: true,
          ceiling: false
        }
      })
    ).toBe(false);
  });
});
