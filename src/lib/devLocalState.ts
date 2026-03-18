export type PersistedChairPlacement = {
  position: [number, number, number];
  rotationY: number;
};

export type PersistedVector3 = [number, number, number];

const DEV_SKIN_KEY = "cozy-room-dev-skin";
const DEV_CHAIR_KEY = "cozy-room-dev-chair";
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

export function loadPersistedChairPlacement(
  fallback: PersistedChairPlacement
): PersistedChairPlacement {
  if (!canUseLocalStorage()) {
    return fallback;
  }

  try {
    const storedValue = window.localStorage.getItem(DEV_CHAIR_KEY);

    if (!storedValue) {
      return fallback;
    }

    const parsedValue = JSON.parse(storedValue) as Partial<PersistedChairPlacement>;

    if (
      !Array.isArray(parsedValue.position) ||
      parsedValue.position.length !== 3 ||
      parsedValue.position.some((value) => typeof value !== "number") ||
      typeof parsedValue.rotationY !== "number"
    ) {
      return fallback;
    }

    return {
      position: [
        parsedValue.position[0],
        parsedValue.position[1],
        parsedValue.position[2]
      ],
      rotationY: parsedValue.rotationY
    };
  } catch {
    return fallback;
  }
}

export function savePersistedChairPlacement(placement: PersistedChairPlacement): void {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(DEV_CHAIR_KEY, JSON.stringify(placement));
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
