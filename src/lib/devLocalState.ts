import { FURNITURE_REGISTRY, type FurniturePlacementSurface, type FurnitureType } from "./furnitureRegistry";
import { DEFAULT_STARTING_COINS } from "./economy";
import {
  createDefaultPcMinigameProgress,
  type PcMinigameProgress
} from "./pcMinigame";
import {
  cloneOwnedPets,
  createOwnedPetCareState,
  PET_REGISTRY,
  type OwnedPet,
  type OwnedPetCareState,
  type OwnedPetStatus,
  type PetBehaviorProfileId,
  type PetType
} from "./pets";
import {
  cloneRoomState,
  createDefaultRoomState,
  ensureRoomStateOwnership,
  type OwnedFurnitureItem,
  type RoomFurniturePlacement,
  type RoomState,
  type Vector3Tuple
} from "./roomState";

export type PersistedFurniturePlacement = RoomFurniturePlacement;
export type PersistedFurnitureType = FurnitureType;
export type PersistedVector3 = Vector3Tuple;

export interface PersistedSandboxState {
  version: 6;
  skinSrc: string | null;
  cameraPosition: PersistedVector3;
  playerPosition: PersistedVector3;
  playerCoins: number;
  roomState: RoomState;
  pcMinigame: PcMinigameProgress;
  pets: OwnedPet[];
}

const DEV_WORLD_DATA_KEY = "cozy-room-dev-world-data-v1";
const DEV_DEFAULT_ROOM_STATE_KEY = "cozy-room-dev-default-room-v1";
const LEGACY_SANDBOX_STATE_KEY = "cozy-room-dev-sandbox-v6";
const DEV_SKIN_KEY = "cozy-room-dev-skin";
const DEV_CAMERA_KEY = "cozy-room-dev-camera";
const DEV_PLAYER_KEY = "cozy-room-dev-player";
const DEV_FURNITURE_KEY = "cozy-room-dev-furniture";

function clampCoordinate(val: number): number {
  return typeof val !== "number" || isNaN(val) ? 0 : Math.max(-20, Math.min(20, val));
}

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isValidVector3(value: unknown): value is PersistedVector3 {
  return Array.isArray(value) && value.length === 3 && value.every((entry) => typeof entry === "number");
}

function isValidPlayerCoins(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isValidOwnedPetStatus(value: unknown): value is OwnedPetStatus {
  return value === "active_room" || value === "stored_roster";
}

function isValidPetBehaviorProfileId(value: unknown): value is PetBehaviorProfileId {
  return (
    value === "lazy" ||
    value === "curious" ||
    value === "clingy" ||
    value === "zoomies"
  );
}

function isValidIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function normalizePetCareValue(value: number): number {
  return Math.max(0, Math.min(100, Math.floor(value)));
}

function isValidOwnedPetCareState(value: unknown): value is OwnedPetCareState {
  return (
    typeof value === "object" &&
    value !== null &&
    "hunger" in value &&
    typeof value.hunger === "number" &&
    Number.isFinite(value.hunger) &&
    "affection" in value &&
    typeof value.affection === "number" &&
    Number.isFinite(value.affection) &&
    "energy" in value &&
    typeof value.energy === "number" &&
    Number.isFinite(value.energy) &&
    "lastUpdatedAt" in value &&
    isValidIsoTimestamp(value.lastUpdatedAt) &&
    "lastCareActionAt" in value &&
    (value.lastCareActionAt === null || isValidIsoTimestamp(value.lastCareActionAt))
  );
}

function normalizeOwnedPet(value: unknown, nowIso: string): OwnedPet | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const rawPet = value as Record<string, unknown>;

  if (
    typeof rawPet.id !== "string" ||
    typeof rawPet.type !== "string" ||
    !(rawPet.type in PET_REGISTRY) ||
    typeof rawPet.presetId !== "string" ||
    rawPet.acquiredFrom !== "pet_shop" ||
    !isValidVector3(rawPet.spawnPosition)
  ) {
    return null;
  }

  const petType = rawPet.type as PetType;
  let presetId = rawPet.presetId as string;

  // Normalize legacy Better Cats cats to the curated tabby variant baseline.
  if (presetId === "better_cat_glb") {
    presetId = "better_cat_variant_tabby";
  }

  const rawSpawnPosition = rawPet.spawnPosition;
  const rawCare = rawPet.care;
  const care = isValidOwnedPetCareState(rawCare)
    ? {
        hunger: normalizePetCareValue(rawCare.hunger),
        affection: normalizePetCareValue(rawCare.affection),
        energy: normalizePetCareValue(rawCare.energy),
        lastUpdatedAt: rawCare.lastUpdatedAt,
        lastCareActionAt: rawCare.lastCareActionAt
      }
    : createOwnedPetCareState(nowIso, {
        hunger: 75,
        affection: 75,
        energy: 75
      });

  return {
    id: rawPet.id,
    type: petType,
    presetId: presetId,
    acquiredFrom: "pet_shop",
    spawnPosition: [
      clampCoordinate(rawSpawnPosition[0]),
      clampCoordinate(rawSpawnPosition[1]),
      clampCoordinate(rawSpawnPosition[2])
    ] as PersistedVector3,
    displayName:
      typeof rawPet.displayName === "string" && rawPet.displayName.trim().length > 0
        ? rawPet.displayName.trim()
        : PET_REGISTRY[petType].label,
    status: isValidOwnedPetStatus(rawPet.status) ? rawPet.status : "active_room",
    behaviorProfileId: isValidPetBehaviorProfileId(rawPet.behaviorProfileId)
      ? rawPet.behaviorProfileId
      : "curious",
    care
  };
}

