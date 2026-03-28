import { getFurnitureDefinition } from "./furnitureRegistry";
import type { RoomFurniturePlacement, Vector3Tuple } from "./roomState";

export type PetObstacle = {
  x: number;
  z: number;
  radius: number;
};

export type PetNavigationNode = {
  id: number;
  position: Vector3Tuple;
  neighborIds: number[];
  perimeter: boolean;
};

export type PetNavigationMap = {
  nodes: PetNavigationNode[];
};

const PET_ROOM_HALF_SIZE = 5;
const PET_ROOM_MARGIN = 0.75;
const PET_PLAYER_CLEARANCE = 0.8;
const PET_SOFT_OBSTACLE_CLEARANCE = 0.7;
const PET_NAVIGATION_STEP = 0.55;
const PET_NAVIGATION_POINT_CLEARANCE = 0.18;
const PET_NAVIGATION_SEGMENT_CLEARANCE = 0.12;
const PET_NAVIGATION_SAMPLE_STEP = 0.28;
const PET_NAVIGATION_PERIMETER_THRESHOLD = 1.1;

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

const PET_RECOVERY_OFFSETS: Array<[number, number]> = [
  [1.6, 0],
  [-1.6, 0],
  [0, 1.6],
  [0, -1.6],
  [2.2, 1.2],
  [-2.2, 1.2],
  [2.2, -1.2],
  [-2.2, -1.2],
  [2.8, 0],
  [-2.8, 0],
  [0, 2.8],
  [0, -2.8]
];

function getPetRoomMaxCoordinate(): number {
  return PET_ROOM_HALF_SIZE - PET_ROOM_MARGIN;
}

function roundPetCoordinate(value: number): number {
  return Number(value.toFixed(3));
}

function cloneVector3Tuple(position: Vector3Tuple): Vector3Tuple {
  return [position[0], 0, position[2]];
}

function getPetDistance(a: Vector3Tuple, b: Vector3Tuple): number {
  return Math.hypot(a[0] - b[0], a[2] - b[2]);
}

function buildPetNavigationAxisValues(): number[] {
  const max = getPetRoomMaxCoordinate();
  const values: number[] = [];

  for (let value = -max; value < max; value += PET_NAVIGATION_STEP) {
    values.push(roundPetCoordinate(value));
  }

  values.push(roundPetCoordinate(max));
  return Array.from(new Set(values));
}

function makeNavigationKey(x: number, z: number): string {
  return `${roundPetCoordinate(x)}:${roundPetCoordinate(z)}`;
}

function segmentIntersectsPetObstacle(
  start: Vector3Tuple,
  end: Vector3Tuple,
  obstacles: PetObstacle[],
  padding = 0
): boolean {
  const distance = getPetDistance(start, end);
  const sampleCount = Math.max(2, Math.ceil(distance / PET_NAVIGATION_SAMPLE_STEP));

  for (let index = 1; index < sampleCount; index += 1) {
    const progress = index / sampleCount;
    const sampleX = start[0] + (end[0] - start[0]) * progress;
    const sampleZ = start[2] + (end[2] - start[2]) * progress;

    if (pointIntersectsPetObstacle(sampleX, sampleZ, obstacles, padding)) {
      return true;
    }
  }

  return false;
}

function pointTooCloseToPlayer(x: number, z: number, playerPosition: Vector3Tuple): boolean {
  const dx = x - playerPosition[0];
  const dz = z - playerPosition[2];
  return dx * dx + dz * dz < PET_PLAYER_CLEARANCE * PET_PLAYER_CLEARANCE;
}

function pointTooCloseToOtherPets(
  x: number,
  z: number,
  otherPetPositions: Vector3Tuple[],
  clearance = PET_SOFT_OBSTACLE_CLEARANCE
): boolean {
  return otherPetPositions.some((otherPetPosition) => {
    const dx = x - otherPetPosition[0];
    const dz = z - otherPetPosition[2];
    return dx * dx + dz * dz < clearance * clearance;
  });
}

