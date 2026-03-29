import { describe, expect, it } from "vitest";
import {
  cloneSharedPetLiveState,
  createSharedRoomPetRecord,
  createSharedPetLiveState,
  migrateLegacySharedPetRecord,
  toRuntimeOwnedPet
} from "../src/lib/sharedRoomPet";
import {
  pushBufferedMotionSample,
  sampleBufferedMotion
} from "../src/lib/liveMotionPlayback";

describe("sharedRoomPet", () => {
  it("creates the canonical shared cat record", () => {
    const sharedPet = createSharedRoomPetRecord(
      [1.25, 0, -0.5],
      "player-1",
      "2026-03-26T13:00:00.000Z",
      { presetId: "variant-a", displayName: "Miso", behaviorProfileId: "lazy" }
    );

    expect(sharedPet).toEqual({
      id: "shared-pet-minecraft_cat",
      type: "minecraft_cat",
      presetId: "variant-a",
      displayName: "Miso",
      behaviorProfileId: "lazy",
      spawnPosition: [1.25, 0, -0.5],
      adoptedAt: "2026-03-26T13:00:00.000Z",
      adoptedByPlayerId: "player-1",
      care: {
        hunger: 75,
        affection: 75,
        energy: 75,
        lastUpdatedAt: "2026-03-26T13:00:00.000Z",
        lastCareActionAt: null
      }
    });
  });

  it("maps the canonical shared cat into the runtime pet actor shape", () => {
    expect(
      toRuntimeOwnedPet(
        createSharedRoomPetRecord(
          [0.5, 0, 1.5],
          "player-2",
          "2026-03-26T13:00:00.000Z",
          { displayName: "Tofu", behaviorProfileId: "zoomies" }
        )
      )
    ).toEqual({
      id: "shared-pet-minecraft_cat",
      type: "minecraft_cat",
      presetId: "better_cat_variant_tabby",
      acquiredFrom: "pet_shop",
      spawnPosition: [0.5, 0, 1.5],
      displayName: "Tofu",
      status: "active_room",
      behaviorProfileId: "zoomies",
      care: {
        hunger: 75,
        affection: 75,
        energy: 75,
        lastUpdatedAt: "2026-03-26T13:00:00.000Z",
        lastCareActionAt: null
      }
    });
  });

  it("migrates legacy shared pet records to the new richer schema", () => {
    const legacyPet = {
      id: "shared-pet-minecraft_cat",
      type: "minecraft_cat",
      presetId: "better_cat_glb",
      spawnPosition: [1.25, 0, -0.5],
      adoptedAt: "2026-03-26T13:00:00.000Z",
      adoptedByPlayerId: "player-1"
    };

    const migrated = migrateLegacySharedPetRecord(legacyPet, "2026-03-29T10:00:00Z");

    expect(migrated).toMatchObject({
      id: "shared-pet-minecraft_cat",
      presetId: "better_cat_variant_tabby",
      displayName: "Shared Cat",
      behaviorProfileId: "curious"
    });
    expect(migrated.care.hunger).toBe(75);
    expect(migrated.care.lastUpdatedAt).toBe("2026-03-29T10:00:00Z");
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
      velocity: [0, 0, 0],
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
      velocity: [0.4, 0, -0.2],
      walkAmount: 0.7
    });

    expect(liveState.position).toEqual([1.25, 0, -0.75]);
    expect(liveState.velocity).toEqual([0.4, 0, -0.2]);
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
        velocity: [0.4, 0, -0.2],
        walkAmount: 0.7
      })
    );
  });

  it("samples buffered live motion smoothly between updates for the shared cat", () => {
    const samples = pushBufferedMotionSample(
      pushBufferedMotionSample([], {
        position: [0, 0, 0],
        receivedAtMs: 1000,
        rotationY: 0,
        stridePhase: 0,
        velocity: [4, 0, 0],
        walkAmount: 1
      }),
      {
        position: [0.4, 0, 0],
        receivedAtMs: 1100,
        rotationY: Math.PI / 2,
        stridePhase: 1.6,
        velocity: [4, 0, 0],
        walkAmount: 1
      }
    );

    const sampled = sampleBufferedMotion(samples, 1220, {
      playbackDelayMs: 100,
      maxExtrapolationMs: 80
    });

    expect(sampled?.position[0]).toBeCloseTo(0.48);
    expect(sampled?.rotationY).toBeCloseTo(Math.PI / 2, 1);
    expect(sampled?.stridePhase).toBeGreaterThan(1.6);
  });
});
