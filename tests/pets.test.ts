import { describe, expect, it } from "vitest";
import { PET_REGISTRY } from "../src/lib/pets";

describe("pet registry", () => {
  it("includes the high-fidelity minecraft cat pet", () => {
    expect(PET_REGISTRY.minecraft_cat.presetId).toBe("better_cat_glb");
    expect(PET_REGISTRY.minecraft_cat.price).toBe(0);
  });
});