function segmentTooCloseToOtherPets(
  start: Vector3Tuple,
  end: Vector3Tuple,
  otherPetPositions: Vector3Tuple[],
  clearance = PET_SOFT_OBSTACLE_CLEARANCE * 0.85
): boolean {
  if (otherPetPositions.length === 0) {
    return false;
  }

  const distance = getPetDistance(start, end);
  const sampleCount = Math.max(2, Math.ceil(distance / PET_NAVIGATION_SAMPLE_STEP));

  for (let index = 1; index < sampleCount; index += 1) {
    const progress = index / sampleCount;
    const sampleX = start[0] + (end[0] - start[0]) * progress;
    const sampleZ = start[2] + (end[2] - start[2]) * progress;

    if (pointTooCloseToOtherPets(sampleX, sampleZ, otherPetPositions, clearance)) {
      return true;
    }
  }

  return false;
}

function isCandidateClear(
  currentPosition: Vector3Tuple,
  candidate: Vector3Tuple,
  playerPosition: Vector3Tuple,
  obstacles: PetObstacle[],
  otherPetPositions: Vector3Tuple[],
  candidatePadding: number,
  midpointPadding: number,
  requirePlayerClearance = true
): boolean {
  const midX = (currentPosition[0] + candidate[0]) / 2;
  const midZ = (currentPosition[2] + candidate[2]) / 2;

  if (
    pointIntersectsPetObstacle(candidate[0], candidate[2], obstacles, candidatePadding) ||
    pointIntersectsPetObstacle(midX, midZ, obstacles, midpointPadding) ||
    pointTooCloseToOtherPets(candidate[0], candidate[2], otherPetPositions) ||
    pointTooCloseToOtherPets(midX, midZ, otherPetPositions, PET_SOFT_OBSTACLE_CLEARANCE * 0.72)
  ) {
    return false;
  }

  if (requirePlayerClearance && pointTooCloseToPlayer(candidate[0], candidate[2], playerPosition)) {
    return false;
  }

  return true;
}

function pickTargetAroundCenter(
  currentPosition: Vector3Tuple,
  centerPosition: Vector3Tuple,
  playerPosition: Vector3Tuple,
  obstacles: PetObstacle[],
  randomValue: () => number,
  minRadius: number,
  maxRadius: number,
  otherPetPositions: Vector3Tuple[],
  requirePlayerClearance = true
): Vector3Tuple {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const angle = randomValue() * Math.PI * 2;
    const radius = minRadius + randomValue() * (maxRadius - minRadius);
    const candidate = clampPetPositionToRoom([
      centerPosition[0] + Math.cos(angle) * radius,
      0,
      centerPosition[2] + Math.sin(angle) * radius
    ]);

    if (
      isCandidateClear(
        currentPosition,
        candidate,
        playerPosition,
        obstacles,
        otherPetPositions,
        0.12,
        0.15,
        requirePlayerClearance
      )
    ) {
      return candidate;
    }
  }

  return clampPetPositionToRoom(currentPosition);
}

function findNearestNavigationNodeId(
  position: Vector3Tuple,
  navigationMap: PetNavigationMap,
  otherPetPositions: Vector3Tuple[] = []
): number | null {
  let bestNodeId: number | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const node of navigationMap.nodes) {
    const distance = getPetDistance(position, node.position);
    const softPenalty = pointTooCloseToOtherPets(
      node.position[0],
      node.position[2],
      otherPetPositions,
      PET_SOFT_OBSTACLE_CLEARANCE * 0.85
    )
      ? 0.85
      : 0;
    const score = distance + softPenalty;

    if (score < bestScore) {
      bestScore = score;
      bestNodeId = node.id;
    }
  }

  return bestNodeId;
}