function isValidPlacementSurface(value: unknown): value is FurniturePlacementSurface {
  return (
    value === "floor" ||
    value === "wall_back" ||
    value === "wall_left" ||
    value === "wall_front" ||
    value === "wall_right" ||
    value === "surface" ||
    value === "ceiling"
  );
}

function isValidFurniturePlacement(value: unknown): value is PersistedFurniturePlacement {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "type" in value &&
    "surface" in value &&
    "position" in value &&
    "rotationY" in value &&
    typeof value.id === "string" &&
    typeof value.type === "string" &&
    value.type in FURNITURE_REGISTRY &&
    isValidPlacementSurface(value.surface) &&
    Array.isArray(value.position) &&
    value.position.length === 3 &&
    value.position.every((entry) => typeof entry === "number") &&
    typeof value.rotationY === "number" &&
    (!("ownedFurnitureId" in value) ||
      value.ownedFurnitureId === undefined ||
      typeof value.ownedFurnitureId === "string") &&
    (!("anchorFurnitureId" in value) ||
      value.anchorFurnitureId === undefined ||
      typeof value.anchorFurnitureId === "string") &&
    (!("surfaceLocalOffset" in value) ||
      value.surfaceLocalOffset === undefined ||
      (Array.isArray(value.surfaceLocalOffset) &&
        value.surfaceLocalOffset.length === 2 &&
        value.surfaceLocalOffset.every((entry) => typeof entry === "number")))
  );
}

function isValidOwnedFurnitureItem(value: unknown): value is OwnedFurnitureItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "type" in value &&
    "ownerId" in value &&
    "acquiredFrom" in value &&
    typeof value.id === "string" &&
    typeof value.type === "string" &&
    value.type in FURNITURE_REGISTRY &&
    typeof value.ownerId === "string" &&
    (value.acquiredFrom === "starter" || value.acquiredFrom === "sandbox_catalog")
  );
}

function isValidOwnedPet(value: unknown): value is OwnedPet {
  return normalizeOwnedPet(value, "1970-01-01T00:00:00.000Z") !== null;
}

function isValidRoomState(value: unknown): value is RoomState {
  return (
    typeof value === "object" &&
    value !== null &&
    "metadata" in value &&
    "furniture" in value &&
    "ownedFurniture" in value &&
    typeof value.metadata === "object" &&
    value.metadata !== null &&
    "roomId" in value.metadata &&
    "roomTheme" in value.metadata &&
    "layoutVersion" in value.metadata &&
    "unlockedFurniture" in value.metadata &&
    typeof value.metadata.roomId === "string" &&
    typeof value.metadata.roomTheme === "string" &&
    typeof value.metadata.layoutVersion === "number" &&
    Array.isArray(value.metadata.unlockedFurniture) &&
    value.metadata.unlockedFurniture.every(
      (entry) => typeof entry === "string" && entry in FURNITURE_REGISTRY
    ) &&
    Array.isArray(value.furniture) &&
    value.furniture.every(isValidFurniturePlacement) &&
    Array.isArray(value.ownedFurniture) &&
    value.ownedFurniture.every(isValidOwnedFurnitureItem)
  );
}

