import { describe, expect, it } from "vitest";
import { getFurnitureInteractionTarget } from "../src/lib/furnitureInteractions";
import type { RoomFurniturePlacement } from "../src/lib/roomState";

describe("furniture interactions", () => {
  it("returns a sit target for chairs using the rotated local seat offset", () => {
    const chair: RoomFurniturePlacement = {
      id: "chair-a",
      type: "chair",
      surface: "floor",
      position: [1, 0, 2],
      rotationY: Math.PI / 2
    };

    const target = getFurnitureInteractionTarget(chair);

    expect(target).not.toBeNull();
    expect(target?.type).toBe("sit");
    expect(target?.position[0]).toBeCloseTo(1.06);
    expect(target?.position[2]).toBeCloseTo(2);
    expect(target?.rotationY).toBeCloseTo(Math.PI / 2);
  });

  it("returns null for non-interactive furniture", () => {
    const rug: RoomFurniturePlacement = {
      id: "rug-a",
      type: "rug",
      surface: "floor",
      position: [0, 0, 0],
      rotationY: 0
    };

    expect(getFurnitureInteractionTarget(rug)).toBeNull();
  });

  it("returns a lie target for beds", () => {
    const bed: RoomFurniturePlacement = {
      id: "bed-a",
      type: "bed",
      surface: "floor",
      position: [2, 0, -1],
      rotationY: 0
    };

    const target = getFurnitureInteractionTarget(bed);

    expect(target?.type).toBe("lie");
    expect(target?.position[0]).toBeCloseTo(2);
    expect(target?.position[2]).toBeCloseTo(-0.8);
  });
});