function reconstructNavigationPath(cameFrom: Map<number, number>, goalNodeId: number): number[] {
  const pathNodeIds = [goalNodeId];
  let currentNodeId = goalNodeId;

  while (cameFrom.has(currentNodeId)) {
    currentNodeId = cameFrom.get(currentNodeId) ?? currentNodeId;
    pathNodeIds.push(currentNodeId);
  }

  pathNodeIds.reverse();
  return pathNodeIds;
}

function smoothPetWaypointPath(
  points: Vector3Tuple[],
  obstacles: PetObstacle[],
  otherPetPositions: Vector3Tuple[] = []
): Vector3Tuple[] {
  const filteredPoints = points.filter(
    (point, index) => index === 0 || getPetDistance(point, points[index - 1] as Vector3Tuple) > 0.08
  );

  if (filteredPoints.length <= 2) {
    return filteredPoints.map(cloneVector3Tuple);
  }

  const smoothedPoints: Vector3Tuple[] = [cloneVector3Tuple(filteredPoints[0] as Vector3Tuple)];
  let anchorIndex = 0;

  while (anchorIndex < filteredPoints.length - 1) {
    let nextIndex = filteredPoints.length - 1;

    while (nextIndex > anchorIndex + 1) {
      const anchorPoint = filteredPoints[anchorIndex] as Vector3Tuple;
      const candidatePoint = filteredPoints[nextIndex] as Vector3Tuple;

      if (
        !segmentIntersectsPetObstacle(
          anchorPoint,
          candidatePoint,
          obstacles,
          PET_NAVIGATION_SEGMENT_CLEARANCE
        ) &&
        !segmentTooCloseToOtherPets(anchorPoint, candidatePoint, otherPetPositions)
      ) {
        break;
      }

      nextIndex -= 1;
    }

    smoothedPoints.push(cloneVector3Tuple(filteredPoints[nextIndex] as Vector3Tuple));
    anchorIndex = nextIndex;
  }

  return smoothedPoints;
}

function getRecentTargetDistance(candidate: Vector3Tuple, recentTargets: Vector3Tuple[]): number {
  if (recentTargets.length === 0) {
    return PET_ROOM_HALF_SIZE * 2;
  }

  return recentTargets.reduce(
    (closestDistance, recentTarget) => Math.min(closestDistance, getPetDistance(candidate, recentTarget)),
    Number.POSITIVE_INFINITY
  );
}

export function clampPetAxis(value: number): number {
  const max = getPetRoomMaxCoordinate();
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

export function buildPetNavigationMap(obstacles: PetObstacle[]): PetNavigationMap {
  const axisValues = buildPetNavigationAxisValues();
  const navigationNodes: PetNavigationNode[] = [];
  const nodeIdByKey = new Map<string, number>();

  axisValues.forEach((z) => {
    axisValues.forEach((x) => {
      if (pointIntersectsPetObstacle(x, z, obstacles, PET_NAVIGATION_POINT_CLEARANCE)) {
        return;
      }

      const edgeDistance = getPetRoomMaxCoordinate() - Math.max(Math.abs(x), Math.abs(z));
      const nodeId = navigationNodes.length;
      const position: Vector3Tuple = [x, 0, z];
      navigationNodes.push({
        id: nodeId,
        position,
        neighborIds: [],
        perimeter: edgeDistance <= PET_NAVIGATION_PERIMETER_THRESHOLD
      });
      nodeIdByKey.set(makeNavigationKey(x, z), nodeId);
    });
  });

  const neighborDirections: Array<[number, number]> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1]
  ];

  navigationNodes.forEach((node) => {
    neighborDirections.forEach(([stepX, stepZ]) => {
      const neighborX = node.position[0] + stepX * PET_NAVIGATION_STEP;
      const neighborZ = node.position[2] + stepZ * PET_NAVIGATION_STEP;
      const neighborId = nodeIdByKey.get(makeNavigationKey(neighborX, neighborZ));

      if (neighborId === undefined) {
        return;
      }

      if (Math.abs(stepX) === 1 && Math.abs(stepZ) === 1) {
        const horizontalNeighborId = nodeIdByKey.get(
          makeNavigationKey(node.position[0] + stepX * PET_NAVIGATION_STEP, node.position[2])
        );
        const verticalNeighborId = nodeIdByKey.get(
          makeNavigationKey(node.position[0], node.position[2] + stepZ * PET_NAVIGATION_STEP)
        );

        if (horizontalNeighborId === undefined || verticalNeighborId === undefined) {
          return;
        }
      }

      const neighborNode = navigationNodes[neighborId];

      if (
        !neighborNode ||
        segmentIntersectsPetObstacle(
          node.position,
          neighborNode.position,
          obstacles,
          PET_NAVIGATION_SEGMENT_CLEARANCE
        )
      ) {
        return;
      }

      node.neighborIds.push(neighborId);
    });
  });

  return {
    nodes: navigationNodes
  };
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

