import { describe, expect, it } from "vitest";
import { getFurnitureAABBs, getFurnitureCollisionReason } from "../src/lib/furnitureCollision";
import type { PersistedFurniturePlacement } from "../src/lib/devLocalState";

const farAwayPlayer: [number, number, number] = [6, 0, 6];

function createOwnedFurnitureId(id: string): string {
  return `owned-${id}`;
}

function makeChair(
  id: string,
  position: [number, number, number],
  rotationY = 0
): PersistedFurniturePlacement {
  return {
    id,
    type: "chair",
    surface: "floor",
    position,
    rotationY,
    ownedFurnitureId: createOwnedFurnitureId(id)
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
    surface: "floor",
    position,
    rotationY,
    ownedFurnitureId: createOwnedFurnitureId(id)
  };
}

function makeDesk(
  id: string,
  position: [number, number, number],
  rotationY = 0
): PersistedFurniturePlacement {
  return {
    id,
    type: "desk",
    surface: "floor",
    position,
    rotationY,
    ownedFurnitureId: createOwnedFurnitureId(id)
  };
}

function makeRug(
  id: string,
  position: [number, number, number],
  rotationY = 0
): PersistedFurniturePlacement {
  return {
    id,
    type: "rug",
    surface: "floor",
    position,
    rotationY,
    ownedFurnitureId: createOwnedFurnitureId(id)
  };
}

function makePoster(
  id: string,
  position: [number, number, number],
  surface: "wall_back" | "wall_left" | "wall_front" | "wall_right" = "wall_back"
): PersistedFurniturePlacement {
  return {
    id,
    type: "poster",
    surface,
    position,
    rotationY:
      surface === "wall_left"
        ? Math.PI / 2
        : surface === "wall_front"
          ? Math.PI
          : surface === "wall_right"
            ? -Math.PI / 2
            : 0,
    ownedFurnitureId: createOwnedFurnitureId(id)
  };
}

function makeWindow(
  id: string,
  position: [number, number, number],
  surface: "wall_back" | "wall_left" | "wall_front" | "wall_right" = "wall_back"
): PersistedFurniturePlacement {
  return {
    id,
    type: "window",
    surface,
    position,
    rotationY:
      surface === "wall_left"
        ? Math.PI / 2
        : surface === "wall_front"
          ? Math.PI
          : surface === "wall_right"
            ? -Math.PI / 2
            : 0,
    ownedFurnitureId: createOwnedFurnitureId(id)
  };
}

function makeVase(
  id: string,
  position: [number, number, number],
  anchorFurnitureId = "desk-1"
): PersistedFurniturePlacement {
  return {
    id,
    type: "vase",
    surface: "surface",
    position,
    rotationY: 0,
    ownedFurnitureId: createOwnedFurnitureId(id),
    anchorFurnitureId,
    surfaceLocalOffset: [0, 0]
  };
}

