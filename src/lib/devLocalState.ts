import { FURNITURE_REGISTRY, type FurnitureType } from "./furnitureRegistry";
import type { RoomFurniturePlacement, Vector3Tuple } from "./roomState";

export type PersistedFurniturePlacement = RoomFurniturePlacement;
export type PersistedFurnitureType = FurnitureType;
export type PersistedVector3 = Vector3Tuple;

const DEV_SKIN_KEY = "cozy-room-dev-skin";
const DEV_FURNITURE_KEY = "cozy-room-dev-furniture";
const DEV_CAMERA_KEY = "cozy-room-dev-camera";
const DEV_PLAYER_KEY = "cozy-room-dev-player";

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadPersistedSkin(): string | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    return window.localStorage.getItem(DEV_SKIN_KEY);
  } catch {
    return null;
  }
}

export function savePersistedSkin(skinSrc: string | null): void {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    if (skinSrc) {
      window.localStorage.setItem(DEV_SKIN_KEY, skinSrc);
      return;
    }

    window.localStorage.removeItem(DEV_SKIN_KEY);
  } catch {
    // Ignore local browser storage failures in dev mode.
  }
}

function isValidFurniturePlacement(value: unknown): value is PersistedFurniturePlacement {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "type" in value &&
    "position" in value &&
    "rotationY" in value &&
    typeof value.id === "string" &&
    typeof value.type === "string" &&
    value.type in FURNITURE_REGISTRY &&
    Array.isArray(value.position) &&
    value.position.length === 3 &&
    value.position.every((entry) => typeof entry === "number") &&
    typeof value.rotationY === "number"
  );
}

export function loadPersistedFurniturePlacements(
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

    if (!Array.isArray(parsedValue) || !parsedValue.every(isValidFurniturePlacement)) {
      return fallback;
    }

    return parsedValue.map((placement) => ({
      id: placement.id,
      type: placement.type,
      position: [placement.position[0], placement.position[1], placement.position[2]],
      rotationY: placement.rotationY
    }));
  } catch {
    return fallback;
  }
}

export function savePersistedFurniturePlacements(
  placements: PersistedFurniturePlacement[]
): void {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(DEV_FURNITURE_KEY, JSON.stringify(placements));
  } catch {
    // Ignore local browser storage failures in dev mode.
  }
}

function isValidVector3(value: unknown): value is PersistedVector3 {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((entry) => typeof entry === "number")
  );
}

function loadPersistedVector3(key: string, fallback: PersistedVector3): PersistedVector3 {
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

function savePersistedVector3(key: string, value: PersistedVector3): void {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore local browser storage failures in dev mode.
  }
}

export function loadPersistedCameraPosition(fallback: PersistedVector3): PersistedVector3 {
  return loadPersistedVector3(DEV_CAMERA_KEY, fallback);
}

export function savePersistedCameraPosition(position: PersistedVector3): void {
  savePersistedVector3(DEV_CAMERA_KEY, position);
}

export function loadPersistedPlayerPosition(fallback: PersistedVector3): PersistedVector3 {
  return loadPersistedVector3(DEV_PLAYER_KEY, fallback);
}

export function savePersistedPlayerPosition(position: PersistedVector3): void {
  savePersistedVector3(DEV_PLAYER_KEY, position);
}
