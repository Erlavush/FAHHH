import {
  getFurnitureCollisionBoxes,
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
  approachPosition?: Vector3Tuple;
  rotationY: number;
  poseOffset?: Vector3Tuple;
  chairFurnitureId?: string;
  slotId?: string;
}

export interface FurnitureInteractionSelectionOptions {
  occupiedSlotIds?: Iterable<string> | null;
}

const DESK_USE_ZONE_HALF_SIZE = 0.5;
const DEFAULT_DESK_USE_ZONE_OFFSET: Vector3Tuple = [0, 0, 1];
const DESK_CHAIR_TYPES = new Set<FurnitureType>(["chair", "office_chair"]);
const SIT_APPROACH_DISTANCE = 0.55;
const USE_PC_APPROACH_DISTANCE = -0.65;
const LIE_APPROACH_BUFFER = 0.45;

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

function addOffset(position: Vector3Tuple, offset: Vector3Tuple): Vector3Tuple {
  return [
    position[0] + offset[0],
    position[1] + offset[1],
    position[2] + offset[2]
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
  const finalPosition: Vector3Tuple = [
    chosenChair.position[0] + rotatedSeatOffset[0],
    chosenChair.position[1] + rotatedSeatOffset[1],
    chosenChair.position[2] + rotatedSeatOffset[2]
  ];
  const approachPosition = addOffset(
    finalPosition,
    rotateLocalOffset([0, 0, USE_PC_APPROACH_DISTANCE], useRotationY)
  );

  return {
    type: "use_pc",
    furnitureId: desk.id,
    furnitureLabel: desk.type === "office_desk" ? "Using Office Desk + PC" : "Using Desk + PC",
    position: finalPosition,
    approachPosition,
    rotationY: useRotationY,
    chairFurnitureId: chosenChair.id
  };
}

function getDirectInteractionApproachPosition(
  placement: RoomFurniturePlacement,
  localOffset: Vector3Tuple,
  finalPosition: Vector3Tuple,
  interactionRotationY: number,
  interactionType: FurnitureInteractionType
): Vector3Tuple {
  if (interactionType === "sit") {
    return addOffset(
      finalPosition,
      rotateLocalOffset([0, 0, SIT_APPROACH_DISTANCE], interactionRotationY)
    );
  }

  const definition = getFurnitureDefinition(placement.type);
  const collisionBoxes = getFurnitureCollisionBoxes(placement.type);
  const fallbackHalfWidth = definition.footprintWidth / 2;
  const halfWidthFromCollision = collisionBoxes.reduce(
    (current, collisionBox) => Math.max(current, Math.abs(collisionBox.center[0]) + collisionBox.size[0] / 2),
    fallbackHalfWidth
  );
  const sideSign = localOffset[0] < 0 ? -1 : 1;
  const approachLocalOffset: Vector3Tuple = [
    sideSign * (halfWidthFromCollision + LIE_APPROACH_BUFFER),
    localOffset[1],
    localOffset[2]
  ];

  return addOffset(placement.position, rotateLocalOffset(approachLocalOffset, placement.rotationY));
}

function createDirectInteractionTarget(
  placement: RoomFurniturePlacement,
  localOffset: Vector3Tuple,
  poseOffset?: Vector3Tuple,
  slotId?: string
): FurnitureInteractionTarget {
  const definition = getFurnitureDefinition(placement.type);
  const rotatedOffset = rotateLocalOffset(localOffset, placement.rotationY);
  const interactionRotationY = normalizeAngle(
    placement.rotationY + (definition.interactionRotationOffsetY ?? 0)
  );
  const finalPosition: Vector3Tuple = [
    placement.position[0] + rotatedOffset[0],
    placement.position[1] + rotatedOffset[1],
    placement.position[2] + rotatedOffset[2]
  ];

  return {
    type: definition.interactionType!,
    furnitureId: placement.id,
    furnitureLabel: definition.label,
    position: finalPosition,
    approachPosition: getDirectInteractionApproachPosition(
      placement,
      localOffset,
      finalPosition,
      interactionRotationY,
      definition.interactionType!
    ),
    rotationY: interactionRotationY,
    poseOffset,
    slotId
  };
}

export function getFurnitureInteractionTargets(
  placement: RoomFurniturePlacement,
  furniturePlacements: RoomFurniturePlacement[] = [placement]
): FurnitureInteractionTarget[] {
  const definition = getFurnitureDefinition(placement.type);

  if (!definition.interactionType) {
    return [];
  }

  if (definition.interactionType === "use_pc") {
    const deskTarget = getDeskUseTarget(placement, furniturePlacements);
    return deskTarget ? [deskTarget] : [];
  }

  if (!definition.interactionOffset) {
    return [];
  }

  const primaryTarget = createDirectInteractionTarget(
    placement,
    definition.interactionOffset,
    definition.interactionPoseOffset,
    definition.interactionType === "lie" ? "primary" : undefined
  );
  const secondaryTarget = definition.interactionSecondaryOffset
    ? createDirectInteractionTarget(
        placement,
        definition.interactionSecondaryOffset,
        definition.interactionSecondaryPoseOffset ?? definition.interactionPoseOffset,
        definition.interactionType === "lie" ? "secondary" : undefined
      )
    : null;

  return secondaryTarget ? [primaryTarget, secondaryTarget] : [primaryTarget];
}

export function getFurnitureInteractionTarget(
  placement: RoomFurniturePlacement,
  furniturePlacements: RoomFurniturePlacement[] = [placement],
  options: FurnitureInteractionSelectionOptions = {}
): FurnitureInteractionTarget | null {
  const targets = getFurnitureInteractionTargets(placement, furniturePlacements);

  if (targets.length === 0) {
    return null;
  }

  if (
    getFurnitureDefinition(placement.type).interactionType === "lie" &&
    options.occupiedSlotIds
  ) {
    const occupiedSlotIds = new Set(options.occupiedSlotIds);
    return targets.find((target) => !target.slotId || !occupiedSlotIds.has(target.slotId)) ?? null;
  }

  return targets[0] ?? null;
}
