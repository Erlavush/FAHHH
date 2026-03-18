import { describe, expect, it } from "vitest";
import {
  getFurnitureCollisionReason
} from "../src/lib/furnitureCollision";
import type { PersistedFurniturePlacement } from "../src/lib/devLocalState";

const farAwayPlayer: [number, number, number] = [6, 0, 6];

function makeChair(
  id: string,
  position: [number, number, number],
  rotationY = 0
): PersistedFurniturePlacement {
  return {
    id,
    type: "chair",
    position,
    rotationY
  };
}

function makeTable(
  id: string,
  position: [number, number, number],
  rotationY = 0
): PersistedFurniturePlacement {
  return {
    id,
    type: "table",
    position,
    rotationY
  };
}

function makePoster(
  id: string,
  position: [number, number, number]
): PersistedFurniturePlacement {
  return {
    id,
    type: "poster",
    position,
    rotationY: 0
  };
}

describe("furnitureCollision", () => {
  it("allows valid placement when no furniture or player overlap exists", () => {
    const selectedChair = makeChair("chair-1", [0, 0, 0], 0);
    const otherFurniture = [makeTable("table-1", [2.2, 0, 0], 0)];

    expect(getFurnitureCollisionReason(selectedChair, otherFurniture, farAwayPlayer)).toBeNull();
  });

  it("blocks placement when furniture footprints overlap", () => {
    const selectedChair = makeChair("chair-1", [0, 0, 0], 0);
    const otherFurniture = [makeTable("table-1", [0.6, 0, 0], 0)];

    expect(getFurnitureCollisionReason(selectedChair, otherFurniture, farAwayPlayer)).toBe(
      "furniture_overlap"
    );
  });

  it("blocks placement when the player occupancy area overlaps", () => {
    const selectedTable = makeTable("table-1", [0, 0, 0], 0);

    expect(getFurnitureCollisionReason(selectedTable, [], [0.15, 0, 0.05])).toBe(
      "player_overlap"
    );
  });

  it("updates collision as rotation changes", () => {
    const otherFurniture = [makeTable("table-1", [0.97, 0, 0.2], 0)];
    const rotatedChair = makeChair("chair-1", [0, 0, 0], Math.PI / 2);
    const unrotatedChair = makeChair("chair-1", [0, 0, 0], 0);

    expect(getFurnitureCollisionReason(unrotatedChair, otherFurniture, farAwayPlayer)).toBe(
      "furniture_overlap"
    );
    expect(getFurnitureCollisionReason(rotatedChair, otherFurniture, farAwayPlayer)).toBeNull();
  });

  it("blocks wall placement when poster footprints overlap on the same wall", () => {
    const selectedPoster = makePoster("poster-1", [0, 1.8, -7.83]);
    const otherFurniture = [makePoster("poster-2", [0.8, 1.85, -7.83])];

    expect(getFurnitureCollisionReason(selectedPoster, otherFurniture, farAwayPlayer)).toBe(
      "furniture_overlap"
    );
  });

  it("does not block wall placement against floor furniture on another surface", () => {
    const selectedPoster = makePoster("poster-1", [0, 1.8, -7.83]);
    const otherFurniture = [makeTable("table-1", [0, 0, 0], 0)];

    expect(getFurnitureCollisionReason(selectedPoster, otherFurniture, farAwayPlayer)).toBeNull();
  });
});
