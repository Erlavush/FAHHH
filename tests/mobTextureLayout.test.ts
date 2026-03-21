import { describe, expect, it } from "vitest";
import {
  createBoxFaceMap,
  createExplicitFaceMap,
  resolveTextureSize,
  scaleFaceMap,
  type TextureSize
} from "../src/lib/mobTextureLayout";

describe("mobTextureLayout", () => {
  it("keeps legacy behavior when no logical atlas size is provided", () => {
    const actualTextureSize: TextureSize = [128, 64];

    expect(resolveTextureSize(undefined, actualTextureSize)).toEqual(actualTextureSize);
  });

  it("scales cuboid UV rectangles from model atlas space into image pixel space", () => {
    const logicalTextureSize: TextureSize = [64, 32];
    const actualTextureSize: TextureSize = [128, 64];
    const faceMap = createBoxFaceMap(20, 0, 5, 5, 15, false);
    const scaledFaceMap = scaleFaceMap(faceMap, logicalTextureSize, actualTextureSize);

    expect(scaledFaceMap.front).toEqual({ x: 70, y: 30, width: 10, height: 10, flipX: undefined, flipY: undefined });
    expect(scaledFaceMap.top).toEqual({ x: 70, y: 0, width: 10, height: 30, flipX: undefined, flipY: undefined });
    expect(scaledFaceMap.right).toEqual({ x: 40, y: 30, width: 30, height: 10, flipX: undefined, flipY: undefined });
  });

  it("preserves same-size atlases without changing coordinates", () => {
    const logicalTextureSize: TextureSize = [64, 64];
    const actualTextureSize: TextureSize = [64, 64];
    const faceMap = createBoxFaceMap(0, 24, 2, 7, 2, true);

    expect(scaleFaceMap(faceMap, logicalTextureSize, actualTextureSize)).toEqual(faceMap);
  });

  it("supports explicit OptiFine per-face UV bounds and preserves flipped faces", () => {
    const faceMap = createExplicitFaceMap({
      right: [18, 35, 20, 43],
      left: [37, 34, 39, 42],
      top: [47, 30, 45, 28],
      bottom: [58, 48, 54, 48],
      front: [37, 26, 39, 34],
      back: [36, 18, 38, 26]
    });

    expect(faceMap).toEqual({
      right: { x: 18, y: 35, width: 2, height: 8, flipX: false, flipY: false },
      left: { x: 37, y: 34, width: 2, height: 8, flipX: false, flipY: false },
      top: { x: 45, y: 28, width: 2, height: 2, flipX: true, flipY: true },
      bottom: { x: 54, y: 48, width: 4, height: 1, flipX: true, flipY: false },
      front: { x: 37, y: 26, width: 2, height: 8, flipX: false, flipY: false },
      back: { x: 36, y: 18, width: 2, height: 8, flipX: false, flipY: false }
    });
  });
});