export function buildPetPathWaypoints(
  currentPosition: Vector3Tuple,
  targetPosition: Vector3Tuple,
  navigationMap: PetNavigationMap,
  obstacles: PetObstacle[],
  otherPetPositions: Vector3Tuple[] = []
): Vector3Tuple[] {
  const clampedTarget = clampPetPositionToRoom(targetPosition);

  if (
    !segmentIntersectsPetObstacle(
      currentPosition,
      clampedTarget,
      obstacles,
      PET_NAVIGATION_SEGMENT_CLEARANCE
    ) &&
    !segmentTooCloseToOtherPets(currentPosition, clampedTarget, otherPetPositions)
  ) {
    return [clampedTarget];
  }

  const startNodeId = findNearestNavigationNodeId(currentPosition, navigationMap, otherPetPositions);
  const goalNodeId = findNearestNavigationNodeId(clampedTarget, navigationMap, otherPetPositions);

  if (startNodeId === null || goalNodeId === null) {
    return [clampedTarget];
  }

  const openNodeIds = new Set<number>([startNodeId]);
  const cameFrom = new Map<number, number>();
  const gScores = new Map<number, number>([[startNodeId, 0]]);
  const fScores = new Map<number, number>([
    [startNodeId, getPetDistance(navigationMap.nodes[startNodeId]!.position, navigationMap.nodes[goalNodeId]!.position)]
  ]);

  while (openNodeIds.size > 0) {
    let currentNodeId: number | null = null;
    let currentNodeScore = Number.POSITIVE_INFINITY;

    openNodeIds.forEach((nodeId) => {
      const candidateScore = fScores.get(nodeId) ?? Number.POSITIVE_INFINITY;
      if (candidateScore < currentNodeScore) {
        currentNodeId = nodeId;
        currentNodeScore = candidateScore;
      }
    });

    if (currentNodeId === null) {
      break;
    }

    if (currentNodeId === goalNodeId) {
      const pathNodeIds = reconstructNavigationPath(cameFrom, goalNodeId);
      const rawWaypoints = [
        cloneVector3Tuple(currentPosition),
        ...pathNodeIds.slice(1).map((nodeId) => cloneVector3Tuple(navigationMap.nodes[nodeId]!.position)),
        clampedTarget
      ];

      return smoothPetWaypointPath(rawWaypoints, obstacles, otherPetPositions).slice(1);
    }

    const resolvedCurrentNodeId = currentNodeId;
    openNodeIds.delete(resolvedCurrentNodeId);
    const currentNode = navigationMap.nodes[resolvedCurrentNodeId]!;

    currentNode.neighborIds.forEach((neighborNodeId) => {
      const neighborNode = navigationMap.nodes[neighborNodeId]!;
      const softPenalty = pointTooCloseToOtherPets(
        neighborNode.position[0],
        neighborNode.position[2],
        otherPetPositions,
        PET_SOFT_OBSTACLE_CLEARANCE * 0.9
      )
        ? 0.75
        : 0;
      const tentativeGScore =
        (gScores.get(resolvedCurrentNodeId) ?? Number.POSITIVE_INFINITY) +
        getPetDistance(currentNode.position, neighborNode.position) +
        softPenalty;

      if (tentativeGScore >= (gScores.get(neighborNodeId) ?? Number.POSITIVE_INFINITY)) {
        return;
      }

      cameFrom.set(neighborNodeId, resolvedCurrentNodeId);
      gScores.set(neighborNodeId, tentativeGScore);
      fScores.set(
        neighborNodeId,
        tentativeGScore + getPetDistance(neighborNode.position, navigationMap.nodes[goalNodeId]!.position)
      );
      openNodeIds.add(neighborNodeId);
    });
  }

  return [clampedTarget];
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
      (randomValue() * 2 - 1) * getPetRoomMaxCoordinate(),
      0,
      (randomValue() * 2 - 1) * getPetRoomMaxCoordinate()
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
  customMaxRadius?: number,
  otherPetPositions: Vector3Tuple[] = []
): Vector3Tuple {
  const dxToPlayer = playerPosition[0] - currentPosition[0];
  const dzToPlayer = playerPosition[2] - currentPosition[2];
  const playerDistance = Math.sqrt(dxToPlayer * dxToPlayer + dzToPlayer * dzToPlayer);
  const shouldBiasTowardPlayer = playerDistance > 3.4 || randomValue() < 0.35;
  const centerX = shouldBiasTowardPlayer ? playerPosition[0] : currentPosition[0];
  const centerZ = shouldBiasTowardPlayer ? playerPosition[2] : currentPosition[2];
  const minRadius = customMinRadius ?? (shouldBiasTowardPlayer ? 1.15 : 0.9);
  const maxRadius = customMaxRadius ?? (shouldBiasTowardPlayer ? 2.2 : 2.8);

  return pickTargetAroundCenter(
    currentPosition,
    [centerX, 0, centerZ],
    playerPosition,
    obstacles,
    randomValue,
    minRadius,
    maxRadius,
    otherPetPositions
  );
}

