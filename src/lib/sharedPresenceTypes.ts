import type { Vector3Tuple } from "./roomState";

export type SharedPresenceActivity =
  | "idle"
  | "walking"
  | "sit"
  | "lie"
  | "use_pc";

export type SharedPresencePoseType = "sit" | "lie" | "use_pc";

export interface SharedPresencePose {
  type: SharedPresencePoseType;
  furnitureId?: string;
  position: Vector3Tuple;
  rotationY: number;
  poseOffset?: Vector3Tuple;
  slotId?: string;
}

export interface SharedPresenceMotionState {
  stridePhase: number;
  velocity: Vector3Tuple;
  walkAmount: number;
}

export interface SharedPetLiveState {
  ownerPlayerId: string;
  petId: string;
  position: Vector3Tuple;
  rotationY: number;
  stridePhase: number;
  targetPosition: Vector3Tuple | null;
  updatedAt: string;
  velocity: Vector3Tuple;
  walkAmount: number;
}

export interface SharedPresenceSnapshot {
  roomId: string;
  playerId: string;
  displayName: string;
  skinSrc: string | null;
  position: Vector3Tuple;
  facingY: number;
  activity: SharedPresenceActivity;
  motion: SharedPresenceMotionState | null;
  pose: SharedPresencePose | null;
  updatedAt: string;
}

export interface SharedPresenceRoomSnapshot {
  roomId: string;
  presences: SharedPresenceSnapshot[];
  sharedPetState: SharedPetLiveState | null;
  updatedAt: string;
}

export interface SharedEditLock {
  roomId: string;
  furnitureId: string;
  playerId: string;
  displayName: string;
  expiresAt: string;
  updatedAt: string;
}

export interface SharedEditLockRoomSnapshot {
  roomId: string;
  locks: SharedEditLock[];
  updatedAt: string;
}

export interface SharedPairLinkPresence {
  pendingLinkId: string;
  playerId: string;
  displayName: string;
  updatedAt: string;
}

export interface SharedPairLinkPresenceSnapshot {
  pendingLinkId: string;
  presences: SharedPairLinkPresence[];
  updatedAt: string;
}

export interface UpsertSharedPresenceInput {
  presence: SharedPresenceSnapshot;
  sharedPetState?: SharedPetLiveState | null;
}

export interface LoadSharedRoomPresenceInput {
  roomId: string;
}

export interface LoadSharedRoomLocksInput {
  roomId: string;
}

export interface AcquireSharedEditLockInput {
  roomId: string;
  furnitureId: string;
  playerId: string;
  displayName: string;
}

export interface RenewSharedEditLockInput {
  roomId: string;
  furnitureId: string;
  playerId: string;
  displayName: string;
}

export interface ReleaseSharedEditLockInput {
  roomId: string;
  furnitureId: string;
  playerId: string;
}

export interface LeaveSharedPresenceInput {
  roomId: string;
  playerId: string;
}

export interface UpsertPairLinkPresenceInput {
  pendingLinkId: string;
  playerId: string;
  displayName: string;
}

export interface LoadPairLinkPresenceInput {
  pendingLinkId: string;
}

export interface LeavePairLinkPresenceInput {
  pendingLinkId: string;
  playerId: string;
}
