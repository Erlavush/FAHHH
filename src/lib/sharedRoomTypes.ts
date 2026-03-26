import type { RoomState } from "./roomState";
import type { SharedRoomProgressionState } from "./sharedProgressionTypes";

export const SHARED_ROOM_OWNER_ID_PREFIX = "shared-room";

export type SharedRoomSeedKind = "dev-current-room" | "starter-room";
export type SharedRoomInviteStatus = "open" | "consumed";
export type SharedRoomMemberRole = "creator" | "partner";

export interface SharedPlayerProfile {
  playerId: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SharedRoomMember {
  playerId: string;
  displayName: string;
  role: SharedRoomMemberRole;
  joinedAt: string;
}

export interface SharedRoomInvite {
  code: string;
  roomId: string;
  creatorPlayerId: string;
  status: SharedRoomInviteStatus;
  createdAt: string;
  consumedAt: string | null;
}

export interface SharedRoomDocument {
  roomId: string;
  inviteCode: string;
  memberIds: string[];
  members: SharedRoomMember[];
  revision: number;
  progression: SharedRoomProgressionState;
  seedKind: SharedRoomSeedKind;
  createdAt: string;
  updatedAt: string;
  roomState: RoomState;
}

export interface SharedRoomSession {
  playerId: string;
  partnerId: string | null;
  roomId: string;
  inviteCode: string;
  lastKnownRevision: number;
}
