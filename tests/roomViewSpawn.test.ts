import { describe, expect, it } from "vitest";
import { getFurnitureCollisionReason } from "../src/lib/furnitureCollision";
import { spawnCandidateOffsets } from "../src/components/room-view/constants";
import {
  resolveSpawnPosition
} from "../src/components/room-view/placementResolvers";
import { findSpawnPlacement } from "../src/components/room-view/useRoomViewSpawn";
import type { FurnitureSpawnRequest } from "../src/app/types";
import type { RoomFurniturePlacement, Vector3Tuple } from "../src/lib/roomState";

function createSpawnRequest(
  type: FurnitureSpawnRequest["type"],
  ownedFurnitureId = `owned-${type}`
): FurnitureSpawnRequest {
  return {
    requestId: 1,
    type,
    ownedFurnitureId
  };
}

function createPlacement(
  id: string,
  type: RoomFurniturePlacement["type"],
  surface: RoomFurniturePlacement["surface"],
  position: Vector3Tuple,
  rotationY = 0,
  extra: Partial<RoomFurniturePlacement> = {}
): RoomFurniturePlacement {
  return {
    id,
    type,
    surface,
    position,
    rotationY,
    ownedFurnitureId: `owned-${id}`,
    ...extra
  };
}

describe("findSpawnPlacement", () => {
  it("returns null when surface decor has no editable host", () => {
    expect(
      findSpawnPlacement({
        furniture: [],
        gridSnapEnabled: true,
        playerWorldPosition: [0, 0, 0],
        spawnRequest: createSpawnRequest("vase"),
        targetPosition: [0, 0, 0]
      })
    ).toBeNull();
  });

  it("uses the first collision-free spawn candidate", () => {
    const targetPosition: Vector3Tuple = [0, 0, 0];
    const blockedCandidate = resolveSpawnPosition(
      "bed",
      "floor",
      targetPosition,
      spawnCandidateOffsets[0][0],
      spawnCandidateOffsets[0][1],
      [],
      true
    );
    const blocker = createPlacement(
      "blocker",
      "bed",
      "floor",
      blockedCandidate.position,
      Math.PI
    );
    const expectedCandidate = spawnCandidateOffsets
      .map(([offsetA, offsetB]) =>
        resolveSpawnPosition(
          "bed",
          "floor",
          targetPosition,
          offsetA,
          offsetB,
          [],
          true
        )
      )
      .find((candidate) => {
        const candidatePlacement = createPlacement(
          "spawn-preview",
          "bed",
          "floor",
          candidate.position,
          candidate.rotationY
        );

        return !getFurnitureCollisionReason(candidatePlacement, [blocker], [4, 0, 4]);
      });
    const result = findSpawnPlacement({
      furniture: [blocker],
      gridSnapEnabled: true,
      playerWorldPosition: [4, 0, 4],
      spawnRequest: createSpawnRequest("bed"),
      targetPosition
    });

    expect(result).not.toBeNull();
    expect(expectedCandidate).toBeDefined();
    expect(result?.surface).toBe("floor");
    expect(result?.position).toEqual(expectedCandidate?.position);
  });

  it("falls back to the initial spawn candidate when all candidates are blocked", () => {
    const targetPosition: Vector3Tuple = [0, 0, 0];
    const blockers = spawnCandidateOffsets.map(([offsetA, offsetB], index) => {
      const candidate = resolveSpawnPosition(
        "bed",
        "floor",
        targetPosition,
        offsetA,
        offsetB,
        [],
        true
      );

      return createPlacement(
        `blocker-${index}`,
        "bed",
        "floor",
        candidate.position,
        Math.PI
      );
    });

    const result = findSpawnPlacement({
      furniture: blockers,
      gridSnapEnabled: true,
      playerWorldPosition: [4, 0, 4],
      spawnRequest: createSpawnRequest("bed"),
      targetPosition
    });

    expect(result).not.toBeNull();
    expect(result?.surface).toBe("floor");
    expect(result?.position).toEqual([0.5, 0, 0.5]);
  });

  it("preserves wall and floor surface preference", () => {
    const floorPlacement = findSpawnPlacement({
      furniture: [],
      gridSnapEnabled: true,
      playerWorldPosition: [0, 0, 0],
      spawnRequest: createSpawnRequest("bed"),
      targetPosition: [0, 0, 0]
    });
    const wallPlacement = findSpawnPlacement({
      furniture: [],
      gridSnapEnabled: true,
      playerWorldPosition: [0, 0, 0],
      spawnRequest: createSpawnRequest("poster"),
      targetPosition: [-4.5, 0, -1.2]
    });

    expect(floorPlacement?.surface).toBe("floor");
    expect(wallPlacement?.surface).toBe("wall_left");
  });
});
