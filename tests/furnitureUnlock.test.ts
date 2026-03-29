import { describe, expect, it } from "vitest";
import { ALL_FURNITURE_TYPES, FURNITURE_REGISTRY } from "../src/lib/furnitureRegistry";
import { DEFAULT_ROOM_STATE } from "../src/lib/roomState";

describe("furnitureUnlock", () => {
  it("includes beanbag_chair and midnight items in ALL_FURNITURE_TYPES", () => {
    expect(ALL_FURNITURE_TYPES).toContain("beanbag_chair");
    expect(ALL_FURNITURE_TYPES).toContain("midnight_chair");
    expect(ALL_FURNITURE_TYPES).toContain("midnight_desk");
  });

  it("marks themed items as not starterUnlocked", () => {
    expect(FURNITURE_REGISTRY["beanbag_chair"].starterUnlocked).toBe(false);
    expect(FURNITURE_REGISTRY["midnight_chair"].starterUnlocked).toBe(false);
    expect(FURNITURE_REGISTRY["midnight_desk"].starterUnlocked).toBe(false);
  });

  it("excludes beanbag_chair from DEFAULT_ROOM_STATE unlockedFurniture", () => {
    expect(DEFAULT_ROOM_STATE.metadata.unlockedFurniture).not.toContain("beanbag_chair");
  });

  it("includes all starterUnlocked furniture in DEFAULT_ROOM_STATE", () => {
    const starterUnlockedCount = ALL_FURNITURE_TYPES.filter(
      (type) => FURNITURE_REGISTRY[type].starterUnlocked
    ).length;
    expect(DEFAULT_ROOM_STATE.metadata.unlockedFurniture).toHaveLength(starterUnlockedCount);
  });
});
