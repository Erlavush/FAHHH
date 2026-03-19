import { FURNITURE_REGISTRY, type FurniturePlacementSurface, type FurnitureType } from "./furnitureRegistry";
import {
  cloneRoomState,
  createDefaultRoomState,
  type RoomFurniturePlacement,
  type RoomState,
  type Vector3Tuple
} from "./roomState";

export type PersistedFurniturePlacement = RoomFurniturePlacement;
export type PersistedFurnitureType = FurnitureType;
export type PersistedVector3 = Vector3Tuple;

export interface PersistedSandboxState {
  version: 1;
  skinSrc: string | null;
  cameraPosition: PersistedVector3;
  playerPosition: PersistedVector3;
  roomState: RoomState;
}

const DEV_SANDBOX_STATE_KEY = "cozy-room-dev-sandbox";
const DEV_SKIN_KEY = "cozy-room-dev-skin";
const DEV_FURNITURE_KEY = "cozy-room-dev-furniture";
const DEV_CAMERA_KEY = "cozy-room-dev-camera";
const DEV_PLAYER_KEY = "cozy-room-dev-player";

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isValidVector3(value: unknown): value is PersistedVector3 {
  return Array.isArray(value) && value.length === 3 && value.every((entry) => typeof entry === "number");
}

function isValidPlacementSurface(value: unknown): value is FurniturePlacementSurface {
  return value === "floor" || value === "wall_back" || value === "wall_left";
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
    typeof value.rotationY === "number"
  );
}

function isValidRoomState(value: unknown): value is RoomState {
  return (
    typeof value === "object" &&
    value !== null &&
    "metadata" in value &&
    "furniture" in value &&
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
    value.furniture.every(isValidFurniturePlacement)
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

    return [parsedValue[0], parsedValue[1], parsedValue[2]];
  } catch {
    return fallback;
  }
}

function loadLegacyFurniturePlacements(
  fallback: PersistedFurniturePlacement[]
): PersistedFurniturePlacement[] {
  if (!canUseLocalStorage()) {
    return fallback;
  }

  try {
    const storedValue = window.localStorage.getItem(DEV_FURNITURE_KEY);

    if (!storedValue) {
      return fallback;
    }

    const parsedValue = JSON.parse(storedValue) as unknown;

    if (!Array.isArray(parsedValue)) {
      return fallback;
    }

    return parsedValue
      .map((entry) => {
        if (!isValidFurniturePlacement(entry)) {
          if (
            typeof entry === "object" &&
            entry !== null &&
            "id" in entry &&
            "type" in entry &&
            "position" in entry &&
            "rotationY" in entry &&
            typeof entry.id === "string" &&
            typeof entry.type === "string" &&
            entry.type in FURNITURE_REGISTRY &&
            Array.isArray(entry.position) &&
            entry.position.length === 3 &&
            entry.position.every((item: unknown) => typeof item === "number") &&
            typeof entry.rotationY === "number"
          ) {
            return {
              id: entry.id,
              type: entry.type as FurnitureType,
              surface: FURNITURE_REGISTRY[entry.type as FurnitureType].surface === "wall"
                ? "wall_back"
                : "floor",
              position: [entry.position[0], entry.position[1], entry.position[2]] as PersistedVector3,
              rotationY: entry.rotationY
            };
          }

          return null;
        }

        return {
          id: entry.id,
          type: entry.type,
          surface: entry.surface,
          position: [entry.position[0], entry.position[1], entry.position[2]] as PersistedVector3,
          rotationY: entry.rotationY
        };
      })
      .filter((entry): entry is PersistedFurniturePlacement => entry !== null);
  } catch {
    return fallback;
  }
}

function loadLegacySandboxState(
  fallbackCameraPosition: PersistedVector3,
  fallbackPlayerPosition: PersistedVector3,
  fallbackRoomState: RoomState
): PersistedSandboxState {
  const roomState = cloneRoomState(fallbackRoomState);

  roomState.furniture = loadLegacyFurniturePlacements(roomState.furniture);

  return {
    version: 1,
    skinSrc: loadPersistedSkin(),
    cameraPosition: loadLegacyVector3(DEV_CAMERA_KEY, fallbackCameraPosition),
    playerPosition: loadLegacyVector3(DEV_PLAYER_KEY, fallbackPlayerPosition),
    roomState
  };
}

function shouldResetToFallbackRoomState(
  persistedRoomState: RoomState,
  fallbackRoomState: RoomState
): boolean {
  return (
    persistedRoomState.metadata.roomTheme !== fallbackRoomState.metadata.roomTheme ||
    persistedRoomState.metadata.layoutVersion < fallbackRoomState.metadata.layoutVersion
  );
}

export function createDefaultSandboxState(
  cameraPosition: PersistedVector3,
  playerPosition: PersistedVector3
): PersistedSandboxState {
  return {
    version: 1,
    skinSrc: null,
    cameraPosition,
    playerPosition,
    roomState: createDefaultRoomState()
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
    const storedValue = window.localStorage.getItem(DEV_SANDBOX_STATE_KEY);

    if (!storedValue) {
      return loadLegacySandboxState(
        fallbackCameraPosition,
        fallbackPlayerPosition,
        fallbackRoomState
      );
    }

    const parsedValue = JSON.parse(storedValue) as unknown;

    if (
      typeof parsedValue !== "object" ||
      parsedValue === null ||
      !("version" in parsedValue) ||
      parsedValue.version !== 1 ||
      !("skinSrc" in parsedValue) ||
      !("cameraPosition" in parsedValue) ||
      !("playerPosition" in parsedValue) ||
      !("roomState" in parsedValue) ||
      (parsedValue.skinSrc !== null && typeof parsedValue.skinSrc !== "string") ||
      !isValidVector3(parsedValue.cameraPosition) ||
      !isValidVector3(parsedValue.playerPosition) ||
      !isValidRoomState(parsedValue.roomState)
    ) {
      return loadLegacySandboxState(
        fallbackCameraPosition,
        fallbackPlayerPosition,
        fallbackRoomState
      );
    }

    if (shouldResetToFallbackRoomState(parsedValue.roomState, fallbackRoomState)) {
      return {
        version: 1,
        skinSrc: parsedValue.skinSrc,
        cameraPosition: [...fallbackCameraPosition],
        playerPosition: [...fallbackPlayerPosition],
        roomState: cloneRoomState(fallbackRoomState)
      };
    }

    return {
      version: 1,
      skinSrc: parsedValue.skinSrc,
      cameraPosition: [
        parsedValue.cameraPosition[0],
        parsedValue.cameraPosition[1],
        parsedValue.cameraPosition[2]
      ],
      playerPosition: [
        parsedValue.playerPosition[0],
        parsedValue.playerPosition[1],
        parsedValue.playerPosition[2]
      ],
      roomState: cloneRoomState(parsedValue.roomState)
    };
  } catch {
    return loadLegacySandboxState(
      fallbackCameraPosition,
      fallbackPlayerPosition,
      fallbackRoomState
    );
  }
}

export function savePersistedSandboxState(state: PersistedSandboxState): void {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(DEV_SANDBOX_STATE_KEY, JSON.stringify(state));
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
