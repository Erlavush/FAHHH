import { beforeEach, describe, expect, it } from "vitest";
import {
  createDefaultSandboxState,
  loadPersistedSandboxState,
  savePersistedSandboxState
} from "../src/lib/devLocalState";
import { createOwnedPet } from "../src/lib/pets";

describe("devLocalState", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists active-room and stored-roster cats", () => {
    const sandboxState = createDefaultSandboxState([10.5, 8.7, 10.5], [0, 0, 0.85]);

    sandboxState.pets = [
      createOwnedPet("minecraft_cat", [0.5, 0, 1.25], {
        id: "pet-minecraft_cat-1",
        displayName: "Cat 1",
        status: "active_room",
        behaviorProfileId: "curious",
        nowIso: "2026-03-27T11:00:00.000Z"
      }),
      createOwnedPet("minecraft_cat", [1.5, 0, -0.25], {
        id: "pet-minecraft_cat-2",
        displayName: "Cat 2",
        status: "stored_roster",
        behaviorProfileId: "lazy",
        nowIso: "2026-03-27T11:05:00.000Z"
      })
    ];

    savePersistedSandboxState(sandboxState);

    const loadedState = loadPersistedSandboxState(
      [10.5, 8.7, 10.5],
      [0, 0, 0.85],
      sandboxState.roomState
    );

    expect(loadedState.pets).toEqual(sandboxState.pets);
    expect(loadedState.pets[0]).not.toBe(sandboxState.pets[0]);
    expect(loadedState.pets[0].care).not.toBe(sandboxState.pets[0].care);
  });

  it("normalizes legacy cats into showcase-ready roster records", () => {
    const legacySandboxState = createDefaultSandboxState([10.5, 8.7, 10.5], [0, 0, 0.85]);

    window.localStorage.setItem(
      "cozy-room-dev-world-data-v1",
      JSON.stringify({
        ...legacySandboxState,
        pets: [
          {
            id: "legacy-cat-1",
            type: "minecraft_cat",
            presetId: "better_cat_glb",
            acquiredFrom: "pet_shop",
            spawnPosition: [0.5, 0, 1.5]
          }
        ]
      })
    );

    const loadedState = loadPersistedSandboxState(
      [10.5, 8.7, 10.5],
      [0, 0, 0.85],
      legacySandboxState.roomState
    );

    expect(loadedState.pets).toHaveLength(1);
    expect(loadedState.pets[0]).toMatchObject({
      id: "legacy-cat-1",
      type: "minecraft_cat",
      presetId: "better_cat_glb",
      acquiredFrom: "pet_shop",
      spawnPosition: [0.5, 0, 1.5],
      displayName: "Cat",
      status: "active_room",
      behaviorProfileId: "curious",
      care: {
        hunger: 75,
        affection: 75,
        energy: 75,
        lastCareActionAt: null
      }
    });
    expect(Number.isNaN(Date.parse(loadedState.pets[0].care.lastUpdatedAt))).toBe(false);
  });
});