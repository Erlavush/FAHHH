import { describe, expect, it } from "vitest";
import {
  buildPetNavigationMap,
  buildPetObstacles,
  buildPetPathWaypoints,
  clampPetPositionToRoom,
  pickPetFollowTarget,
  pickPetRecoveryTarget,
  pickPetRestTarget,
  pickPetRoomWanderTarget,
  pickPetSpawnPosition,
  pickPetWanderTarget,
  pointIntersectsPetObstacle,
  type PetObstacle
} from "../src/lib/petPathing";
import type { RoomFurniturePlacement, Vector3Tuple } from "../src/lib/roomState";

function createSequenceRandom(values: number[]): () => number {
  let index = 0;
  return () => {
    const nextValue = values[index] ?? values[values.length - 1] ?? 0.5;
    index += 1;
    return nextValue;
  };
}

describe("petPathing", () => {
  it("ignores rugs and wall items when building pet obstacles", () => {
    const furniture: RoomFurniturePlacement[] = [
      {
        id: "bed-1",
        type: "bed",
        surface: "floor",
        position: [0, 0, 0],
        rotationY: 0,
        ownedFurnitureId: "owned-bed-1"
      },
      {
        id: "rug-1",
        type: "rug",
        surface: "floor",
        position: [2, 0, 2],
        rotationY: 0,
        ownedFurnitureId: "owned-rug-1"
      },
      {
        id: "window-1",
        type: "window",
        surface: "wall_back",
        position: [0, 2, -4.83],
        rotationY: 0,
        ownedFurnitureId: "owned-window-1"
      }
    ];

    const obstacles = buildPetObstacles(furniture);

    expect(obstacles).toHaveLength(1);
    expect(obstacles[0]).toMatchObject({ x: 0, z: 0 });
  });

  it("builds a room-wide navigation map that reaches the room edges", () => {
    const navigationMap = buildPetNavigationMap([]);

    expect(navigationMap.nodes.length).toBeGreaterThan(0);
    expect(
      navigationMap.nodes.some(
        (node) => Math.abs(node.position[0]) >= 4.2 || Math.abs(node.position[2]) >= 4.2
      )
    ).toBe(true);
    expect(navigationMap.nodes.some((node) => node.perimeter)).toBe(true);
  });

  it("routes around blocking furniture instead of taking a straight blocked line", () => {
    const obstacles: PetObstacle[] = [{ x: 0, z: 0, radius: 1.55 }];
    const navigationMap = buildPetNavigationMap(obstacles);
    const currentPosition: Vector3Tuple = [-3.4, 0, 0];
    const targetPosition: Vector3Tuple = [3.4, 0, 0];
    const waypoints = buildPetPathWaypoints(
      currentPosition,
      targetPosition,
      navigationMap,
      obstacles
    );

    expect(waypoints.length).toBeGreaterThan(1);
    expect(waypoints[waypoints.length - 1]).toEqual(targetPosition);
    expect(waypoints.some((point) => Math.abs(point[2]) > 0.3)).toBe(true);
    expect(
      waypoints.every((point) => !pointIntersectsPetObstacle(point[0], point[2], obstacles, 0.12))
    ).toBe(true);
  });

  it("avoids recently visited room-wide wander targets", () => {
    const navigationMap = buildPetNavigationMap([]);
    const currentPosition: Vector3Tuple = [0, 0, 0];
    const playerPosition: Vector3Tuple = [0.2, 0, -0.3];
    const recentTargets: Vector3Tuple[] = [
      [4.25, 0, 4.25],
      [4.25, 0, 3.7],
      [3.7, 0, 4.25]
    ];
    const wanderTarget = pickPetRoomWanderTarget(
      currentPosition,
      playerPosition,
      navigationMap,
      createSequenceRandom([0.1, 0.95, 0.98, 0.98, 0.98, 0.2, 0.8, 0.6, 0.4, 0.3]),
      recentTargets
    );
    const recentDistance = recentTargets.reduce(
      (closestDistance, recentTarget) =>
        Math.min(
          closestDistance,
          Math.hypot(wanderTarget[0] - recentTarget[0], wanderTarget[2] - recentTarget[2])
        ),
      Number.POSITIVE_INFINITY
    );

    expect(recentDistance).toBeGreaterThan(1);
    expect(Math.hypot(wanderTarget[0], wanderTarget[2])).toBeGreaterThan(2);
  });

  it("guards room-wide wander target selection against out-of-range random samples", () => {
    const navigationMap = buildPetNavigationMap([]);
    const wanderTarget = pickPetRoomWanderTarget(
      [0, 0, 0],
      [0, 0, 0],
      navigationMap,
      createSequenceRandom([-0.25, 0.4, 1.4, 0.7, 0.15, 0.9, 0.3, 0.6])
    );

    expect(clampPetPositionToRoom(wanderTarget)).toEqual(wanderTarget);
  });

  it("picks a safe pet spawn position near the player", () => {
    const furniture: RoomFurniturePlacement[] = [
      {
        id: "desk-1",
        type: "desk",
        surface: "floor",
        position: [0.9, 0, -3.9],
        rotationY: Math.PI,
        ownedFurnitureId: "owned-desk-1"
      }
    ];
    const playerPosition: Vector3Tuple = [1, 0, -4];
    const spawnPosition = pickPetSpawnPosition(
      playerPosition,
      furniture,
      createSequenceRandom([0.25, 0.75])
    );
    const obstacles = buildPetObstacles(furniture);

    expect(spawnPosition[1]).toBe(0);
    expect(spawnPosition[0]).toBeGreaterThanOrEqual(-4.25);
    expect(spawnPosition[0]).toBeLessThanOrEqual(4.25);
    expect(spawnPosition[2]).toBeGreaterThanOrEqual(-4.25);
    expect(spawnPosition[2]).toBeLessThanOrEqual(4.25);
    expect(pointIntersectsPetObstacle(spawnPosition[0], spawnPosition[2], obstacles, 0.1)).toBe(
      false
    );
  });

  it("keeps wander targets inside the room and outside obstacles", () => {
    const obstacles: PetObstacle[] = [{ x: 0, z: 0, radius: 1.4 }];
    const currentPosition: Vector3Tuple = [0.4, 0, 0.4];
    const playerPosition: Vector3Tuple = [3.2, 0, 2.8];
    const wanderTarget = pickPetWanderTarget(
      currentPosition,
      playerPosition,
      obstacles,
      createSequenceRandom([0.2, 0.1, 0.85, 0.65, 0.4, 0.55])
    );
    const clampedTarget = clampPetPositionToRoom(wanderTarget);

    expect(wanderTarget).toEqual(clampedTarget);
    expect(pointIntersectsPetObstacle(wanderTarget[0], wanderTarget[2], obstacles, 0.12)).toBe(
      false
    );
  });

  it("avoids other pet positions as soft obstacles", () => {
    const currentPosition: Vector3Tuple = [0, 0, 0];
    const playerPosition: Vector3Tuple = [1, 0, 1];
    const otherPetPositions: Vector3Tuple[] = [[1.85, 0, 0]];
    const wanderTarget = pickPetWanderTarget(
      currentPosition,
      playerPosition,
      [],
      createSequenceRandom([0.9, 0.0, 0.5, 0.25, 0.5]),
      undefined,
      undefined,
      otherPetPositions
    );

    const distanceToOtherPet = Math.hypot(
      wanderTarget[0] - otherPetPositions[0][0],
      wanderTarget[2] - otherPetPositions[0][2]
    );

    expect(distanceToOtherPet).toBeGreaterThan(0.69);
    expect(wanderTarget[2]).toBeGreaterThan(1);
  });

  it("picks a recovery target when a cat gets trapped", () => {
    const currentPosition: Vector3Tuple = [0, 0, 0];
    const playerPosition: Vector3Tuple = [0.25, 0, 0.25];
    const obstacles: PetObstacle[] = [{ x: 0, z: 0, radius: 1.35 }];
    const recoveryTarget = pickPetRecoveryTarget(
      currentPosition,
      playerPosition,
      obstacles,
      createSequenceRandom([0.4, 0.6])
    );

    expect(recoveryTarget).not.toEqual(currentPosition);
    expect(pointIntersectsPetObstacle(recoveryTarget[0], recoveryTarget[2], obstacles, 0.16)).toBe(
      false
    );
  });

  it("keeps follow and rest targets room-safe", () => {
    const currentPosition: Vector3Tuple = [-0.8, 0, -0.8];
    const playerPosition: Vector3Tuple = [2, 0, 1.8];
    const obstacles: PetObstacle[] = [{ x: 0.9, z: 0.9, radius: 0.8 }];

    const followTarget = pickPetFollowTarget(
      currentPosition,
      playerPosition,
      obstacles,
      createSequenceRandom([0.25, 0.2, 0.75, 0.5])
    );
    const restTarget = pickPetRestTarget(
      currentPosition,
      playerPosition,
      obstacles,
      createSequenceRandom([0.6, 0.1, 0.2, 0.4])
    );

    expect(pointIntersectsPetObstacle(followTarget[0], followTarget[2], obstacles, 0.12)).toBe(
      false
    );
    expect(pointIntersectsPetObstacle(restTarget[0], restTarget[2], obstacles, 0.12)).toBe(
      false
    );
    expect(clampPetPositionToRoom(followTarget)).toEqual(followTarget);
    expect(clampPetPositionToRoom(restTarget)).toEqual(restTarget);
  });
});