export function pickPetRoomWanderTarget(
  currentPosition: Vector3Tuple,
  playerPosition: Vector3Tuple,
  navigationMap: PetNavigationMap,
  randomValue = Math.random,
  recentTargets: Vector3Tuple[] = []
): Vector3Tuple {
  if (navigationMap.nodes.length === 0) {
    return clampPetPositionToRoom(currentPosition);
  }

  const preferPerimeter = randomValue() < 0.6;
  const preferPlayerOrbit = randomValue() < 0.35;
  const desiredTravelDistance = 2.5 + randomValue() * 4.2;
  const nodeCount = navigationMap.nodes.length;
  const sampleCount = Math.min(36, nodeCount);
  let bestNode: PetNavigationNode | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let attempt = 0; attempt < sampleCount; attempt += 1) {
    const rawIndex = Math.floor(randomValue() * nodeCount);
    const safeIndex = Math.max(0, Math.min(nodeCount - 1, rawIndex));
    const candidateNode = navigationMap.nodes[safeIndex];

    if (!candidateNode) {
      continue;
    }

    const travelDistance = getPetDistance(currentPosition, candidateNode.position);

    if (travelDistance < 1.2) {
      continue;
    }

    const playerDistance = getPetDistance(playerPosition, candidateNode.position);
    const recentTargetDistance = getRecentTargetDistance(candidateNode.position, recentTargets);
    const distanceScore = 1 - Math.min(1.3, Math.abs(travelDistance - desiredTravelDistance) / 3.8);
    const orbitScore = preferPlayerOrbit
      ? 1 - Math.min(1.3, Math.abs(playerDistance - 2.6) / 2.2)
      : 0;
    const independenceScore = preferPlayerOrbit ? 0 : Math.min(1, playerDistance / 4.8);
    const noveltyScore = Math.min(1.3, recentTargetDistance / 2.8);
    const revisitPenalty = recentTargetDistance < 1.15 ? 1.35 : 0;
    const centerPenalty = Math.max(0, 1 - Math.hypot(candidateNode.position[0], candidateNode.position[2]) / 1.8) * 0.25;
    const perimeterBonus = preferPerimeter && candidateNode.perimeter ? 0.8 : 0;
    const score =
      distanceScore * 1.4 +
      orbitScore * 0.85 +
      independenceScore * 0.35 +
      noveltyScore * 1.1 +
      perimeterBonus +
      randomValue() * 0.18 -
      revisitPenalty -
      centerPenalty;

    if (score > bestScore) {
      bestScore = score;
      bestNode = candidateNode;
    }
  }

  if (bestNode) {
    return cloneVector3Tuple(bestNode.position);
  }

  const fallbackNode = navigationMap.nodes[0];

  if (!fallbackNode) {
    return clampPetPositionToRoom(currentPosition);
  }

  const furthestNode = navigationMap.nodes.reduce((currentFurthestNode, candidateNode) =>
    getPetDistance(currentPosition, candidateNode.position) >
    getPetDistance(currentPosition, currentFurthestNode.position)
      ? candidateNode
      : currentFurthestNode,
    fallbackNode
  );

  return cloneVector3Tuple(furthestNode.position);
}

