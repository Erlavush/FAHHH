import {
  getFurnitureCollisionBoxes,
  getFurnitureDefinition,
  type FurnitureCollisionBox
} from "./furnitureRegistry";
import type { PersistedVector3 } from "./devLocalState";
import type { RoomFurniturePlacement } from "./roomState";

export type CollisionReason =
  | "furniture_overlap"
  | "player_overlap"
  | "unsupported_surface";

export type FurnitureCollisionFootprint = {
  width: number;
  depth: number;
};

/**
 * 3D Bounding Box (AABB)
 * min/max coordinates for X, Y, Z
 */
export type AABB = {
  min: [number, number, number];
  max: [number, number, number];
};

type FootprintRect = {
  centerX: number;
  centerZ: number;
  halfWidth: number;
  halfDepth: number;
  rotationY: number;
};

type SurfaceRect = {
  centerA: number;
  centerB: number;
  halfWidth: number;
  halfHeight: number;
};

type Axis2D = {
  x: number;
  z: number;
};

const PLAYER_OCCUPANCY_FOOTPRINT: FurnitureCollisionFootprint = {
  width: 0.72,
  depth: 0.72
};

function createFootprintRect(
  position: [number, number, number],
  rotationY: number,
  footprint: FurnitureCollisionFootprint
): FootprintRect {
  return {
    centerX: position[0],
    centerZ: position[2],
    halfWidth: footprint.width / 2,
    halfDepth: footprint.depth / 2,
    rotationY
  };
}

function getRectAxes(rect: FootprintRect): Axis2D[] {
  const cos = Math.cos(rect.rotationY);
  const sin = Math.sin(rect.rotationY);

  return [
    { x: cos, z: -sin },
    { x: sin, z: cos }
  ];
}

function getRectCorners(rect: FootprintRect): Axis2D[] {
  const rightX = Math.cos(rect.rotationY);
  const rightZ = -Math.sin(rect.rotationY);
  const forwardX = Math.sin(rect.rotationY);
  const forwardZ = Math.cos(rect.rotationY);

  const halfWidthX = rightX * rect.halfWidth;
  const halfWidthZ = rightZ * rect.halfWidth;
  const halfDepthX = forwardX * rect.halfDepth;
  const halfDepthZ = forwardZ * rect.halfDepth;

  return [
    {
      x: rect.centerX - halfWidthX - halfDepthX,
      z: rect.centerZ - halfWidthZ - halfDepthZ
    },
    {
      x: rect.centerX + halfWidthX - halfDepthX,
      z: rect.centerZ + halfWidthZ - halfDepthZ
    },
    {
      x: rect.centerX + halfWidthX + halfDepthX,
      z: rect.centerZ + halfWidthZ + halfDepthZ
    },
    {
      x: rect.centerX - halfWidthX + halfDepthX,
      z: rect.centerZ - halfWidthZ + halfDepthZ
    }
  ];
}

function projectRectToAxis(rect: FootprintRect, axis: Axis2D): [number, number] {
  const corners = getRectCorners(rect);
  let min = Infinity;
  let max = -Infinity;

  corners.forEach((corner) => {
    const projection = corner.x * axis.x + corner.z * axis.z;
    min = Math.min(min, projection);
    max = Math.max(max, projection);
  });

  return [min, max];
}

function rangesOverlap(first: [number, number], second: [number, number]): boolean {
  const epsilon = 0.0001;
  return first[0] < second[1] - epsilon && second[0] < first[1] - epsilon;
}

function rectanglesOverlap(first: FootprintRect, second: FootprintRect): boolean {
  const axes = [...getRectAxes(first), ...getRectAxes(second)];

  return axes.every((axis) =>
    rangesOverlap(projectRectToAxis(first, axis), projectRectToAxis(second, axis))
  );
}

function createSurfaceRect(
  centerA: number,
  centerB: number,
  width: number,
  height: number
): SurfaceRect {
  return {
    centerA,
    centerB,
    halfWidth: width / 2,
    halfHeight: height / 2
  };
}

function surfaceRectanglesOverlap(first: SurfaceRect, second: SurfaceRect): boolean {
  const epsilon = 0.0001;
  return (
    Math.abs(first.centerA - second.centerA) < first.halfWidth + second.halfWidth - epsilon &&
    Math.abs(first.centerB - second.centerB) < first.halfHeight + second.halfHeight - epsilon
  );
}

function rotateLocalPoint(x: number, z: number, rotationY: number): [number, number] {
  const cos = Math.cos(rotationY);
  const sin = Math.sin(rotationY);

  return [x * cos + z * sin, z * cos - x * sin];
}

function createAABBFromLocalCollisionBox(
  placement: RoomFurniturePlacement,
  collisionBox: FurnitureCollisionBox
): AABB {
  const [centerX, centerY, centerZ] = collisionBox.center;
  const [sizeX, sizeY, sizeZ] = collisionBox.size;
  const halfX = sizeX / 2;
  const halfY = sizeY / 2;
  const halfZ = sizeZ / 2;
  const corners: [number, number][] = [
    [centerX - halfX, centerZ - halfZ],
    [centerX + halfX, centerZ - halfZ],
    [centerX + halfX, centerZ + halfZ],
    [centerX - halfX, centerZ + halfZ]
  ];

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  corners.forEach(([localX, localZ]) => {
    const [rotatedX, rotatedZ] = rotateLocalPoint(localX, localZ, placement.rotationY);
    const worldX = placement.position[0] + rotatedX;
    const worldZ = placement.position[2] + rotatedZ;

    minX = Math.min(minX, worldX);
    maxX = Math.max(maxX, worldX);
    minZ = Math.min(minZ, worldZ);
    maxZ = Math.max(maxZ, worldZ);
  });

  return {
    min: [minX, placement.position[1] + centerY - halfY, minZ],
    max: [maxX, placement.position[1] + centerY + halfY, maxZ]
  };
}

