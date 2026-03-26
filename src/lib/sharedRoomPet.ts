import type { OwnedPet } from "./pets";
import type { Vector3Tuple } from "./roomState";
import type { SharedRoomPetRecord } from "./sharedRoomTypes";

export function createSharedRoomPetRecord(
  spawnPosition: Vector3Tuple,
  actorPlayerId: string,
  nowIso: string
): SharedRoomPetRecord {
  return {
    id: "shared-pet-minecraft_cat",
    type: "minecraft_cat",
    presetId: "better_cat_glb",
    spawnPosition: [...spawnPosition] as Vector3Tuple,
    adoptedAt: nowIso,
    adoptedByPlayerId: actorPlayerId
  };
}

export function cloneSharedRoomPetRecord(
  sharedPet: SharedRoomPetRecord
): SharedRoomPetRecord {
  return {
    ...sharedPet,
    spawnPosition: [...sharedPet.spawnPosition] as Vector3Tuple
  };
}

export function toRuntimeOwnedPet(sharedPet: SharedRoomPetRecord): OwnedPet {
  return {
    id: sharedPet.id,
    type: sharedPet.type,
    presetId: sharedPet.presetId,
    acquiredFrom: "pet_shop",
    spawnPosition: [...sharedPet.spawnPosition] as Vector3Tuple
  };
}
