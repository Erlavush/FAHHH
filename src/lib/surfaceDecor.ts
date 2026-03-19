import { getFurnitureDefinition, type FurnitureType } from "./furnitureRegistry";
import type { RoomFurniturePlacement, Vector3Tuple } from "./roomState";

export type SurfaceLocalOffset = [number, number];

export type SurfaceHostCandidate = {
  host: RoomFurniturePlacement;
  localOffset: SurfaceLocalOffset;
  position: Vector3Tuple;
  distanceScore: number;
  rayDistance?: number;
};

export const SURFACE_DECOR_SNAP_STEP = 0.5;

function rotateLocalToWorld(
  localX: number,
  localZ: number,
  rotationY: number
): [number, number] {
  const cos = Math.cos(rotationY);
  const sin = Math.sin(rotationY);

  return [localX * cos + localZ * sin, localZ * cos - localX * sin];
}

function rotateWorldToLocal(
  worldX: number,
  worldZ: number,
  rotationY: number
): [number, number] {
  const cos = Math.cos(rotationY);
  const sin = Math.sin(rotationY);

  return [worldX * cos - worldZ * sin, worldX * sin + worldZ * cos];
}

function snapSurfaceValue(value: number, gridSnapEnabled: boolean): number {
  if (!gridSnapEnabled) {
    return value;
  }

  return Math.round((value - 0.25) / SURFACE_DECOR_SNAP_STEP) * SURFACE_DECOR_SNAP_STEP + 0.25;
}

export function canHostSurfaceDecor(placement: RoomFurniturePlacement): boolean {
  return (
    placement.surface === "floor" &&
    getFurnitureDefinition(placement.type).supportSurface !== undefined
  );
}

export function getSurfaceHosts(
  placements: RoomFurniturePlacement[]
): RoomFurniturePlacement[] {
  return placements.filter(canHostSurfaceDecor);
}

export function getSupportTopY(host: RoomFurniturePlacement): number | null {
  const supportSurface = getFurnitureDefinition(host.type).supportSurface;

  if (!supportSurface) {
    return null;
  }

  return host.position[1] + supportSurface.height;
}

export function getSurfaceWorldPosition(
  host: RoomFurniturePlacement,
  localOffset: SurfaceLocalOffset
): Vector3Tuple | null {
  const definition = getFurnitureDefinition(host.type);
  const supportSurface = definition.supportSurface;

  if (!supportSurface) {
    return null;
  }

  const [supportOffsetX, supportOffsetZ] = rotateLocalToWorld(
    supportSurface.offsetX ?? 0,
    supportSurface.offsetZ ?? 0,
    host.rotationY
  );
  const [worldOffsetX, worldOffsetZ] = rotateLocalToWorld(
    localOffset[0],
    localOffset[1],
    host.rotationY
  );

  return [
    host.position[0] + supportOffsetX + worldOffsetX,
    host.position[1] + supportSurface.height,
    host.position[2] + supportOffsetZ + worldOffsetZ
  ];
}

export function getSurfaceLocalOffsetFromWorld(
  host: RoomFurniturePlacement,
  worldPosition: Vector3Tuple
): SurfaceLocalOffset | null {
  const definition = getFurnitureDefinition(host.type);
  const supportSurface = definition.supportSurface;

  if (!supportSurface) {
    return null;
  }

  const [supportOffsetX, supportOffsetZ] = rotateLocalToWorld(
    supportSurface.offsetX ?? 0,
    supportSurface.offsetZ ?? 0,
    host.rotationY
  );
  const [localX, localZ] = rotateWorldToLocal(
    worldPosition[0] - host.position[0] - supportOffsetX,
    worldPosition[2] - host.position[2] - supportOffsetZ,
    host.rotationY
  );

  return [localX, localZ];
}

export function getSurfaceHalfExtentsForItem(
  furnitureType: FurnitureType,
  itemRotationY: number,
  hostRotationY: number
): SurfaceLocalOffset {
  const definition = getFurnitureDefinition(furnitureType);
  const halfWidth = definition.footprintWidth / 2;
  const halfDepth = definition.footprintDepth / 2;
  const relativeRotation = itemRotationY - hostRotationY;
  const cos = Math.cos(relativeRotation);
  const sin = Math.sin(relativeRotation);

  return [
    Math.abs(cos) * halfWidth + Math.abs(sin) * halfDepth,
    Math.abs(sin) * halfWidth + Math.abs(cos) * halfDepth
  ];
}

export function clampSurfaceOffsetToHost(
  host: RoomFurniturePlacement,
  furnitureType: FurnitureType,
  localOffset: SurfaceLocalOffset,
  itemRotationY: number,
  gridSnapEnabled: boolean
): SurfaceLocalOffset | null {
  const definition = getFurnitureDefinition(host.type);
  const supportSurface = definition.supportSurface;

  if (!supportSurface) {
    return null;
  }

  const [halfWidth, halfDepth] = getSurfaceHalfExtentsForItem(
    furnitureType,
    itemRotationY,
    host.rotationY
  );
  const maxX = Math.max(0, supportSurface.width / 2 - halfWidth);
  const maxZ = Math.max(0, supportSurface.depth / 2 - halfDepth);
  const snappedX = snapSurfaceValue(localOffset[0], gridSnapEnabled);
  const snappedZ = snapSurfaceValue(localOffset[1], gridSnapEnabled);

  return [
    Math.min(maxX, Math.max(-maxX, snappedX)),
    Math.min(maxZ, Math.max(-maxZ, snappedZ))
  ];
}

