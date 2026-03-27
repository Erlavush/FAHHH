import { describe, expect, it } from "vitest";
import {
  cloneSharedPetLiveState,
  createSharedRoomPetRecord,
  createSharedPetLiveState,
  toRuntimeOwnedPet
} from "../src/lib/sharedRoomPet";

describe("sharedRoomPet", () => {
  it("creates the canonical shared cat record", () => {
    const sharedPet = createSharedRoomPetRecord(
      [1.25, 0, -0.5],
      "player-1",
      "2026-03-26T13:00:00.000Z"
    );

    expect(sharedPet).toEqual({
      id: "shared-pet-minecraft_cat",
      type: "minecraft_cat",
      presetId: "better_cat_glb",
      spawnPosition: [1.25, 0, -0.5],
      adoptedAt: "2026-03-26T13:00:00.000Z",
      adoptedByPlayerId: "player-1"
    });
  });

  it("maps the canonical shared cat into the runtime pet actor shape", () => {
    expect(
      toRuntimeOwnedPet(
        createSharedRoomPetRecord(
          [0.5, 0, 1.5],
          "player-2",
          "2026-03-26T13:00:00.000Z"
        )
      )
    ).toEqual({
      id: "shared-pet-minecraft_cat",
      type: "minecraft_cat",
      presetId: "better_cat_glb",
      acquiredFrom: "pet_shop",
      spawnPosition: [0.5, 0, 1.5]
    });
  });

  it("creates shared live motion state without mutating canonical pet records", () => {
    const sharedPet = createSharedRoomPetRecord(
      [0.5, 0, 1.5],
      "player-1",
      "2026-03-26T13:00:00.000Z"
    );
    const liveState = createSharedPetLiveState(
      sharedPet,
      "player-1",
      "2026-03-26T13:05:00.000Z"
    );

    expect(sharedPet.spawnPosition).toEqual([0.5, 0, 1.5]);
    expect(liveState).toEqual({
      ownerPlayerId: "player-1",
      petId: "shared-pet-minecraft_cat",
      position: [0.5, 0, 1.5],
      rotationY: 0,
      stridePhase: 0,
      targetPosition: null,
      updatedAt: "2026-03-26T13:05:00.000Z",
      walkAmount: 0
    });
  });

  it("clones shared live motion state deeply for cross-client reuse", () => {
    const liveState = cloneSharedPetLiveState({
      ownerPlayerId: "player-2",
      petId: "shared-pet-minecraft_cat",
      position: [1.25, 0, -0.75],
      rotationY: Math.PI / 2,
      stridePhase: 2.4,
      targetPosition: [0.25, 0, 0.5],
      updatedAt: "2026-03-26T13:06:00.000Z",
      walkAmount: 0.7
    });

    expect(liveState.position).toEqual([1.25, 0, -0.75]);
    expect(liveState.targetPosition).toEqual([0.25, 0, 0.5]);
    expect(liveState).not.toBe(
      cloneSharedPetLiveState({
        ownerPlayerId: "player-2",
        petId: "shared-pet-minecraft_cat",
        position: [1.25, 0, -0.75],
        rotationY: Math.PI / 2,
        stridePhase: 2.4,
        targetPosition: [0.25, 0, 0.5],
        updatedAt: "2026-03-26T13:06:00.000Z",
        walkAmount: 0.7
      })
    );
  });
});
