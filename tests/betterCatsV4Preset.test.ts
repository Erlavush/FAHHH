import { describe, expect, it } from "vitest";
import betterCatsV4TabbyPreset from "../src/lib/mob-presets/better_cats_v4_tabby.json";
import { getMobRenderMode, type ImportedMobPreset } from "../src/lib/mobLab";

describe("betterCatsV4Tabby preset", () => {
  const preset = betterCatsV4TabbyPreset as unknown as ImportedMobPreset;

  it("uses the CEM render path with imported animation targets", () => {
    expect(getMobRenderMode(preset)).toBe("cem");
    expect(preset.cemModel?.animationProfile).toBe("minecraft_cat");
    expect(preset.cemModel?.animationNodes).toEqual({
      bodyId: "body",
      headId: "head",
      tailRootId: "tail",
      tailLowerId: "tail2",
      frontLeftLegId: "front_left_leg",
      frontRightLegId: "front_right_leg",
      rearLeftLegId: "back_left_leg",
      rearRightLegId: "back_right_leg"
    });
  });

  it("keeps the OptiFine texture overrides needed for eyes and whiskers", () => {
    const textureNodes = new Map(
      (preset.cemModel?.rootNodes ?? [])
        .flatMap(function flatten(node): Array<{ id: string; textureSrc?: string; emissiveTextureSrc?: string }> {
          return [
            { id: node.id, textureSrc: node.textureSrc, emissiveTextureSrc: node.emissiveTextureSrc },
            ...node.children.flatMap(flatten)
          ];
        })
        .map((node) => [node.id, node])
    );

    expect(textureNodes.get("eyes")?.textureSrc).toBe("/textures/optifine-bettercats-v4/cat_eyes.png");
    expect(textureNodes.get("eyes")?.emissiveTextureSrc).toBe("/textures/optifine-bettercats-v4/cat_eyes_e.png");
    expect(textureNodes.get("whiskers")?.textureSrc).toBe("/textures/optifine-bettercats-v4/whiskers.png");
  });
});
