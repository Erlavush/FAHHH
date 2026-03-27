import type { Vector3Tuple } from "./roomState";
import type {
  AcquireSharedEditLockInput,
  LoadPairLinkPresenceInput,
  LoadSharedRoomLocksInput,
  ReleaseSharedEditLockInput,
  RenewSharedEditLockInput,
  SharedPairLinkPresence,
  SharedPairLinkPresenceSnapshot,
  SharedPresenceActivity,
  SharedEditLock,
  SharedEditLockRoomSnapshot,
  SharedPetLiveState,
  SharedPresenceMotionState,
  SharedPresencePose,
  SharedPresenceRoomSnapshot,
  SharedPresenceSnapshot
} from "./sharedPresenceTypes";

const VALID_SHARED_PRESENCE_ACTIVITIES: SharedPresenceActivity[] = [
  "idle",
  "walking",
  "sit",
  "lie",
  "use_pc"
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isIsoDateString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isValidVector3Tuple(value: unknown): value is Vector3Tuple {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((entry) => typeof entry === "number" && Number.isFinite(entry))
  );
}

export function isValidSharedPresenceActivity(
  value: unknown
): value is SharedPresenceActivity {
  return VALID_SHARED_PRESENCE_ACTIVITIES.includes(value as SharedPresenceActivity);
}

export function isValidSharedPresencePose(value: unknown): value is SharedPresencePose {
  return (
    isRecord(value) &&
    (value.type === "sit" || value.type === "lie" || value.type === "use_pc") &&
    isValidVector3Tuple(value.position) &&
    typeof value.rotationY === "number" &&
    Number.isFinite(value.rotationY) &&
    (!("furnitureId" in value) ||
      value.furnitureId === undefined ||
      typeof value.furnitureId === "string") &&
    (!("slotId" in value) ||
      value.slotId === undefined ||
      typeof value.slotId === "string") &&
    (!("poseOffset" in value) ||
      value.poseOffset === undefined ||
      isValidVector3Tuple(value.poseOffset))
  );
}

export function isValidSharedPresenceMotionState(
  value: unknown
): value is SharedPresenceMotionState {
  return (
    isRecord(value) &&
    isValidVector3Tuple(value.velocity) &&
    typeof value.walkAmount === "number" &&
    Number.isFinite(value.walkAmount) &&
    typeof value.stridePhase === "number" &&
    Number.isFinite(value.stridePhase)
  );
}

export function isValidSharedPetLiveState(value: unknown): value is SharedPetLiveState {
  return (
    isRecord(value) &&
    typeof value.petId === "string" &&
    typeof value.ownerPlayerId === "string" &&
    isValidVector3Tuple(value.position) &&
    (value.targetPosition === null || isValidVector3Tuple(value.targetPosition)) &&
    typeof value.rotationY === "number" &&
    Number.isFinite(value.rotationY) &&
    typeof value.walkAmount === "number" &&
    Number.isFinite(value.walkAmount) &&
    typeof value.stridePhase === "number" &&
    Number.isFinite(value.stridePhase) &&
    isIsoDateString(value.updatedAt)
  );
}

export function isValidSharedPresenceSnapshot(
  value: unknown
): value is SharedPresenceSnapshot {
  return (
    isRecord(value) &&
    typeof value.roomId === "string" &&
    typeof value.playerId === "string" &&
    typeof value.displayName === "string" &&
    (typeof value.skinSrc === "string" || value.skinSrc === null) &&
    isValidVector3Tuple(value.position) &&
    typeof value.facingY === "number" &&
    Number.isFinite(value.facingY) &&
    isValidSharedPresenceActivity(value.activity) &&
    (!("motion" in value) ||
      value.motion === undefined ||
      value.motion === null ||
      isValidSharedPresenceMotionState(value.motion)) &&
    (!("pose" in value) ||
      value.pose === undefined ||
      value.pose === null ||
      isValidSharedPresencePose(value.pose)) &&
    isIsoDateString(value.updatedAt)
  );
}

export function isValidSharedPresenceRoomSnapshot(
  value: unknown
): value is SharedPresenceRoomSnapshot {
  return (
    isRecord(value) &&
    typeof value.roomId === "string" &&
    Array.isArray(value.presences) &&
    value.presences.every(isValidSharedPresenceSnapshot) &&
    (!("sharedPetState" in value) ||
      value.sharedPetState === undefined ||
      value.sharedPetState === null ||
      isValidSharedPetLiveState(value.sharedPetState)) &&
    isIsoDateString(value.updatedAt)
  );
}

export function isValidSharedEditLock(value: unknown): value is SharedEditLock {
  return (
    isRecord(value) &&
    typeof value.roomId === "string" &&
    typeof value.furnitureId === "string" &&
    typeof value.playerId === "string" &&
    typeof value.displayName === "string" &&
    isIsoDateString(value.expiresAt) &&
    isIsoDateString(value.updatedAt)
  );
}

export function isValidSharedEditLockRoomSnapshot(
  value: unknown
): value is SharedEditLockRoomSnapshot {
  return (
    isRecord(value) &&
    typeof value.roomId === "string" &&
    Array.isArray(value.locks) &&
    value.locks.every(isValidSharedEditLock) &&
    isIsoDateString(value.updatedAt)
  );
}

