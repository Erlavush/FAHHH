import type { OwnedPet } from "./pets";
import type { SharedPetLiveState } from "./sharedPresenceTypes";
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

export function createSharedPetLiveState(
  sharedPet: SharedRoomPetRecord,
  ownerPlayerId: string,
  nowIso: string
): SharedPetLiveState {
  return {
    ownerPlayerId,
    petId: sharedPet.id,
    position: [...sharedPet.spawnPosition] as Vector3Tuple,
    rotationY: 0,
    stridePhase: 0,
    targetPosition: null,
    updatedAt: nowIso,
    walkAmount: 0
  };
}

export function cloneSharedPetLiveState(
  petState: SharedPetLiveState
): SharedPetLiveState {
  return {
    ...petState,
    position: [...petState.position] as Vector3Tuple,
    targetPosition:
      petState.targetPosition === null
        ? null
        : ([...petState.targetPosition] as Vector3Tuple)
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
