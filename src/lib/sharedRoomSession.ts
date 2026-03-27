import type { SharedPlayerProfile, SharedRoomSession } from "./sharedRoomTypes";

const SHARED_ROOM_PROFILE_KEY = "cozy-room-shared-profile-v1";
const SHARED_ROOM_SESSION_KEY = "cozy-room-shared-session-v1";
const DEFAULT_DISPLAY_NAME = "Player";

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSharedPlayerProfile(value: unknown): value is SharedPlayerProfile {
  return (
    isRecord(value) &&
    typeof value.playerId === "string" &&
    typeof value.displayName === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isSharedRoomSession(value: unknown): value is SharedRoomSession {
  return (
    isRecord(value) &&
    typeof value.playerId === "string" &&
    (typeof value.partnerId === "string" || value.partnerId === null) &&
    typeof value.roomId === "string" &&
    typeof value.inviteCode === "string" &&
    typeof value.lastKnownRevision === "number"
  );
}

function createSharedPlayerProfile(
  displayName = DEFAULT_DISPLAY_NAME,
  canonicalPlayerId?: string | null
): SharedPlayerProfile {
  const normalizedDisplayName = displayName.trim() || DEFAULT_DISPLAY_NAME;
  const timestamp = new Date().toISOString();
  const normalizedCanonicalPlayerId = canonicalPlayerId?.trim() || null;

  return {
    playerId: normalizedCanonicalPlayerId ?? crypto.randomUUID(),
    displayName: normalizedDisplayName,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function writeLocalStorageRecord(key: string, value: unknown): void {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore local browser storage failures in the dev client.
  }
}

function readLocalStorageRecord(key: string): unknown {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(key);
    return storedValue ? (JSON.parse(storedValue) as unknown) : null;
  } catch {
    return null;
  }
}

export function loadOrCreateSharedPlayerProfile(
  displayName = DEFAULT_DISPLAY_NAME,
  options: { canonicalPlayerId?: string | null } = {}
): SharedPlayerProfile {
  const storedProfile = readLocalStorageRecord(SHARED_ROOM_PROFILE_KEY);
  const normalizedCanonicalPlayerId = options.canonicalPlayerId?.trim() || null;

  if (!isSharedPlayerProfile(storedProfile)) {
    const nextProfile = createSharedPlayerProfile(
      displayName,
      normalizedCanonicalPlayerId
    );
    writeLocalStorageRecord(SHARED_ROOM_PROFILE_KEY, nextProfile);
    return nextProfile;
  }

  const normalizedDisplayName = displayName.trim() || storedProfile.displayName;
  const nextPlayerId = normalizedCanonicalPlayerId ?? storedProfile.playerId;

  if (
    normalizedDisplayName !== storedProfile.displayName ||
    nextPlayerId !== storedProfile.playerId
  ) {
    const nextProfile = {
      ...storedProfile,
      playerId: nextPlayerId,
      displayName: normalizedDisplayName,
      updatedAt: new Date().toISOString()
    };

    writeLocalStorageRecord(SHARED_ROOM_PROFILE_KEY, nextProfile);
    return nextProfile;
  }

  return storedProfile;
}

export function saveSharedPlayerProfile(profile: SharedPlayerProfile): void {
  writeLocalStorageRecord(SHARED_ROOM_PROFILE_KEY, profile);
}

export function loadSharedRoomSession(): SharedRoomSession | null {
  const storedSession = readLocalStorageRecord(SHARED_ROOM_SESSION_KEY);
  return isSharedRoomSession(storedSession) ? storedSession : null;
}

export function saveSharedRoomSession(session: SharedRoomSession): void {
  writeLocalStorageRecord(SHARED_ROOM_SESSION_KEY, session);
}

export function clearSharedRoomSession(): void {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(SHARED_ROOM_SESSION_KEY);
  } catch {
    // Ignore local browser storage failures in the dev client.
  }
}