function isValidPcMinigameProgress(value: unknown): value is PcMinigameProgress {
  return (
    typeof value === "object" &&
    value !== null &&
    "bestScore" in value &&
    "lastScore" in value &&
    "gamesPlayed" in value &&
    "totalCoinsEarned" in value &&
    "lastRewardCoins" in value &&
    "lastCompletedAt" in value &&
    typeof value.bestScore === "number" &&
    Number.isFinite(value.bestScore) &&
    value.bestScore >= 0 &&
    typeof value.lastScore === "number" &&
    Number.isFinite(value.lastScore) &&
    value.lastScore >= 0 &&
    typeof value.gamesPlayed === "number" &&
    Number.isFinite(value.gamesPlayed) &&
    value.gamesPlayed >= 0 &&
    typeof value.totalCoinsEarned === "number" &&
    Number.isFinite(value.totalCoinsEarned) &&
    value.totalCoinsEarned >= 0 &&
    typeof value.lastRewardCoins === "number" &&
    Number.isFinite(value.lastRewardCoins) &&
    value.lastRewardCoins >= 0 &&
    (value.lastCompletedAt === null ||
      (typeof value.lastCompletedAt === "number" &&
        Number.isFinite(value.lastCompletedAt) &&
        value.lastCompletedAt >= 0))
  );
}

function loadLegacyVector3(key: string, fallback: PersistedVector3): PersistedVector3 {
  if (!canUseLocalStorage()) {
    return fallback;
  }

  try {
    const storedValue = window.localStorage.getItem(key);

    if (!storedValue) {
      return fallback;
    }

    const parsedValue = JSON.parse(storedValue) as unknown;

    if (!isValidVector3(parsedValue)) {
      return fallback;
    }

    return [
      clampCoordinate(parsedValue[0]),
      clampCoordinate(parsedValue[1]),
      clampCoordinate(parsedValue[2])
    ];
  } catch {
    return fallback;
  }
}

function shouldResetToFallbackRoomState(
  persistedRoomState: RoomState,
  fallbackRoomState: RoomState,
  persistedVersion: number
): boolean {
  return (
    persistedVersion < 6 ||
    persistedRoomState.metadata.roomTheme !== fallbackRoomState.metadata.roomTheme ||
    persistedRoomState.metadata.layoutVersion < fallbackRoomState.metadata.layoutVersion
  );
}

function loadPersistedDefaultRoomState(
  fallbackRoomState = createDefaultRoomState()
): RoomState {
  if (!canUseLocalStorage()) {
    return cloneRoomState(fallbackRoomState);
  }

  try {
    const storedValue = window.localStorage.getItem(DEV_DEFAULT_ROOM_STATE_KEY);

    if (!storedValue) {
      return cloneRoomState(fallbackRoomState);
    }

    const parsedValue = JSON.parse(storedValue) as unknown;

    if (!isValidRoomState(parsedValue)) {
      return cloneRoomState(fallbackRoomState);
    }

    return ensureRoomStateOwnership(cloneRoomState(parsedValue));
  } catch {
    return cloneRoomState(fallbackRoomState);
  }
}

function savePersistedDefaultRoomState(roomState: RoomState): void {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(
      DEV_DEFAULT_ROOM_STATE_KEY,
      JSON.stringify(ensureRoomStateOwnership(cloneRoomState(roomState)))
    );
  } catch {
    // Ignore local browser storage failures in dev mode.
  }
}

export function createDefaultSandboxState(
  cameraPosition: PersistedVector3,
  playerPosition: PersistedVector3,
  fallbackRoomState = createDefaultRoomState()
): PersistedSandboxState {
  return {
    version: 6,
    skinSrc: null,
    cameraPosition,
    playerPosition,
    playerCoins: DEFAULT_STARTING_COINS,
    roomState: loadPersistedDefaultRoomState(fallbackRoomState),
    pcMinigame: createDefaultPcMinigameProgress(),
    pets: []
  };
}

