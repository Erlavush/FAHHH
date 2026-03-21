import { describe, expect, it } from "vitest";
import {
  ALL_FURNITURE_TYPES,
  FURNITURE_REGISTRY,
  getFurnitureCollisionBoxes
} from "../src/lib/furnitureRegistry";

describe("furniture registry", () => {
  it("provides a static shop preview image for every furniture item", () => {
    expect(
      ALL_FURNITURE_TYPES.every((type) => {
        const previewSrc = FURNITURE_REGISTRY[type].shopPreviewSrc;

        return (
          previewSrc.startsWith("/shop-previews/") &&
          /\.(png|svg|webp)$/i.test(previewSrc)
        );
      })
    ).toBe(true);
  });

  it("provides a short shop description for every furniture item", () => {
    expect(
      ALL_FURNITURE_TYPES.every((type) => FURNITURE_REGISTRY[type].shortDescription.trim().length > 0)
    ).toBe(true);
  });

  it("defines opening and sunlight metadata for the tall window", () => {
    expect(FURNITURE_REGISTRY.window.wallOpening).toEqual(
      expect.objectContaining({
        width: expect.any(Number),
        height: expect.any(Number),
        centerY: expect.any(Number),
        fixedVertical: true
      })
    );
    expect(FURNITURE_REGISTRY.window.sunlightPatch).toEqual(
      expect.objectContaining({
        width: expect.any(Number),
        depth: expect.any(Number),
        offsetFromWall: expect.any(Number)
      })
    );
  });

  it("defines authored collision boxes for every floor furniture item", () => {
    const floorTypes = ALL_FURNITURE_TYPES.filter(
      (type) => FURNITURE_REGISTRY[type].surface === "floor"
    );

    expect(floorTypes.every((type) => getFurnitureCollisionBoxes(type).length > 0)).toBe(true);
  });
});
