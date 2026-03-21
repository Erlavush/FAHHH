import { describe, expect, it } from "vitest";
import { PET_REGISTRY } from "../src/lib/pets";

describe("pet registry", () => {
  it("includes the vanilla minecraft cat test pet", () => {
    expect(PET_REGISTRY.minecraft_vanilla_cat.presetId).toBe("better_cats_v4_tabby");
    expect(PET_REGISTRY.minecraft_vanilla_cat.price).toBe(0);
  });
});
