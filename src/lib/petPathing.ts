import { getFurnitureDefinition } from "./furnitureRegistry";
import type { RoomFurniturePlacement, Vector3Tuple } from "./roomState";

export type PetObstacle = {
  x: number;
  z: number;
  radius: number;
};

const PET_ROOM_HALF_SIZE = 5;
const PET_ROOM_MARGIN = 0.75;
const PET_PLAYER_CLEARANCE = 0.8;

const PET_SPAWN_OFFSETS: Array<[number, number]> = [
  [1.1, 0],
  [-1.1, 0],
  [0, 1.1],
  [0, -1.1],
  [1.4, 1.1],
  [-1.4, 1.1],
  [1.4, -1.1],
  [-1.4, -1.1],
  [2, 0],
  [-2, 0]
];

export function clampPetAxis(value: number): number {
  const max = PET_ROOM_HALF_SIZE - PET_ROOM_MARGIN;
  return Math.min(max, Math.max(-max, value));
}

export function clampPetPositionToRoom(position: Vector3Tuple): Vector3Tuple {
  return [clampPetAxis(position[0]), 0, clampPetAxis(position[2])];
}

export function buildPetObstacles(furniture: RoomFurniturePlacement[]): PetObstacle[] {
  return furniture.flatMap((item) => {
    if (item.surface !== "floor" || item.type === "rug") {
      return [];
    }

    const definition = getFurnitureDefinition(item.type);
    return [{
      x: item.position[0],
      z: item.position[2],
      radius: Math.max(definition.footprintWidth, definition.footprintDepth) / 2 + 0.38
    }];
  });
}

export function pointIntersectsPetObstacle(
  x: number,
  z: number,
  obstacles: PetObstacle[],
  padding = 0
): boolean {
  return obstacles.some((obstacle) => {
    const dx = x - obstacle.x;
    const dz = z - obstacle.z;
    const minDistance = obstacle.radius + padding;
    return dx * dx + dz * dz < minDistance * minDistance;
  });
}

function pointTooCloseToPlayer(x: number, z: number, playerPosition: Vector3Tuple): boolean {
  const dx = x - playerPosition[0];
  const dz = z - playerPosition[2];
  return dx * dx + dz * dz < PET_PLAYER_CLEARANCE * PET_PLAYER_CLEARANCE;
}

export function pickPetSpawnPosition(
  playerPosition: Vector3Tuple,
  furniture: RoomFurniturePlacement[],
  randomValue = Math.random
): Vector3Tuple {
  const obstacles = buildPetObstacles(furniture);

  for (const [offsetX, offsetZ] of PET_SPAWN_OFFSETS) {
    const candidate = clampPetPositionToRoom([
      playerPosition[0] + offsetX,
      0,
      playerPosition[2] + offsetZ
    ]);

    if (!pointIntersectsPetObstacle(candidate[0], candidate[2], obstacles, 0.1)) {
      return candidate;
    }
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = clampPetPositionToRoom([
      (randomValue() * 2 - 1) * (PET_ROOM_HALF_SIZE - PET_ROOM_MARGIN),
      0,
      (randomValue() * 2 - 1) * (PET_ROOM_HALF_SIZE - PET_ROOM_MARGIN)
    ]);

    if (!pointIntersectsPetObstacle(candidate[0], candidate[2], obstacles, 0.1)) {
      return candidate;
    }
  }

  return clampPetPositionToRoom([0, 0, 0]);
}

export function pickPetWanderTarget(
  currentPosition: Vector3Tuple,
  playerPosition: Vector3Tuple,
  obstacles: PetObstacle[],
  randomValue = Math.random,
  customMinRadius?: number,
  customMaxRadius?: number
): Vector3Tuple {
  const dxToPlayer = playerPosition[0] - currentPosition[0];
  const dzToPlayer = playerPosition[2] - currentPosition[2];
  const playerDistance = Math.sqrt(dxToPlayer * dxToPlayer + dzToPlayer * dzToPlayer);
  const shouldBiasTowardPlayer = playerDistance > 3.4 || randomValue() < 0.35;
  const centerX = shouldBiasTowardPlayer ? playerPosition[0] : currentPosition[0];
  const centerZ = shouldBiasTowardPlayer ? playerPosition[2] : currentPosition[2];

  const minRadius = customMinRadius ?? (shouldBiasTowardPlayer ? 1.15 : 0.9);
  const maxRadius = customMaxRadius ?? (shouldBiasTowardPlayer ? 2.2 : 2.8);

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const angle = randomValue() * Math.PI * 2;
    const radius = minRadius + randomValue() * (maxRadius - minRadius);
    const candidateX = centerX + Math.cos(angle) * radius;
    const candidateZ = centerZ + Math.sin(angle) * radius;

    const candidate = clampPetPositionToRoom([candidateX, 0, candidateZ]);

    // Fast path clear check (simple raycast simulation)
    const midX = (currentPosition[0] + candidate[0]) / 2;
    const midZ = (currentPosition[2] + candidate[2]) / 2;

    if (
      pointIntersectsPetObstacle(candidate[0], candidate[2], obstacles, 0.12) ||
      pointIntersectsPetObstacle(midX, midZ, obstacles, 0.15) || // Check middle point for better pathing
      pointTooCloseToPlayer(candidate[0], candidate[2], playerPosition)
    ) {
      continue;
    }

    return candidate;
  }

  return clampPetPositionToRoom(currentPosition);
}