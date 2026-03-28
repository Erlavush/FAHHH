import { describe, expect, it } from "vitest";
import {
  DEFAULT_BETTER_CAT_GLB_VARIANT,
  getBetterCatHiddenMeshNames,
  shouldHideBetterCatMesh
} from "../src/lib/betterCatGlb";

describe("betterCatGlb", () => {
  it("keeps the original Better Cat on the legacy base body, normal tail, and bent-ear mesh set", () => {
    const hiddenMeshNames = new Set(getBetterCatHiddenMeshNames(DEFAULT_BETTER_CAT_GLB_VARIANT));

    expect(hiddenMeshNames.has("thinbase")).toBe(true);
    expect(hiddenMeshNames.has("fluffybase")).toBe(true);
    expect(hiddenMeshNames.has("thintail")).toBe(true);
    expect(hiddenMeshNames.has("thintail2")).toBe(true);
    expect(hiddenMeshNames.has("flufftail")).toBe(true);
    expect(hiddenMeshNames.has("flufftip")).toBe(true);
    expect(hiddenMeshNames.has("flufftip_1")).toBe(true);
    expect(hiddenMeshNames.has("bobtail")).toBe(true);
    expect(hiddenMeshNames.has("bobtailtip")).toBe(true);
    expect(hiddenMeshNames.has("ear2")).toBe(true);
    expect(hiddenMeshNames.has("ear3")).toBe(true);
    expect(hiddenMeshNames.has("ear6")).toBe(true);
    expect(hiddenMeshNames.has("ear7")).toBe(true);
    expect(hiddenMeshNames.has("base")).toBe(false);
    expect(hiddenMeshNames.has("normaltail")).toBe(false);
    expect(hiddenMeshNames.has("normaltip")).toBe(false);
    expect(hiddenMeshNames.has("ear4")).toBe(false);
    expect(hiddenMeshNames.has("ear5")).toBe(false);
  });

  it("supports a fluffy-body, fluffy-tail, and base-ear Better Cat export", () => {
    const hiddenMeshNames = new Set(
      getBetterCatHiddenMeshNames({
        body: "fluffy",
        tail: "fluffy",
        ear: "base"
      })
    );

    expect(hiddenMeshNames.has("base")).toBe(true);
    expect(hiddenMeshNames.has("thinbase")).toBe(true);
    expect(hiddenMeshNames.has("fluffybase")).toBe(false);
    expect(hiddenMeshNames.has("normaltail")).toBe(true);
    expect(hiddenMeshNames.has("thintail")).toBe(true);
    expect(hiddenMeshNames.has("thintail2")).toBe(true);
    expect(hiddenMeshNames.has("normaltip")).toBe(true);
    expect(hiddenMeshNames.has("normaltip_1")).toBe(true);
    expect(hiddenMeshNames.has("flufftail")).toBe(false);
    expect(hiddenMeshNames.has("flufftip")).toBe(false);
    expect(hiddenMeshNames.has("flufftip_1")).toBe(false);
    expect(hiddenMeshNames.has("ear2")).toBe(false);
    expect(hiddenMeshNames.has("ear3")).toBe(false);
    expect(hiddenMeshNames.has("ear4")).toBe(true);
    expect(hiddenMeshNames.has("ear5")).toBe(true);
    expect(hiddenMeshNames.has("ear6")).toBe(true);
    expect(hiddenMeshNames.has("ear7")).toBe(true);
  });

  it("supports a fluffy-body, bobtail, and big-ear Better Cat export", () => {
    const hiddenMeshNames = new Set(
      getBetterCatHiddenMeshNames({
        body: "fluffy",
        tail: "bob",
        ear: "big"
      })
    );

    expect(hiddenMeshNames.has("base")).toBe(true);
    expect(hiddenMeshNames.has("thinbase")).toBe(true);
    expect(hiddenMeshNames.has("fluffybase")).toBe(false);
    expect(hiddenMeshNames.has("normaltail")).toBe(true);
    expect(hiddenMeshNames.has("thintail")).toBe(true);
    expect(hiddenMeshNames.has("thintail2")).toBe(true);
    expect(hiddenMeshNames.has("flufftail")).toBe(true);
    expect(hiddenMeshNames.has("flufftip")).toBe(true);
    expect(hiddenMeshNames.has("flufftip_1")).toBe(true);
    expect(hiddenMeshNames.has("bobtail")).toBe(false);
    expect(hiddenMeshNames.has("bobtailtip")).toBe(false);
    expect(hiddenMeshNames.has("ear2")).toBe(true);
    expect(hiddenMeshNames.has("ear3")).toBe(true);
    expect(hiddenMeshNames.has("ear4")).toBe(true);
    expect(hiddenMeshNames.has("ear5")).toBe(true);
    expect(hiddenMeshNames.has("ear6")).toBe(false);
    expect(hiddenMeshNames.has("ear7")).toBe(false);
  });

  it("still hides the Better Cats small-leg helper meshes", () => {
    expect(shouldHideBetterCatMesh("front_left_small_leg")).toBe(true);
    expect(shouldHideBetterCatMesh("back_right_small_leg")).toBe(true);
    expect(shouldHideBetterCatMesh("front_left_leg2")).toBe(false);
  });
});