export function clonePersistedSandboxState(
  state: PersistedSandboxState
): PersistedSandboxState {
  return {
    version: 6,
    skinSrc: state.skinSrc,
    cameraPosition: [...state.cameraPosition] as PersistedVector3,
    playerPosition: [...state.playerPosition] as PersistedVector3,
    playerCoins: Math.max(0, Math.floor(state.playerCoins)),
    roomState: ensureRoomStateOwnership(cloneRoomState(state.roomState)),
    pcMinigame: {
      bestScore: Math.max(0, Math.floor(state.pcMinigame.bestScore)),
      lastScore: Math.max(0, Math.floor(state.pcMinigame.lastScore)),
      gamesPlayed: Math.max(0, Math.floor(state.pcMinigame.gamesPlayed)),
      totalCoinsEarned: Math.max(0, Math.floor(state.pcMinigame.totalCoinsEarned)),
      lastRewardCoins: Math.max(0, Math.floor(state.pcMinigame.lastRewardCoins)),
      lastCompletedAt: state.pcMinigame.lastCompletedAt
    },
    pets: cloneOwnedPets(state.pets.filter(isValidOwnedPet))
  };
}

function resolveFallbackSandboxState(
  fallbackCameraPosition: PersistedVector3,
  fallbackPlayerPosition: PersistedVector3,
  fallbackRoomState: RoomState,
  seedState?: PersistedSandboxState
): PersistedSandboxState {
  return seedState
    ? clonePersistedSandboxState(seedState)
    : createDefaultSandboxState(
        fallbackCameraPosition,
        fallbackPlayerPosition,
        fallbackRoomState
      );
}

export function loadPersistedSandboxState(
  fallbackCameraPosition: PersistedVector3,
  fallbackPlayerPosition: PersistedVector3,
  fallbackRoomState = createDefaultRoomState(),
  seedState?: PersistedSandboxState
): PersistedSandboxState {
  if (!canUseLocalStorage()) {
    return resolveFallbackSandboxState(
      fallbackCameraPosition,
      fallbackPlayerPosition,
      fallbackRoomState,
      seedState
    );
  }

  const defaultRoomState = loadPersistedDefaultRoomState(fallbackRoomState);

  try {
    const storedValue =
      window.localStorage.getItem(DEV_WORLD_DATA_KEY) ??
      window.localStorage.getItem(LEGACY_SANDBOX_STATE_KEY);

    if (!storedValue) {
      return resolveFallbackSandboxState(
        fallbackCameraPosition,
        fallbackPlayerPosition,
        defaultRoomState,
        seedState
      );
    }

    const parsedValue = JSON.parse(storedValue) as unknown;

    if (
      typeof parsedValue !== "object" ||
      parsedValue === null ||
      !("version" in parsedValue) ||
      (parsedValue.version !== 5 && parsedValue.version !== 6) ||
      !("skinSrc" in parsedValue) ||
      !("cameraPosition" in parsedValue) ||
      !("playerPosition" in parsedValue) ||
      !("roomState" in parsedValue) ||
      (parsedValue.skinSrc !== null && typeof parsedValue.skinSrc !== "string") ||
      !isValidVector3(parsedValue.cameraPosition) ||
      !isValidVector3(parsedValue.playerPosition) ||
      !isValidRoomState(parsedValue.roomState)
    ) {
      return resolveFallbackSandboxState(
        fallbackCameraPosition,
        fallbackPlayerPosition,
        defaultRoomState,
        seedState
      );
    }

    const petsNowIso = new Date().toISOString();
    const parsedPets =
      "pets" in parsedValue && Array.isArray(parsedValue.pets)
        ? cloneOwnedPets(
            parsedValue.pets
              .map((pet) => normalizeOwnedPet(pet, petsNowIso))
              .filter((pet): pet is OwnedPet => pet !== null)
          )
        : [];

    if (!window.localStorage.getItem(DEV_DEFAULT_ROOM_STATE_KEY)) {
      savePersistedDefaultRoomState(parsedValue.roomState);
    }

    if (
      shouldResetToFallbackRoomState(
        parsedValue.roomState,
        defaultRoomState,
        parsedValue.version
      )
    ) {
      return seedState
        ? clonePersistedSandboxState(seedState)
        : {
            version: 6,
            skinSrc: parsedValue.skinSrc,
            cameraPosition: [...fallbackCameraPosition],
            playerPosition: [...fallbackPlayerPosition],
            playerCoins:
              "playerCoins" in parsedValue && isValidPlayerCoins(parsedValue.playerCoins)
                ? Math.floor(parsedValue.playerCoins)
                : DEFAULT_STARTING_COINS,
            roomState: cloneRoomState(defaultRoomState),
            pcMinigame:
              "pcMinigame" in parsedValue &&
              isValidPcMinigameProgress(parsedValue.pcMinigame)
                ? {
                    bestScore: Math.floor(parsedValue.pcMinigame.bestScore),
                    lastScore: Math.floor(parsedValue.pcMinigame.lastScore),
                    gamesPlayed: Math.floor(parsedValue.pcMinigame.gamesPlayed),
                    totalCoinsEarned: Math.floor(
                      parsedValue.pcMinigame.totalCoinsEarned
                    ),
                    lastRewardCoins: Math.floor(
                      parsedValue.pcMinigame.lastRewardCoins
                    ),
                    lastCompletedAt: parsedValue.pcMinigame.lastCompletedAt
                  }
                : createDefaultPcMinigameProgress(),
            pets: parsedPets
          };
    }

    return {
      version: 6,
      skinSrc: parsedValue.skinSrc,
      cameraPosition: [
        parsedValue.cameraPosition[0],
        parsedValue.cameraPosition[1],
        parsedValue.cameraPosition[2]
      ],
      playerPosition: [
        clampCoordinate(parsedValue.playerPosition[0]),
        clampCoordinate(parsedValue.playerPosition[1]),
        clampCoordinate(parsedValue.playerPosition[2])
      ],
      playerCoins:
        "playerCoins" in parsedValue && isValidPlayerCoins(parsedValue.playerCoins)
          ? Math.floor(parsedValue.playerCoins)
          : DEFAULT_STARTING_COINS,
      roomState: ensureRoomStateOwnership(cloneRoomState(parsedValue.roomState)),
      pcMinigame:
        "pcMinigame" in parsedValue && isValidPcMinigameProgress(parsedValue.pcMinigame)
          ? {
              bestScore: Math.floor(parsedValue.pcMinigame.bestScore),
              lastScore: Math.floor(parsedValue.pcMinigame.lastScore),
              gamesPlayed: Math.floor(parsedValue.pcMinigame.gamesPlayed),
              totalCoinsEarned: Math.floor(parsedValue.pcMinigame.totalCoinsEarned),
              lastRewardCoins: Math.floor(parsedValue.pcMinigame.lastRewardCoins),
              lastCompletedAt: parsedValue.pcMinigame.lastCompletedAt
            }
          : createDefaultPcMinigameProgress(),
      pets: parsedPets
    };
  } catch {
    return resolveFallbackSandboxState(
      fallbackCameraPosition,
      fallbackPlayerPosition,
      defaultRoomState,
      seedState
    );
  }
}