function createSurfaceHostCandidate(
  host: RoomFurniturePlacement,
  furnitureType: FurnitureType,
  itemRotationY: number,
  localOffset: SurfaceLocalOffset,
  outsideDistance: number,
  gridSnapEnabled: boolean,
  rayDistance?: number
): SurfaceHostCandidate | null {
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
    host,
    localOffset: clampedOffset,
    position: worldPosition,
    distanceScore: outsideDistance,
    rayDistance
  };
}

export function findBestSurfaceHostForWorldPoint(
  hosts: RoomFurniturePlacement[],
  furnitureType: FurnitureType,
  itemRotationY: number,
  worldX: number,
  worldZ: number,
  gridSnapEnabled: boolean,
  preferredHostId?: string | null
): SurfaceHostCandidate | null {
  const candidates = hosts
    .map((host) => {
      const localOffset = getSurfaceLocalOffsetFromWorld(host, [worldX, 0, worldZ]);

      if (!localOffset) {
        return null;
      }

      const definition = getFurnitureDefinition(host.type);
      const supportSurface = definition.supportSurface;

      if (!supportSurface) {
        return null;
      }

      const [halfWidth, halfDepth] = getSurfaceHalfExtentsForItem(
        furnitureType,
        itemRotationY,
        host.rotationY
      );
      const maxX = Math.max(0, supportSurface.width / 2 - halfWidth);
      const maxZ = Math.max(0, supportSurface.depth / 2 - halfDepth);
      const outsideX = Math.max(Math.abs(localOffset[0]) - maxX, 0);
      const outsideZ = Math.max(Math.abs(localOffset[1]) - maxZ, 0);
      const outsideDistance = Math.hypot(outsideX, outsideZ);

      return createSurfaceHostCandidate(
        host,
        furnitureType,
        itemRotationY,
        localOffset,
        outsideDistance,
        gridSnapEnabled
      );
    })
    .filter((candidate): candidate is SurfaceHostCandidate => candidate !== null)
    .sort((first, second) => {
      if (Math.abs(first.distanceScore - second.distanceScore) > 0.0001) {
        return first.distanceScore - second.distanceScore;
      }

      if (preferredHostId) {
        if (first.host.id === preferredHostId && second.host.id !== preferredHostId) {
          return -1;
        }

        if (second.host.id === preferredHostId && first.host.id !== preferredHostId) {
          return 1;
        }
      }

      const firstTopY = getSupportTopY(first.host) ?? 0;
      const secondTopY = getSupportTopY(second.host) ?? 0;

      return secondTopY - firstTopY;
    });

  return candidates[0] ?? null;
}

export function findBestSurfaceHostFromRay(
  hosts: RoomFurniturePlacement[],
  furnitureType: FurnitureType,
  itemRotationY: number,
  rayOrigin: Vector3Tuple,
  rayDirection: Vector3Tuple,
  gridSnapEnabled: boolean,
  preferredHostId?: string | null
): SurfaceHostCandidate | null {
  const candidates = hosts
    .map((host) => {
      const topY = getSupportTopY(host);

      if (topY === null || Math.abs(rayDirection[1]) < 0.0001) {
        return null;
      }

      const rayDistance = (topY - rayOrigin[1]) / rayDirection[1];

      if (rayDistance < 0) {
        return null;
      }

      const worldX = rayOrigin[0] + rayDirection[0] * rayDistance;
      const worldZ = rayOrigin[2] + rayDirection[2] * rayDistance;
      const localOffset = getSurfaceLocalOffsetFromWorld(host, [worldX, 0, worldZ]);

      if (!localOffset) {
        return null;
      }

      const definition = getFurnitureDefinition(host.type);
      const supportSurface = definition.supportSurface;

      if (!supportSurface) {
        return null;
      }

      const [halfWidth, halfDepth] = getSurfaceHalfExtentsForItem(
        furnitureType,
        itemRotationY,
        host.rotationY
      );
      const maxX = Math.max(0, supportSurface.width / 2 - halfWidth);
      const maxZ = Math.max(0, supportSurface.depth / 2 - halfDepth);
      const outsideX = Math.max(Math.abs(localOffset[0]) - maxX, 0);
      const outsideZ = Math.max(Math.abs(localOffset[1]) - maxZ, 0);
      const outsideDistance = Math.hypot(outsideX, outsideZ);

      return createSurfaceHostCandidate(
        host,
        furnitureType,
        itemRotationY,
        localOffset,
        outsideDistance,
        gridSnapEnabled,
        rayDistance
      );
    })
    .filter((candidate): candidate is SurfaceHostCandidate => candidate !== null)
    .sort((first, second) => {
      if (Math.abs(first.distanceScore - second.distanceScore) > 0.0001) {
        return first.distanceScore - second.distanceScore;
      }

      if (preferredHostId) {
        if (first.host.id === preferredHostId && second.host.id !== preferredHostId) {
          return -1;
        }

        if (second.host.id === preferredHostId && first.host.id !== preferredHostId) {
          return 1;
        }
      }

      return (first.rayDistance ?? Infinity) - (second.rayDistance ?? Infinity);
    });

  return candidates[0] ?? null;
}

export function syncAnchoredSurfaceDecor(
  placements: RoomFurniturePlacement[],
  previousHost: RoomFurniturePlacement,
  nextHost: RoomFurniturePlacement
): RoomFurniturePlacement[] {
  return placements.map((placement) => {
    if (
      placement.surface !== "surface" ||
      placement.anchorFurnitureId !== previousHost.id ||
      !placement.surfaceLocalOffset
    ) {
      return placement;
    }

    const worldPosition = getSurfaceWorldPosition(nextHost, placement.surfaceLocalOffset);

    if (!worldPosition) {
      return placement;
    }

    const relativeRotation = placement.rotationY - previousHost.rotationY;

    return {
      ...placement,
      position: worldPosition,
      rotationY: nextHost.rotationY + relativeRotation
    };
  });
}
