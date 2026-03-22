import type { Ray } from "three";
import {
  getFurnitureDefinition,
  getSurfaceRotationY,
  type FurniturePlacementSurface,
  type FurnitureType
} from "../../lib/furnitureRegistry";
import type { RoomFurniturePlacement, Vector3Tuple } from "../../lib/roomState";
import {
  clampSurfaceOffsetToHost,
  findBestSurfaceHostForWorldPoint,
  findBestSurfaceHostFromRay,
  getSurfaceHosts,
  getSurfaceWorldPosition,
  type SurfaceLocalOffset
} from "../../lib/surfaceDecor";
import {
  BACK_WALL_SURFACE_Z,
  LEFT_WALL_SURFACE_X,
  backWallDragPlane,
  dragPlaneHitPoint,
  floorDragPlane,
  leftWallDragPlane
} from "./constants";
import {
  clampFurnitureToFloor,
  clampWallAxis,
  clampWallHeight,
  getEffectiveHalfSizes,
  snapToBlockCenter
} from "./helpers";

export type PlacementTransform = Pick<
  RoomFurniturePlacement,
  "position" | "rotationY" | "surface" | "anchorFurnitureId" | "surfaceLocalOffset"
>;

export type DragPlacementState = {
  furnitureId: string;
  type: FurnitureType;
  surface: FurniturePlacementSurface;
  rotationY: number;
  anchorFurnitureId?: string;
};

export function getEditableSurfaceHosts(
  furniture: RoomFurniturePlacement[],
  excludedFurnitureId?: string
): RoomFurniturePlacement[] {
  return getSurfaceHosts(furniture.filter((item) => item.id !== excludedFurnitureId));
}

export function resolveSurfacePlacementOnHost(
  host: RoomFurniturePlacement,
  furnitureType: FurnitureType,
  localOffset: SurfaceLocalOffset,
  itemRotationY: number,
  gridSnapEnabled: boolean
): PlacementTransform | null {
  const clampedOffset = clampSurfaceOffsetToHost(
    host,
    furnitureType,
    localOffset,
    itemRotationY,
    gridSnapEnabled
  );

  if (!clampedOffset) {
    return null;
  }

  const worldPosition = getSurfaceWorldPosition(host, clampedOffset);

  if (!worldPosition) {
    return null;
  }

  return {
    position: worldPosition,
    rotationY: getSurfaceRotationY(furnitureType, "surface"),
    surface: "surface",
    anchorFurnitureId: host.id,
    surfaceLocalOffset: clampedOffset
  };
}

export function resolveSurfacePlacementFromWorldPoint(
  worldX: number,
  worldZ: number,
  furnitureType: FurnitureType,
  itemRotationY: number,
  furniture: RoomFurniturePlacement[],
  gridSnapEnabled: boolean,
  preferredHostId?: string | null,
  excludedFurnitureId?: string
): PlacementTransform | null {
  const hostCandidate = findBestSurfaceHostForWorldPoint(
    getEditableSurfaceHosts(furniture, excludedFurnitureId),
    furnitureType,
    itemRotationY,
    worldX,
    worldZ,
    gridSnapEnabled,
    preferredHostId
  );

  if (!hostCandidate) {
    return null;
  }

  return resolveSurfacePlacementOnHost(
    hostCandidate.host,
    furnitureType,
    hostCandidate.localOffset,
    itemRotationY,
    gridSnapEnabled
  );
}

export function resolvePlacementFromDragRay(
  ray: Ray,
  dragState: DragPlacementState,
  furniture: RoomFurniturePlacement[],
  gridSnapEnabled: boolean
): PlacementTransform | null {
  if (dragState.surface === "surface") {
    const hostCandidate = findBestSurfaceHostFromRay(
      getEditableSurfaceHosts(furniture, dragState.furnitureId),
      dragState.type,
      dragState.rotationY,
      [ray.origin.x, ray.origin.y, ray.origin.z],
      [ray.direction.x, ray.direction.y, ray.direction.z],
      gridSnapEnabled,
      dragState.anchorFurnitureId ?? null
    );

    if (!hostCandidate) {
      return null;
    }

    return resolveSurfacePlacementOnHost(
      hostCandidate.host,
      dragState.type,
      hostCandidate.localOffset,
      dragState.rotationY,
      gridSnapEnabled
    );
  }

  const dragPlane =
    dragState.surface === "floor"
      ? floorDragPlane
      : dragState.surface === "wall_back"
        ? backWallDragPlane
        : leftWallDragPlane;

  if (!ray.intersectPlane(dragPlane, dragPlaneHitPoint)) {
    return null;
  }

  if (dragState.surface === "floor") {
    return resolveFloorPlacement(
      dragPlaneHitPoint.x,
      dragPlaneHitPoint.z,
      dragState.type,
      gridSnapEnabled,
      dragState.rotationY
    );
  }

  if (dragState.surface === "wall_back") {
    return resolveWallPlacement(
      "wall_back",
      dragPlaneHitPoint.x,
      dragPlaneHitPoint.y,
      dragState.type,
      gridSnapEnabled
    );
  }

  return resolveWallPlacement(
    "wall_left",
    dragPlaneHitPoint.z,
    dragPlaneHitPoint.y,
    dragState.type,
    gridSnapEnabled
  );
}