export function pickPetRestTarget(
  currentPosition: Vector3Tuple,
  playerPosition: Vector3Tuple,
  obstacles: PetObstacle[],
  randomValue = Math.random,
  otherPetPositions: Vector3Tuple[] = []
): Vector3Tuple {
  const awayFromPlayerX = currentPosition[0] - playerPosition[0];
  const awayFromPlayerZ = currentPosition[2] - playerPosition[2];
  const awayLength = Math.max(1, Math.hypot(awayFromPlayerX, awayFromPlayerZ));
  const restCenter = clampPetPositionToRoom([
    currentPosition[0] + (awayFromPlayerX / awayLength) * 1.25,
    0,
    currentPosition[2] + (awayFromPlayerZ / awayLength) * 1.25
  ]);

  return pickTargetAroundCenter(
    currentPosition,
    restCenter,
    playerPosition,
    obstacles,
    randomValue,
    0.35,
    1.4,
    otherPetPositions
  );
}

export function pickPetFollowTarget(
  currentPosition: Vector3Tuple,
  playerPosition: Vector3Tuple,
  obstacles: PetObstacle[],
  randomValue = Math.random,
  otherPetPositions: Vector3Tuple[] = []
): Vector3Tuple {
  return pickTargetAroundCenter(
    currentPosition,
    playerPosition,
    playerPosition,
    obstacles,
    randomValue,
    PET_PLAYER_CLEARANCE + 0.15,
    1.65,
    otherPetPositions
  );
}

export function pickPetRecoveryTarget(
  currentPosition: Vector3Tuple,
  playerPosition: Vector3Tuple,
  obstacles: PetObstacle[],
  randomValue = Math.random,
  otherPetPositions: Vector3Tuple[] = []
): Vector3Tuple {
  for (const [offsetX, offsetZ] of PET_RECOVERY_OFFSETS) {
    const candidate = clampPetPositionToRoom([
      currentPosition[0] + offsetX,
      0,
      currentPosition[2] + offsetZ
    ]);

    if (
      isCandidateClear(
        currentPosition,
        candidate,
        playerPosition,
        obstacles,
        otherPetPositions,
        0.16,
        0.18
      )
    ) {
      return candidate;
    }
  }

  return pickTargetAroundCenter(
    currentPosition,
    currentPosition,
    playerPosition,
    obstacles,
    randomValue,
    2.2,
    4,
    otherPetPositions
  );
}
