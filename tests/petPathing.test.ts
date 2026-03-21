import { describe, expect, it } from "vitest";
import {
  buildPetObstacles,
  clampPetPositionToRoom,
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
    const spawnPosition = pickPetSpawnPosition(playerPosition, furniture, createSequenceRandom([0.25, 0.75]));
    const obstacles = buildPetObstacles(furniture);

    expect(spawnPosition[1]).toBe(0);
    expect(spawnPosition[0]).toBeGreaterThanOrEqual(-4.25);
    expect(spawnPosition[0]).toBeLessThanOrEqual(4.25);
    expect(spawnPosition[2]).toBeGreaterThanOrEqual(-4.25);
    expect(spawnPosition[2]).toBeLessThanOrEqual(4.25);
    expect(pointIntersectsPetObstacle(spawnPosition[0], spawnPosition[2], obstacles, 0.1)).toBe(false);
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
    expect(pointIntersectsPetObstacle(wanderTarget[0], wanderTarget[2], obstacles, 0.12)).toBe(false);
  });
});