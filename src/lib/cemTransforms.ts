import { Quaternion, Vector3 } from "three";
import type { CemBoxDefinition } from "./mobLab";
import type { Vector3Tuple } from "./roomState";

const DEG_TO_RAD = Math.PI / 180;

export function getCemAxisSigns(invertAxis = ""): Vector3Tuple {
  return [
    invertAxis.includes("x") ? -1 : 1,
    invertAxis.includes("y") ? -1 : 1,
    invertAxis.includes("z") ? -1 : 1
  ];
}

export function convertCemPosition(position: Vector3Tuple, invertAxis = ""): Vector3Tuple {
  const [signX, signY, signZ] = getCemAxisSigns(invertAxis);

  return [position[0] * signX, position[1] * signY, position[2] * signZ];
}

export function convertCemRotation(rotation: Vector3Tuple, invertAxis = ""): Vector3Tuple {
  const x = invertAxis.includes("x") ? -rotation[0] : rotation[0];
  const y = invertAxis.includes("y") ? -rotation[1] : rotation[1];
  const z = invertAxis.includes("z") ? -rotation[2] : rotation[2];

  return [x * DEG_TO_RAD, y * DEG_TO_RAD, z * DEG_TO_RAD];
}

export function convertModelDeltaToParentLocal(
  delta: Vector3Tuple,
  parentWorldQuaternion: Quaternion,
  actorWorldQuaternion: Quaternion
): Vector3Tuple {
  const deltaVector = new Vector3(delta[0], delta[1], delta[2]);
  const parentQuaternionInActorSpace = actorWorldQuaternion.clone().invert().multiply(parentWorldQuaternion.clone());

  deltaVector.applyQuaternion(parentQuaternionInActorSpace.invert());

  return [deltaVector.x, deltaVector.y, deltaVector.z];
}

export function getCemBoxGeometrySize(box: CemBoxDefinition): Vector3Tuple {
  const [, , , width, height, depth] = box.coordinates;
  const sizeAdd = box.sizeAdd ?? 0;

  return [
    Math.max(0.01, width + sizeAdd * 2),
    Math.max(0.01, height + sizeAdd * 2),
    Math.max(0.01, depth + sizeAdd * 2)
  ];
}

export function getCemBoxCenter(box: CemBoxDefinition, invertAxis = ""): Vector3Tuple {
  const [x, y, z, width, height, depth] = box.coordinates;
  const [signX, signY, signZ] = getCemAxisSigns(invertAxis);

  return [
    (x + width / 2) * signX,
    (y + height / 2) * signY,
    (z + depth / 2) * signZ
  ];
}
