import { describe, expect, it } from "vitest";
import {
  BETTER_CATS_CATALOG,
  cloneOwnedPet,
  countOwnedPetsByPresetId,
  countOwnedPetsByStatus,
  countOwnedPetsByType,
  createOwnedPet,
  getNextPetDisplayName,
  PET_REGISTRY,
  SANDBOX_PET_CATALOG
} from "../src/lib/pets";

describe("pet registry", () => {
  it("only includes cat presets for the showcase pet system", () => {
    expect(Object.keys(PET_REGISTRY)).toEqual(["minecraft_cat"]);
    expect(PET_REGISTRY.minecraft_cat.presetId).toBe("better_cat_variant_tabby");
    expect(PET_REGISTRY.minecraft_cat.price).toBe(0);
  });

  it("exposes the local sandbox catalog with the checked-in Better Cats presets", () => {
    expect(SANDBOX_PET_CATALOG.map((pet) => pet.presetId)).toEqual([
      "better_cat_variant_tabby",
      "better_cat_variant_red",
      "better_cat_variant_calico",
      "better_cat_variant_siamese",
      "better_cat_variant_british_shorthair",
      "better_cat_variant_ragdoll",
      "better_cat_variant_black",
      "better_cat_variant_white"
    ]);
    expect(SANDBOX_PET_CATALOG.every((pet) => pet.type === "minecraft_cat")).toBe(true);
  });

  it("exposes the curated Better Cats catalog for the adoption loop", () => {
    const curatedIds = [
      "better_cat_variant_tabby",
      "better_cat_variant_red",
      "better_cat_variant_calico",
      "better_cat_variant_siamese",
      "better_cat_variant_british_shorthair",
      "better_cat_variant_ragdoll",
      "better_cat_variant_black",
      "better_cat_variant_white"
    ];
    expect(BETTER_CATS_CATALOG.map((p) => p.presetId)).toEqual(curatedIds);
    expect(BETTER_CATS_CATALOG.every((p) => p.type === "minecraft_cat")).toBe(true);
    expect(BETTER_CATS_CATALOG.every((p) => p.description.includes("A curated Better Cats variant"))).toBe(true);
  });

  it("creates roster-ready cat records with default care state", () => {
    const pet = createOwnedPet("minecraft_cat", [1.25, 0, -0.75], {
      id: "pet-minecraft_cat-1",
      displayName: "Miso",
      status: "stored_roster",
      behaviorProfileId: "lazy",
      nowIso: "2026-03-27T10:00:00.000Z"
    });

    expect(pet).toEqual({
      id: "pet-minecraft_cat-1",
      type: "minecraft_cat",
      presetId: "better_cat_variant_tabby",
      acquiredFrom: "pet_shop",
      spawnPosition: [1.25, 0, -0.75],
      displayName: "Miso",
      status: "stored_roster",
      behaviorProfileId: "lazy",
      care: {
        hunger: 75,
        affection: 75,
        energy: 75,
        lastUpdatedAt: "2026-03-27T10:00:00.000Z",
        lastCareActionAt: null
      }
    });
  });

  it("allows a local cat purchase to override the imported preset id", () => {
    const pet = createOwnedPet("minecraft_cat", [0, 0, 0], {
      id: "pet-minecraft_cat-imported",
      displayName: "Cat 1",
      presetId: "better_cat_fluffy_body_big_ears_bobtail",
      nowIso: "2026-03-28T00:00:00.000Z"
    });

    expect(pet.presetId).toBe("better_cat_fluffy_body_big_ears_bobtail");
  });

  it("clones nested pet state without reusing mutable references", () => {
    const original = createOwnedPet("minecraft_cat", [0.5, 0, 1.5], {
      id: "pet-minecraft_cat-2",
      displayName: "Nori",
      nowIso: "2026-03-27T10:05:00.000Z"
    });

    const clone = cloneOwnedPet(original);

    expect(clone).toEqual(original);
    expect(clone).not.toBe(original);
    expect(clone.spawnPosition).not.toBe(original.spawnPosition);
    expect(clone.care).not.toBe(original.care);
  });

  it("counts active-room cats, stored cats, and owned presets separately", () => {
    const pets = [
      createOwnedPet("minecraft_cat", [0.5, 0, 1.5], {
        id: "pet-minecraft_cat-1",
        displayName: "Cat 1",
        status: "active_room",
        presetId: "better_cat_glb",
        nowIso: "2026-03-27T10:00:00.000Z"
      }),
      createOwnedPet("minecraft_cat", [1.5, 0, -0.5], {
        id: "pet-minecraft_cat-2",
        displayName: "Cat 2",
        status: "stored_roster",
        presetId: "better_cat_fluffy_body_base_ears_flufftail",
        nowIso: "2026-03-27T10:05:00.000Z"
      })
    ];

    expect(countOwnedPetsByType(pets, "minecraft_cat")).toBe(2);
    expect(countOwnedPetsByStatus(pets, "active_room", "minecraft_cat")).toBe(1);
    expect(countOwnedPetsByStatus(pets, "stored_roster", "minecraft_cat")).toBe(1);
    expect(countOwnedPetsByStatus(pets, "active_room")).toBe(1);
    expect(countOwnedPetsByPresetId(pets, "better_cat_fluffy_body_base_ears_flufftail")).toBe(1);
  });

  it("generates sequential cat names from the existing roster", () => {
    const pets = [
      createOwnedPet("minecraft_cat", [0.5, 0, 1.5], {
        id: "pet-minecraft_cat-legacy",
        displayName: "Cat",
        status: "active_room",
        nowIso: "2026-03-27T10:00:00.000Z"
      }),
      createOwnedPet("minecraft_cat", [1.5, 0, -0.5], {
        id: "pet-minecraft_cat-4",
        displayName: "Cat 4",
        status: "stored_roster",
        nowIso: "2026-03-27T10:05:00.000Z"
      })
    ];

    expect(getNextPetDisplayName("minecraft_cat", pets)).toBe("Cat 5");
  });
});
