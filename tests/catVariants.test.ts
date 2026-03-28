import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BETTER_CAT_VARIANTS } from "../src/lib/catVariants";
import { DEFAULT_IMPORTED_MOB_PRESETS } from "../src/lib/mobLab";

function toPublicRepoPath(assetPath: string): string {
  const normalized = assetPath.replace(/^\//, "");
  return path.join(process.cwd(), "public", ...normalized.split("/"));
}

function toPresetPath(presetId: string): string {
  return path.join(process.cwd(), "src", "lib", "mob-presets", `${presetId}.json`);
}

describe("Better Cats variants", () => {
  it("describes the curated Better Cats launch set", () => {
    expect(BETTER_CAT_VARIANTS.map((variant) => variant.id)).toEqual([
      "tabby",
      "red",
      "calico",
      "siamese",
      "british_shorthair",
      "ragdoll",
      "black",
      "white"
    ]);
  });

  it("uses stable preset ids and repo-owned texture paths", () => {
    for (const variant of BETTER_CAT_VARIANTS) {
      expect(variant.presetId).toBe(`better_cat_variant_${variant.id}`);
      expect(variant.coatTextureSrc).toBe(`/textures/cats/better-cats/coats/${variant.id}.png`);
      expect(variant.eyeOverlayTextureSrc).toBe("/textures/cats/better-cats/overlays/cat_eyes.png");
      expect(variant.eyeEmissiveTextureSrc).toBe("/textures/cats/better-cats/overlays/cat_eyes_e.png");
      expect(variant.whiskersTextureSrc).toBe("/textures/cats/better-cats/overlays/whiskers.png");
      expect(variant.sourceTextureName).toBe(`${variant.id}.png`);
    }
  });

  it("points at checked-in repo texture assets", () => {
    const requiredAssetPaths = new Set<string>([
      ...BETTER_CAT_VARIANTS.map((variant) => variant.coatTextureSrc),
      ...BETTER_CAT_VARIANTS.flatMap((variant) => [
        variant.eyeOverlayTextureSrc,
        variant.eyeEmissiveTextureSrc,
        variant.whiskersTextureSrc
      ].filter((assetPath): assetPath is string => Boolean(assetPath)))
    ]);

    for (const assetPath of requiredAssetPaths) {
      expect(existsSync(toPublicRepoPath(assetPath))).toBe(true);
    }
  });

  it("points at checked-in curated preset definitions", () => {
    for (const variant of BETTER_CAT_VARIANTS) {
      const presetPath = toPresetPath(variant.presetId);
      expect(existsSync(presetPath)).toBe(true);

      const preset = JSON.parse(readFileSync(presetPath, "utf8")) as {
        variantId: string;
        sourceMobPath: string;
        textureSrc: string;
      };

      expect(preset.variantId).toBe(variant.id);
      expect(preset.sourceMobPath).toBe("/models/better_cat.glb");
      expect(preset.textureSrc).toBe(variant.coatTextureSrc);
    }
  });

  it("registers the curated presets in the built-in Mob Lab library", () => {
    for (const variant of BETTER_CAT_VARIANTS) {
      expect(DEFAULT_IMPORTED_MOB_PRESETS[variant.presetId]).toBeDefined();
      expect(DEFAULT_IMPORTED_MOB_PRESETS[variant.presetId]?.variantId).toBe(variant.id);
      expect(DEFAULT_IMPORTED_MOB_PRESETS[variant.presetId]?.textureSrc).toBe(variant.coatTextureSrc);
    }
  });
});
