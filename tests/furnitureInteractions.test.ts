import { describe, expect, it } from "vitest";
import { getFurnitureInteractionTarget } from "../src/lib/furnitureInteractions";
import type { RoomFurniturePlacement } from "../src/lib/roomState";

function normalizeAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function shortestAngleDistance(from: number, to: number): number {
  return Math.atan2(Math.sin(from - to), Math.cos(from - to));
}

function createOwnedFurnitureId(id: string): string {
  return `owned-${id}`;
}

describe("furniture interactions", () => {
  it("returns a sit target for chairs using the rotated local seat offset", () => {
    const chair: RoomFurniturePlacement = {
      id: "chair-a",
      type: "chair",
      surface: "floor",
      position: [1, 0, 2],
      rotationY: Math.PI / 2,
      ownedFurnitureId: createOwnedFurnitureId("chair-a")
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
      rotationY: 0,
      ownedFurnitureId: createOwnedFurnitureId("rug-a")
    };

    expect(getFurnitureInteractionTarget(rug)).toBeNull();
  });

  it("returns a lie target for beds", () => {
    const bed: RoomFurniturePlacement = {
      id: "bed-a",
      type: "bed",
      surface: "floor",
      position: [2, 0, -1],
      rotationY: 0,
      ownedFurnitureId: createOwnedFurnitureId("bed-a")
    };

    const target = getFurnitureInteractionTarget(bed);

    expect(target?.type).toBe("lie");
    expect(target?.position[0]).toBeCloseTo(2);
    expect(target?.position[2]).toBeCloseTo(-0.8);
  });

  it("returns a pc-use target for a desk when a chair overlaps the front zone", () => {
    const desk: RoomFurniturePlacement = {
      id: "desk-a",
      type: "desk",
      surface: "floor",
      position: [0, 0, 0],
      rotationY: 0,
      ownedFurnitureId: createOwnedFurnitureId("desk-a")
    };
    const chair: RoomFurniturePlacement = {
      id: "chair-a",
      type: "chair",
      surface: "floor",
      position: [0.12, 0, 1.3],
      rotationY: Math.PI / 2,
      ownedFurnitureId: createOwnedFurnitureId("chair-a")
    };

    const target = getFurnitureInteractionTarget(desk, [desk, chair]);

    expect(target?.type).toBe("use_pc");
    expect(target?.chairFurnitureId).toBe("chair-a");
    expect(target?.position[0]).toBeCloseTo(0.12);
    expect(target?.position[2]).toBeCloseTo(1.24);
    expect(
      Math.abs(shortestAngleDistance(target?.rotationY ?? 0, Math.PI))
    ).toBeLessThan(0.005);
  });

  it("chooses the nearest valid chair when multiple chairs overlap the desk zone", () => {
    const desk: RoomFurniturePlacement = {
      id: "desk-a",
      type: "desk",
      surface: "floor",
      position: [0, 0, 0],
      rotationY: 0,
      ownedFurnitureId: createOwnedFurnitureId("desk-a")
    };
    const fartherChair: RoomFurniturePlacement = {
      id: "chair-a",
      type: "chair",
      surface: "floor",
      position: [0.48, 0, 1.4],
      rotationY: 0,
      ownedFurnitureId: createOwnedFurnitureId("chair-a")
    };
    const nearerOfficeChair: RoomFurniturePlacement = {
      id: "office-chair-a",
      type: "office_chair",
      surface: "floor",
      position: [0.04, 0, 1.12],
      rotationY: -Math.PI / 2,
      ownedFurnitureId: createOwnedFurnitureId("office-chair-a")
    };

    const target = getFurnitureInteractionTarget(desk, [
      desk,
      fartherChair,
      nearerOfficeChair
    ]);

    expect(target?.chairFurnitureId).toBe("office-chair-a");
    expect(target?.type).toBe("use_pc");
  });

  it("returns null for a desk with no valid chair in front", () => {
    const desk: RoomFurniturePlacement = {
      id: "desk-a",
      type: "desk",
      surface: "floor",
      position: [0, 0, 0],
      rotationY: 0,
      ownedFurnitureId: createOwnedFurnitureId("desk-a")
    };
    const chairBehindDesk: RoomFurniturePlacement = {
      id: "chair-a",
      type: "chair",
      surface: "floor",
      position: [0, 0, -1],
      rotationY: 0,
      ownedFurnitureId: createOwnedFurnitureId("chair-a")
    };

    expect(getFurnitureInteractionTarget(desk, [desk, chairBehindDesk])).toBeNull();
  });

  it("returns a pc-use target for an office desk when the chair is on its flipped front side", () => {
    const officeDesk: RoomFurniturePlacement = {
      id: "office-desk-a",
      type: "office_desk",
      surface: "floor",
      position: [0, 0, 0],
      rotationY: 0,
      ownedFurnitureId: createOwnedFurnitureId("office-desk-a")
    };
    const officeChair: RoomFurniturePlacement = {
      id: "office-chair-a",
      type: "office_chair",
      surface: "floor",
      position: [0.1, 0, -1.15],
      rotationY: 0,
      ownedFurnitureId: createOwnedFurnitureId("office-chair-a")
    };

    const target = getFurnitureInteractionTarget(officeDesk, [officeDesk, officeChair]);

    expect(target?.type).toBe("use_pc");
    expect(target?.chairFurnitureId).toBe("office-chair-a");
    expect(
      Math.abs(shortestAngleDistance(target?.rotationY ?? 0, 0))
    ).toBeLessThan(0.005);
  });
});