export function getFurnitureFootprintRect(placement: RoomFurniturePlacement): FootprintRect {
  const definition = getFurnitureDefinition(placement.type);

  return createFootprintRect(placement.position, placement.rotationY, {
    width: definition.footprintWidth,
    depth: definition.footprintDepth
  });
}

/**
 * Gets one or more authored 3D bounding boxes for a furniture placement.
 * Floor furniture uses explicit local collision boxes authored in the registry.
 */
export function getFurnitureAABBs(placement: RoomFurniturePlacement): AABB[] {
  const definition = getFurnitureDefinition(placement.type);
  const authoredBoxes = getFurnitureCollisionBoxes(placement.type);

  if (authoredBoxes.length > 0) {
    return authoredBoxes.map((collisionBox) => createAABBFromLocalCollisionBox(placement, collisionBox));
  }

  const pos = placement.position;
  const height = definition.supportSurface?.height ?? 1.0;
  const isRotated = Math.abs(Math.cos(placement.rotationY)) < 0.5;
  const effectiveWidth = isRotated ? definition.footprintDepth : definition.footprintWidth;
  const effectiveDepth = isRotated ? definition.footprintWidth : definition.footprintDepth;
  const halfWidth = effectiveWidth / 2;
  const halfDepth = effectiveDepth / 2;

  return [{
    min: [pos[0] - halfWidth, pos[1], pos[2] - halfDepth],
    max: [pos[0] + halfWidth, pos[1] + height, pos[2] + halfDepth]
  }];
}

export function aabbsOverlap(a: AABB, b: AABB): boolean {
  const epsilon = 0.0001;
  return (
    a.min[0] <= b.max[0] - epsilon &&
    a.max[0] >= b.min[0] + epsilon &&
    a.min[1] <= b.max[1] - epsilon &&
    a.max[1] >= b.min[1] + epsilon &&
    a.min[2] <= b.max[2] - epsilon &&
    a.max[2] >= b.min[2] + epsilon
  );
}

export function getPlayerOccupancyRect(position: PersistedVector3): FootprintRect {
  return createFootprintRect(position, 0, PLAYER_OCCUPANCY_FOOTPRINT);
}

export function getPlayerAABB(position: PersistedVector3): AABB {
  return {
    min: [position[0] - 0.3, position[1], position[2] - 0.3],
    max: [position[0] + 0.3, position[1] + 1.8, position[2] + 0.3]
  };
}

function getWallSurfaceRect(placement: RoomFurniturePlacement): SurfaceRect {
  const definition = getFurnitureDefinition(placement.type);

  if (placement.surface === "wall_left" || placement.surface === "wall_right") {
    return createSurfaceRect(
      placement.position[2],
      placement.position[1],
      definition.footprintWidth,
      definition.footprintDepth
    );
  }

  return createSurfaceRect(
    placement.position[0],
    placement.position[1],
    definition.footprintWidth,
    definition.footprintDepth
  );
}

export function getFurnitureCollisionReason(
  selectedFurniture: RoomFurniturePlacement,
  otherFurniture: RoomFurniturePlacement[],
  playerPosition: PersistedVector3
): CollisionReason | null {
  const selectedDefinition = getFurnitureDefinition(selectedFurniture.type);
  const selectedIsRug = selectedFurniture.type === "rug";

  if (selectedDefinition.surface === "surface") {
    if (!selectedFurniture.anchorFurnitureId || !selectedFurniture.surfaceLocalOffset) {
      return "unsupported_surface";
    }

    const selectedRect = getFurnitureFootprintRect(selectedFurniture);

    if (
      otherFurniture.some((placement) => {
        const otherDefinition = getFurnitureDefinition(placement.type);

        return (
          otherDefinition.surface === "surface" &&
          placement.anchorFurnitureId === selectedFurniture.anchorFurnitureId &&
          rectanglesOverlap(selectedRect, getFurnitureFootprintRect(placement))
        );
      })
    ) {
      return "furniture_overlap";
    }

    return null;
  }

  if (selectedDefinition.surface === "wall") {
    const selectedRect = getWallSurfaceRect(selectedFurniture);

    if (
      otherFurniture.some((placement) => {
        const otherDefinition = getFurnitureDefinition(placement.type);

        return (
          otherDefinition.surface === "wall" &&
          placement.surface === selectedFurniture.surface &&
          surfaceRectanglesOverlap(selectedRect, getWallSurfaceRect(placement))
        );
      })
    ) {
      return "furniture_overlap";
    }

    return null;
  }

  const selectedRect = getFurnitureFootprintRect(selectedFurniture);
  const selectedAABBs = getFurnitureAABBs(selectedFurniture);
  const playerAABB = getPlayerAABB(playerPosition);

  if (
    otherFurniture.some((placement) => {
      const otherDefinition = getFurnitureDefinition(placement.type);

      if (otherDefinition.surface !== "floor") return false;
      if (selectedIsRug && placement.type !== "rug") return false;
      if (!selectedIsRug && placement.type === "rug") return false;

      return rectanglesOverlap(selectedRect, getFurnitureFootprintRect(placement));
    })
  ) {
    return "furniture_overlap";
  }

  if (!selectedIsRug) {
    const overlapsPlayer = selectedAABBs.some((selectedAABB) => aabbsOverlap(selectedAABB, playerAABB));
    if (overlapsPlayer) {
      return "player_overlap";
    }
  }

  return null;
}