export function isValidSharedPairLinkPresence(
  value: unknown
): value is SharedPairLinkPresence {
  return (
    isRecord(value) &&
    typeof value.pendingLinkId === "string" &&
    typeof value.playerId === "string" &&
    typeof value.displayName === "string" &&
    isIsoDateString(value.updatedAt)
  );
}

export function isValidSharedPairLinkPresenceSnapshot(
  value: unknown
): value is SharedPairLinkPresenceSnapshot {
  return (
    isRecord(value) &&
    typeof value.pendingLinkId === "string" &&
    Array.isArray(value.presences) &&
    value.presences.every(isValidSharedPairLinkPresence) &&
    isIsoDateString(value.updatedAt)
  );
}

export function isValidLoadSharedRoomLocksInput(
  value: unknown
): value is LoadSharedRoomLocksInput {
  return isRecord(value) && typeof value.roomId === "string";
}

export function isValidAcquireSharedEditLockInput(
  value: unknown
): value is AcquireSharedEditLockInput {
  return (
    isRecord(value) &&
    typeof value.roomId === "string" &&
    typeof value.furnitureId === "string" &&
    typeof value.playerId === "string" &&
    typeof value.displayName === "string"
  );
}

export function isValidLoadPairLinkPresenceInput(
  value: unknown
): value is LoadPairLinkPresenceInput {
  return isRecord(value) && typeof value.pendingLinkId === "string";
}

export function isValidRenewSharedEditLockInput(
  value: unknown
): value is RenewSharedEditLockInput {
  return isValidAcquireSharedEditLockInput(value);
}

export function isValidReleaseSharedEditLockInput(
  value: unknown
): value is ReleaseSharedEditLockInput {
  return (
    isRecord(value) &&
    typeof value.roomId === "string" &&
    typeof value.furnitureId === "string" &&
    typeof value.playerId === "string"
  );
}

export function validateSharedPresenceSnapshot(
  value: unknown
): SharedPresenceSnapshot {
  if (!isValidSharedPresenceSnapshot(value)) {
    throw new Error("Invalid shared presence snapshot");
  }

  const snapshot = value as SharedPresenceSnapshot;

  return {
    ...snapshot,
    position: [...snapshot.position] as Vector3Tuple,
    facingY: snapshot.facingY,
    motion: snapshot.motion
      ? {
          ...snapshot.motion,
          velocity: [...snapshot.motion.velocity] as Vector3Tuple
        }
      : null,
    pose: snapshot.pose
      ? {
          ...snapshot.pose,
          position: [...snapshot.pose.position] as Vector3Tuple,
          poseOffset: snapshot.pose.poseOffset
            ? ([...snapshot.pose.poseOffset] as Vector3Tuple)
            : undefined
        }
      : null
  };
}

export function validateSharedPresenceRoomSnapshot(
  value: unknown
): SharedPresenceRoomSnapshot {
  if (!isValidSharedPresenceRoomSnapshot(value)) {
    throw new Error("Invalid shared room presence snapshot");
  }

  const roomSnapshot = value as SharedPresenceRoomSnapshot;

  return {
    roomId: roomSnapshot.roomId,
    sharedPetState:
      roomSnapshot.sharedPetState === null ||
      roomSnapshot.sharedPetState === undefined
        ? null
        : validateSharedPetLiveState(roomSnapshot.sharedPetState),
    updatedAt: roomSnapshot.updatedAt,
    presences: roomSnapshot.presences.map(validateSharedPresenceSnapshot)
  };
}

export function validateSharedPetLiveState(value: unknown): SharedPetLiveState {
  if (!isValidSharedPetLiveState(value)) {
    throw new Error("Invalid shared pet live state");
  }

  const petState = value as SharedPetLiveState;

  return {
    ...petState,
    position: [...petState.position] as Vector3Tuple,
    targetPosition:
      petState.targetPosition === null
        ? null
        : ([...petState.targetPosition] as Vector3Tuple)
  };
}

export function validateSharedEditLock(value: unknown): SharedEditLock {
  if (!isValidSharedEditLock(value)) {
    throw new Error("Invalid shared edit lock");
  }

  return {
    ...(value as SharedEditLock)
  };
}

export function validateSharedEditLockRoomSnapshot(
  value: unknown
): SharedEditLockRoomSnapshot {
  if (!isValidSharedEditLockRoomSnapshot(value)) {
    throw new Error("Invalid shared edit lock room snapshot");
  }

  const roomSnapshot = value as SharedEditLockRoomSnapshot;

  return {
    roomId: roomSnapshot.roomId,
    updatedAt: roomSnapshot.updatedAt,
    locks: roomSnapshot.locks.map(validateSharedEditLock)
  };
}

export function validateSharedPairLinkPresence(
  value: unknown
): SharedPairLinkPresence {
  if (!isValidSharedPairLinkPresence(value)) {
    throw new Error("Invalid shared pair-link presence");
  }

  return {
    ...(value as SharedPairLinkPresence)
  };
}

export function validateSharedPairLinkPresenceSnapshot(
  value: unknown
): SharedPairLinkPresenceSnapshot {
  if (!isValidSharedPairLinkPresenceSnapshot(value)) {
    throw new Error("Invalid shared pair-link presence snapshot");
  }

  const snapshot = value as SharedPairLinkPresenceSnapshot;

  return {
    pendingLinkId: snapshot.pendingLinkId,
    updatedAt: snapshot.updatedAt,
    presences: snapshot.presences.map(validateSharedPairLinkPresence)
  };
}
