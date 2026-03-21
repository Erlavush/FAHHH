import { Quaternion, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import type { CemBoxDefinition } from "../src/lib/mobLab";
import {
  convertCemPosition,
  convertModelDeltaToParentLocal,
  getCemBoxCenter
} from "../src/lib/cemTransforms";

describe("cemTransforms", () => {
  it("inverts Y values when invertAxis includes y", () => {
    const bodyPosition = convertCemPosition([0, -12, 11], "xy");
    const legPosition = convertCemPosition([1.1, -9.9, 5], "xy");

    expect(bodyPosition[0]).toBeCloseTo(0);
    expect(bodyPosition.slice(1)).toEqual([12, 11]);
    expect(legPosition).toEqual([-1.1, 9.9, 5]);
  });

  it("applies invertAxis to box placement, not only node pivots", () => {
    const box: CemBoxDefinition = {
      coordinates: [1, 2, 3, 4, 6, 8],
      textureOrigin: [0, 0]
    };

    expect(getCemBoxCenter(box, "")).toEqual([3, 5, 7]);
    expect(getCemBoxCenter(box, "xy")).toEqual([-3, -5, 7]);
  });

  it("keeps model-space deltas stable when the actor turns", () => {
    const actorRotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
    const modelRotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI);
    const parentWorldQuaternion = actorRotation.clone().multiply(modelRotation);

    expect(
      convertModelDeltaToParentLocal([0, 4, 2], parentWorldQuaternion, actorRotation).map((value) =>
        Number(value.toFixed(4))
      )
    ).toEqual([0, 4, -2]);
  });
});
