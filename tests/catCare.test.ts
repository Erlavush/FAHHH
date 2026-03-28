import { describe, expect, it } from "vitest";
import {
  applyCatCareAction,
  buildCatCareSummary,
  selectCatsNeedingCare,
  tickOwnedPetCareState
} from "../src/lib/catCare";
import {
  createOwnedPet,
  type OwnedPet,
  type OwnedPetStatus
} from "../src/lib/pets";

function createCat(
  id: string,
  status: OwnedPetStatus = "active_room",
  careOverrides: Partial<OwnedPet["care"]> = {}
): OwnedPet {
  const pet = createOwnedPet("minecraft_cat", [0, 0, 0], {
    id,
    displayName: id,
    status,
    nowIso: "2026-03-27T00:00:00.000Z"
  });

  return {
    ...pet,
    care: {
      ...pet.care,
      ...careOverrides
    }
  };
}

describe("catCare", () => {
  it("awards coins when feeding a hungry cat", () => {
    const result = applyCatCareAction(
      createCat("Cat 1", "active_room", {
        hunger: 20,
        affection: 72,
        energy: 68,
        lastUpdatedAt: "2026-03-27T00:05:00.000Z"
      }),
      "feed",
      "2026-03-27T00:05:00.000Z"
    );

    expect(result.rewardCoins).toBe(2);
    expect(result.pet.care.hunger).toBe(55);
    expect(result.pet.care.affection).toBe(72);
    expect(result.pet.care.energy).toBe(68);
    expect(result.pet.care.lastUpdatedAt).toBe("2026-03-27T00:05:00.000Z");
    expect(result.pet.care.lastCareActionAt).toBe("2026-03-27T00:05:00.000Z");
  });

  it("decays active care values from elapsed minutes and clamps them into range", () => {
    const tickedPet = tickOwnedPetCareState(
      createCat("Cat 2", "active_room", {
        hunger: 75,
        affection: 75,
        energy: 75,
        lastUpdatedAt: "2026-03-27T00:00:00.000Z"
      }),
      "2026-03-27T00:10:00.000Z"
    );

    expect(tickedPet.care.hunger).toBe(55);
    expect(tickedPet.care.affection).toBe(65);
    expect(tickedPet.care.energy).toBe(65);
    expect(tickedPet.care.lastUpdatedAt).toBe("2026-03-27T00:10:00.000Z");
  });

  it("selects cats needing care when any stat drops below 55", () => {
    const cats = [
      createCat("Cat 1", "active_room", {
        hunger: 70,
        affection: 54,
        energy: 76
      }),
      createCat("Cat 2", "stored_roster", {
        hunger: 72,
        affection: 70,
        energy: 68
      })
    ];

    expect(selectCatsNeedingCare(cats).map((pet) => pet.id)).toEqual(["Cat 1"]);
  });

  it("builds active, stored, and needs-care counts for showcase shell wiring", () => {
    const summary = buildCatCareSummary([
      createCat("Cat 1", "active_room", {
        hunger: 49,
        affection: 70,
        energy: 75
      }),
      createCat("Cat 2", "active_room", {
        hunger: 70,
        affection: 70,
        energy: 70
      }),
      createCat("Cat 3", "stored_roster", {
        hunger: 80,
        affection: 80,
        energy: 80
      })
    ]);

    expect(summary.totalCatCount).toBe(3);
    expect(summary.activeCatCount).toBe(2);
    expect(summary.storedCatCount).toBe(1);
    expect(summary.catsNeedingCareCount).toBe(1);
    expect(summary.catsNeedingCare.map((pet) => pet.id)).toEqual(["Cat 1"]);
  });
});