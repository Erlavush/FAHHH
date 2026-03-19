import {
  getFurnitureDefinition,
  type FurnitureInteractionType,
  type FurnitureType
} from "./furnitureRegistry";
import type { RoomFurniturePlacement, Vector3Tuple } from "./roomState";

export interface FurnitureInteractionTarget {
  type: FurnitureInteractionType;
  furnitureId: string;
  furnitureLabel: string;
  position: Vector3Tuple;
  rotationY: number;
  chairFurnitureId?: string;
}

const DESK_USE_ZONE_HALF_SIZE = 0.5;
const DEFAULT_DESK_USE_ZONE_OFFSET: Vector3Tuple = [0, 0, 1];
const DESK_CHAIR_TYPES = new Set<FurnitureType>(["chair", "office_chair"]);

function normalizeAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
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

function rotateWorldOffsetToLocal(
  offset: Vector3Tuple,
  rotationY: number
): Vector3Tuple {
  const [worldX, worldY, worldZ] = offset;
  const cos = Math.cos(rotationY);
  const sin = Math.sin(rotationY);

  return [
    worldX * cos - worldZ * sin,
    worldY,
    worldX * sin + worldZ * cos
  ];
}

function getDeskUseZoneCenter(desk: RoomFurniturePlacement): Vector3Tuple {
  const deskDefinition = getFurnitureDefinition(desk.type);
  const localZoneOffset = deskDefinition.interactionOffset ?? DEFAULT_DESK_USE_ZONE_OFFSET;
  const rotatedOffset = rotateLocalOffset(localZoneOffset, desk.rotationY);

  return [
    desk.position[0] + rotatedOffset[0],
    desk.position[1] + rotatedOffset[1],
    desk.position[2] + rotatedOffset[2]
  ];
}

function chairOverlapsDeskUseZone(
  desk: RoomFurniturePlacement,
  chair: RoomFurniturePlacement
): boolean {
  const zoneCenter = getDeskUseZoneCenter(desk);
  const chairDefinition = getFurnitureDefinition(chair.type);
  const relative = rotateWorldOffsetToLocal(
    [
      chair.position[0] - zoneCenter[0],
      0,
      chair.position[2] - zoneCenter[2]
    ],
    desk.rotationY
  );

  return (
    Math.abs(relative[0]) < DESK_USE_ZONE_HALF_SIZE + chairDefinition.footprintWidth / 2 &&
    Math.abs(relative[2]) < DESK_USE_ZONE_HALF_SIZE + chairDefinition.footprintDepth / 2
  );
}

function getDeskUseTarget(
  desk: RoomFurniturePlacement,
  furniturePlacements: RoomFurniturePlacement[]
): FurnitureInteractionTarget | null {
  const zoneCenter = getDeskUseZoneCenter(desk);
  const deskDefinition = getFurnitureDefinition(desk.type);
  const localZoneOffset = deskDefinition.interactionOffset ?? DEFAULT_DESK_USE_ZONE_OFFSET;
  const chosenChair =
    furniturePlacements
      .filter(
        (placement) =>
          placement.id !== desk.id &&
          placement.surface === "floor" &&
          DESK_CHAIR_TYPES.has(placement.type) &&
          chairOverlapsDeskUseZone(desk, placement)
      )
      .sort((first, second) => {
        const firstDistance =
          Math.hypot(first.position[0] - zoneCenter[0], first.position[2] - zoneCenter[2]);
        const secondDistance =
          Math.hypot(second.position[0] - zoneCenter[0], second.position[2] - zoneCenter[2]);

        return firstDistance - secondDistance;
      })[0] ?? null;

  if (!chosenChair) {
    return null;
  }

  const chairDefinition = getFurnitureDefinition(chosenChair.type);
  const useRotationY = normalizeAngle(
    desk.rotationY + Math.atan2(-localZoneOffset[0], -localZoneOffset[2])
  );
  const seatYOffset = chairDefinition.interactionOffset?.[1] ?? 0;
  const seatForwardOffset = Math.abs(chairDefinition.interactionOffset?.[2] ?? 0.06);
  const rotatedSeatOffset = rotateLocalOffset([0, seatYOffset, seatForwardOffset], useRotationY);

  return {
    type: "use_pc",
    furnitureId: desk.id,
    furnitureLabel: desk.type === "office_desk" ? "Using Office Desk + PC" : "Using Desk + PC",
    position: [
      chosenChair.position[0] + rotatedSeatOffset[0],
      chosenChair.position[1] + rotatedSeatOffset[1],
      chosenChair.position[2] + rotatedSeatOffset[2]
    ],
    rotationY: useRotationY,
    chairFurnitureId: chosenChair.id
  };
}

export function getFurnitureInteractionTarget(
  placement: RoomFurniturePlacement,
  furniturePlacements: RoomFurniturePlacement[] = [placement]
): FurnitureInteractionTarget | null {
  const definition = getFurnitureDefinition(placement.type);

  if (!definition.interactionType) {
    return null;
  }

  if (definition.interactionType === "use_pc") {
    return getDeskUseTarget(placement, furniturePlacements);
  }

  if (!definition.interactionOffset) {
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
