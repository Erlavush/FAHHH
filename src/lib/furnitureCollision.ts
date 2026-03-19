import type { PersistedVector3 } from "./devLocalState";
import { getFurnitureDefinition } from "./furnitureRegistry";
import type { RoomFurniturePlacement } from "./roomState";

export type CollisionReason =
  | "furniture_overlap"
  | "player_overlap"
  | "unsupported_surface";

export type FurnitureCollisionFootprint = {
  width: number;
  depth: number;
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

export function getFurnitureFootprintRect(placement: RoomFurniturePlacement): FootprintRect {
  const definition = getFurnitureDefinition(placement.type);

  return createFootprintRect(placement.position, placement.rotationY, {
    width: definition.footprintWidth,
    depth: definition.footprintDepth
  });
}

export function getPlayerOccupancyRect(position: PersistedVector3): FootprintRect {
  return createFootprintRect(position, 0, PLAYER_OCCUPANCY_FOOTPRINT);
}

function getWallSurfaceRect(placement: RoomFurniturePlacement): SurfaceRect {
  const definition = getFurnitureDefinition(placement.type);

  if (placement.surface === "wall_left") {
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

  if (
    otherFurniture.some((placement) => {
      const otherDefinition = getFurnitureDefinition(placement.type);

      return (
        otherDefinition.surface === "floor" &&
        !(selectedIsRug && placement.type !== "rug") &&
        !(!selectedIsRug && placement.type === "rug") &&
        rectanglesOverlap(selectedRect, getFurnitureFootprintRect(placement))
      );
    })
  ) {
    return "furniture_overlap";
  }

  if (!selectedIsRug && rectanglesOverlap(selectedRect, getPlayerOccupancyRect(playerPosition))) {
    return "player_overlap";
  }

  return null;
}
