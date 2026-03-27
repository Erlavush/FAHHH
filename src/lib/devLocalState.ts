import { FURNITURE_REGISTRY, type FurniturePlacementSurface, type FurnitureType } from "./furnitureRegistry";
import { DEFAULT_STARTING_COINS } from "./economy";
import {
  createDefaultPcMinigameProgress,
  type PcMinigameProgress
} from "./pcMinigame";
import { cloneOwnedPets, PET_REGISTRY, type OwnedPet } from "./pets";
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
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "type" in value &&
    typeof value.type === "string" &&
    value.type in PET_REGISTRY &&
    "presetId" in value &&
    typeof value.presetId === "string" &&
    "acquiredFrom" in value &&
    value.acquiredFrom === "pet_shop" &&
    "spawnPosition" in value &&
    isValidVector3(value.spawnPosition)
  );
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

export function createDefaultSandboxState(
  cameraPosition: PersistedVector3,
  playerPosition: PersistedVector3
): PersistedSandboxState {
  return {
    version: 6,
    skinSrc: null,
    cameraPosition,
    playerPosition,
    playerCoins: DEFAULT_STARTING_COINS,
    roomState: createDefaultRoomState(),
    pcMinigame: createDefaultPcMinigameProgress(),
    pets: []
  };
}

export function loadPersistedSandboxState(
  fallbackCameraPosition: PersistedVector3,
  fallbackPlayerPosition: PersistedVector3,
  fallbackRoomState = createDefaultRoomState()
): PersistedSandboxState {
  if (!canUseLocalStorage()) {
    return createDefaultSandboxState(fallbackCameraPosition, fallbackPlayerPosition);
  }

  try {
    const storedValue =
      window.localStorage.getItem(DEV_WORLD_DATA_KEY) ??
      window.localStorage.getItem(LEGACY_SANDBOX_STATE_KEY);

    if (!storedValue) {
      return createDefaultSandboxState(fallbackCameraPosition, fallbackPlayerPosition);
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
      return createDefaultSandboxState(fallbackCameraPosition, fallbackPlayerPosition);
    }

    const parsedPets =
      "pets" in parsedValue && Array.isArray(parsedValue.pets)
        ? cloneOwnedPets(parsedValue.pets.filter(isValidOwnedPet))
        : [];

    if (shouldResetToFallbackRoomState(parsedValue.roomState, fallbackRoomState, parsedValue.version)) {
      return {
        version: 6,
        skinSrc: parsedValue.skinSrc,
        cameraPosition: [...fallbackCameraPosition],
        playerPosition: [...fallbackPlayerPosition],
        playerCoins:
          "playerCoins" in parsedValue && isValidPlayerCoins(parsedValue.playerCoins)
            ? Math.floor(parsedValue.playerCoins)
            : DEFAULT_STARTING_COINS,
        roomState: cloneRoomState(fallbackRoomState),
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
    return createDefaultSandboxState(fallbackCameraPosition, fallbackPlayerPosition);
  }
}

export function savePersistedSandboxState(state: PersistedSandboxState): void {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(DEV_WORLD_DATA_KEY, JSON.stringify(state));
    window.localStorage.setItem(DEV_SKIN_KEY, state.skinSrc ?? "");
    window.localStorage.setItem(DEV_CAMERA_KEY, JSON.stringify(state.cameraPosition));
    window.localStorage.setItem(DEV_PLAYER_KEY, JSON.stringify(state.playerPosition));
    window.localStorage.setItem(DEV_FURNITURE_KEY, JSON.stringify(state.roomState.furniture));
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
