import { getFurnitureDefinition, type FurnitureInteractionType } from "./furnitureRegistry";
import type { RoomFurniturePlacement, Vector3Tuple } from "./roomState";

export interface FurnitureInteractionTarget {
  type: FurnitureInteractionType;
  furnitureId: string;
  furnitureLabel: string;
  position: Vector3Tuple;
  rotationY: number;
}

function rotateLocalOffset(
  offset: Vector3Tuple,
  rotationY: number
): Vector3Tuple {
  const [localX, localY, localZ] = offset;
  const cos = Math.cos(rotationY);
  const sin = Math.sin(rotationY);

  return [
    localX * cos + localZ * sin,
    localY,
    localZ * cos - localX * sin
  ];
}

export function getFurnitureInteractionTarget(
  placement: RoomFurniturePlacement
): FurnitureInteractionTarget | null {
  const definition = getFurnitureDefinition(placement.type);

  if (!definition.interactionType || !definition.interactionOffset) {
    return null;
  }

  const rotatedOffset = rotateLocalOffset(definition.interactionOffset, placement.rotationY);

  return {
    type: definition.interactionType,
    furnitureId: placement.id,
    furnitureLabel: definition.label,
    position: [
      placement.position[0] + rotatedOffset[0],
      placement.position[1] + rotatedOffset[1],
      placement.position[2] + rotatedOffset[2]
    ],
    rotationY: placement.rotationY
  };
}
