import { describe, expect, it } from "vitest";
import { resolvePlayerMovement } from "../src/lib/physics";
import type { PersistedFurniturePlacement } from "../src/lib/devLocalState";

function makeFloorFurniture(
  id: string,
  type: PersistedFurniturePlacement["type"],
  position: [number, number, number],
  rotationY = 0
): PersistedFurniturePlacement {
  return {
    id,
    type,
    surface: "floor",
    position,
    rotationY,
    ownedFurnitureId: `owned-${id}`
  };
}

describe("resolvePlayerMovement", () => {
  it("blocks walking into floor furniture", () => {
    const chair = makeFloorFurniture("chair-1", "chair", [0, 0, 0]);

    const result = resolvePlayerMovement([-1, 0, 0], [0, 0, 0], [chair]);

    expect(result.collided).toBe(true);
    expect(result.position[0]).toBeLessThan(0);
  });

  it("ignores rugs as walk blockers", () => {
    const rug = makeFloorFurniture("rug-1", "rug", [0, 0, 0]);

    const result = resolvePlayerMovement([-1, 0, 0], [0, 0, 0], [rug]);

    expect(result.collided).toBe(false);
    expect(result.position[0]).toBe(0);
  });

  it("allows free walking when no obstacle is present", () => {
    const result = resolvePlayerMovement([-1, 0, 0], [0, 0, 0], []);

    expect(result.collided).toBe(false);
    expect(result.position).toEqual([0, 0, 0]);
  });
});