describe("furnitureCollision", () => {
  it("allows valid floor placement when no furniture or player overlap exists", () => {
    const selectedChair = makeChair("chair-1", [0, 0, 0], 0);
    const otherFurniture = [makeTable("table-1", [1, 0, 0], 0)];

    expect(getFurnitureCollisionReason(selectedChair, otherFurniture, farAwayPlayer)).toBeNull();
  });

  it("blocks floor placement when furniture footprints overlap", () => {
    const selectedChair = makeChair("chair-1", [0, 0, 0], 0);
    const otherFurniture = [makeTable("table-1", [0.7, 0, 0], 0)];

    expect(getFurnitureCollisionReason(selectedChair, otherFurniture, farAwayPlayer)).toBe(
      "furniture_overlap"
    );
  });

  it("blocks floor placement when the player occupancy area overlaps", () => {
    const selectedTable = makeTable("table-1", [0, 0, 0], 0);

    expect(getFurnitureCollisionReason(selectedTable, [], [0.15, 0, 0.05])).toBe(
      "player_overlap"
    );
  });

  it("updates floor collision as rotation changes", () => {
    const otherFurniture = [makeTable("table-1", [1.1, 0, 0], 0)];
    const unrotatedDesk = makeDesk("desk-1", [0, 0, 0], 0);
    const rotatedDesk = makeDesk("desk-1", [0, 0, 0], Math.PI / 2);

    expect(getFurnitureCollisionReason(unrotatedDesk, otherFurniture, farAwayPlayer)).toBe(
      "furniture_overlap"
    );
    expect(getFurnitureCollisionReason(rotatedDesk, otherFurniture, farAwayPlayer)).toBeNull();
  });

  it("allows rugs to overlap furniture and the player", () => {
    const selectedRug = makeRug("rug-1", [0, 0, 0], 0);
    const otherFurniture = [makeDesk("desk-1", [0, 0, 0], 0)];

    expect(getFurnitureCollisionReason(selectedRug, otherFurniture, [0, 0, 0])).toBeNull();
  });

  it("blocks rugs from overlapping other rugs", () => {
    const selectedRug = makeRug("rug-1", [0, 0, 0], 0);
    const otherFurniture = [makeRug("rug-2", [0.5, 0, 0], 0)];

    expect(getFurnitureCollisionReason(selectedRug, otherFurniture, farAwayPlayer)).toBe(
      "furniture_overlap"
    );
  });

  it("blocks wall placement when two posters overlap on the same wall", () => {
    const selectedPoster = makePoster("poster-1", [0, 1.8, -7.83], "wall_back");
    const otherFurniture = [makePoster("poster-2", [0.8, 1.85, -7.83], "wall_back")];

    expect(getFurnitureCollisionReason(selectedPoster, otherFurniture, farAwayPlayer)).toBe(
      "furniture_overlap"
    );
  });

  it("allows wall items on different walls without false overlap", () => {
    const selectedPoster = makePoster("poster-1", [0, 1.8, -7.83], "wall_back");
    const otherFurniture = [makePoster("poster-2", [-7.83, 1.8, 0.2], "wall_left")];

    expect(getFurnitureCollisionReason(selectedPoster, otherFurniture, farAwayPlayer)).toBeNull();
  });

  it("blocks windows from overlapping other wall decor on the same wall", () => {
    const selectedWindow = makeWindow("window-1", [-1.5, 1.82, -4.83], "wall_back");
    const otherFurniture = [makePoster("poster-2", [-1.2, 1.9, -4.83], "wall_back")];

    expect(getFurnitureCollisionReason(selectedWindow, otherFurniture, farAwayPlayer)).toBe(
      "furniture_overlap"
    );
  });

  it("allows windows on different walls without false overlap", () => {
    const selectedWindow = makeWindow("window-1", [-1.5, 1.82, -4.83], "wall_back");
    const otherFurniture = [makeWindow("window-2", [-4.83, 1.82, -1.4], "wall_left")];

    expect(getFurnitureCollisionReason(selectedWindow, otherFurniture, farAwayPlayer)).toBeNull();
  });

  it("allows separated wall items on the right wall without false overlap", () => {
    const selectedPoster = makePoster("poster-1", [4.83, 1.8, -2.4], "wall_right");
    const otherFurniture = [makePoster("poster-2", [4.83, 1.8, 2.4], "wall_right")];

    expect(getFurnitureCollisionReason(selectedPoster, otherFurniture, farAwayPlayer)).toBeNull();
  });

  it("blocks overlapping surface decor on the same host", () => {
    const selectedVase = makeVase("vase-1", [0, 0.94, 0], "desk-1");
    const otherFurniture = [makeVase("vase-2", [0.15, 0.94, 0], "desk-1")];

    expect(getFurnitureCollisionReason(selectedVase, otherFurniture, farAwayPlayer)).toBe(
      "furniture_overlap"
    );
  });

  it("allows surface decor on different hosts without false overlap", () => {
    const selectedVase = makeVase("vase-1", [0, 0.94, 0], "desk-1");
    const otherFurniture = [makeVase("vase-2", [0, 2.1, 0], "fridge-1")];

    expect(getFurnitureCollisionReason(selectedVase, otherFurniture, farAwayPlayer)).toBeNull();
  });
});