export function getPreferredWallSurface(
  targetPosition: Vector3Tuple
): FurniturePlacementSurface {
  const leftWallDistance = Math.abs(targetPosition[0] - LEFT_WALL_SURFACE_X);
  const backWallDistance = Math.abs(targetPosition[2] - BACK_WALL_SURFACE_Z);

  return leftWallDistance < backWallDistance ? "wall_left" : "wall_back";
}

export function resolveFloorPlacement(
  x: number,
  z: number,
  furnitureType: FurnitureType,
  gridSnapEnabled: boolean,
  currentRotationY?: number
): PlacementTransform {
  const rotationY =
    currentRotationY !== undefined
      ? currentRotationY
      : getSurfaceRotationY(furnitureType, "floor");
  const [effHalfWidth, effHalfDepth] = getEffectiveHalfSizes(
    furnitureType,
    rotationY
  );
  const nextX = gridSnapEnabled ? snapToBlockCenter(x) : x;
  const nextZ = gridSnapEnabled ? snapToBlockCenter(z) : z;

  return {
    position: [
      clampFurnitureToFloor(nextX, effHalfWidth),
      0,
      clampFurnitureToFloor(nextZ, effHalfDepth)
    ],
    rotationY,
    surface: "floor"
  };
}

export function resolveWallPlacement(
  surface: "wall_back" | "wall_left",
  horizontal: number,
  vertical: number,
  furnitureType: FurnitureType,
  gridSnapEnabled: boolean
): PlacementTransform {
  const definition = getFurnitureDefinition(furnitureType);
  const halfWidth = definition.footprintWidth / 2;
  const nextHorizontal = gridSnapEnabled
    ? snapToBlockCenter(horizontal)
    : horizontal;
  const nextVertical = definition.wallOpening?.fixedVertical
    ? definition.wallOpening.centerY
    : gridSnapEnabled
      ? snapToBlockCenter(vertical)
      : vertical;

  if (surface === "wall_back") {
    return {
      position: [
        clampWallAxis(nextHorizontal, halfWidth),
        definition.wallOpening?.fixedVertical
          ? nextVertical
          : clampWallHeight(nextVertical, definition.footprintDepth / 2),
        BACK_WALL_SURFACE_Z
      ],
      rotationY: getSurfaceRotationY(furnitureType, surface),
      surface
    };
  }

  return {
    position: [
      LEFT_WALL_SURFACE_X,
      definition.wallOpening?.fixedVertical
        ? nextVertical
        : clampWallHeight(nextVertical, definition.footprintDepth / 2),
      clampWallAxis(nextHorizontal, halfWidth)
    ],
    rotationY: getSurfaceRotationY(furnitureType, surface),
    surface
  };
}

export function resolveSpawnPosition(
  furnitureType: FurnitureType,
  surface: FurniturePlacementSurface,
  targetPosition: Vector3Tuple,
  offsetA: number,
  offsetB: number,
  furniture: RoomFurniturePlacement[],
  gridSnapEnabled: boolean
): PlacementTransform {
  if (surface === "surface") {
    return (
      resolveSurfacePlacementFromWorldPoint(
        targetPosition[0] + offsetA,
        targetPosition[2] + offsetB,
        furnitureType,
        getSurfaceRotationY(furnitureType, "surface"),
        furniture,
        gridSnapEnabled
      ) ?? {
        position: [targetPosition[0], 0.9, targetPosition[2]],
        rotationY: getSurfaceRotationY(furnitureType, "surface"),
        surface: "surface",
        anchorFurnitureId: undefined,
        surfaceLocalOffset: undefined
      }
    );
  }

  if (surface === "floor") {
    return resolveFloorPlacement(
      targetPosition[0] + offsetA,
      targetPosition[2] + offsetB,
      furnitureType,
      gridSnapEnabled
    );
  }

  if (surface === "wall_back") {
    return resolveWallPlacement(
      "wall_back",
      targetPosition[0] + offsetA,
      1.85 + offsetB * 0.35,
      furnitureType,
      gridSnapEnabled
    );
  }

  return resolveWallPlacement(
    "wall_left",
    targetPosition[2] + offsetA,
    1.85 + offsetB * 0.35,
    furnitureType,
    gridSnapEnabled
  );
}

export function resolveFurnitureRotation(
  angle: number,
  gridSnapEnabled: boolean
): number {
  const step = gridSnapEnabled ? Math.PI / 2 : Math.PI / 180;
  const snappedAngle = Math.round(angle / step) * step;

  return Math.atan2(Math.sin(snappedAngle), Math.cos(snappedAngle));
}

export function applyPlacementToItem(
  item: RoomFurniturePlacement,
  nextPlacement: PlacementTransform
): RoomFurniturePlacement {
  if (nextPlacement.surface === "floor" || nextPlacement.surface === "surface") {
    return {
      ...item,
      ...nextPlacement,
      rotationY: item.rotationY
    };
  }

  return {
    ...item,
    ...nextPlacement
  };
}
