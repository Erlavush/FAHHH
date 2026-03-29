import {
  createOwnedPetCareState,
  type OwnedPet,
  type PetBehaviorProfileId,
  type OwnedPetCareState
} from "./pets";
import type { SharedPetLiveState } from "./sharedPresenceTypes";
import type { Vector3Tuple } from "./roomState";
import type { SharedRoomPetRecord } from "./sharedRoomTypes";

export function createSharedRoomPetRecord(
  spawnPosition: Vector3Tuple,
  actorPlayerId: string,
  nowIso: string,
  options?: {
    id?: string;
    presetId?: string;
    displayName?: string;
    behaviorProfileId?: PetBehaviorProfileId;
    care?: OwnedPetCareState;
  }
): SharedRoomPetRecord {
  return {
    id: options?.id ?? "shared-pet-minecraft_cat",
    type: "minecraft_cat",
    presetId: options?.presetId ?? "better_cat_variant_tabby",
    displayName: options?.displayName ?? "Shared Cat",
    behaviorProfileId: options?.behaviorProfileId ?? "curious",
    spawnPosition: [...spawnPosition] as Vector3Tuple,
    adoptedAt: nowIso,
    adoptedByPlayerId: actorPlayerId,
    care: options?.care ?? createOwnedPetCareState(nowIso)
  };
}

export function cloneSharedRoomPetRecord(
  sharedPet: SharedRoomPetRecord
): SharedRoomPetRecord {
  return {
    ...sharedPet,
    spawnPosition: [...sharedPet.spawnPosition] as Vector3Tuple,
    care: {
      ...sharedPet.care
    }
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
    velocity: [0, 0, 0],
    walkAmount: 0
  };
}

export function cloneSharedPetLiveState(
  petState: SharedPetLiveState
): SharedPetLiveState {
  return {
    ...petState,
    position: [...petState.position] as Vector3Tuple,
    velocity: [...petState.velocity] as Vector3Tuple,
    targetPosition:
      petState.targetPosition === null
        ? null
        : ([...petState.targetPosition] as Vector3Tuple)
  };
}

export function migrateLegacySharedPetRecord(
  rawPet: any,
  nowIso: string
): SharedRoomPetRecord {
  const spawnPosition = (rawPet.spawnPosition || [0, 0, 0]) as Vector3Tuple;
  let presetId = (rawPet.presetId || "better_cat_variant_tabby") as string;
  if (presetId === "better_cat_glb") {
    presetId = "better_cat_variant_tabby";
  }

  return {
    id: rawPet.id || `shared-pet-minecraft_cat-${crypto.randomUUID()}`,
    type: "minecraft_cat",
    presetId,
    displayName: rawPet.displayName || "Shared Cat",
    behaviorProfileId: rawPet.behaviorProfileId || "curious",
    spawnPosition: [...spawnPosition] as Vector3Tuple,
    adoptedAt: rawPet.adoptedAt || nowIso,
    adoptedByPlayerId: rawPet.adoptedByPlayerId || "legacy-system",
    care: rawPet.care ? { ...rawPet.care } : createOwnedPetCareState(nowIso)
  };
}

export function toRuntimeOwnedPet(sharedPet: SharedRoomPetRecord): OwnedPet {
  return {
    id: sharedPet.id,
    type: sharedPet.type,
    presetId: sharedPet.presetId,
    acquiredFrom: "pet_shop",
    spawnPosition: [...sharedPet.spawnPosition] as Vector3Tuple,
    displayName: sharedPet.displayName,
    status: "active_room",
    behaviorProfileId: sharedPet.behaviorProfileId,
    care: {
      ...sharedPet.care
    }
  };
}