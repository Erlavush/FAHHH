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
  position: Vector3Tuple;
  rotationY: number;
  poseOffset?: Vector3Tuple;
}

export interface SharedPresenceSnapshot {
  roomId: string;
  playerId: string;
  displayName: string;
  skinSrc: string | null;
  position: Vector3Tuple;
  facingY: number;
  activity: SharedPresenceActivity;
  pose: SharedPresencePose | null;
  updatedAt: string;
}

export interface SharedPresenceRoomSnapshot {
  roomId: string;
  presences: SharedPresenceSnapshot[];
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

export interface UpsertSharedPresenceInput {
  presence: SharedPresenceSnapshot;
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
