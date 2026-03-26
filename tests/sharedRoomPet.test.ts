import { describe, expect, it } from "vitest";
import {
  createSharedRoomPetRecord,
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
});
