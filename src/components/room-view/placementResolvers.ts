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
  CEILING_SURFACE_Y,
  FRONT_WALL_SURFACE_Z,
  HALF_FLOOR_SIZE,
  LEFT_WALL_SURFACE_X,
  RIGHT_WALL_SURFACE_X,
  backWallDragPlane,
  ceilingDragPlane,
  dragPlaneHitPoint,
  floorDragPlane,
  frontWallDragPlane,
  leftWallDragPlane,
  rightWallDragPlane
} from "./constants";
import {
  clampFurnitureToFloor,
  clampWallAxis,
  clampWallHeight,
  getEffectiveHalfSizes,
  getWallParallelCoordinate,
  isWallSurface,
  snapToBlockCenter,
  type WallSurface
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

  if (dragState.surface === "floor") {
    if (!ray.intersectPlane(floorDragPlane, dragPlaneHitPoint)) {
      return null;
    }

    return resolveFloorPlacement(
      dragPlaneHitPoint.x,
      dragPlaneHitPoint.z,
      dragState.type,
      gridSnapEnabled,
      dragState.rotationY
    );
  }

  if (dragState.surface === "ceiling") {
    if (!ray.intersectPlane(ceilingDragPlane, dragPlaneHitPoint)) {
      return null;
    }

    return resolveCeilingPlacement(
      dragPlaneHitPoint.x,
      dragPlaneHitPoint.z,
      dragState.type,
      gridSnapEnabled,
      dragState.rotationY
    );
  }

  if (!isWallSurface(dragState.surface)) {
    return null;
  }

  const resolvedWallDrag = resolveWallDragHit(ray, dragState.surface);

  if (!resolvedWallDrag) {
    return null;
  }

  return resolveWallPlacement(
    resolvedWallDrag.surface,
    resolvedWallDrag.horizontal,
    resolvedWallDrag.vertical,
    dragState.type,
    gridSnapEnabled
  );
}

export function getPreferredWallSurface(
  targetPosition: Vector3Tuple
): WallSurface {
  const distances: Array<{ surface: WallSurface; distance: number }> = [
    {
      surface: "wall_back",
      distance: Math.abs(targetPosition[2] - BACK_WALL_SURFACE_Z)
    },
    {
      surface: "wall_left",
      distance: Math.abs(targetPosition[0] - LEFT_WALL_SURFACE_X)
    },
    {
      surface: "wall_front",
      distance: Math.abs(targetPosition[2] - FRONT_WALL_SURFACE_Z)
    },
    {
      surface: "wall_right",
      distance: Math.abs(targetPosition[0] - RIGHT_WALL_SURFACE_X)
    }
  ];

  return distances.reduce((closest, candidate) =>
    candidate.distance < closest.distance ? candidate : closest
  ).surface;
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
  surface: WallSurface,
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

  if (surface === "wall_back" || surface === "wall_front") {
    return {
      position: [
        clampWallAxis(nextHorizontal, halfWidth),
        definition.wallOpening?.fixedVertical
          ? nextVertical
          : clampWallHeight(nextVertical, definition.footprintDepth / 2),
        surface === "wall_back" ? BACK_WALL_SURFACE_Z : FRONT_WALL_SURFACE_Z
      ],
      rotationY: getSurfaceRotationY(furnitureType, surface),
      surface
    };
  }

  return {
    position: [
      surface === "wall_left" ? LEFT_WALL_SURFACE_X : RIGHT_WALL_SURFACE_X,
      definition.wallOpening?.fixedVertical
        ? nextVertical
        : clampWallHeight(nextVertical, definition.footprintDepth / 2),
      clampWallAxis(nextHorizontal, halfWidth)
    ],
    rotationY: getSurfaceRotationY(furnitureType, surface),
    surface
  };
}

export function resolveCeilingPlacement(
  x: number,
  z: number,
  furnitureType: FurnitureType,
  gridSnapEnabled: boolean,
  currentRotationY?: number
): PlacementTransform {
  const rotationY =
    currentRotationY !== undefined
      ? currentRotationY
      : getSurfaceRotationY(furnitureType, "ceiling");
  const [effHalfWidth, effHalfDepth] = getEffectiveHalfSizes(
    furnitureType,
    rotationY
  );
  const nextX = gridSnapEnabled ? snapToBlockCenter(x) : x;
  const nextZ = gridSnapEnabled ? snapToBlockCenter(z) : z;

  return {
    position: [
      clampFurnitureToFloor(nextX, effHalfWidth),
      CEILING_SURFACE_Y,
      clampFurnitureToFloor(nextZ, effHalfDepth)
    ],
    rotationY,
    surface: "ceiling"
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

  if (surface === "ceiling") {
    return resolveCeilingPlacement(
      targetPosition[0] + offsetA,
      targetPosition[2] + offsetB,
      furnitureType,
      gridSnapEnabled
    );
  }

  if (isWallSurface(surface)) {
    return resolveWallPlacement(
      surface,
      surface === "wall_back" || surface === "wall_front"
        ? targetPosition[0] + offsetA
        : targetPosition[2] + offsetA,
      1.85 + offsetB * 0.35,
      furnitureType,
      gridSnapEnabled
    );
  }

  return resolveFloorPlacement(
    targetPosition[0] + offsetA,
    targetPosition[2] + offsetB,
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
  if (
    nextPlacement.surface === "floor" ||
    nextPlacement.surface === "surface" ||
    nextPlacement.surface === "ceiling"
  ) {
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

type ResolvedWallDragHit = {
  surface: WallSurface;
  horizontal: number;
  vertical: number;
};

function getWallDragPlane(surface: WallSurface) {
  switch (surface) {
    case "wall_back":
      return backWallDragPlane;
    case "wall_front":
      return frontWallDragPlane;
    case "wall_left":
      return leftWallDragPlane;
    case "wall_right":
      return rightWallDragPlane;
  }
}

function getAdjacentWallSurface(
  surface: WallSurface,
  horizontal: number
): WallSurface {
  if (surface === "wall_back" || surface === "wall_front") {
    return horizontal < -HALF_FLOOR_SIZE ? "wall_left" : "wall_right";
  }

  return horizontal < -HALF_FLOOR_SIZE ? "wall_back" : "wall_front";
}

function resolveWallDragHit(
  ray: Ray,
  surface: WallSurface,
  depth = 0
): ResolvedWallDragHit | null {
  if (depth > 4 || !ray.intersectPlane(getWallDragPlane(surface), dragPlaneHitPoint)) {
    return null;
  }

  const horizontal = getWallParallelCoordinate(surface, dragPlaneHitPoint);

  if (horizontal < -HALF_FLOOR_SIZE || horizontal > HALF_FLOOR_SIZE) {
    return resolveWallDragHit(
      ray,
      getAdjacentWallSurface(surface, horizontal),
      depth + 1
    );
  }

  return {
    surface,
    horizontal,
    vertical: dragPlaneHitPoint.y
  };
}
