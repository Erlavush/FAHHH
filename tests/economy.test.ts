import { describe, expect, it } from "vitest";
import { createDefaultSandboxState } from "../src/lib/devLocalState";
import {
  DEFAULT_STARTING_COINS,
  getOwnedFurnitureSellPrice
} from "../src/lib/economy";
import { getFurnitureBuyPrice } from "../src/lib/furnitureRegistry";
import type { OwnedFurnitureItem } from "../src/lib/roomState";

describe("economy", () => {
  it("starts a fresh sandbox with the default coin balance", () => {
    const sandboxState = createDefaultSandboxState([10.5, 8.7, 10.5], [0, 0, 0.85]);

    expect(sandboxState.playerCoins).toBe(DEFAULT_STARTING_COINS);
  });

  it("refunds bought furniture at full price while earn systems are not wired yet", () => {
    const boughtDesk: Pick<OwnedFurnitureItem, "type" | "acquiredFrom"> = {
      type: "desk",
      acquiredFrom: "sandbox_catalog"
    };

    expect(getOwnedFurnitureSellPrice(boughtDesk)).toBe(getFurnitureBuyPrice("desk"));
  });

  it("does not grant coins for removing starter furniture", () => {
    const starterDesk: Pick<OwnedFurnitureItem, "type" | "acquiredFrom"> = {
      type: "desk",
      acquiredFrom: "starter"
    };

    expect(getOwnedFurnitureSellPrice(starterDesk)).toBe(0);
  });
});