export function savePersistedSandboxState(state: PersistedSandboxState): void {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    const persistedState: PersistedSandboxState = {
      version: 6,
      skinSrc: state.skinSrc,
      cameraPosition: [...state.cameraPosition] as PersistedVector3,
      playerPosition: [...state.playerPosition] as PersistedVector3,
      playerCoins: Math.max(0, Math.floor(state.playerCoins)),
      roomState: ensureRoomStateOwnership(cloneRoomState(state.roomState)),
      pcMinigame: {
        bestScore: Math.max(0, Math.floor(state.pcMinigame.bestScore)),
        lastScore: Math.max(0, Math.floor(state.pcMinigame.lastScore)),
        gamesPlayed: Math.max(0, Math.floor(state.pcMinigame.gamesPlayed)),
        totalCoinsEarned: Math.max(0, Math.floor(state.pcMinigame.totalCoinsEarned)),
        lastRewardCoins: Math.max(0, Math.floor(state.pcMinigame.lastRewardCoins)),
        lastCompletedAt: state.pcMinigame.lastCompletedAt
      },
      pets: cloneOwnedPets(state.pets.filter(isValidOwnedPet))
    };

    window.localStorage.setItem(DEV_WORLD_DATA_KEY, JSON.stringify(persistedState));
    window.localStorage.setItem(DEV_SKIN_KEY, persistedState.skinSrc ?? "");
    window.localStorage.setItem(DEV_CAMERA_KEY, JSON.stringify(persistedState.cameraPosition));
    window.localStorage.setItem(DEV_PLAYER_KEY, JSON.stringify(persistedState.playerPosition));
    window.localStorage.setItem(DEV_FURNITURE_KEY, JSON.stringify(persistedState.roomState.furniture));
  } catch {
    // Ignore local browser storage failures in dev mode.
  }
}

export function loadPersistedSkin(): string | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const value = window.localStorage.getItem(DEV_SKIN_KEY);
    return value ? value : null;
  } catch {
    return null;
  }
}



