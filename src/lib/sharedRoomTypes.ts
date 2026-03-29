import type { RoomState, Vector3Tuple } from "./roomState";
import type { SharedRoomProgressionState } from "./sharedProgressionTypes";
import type { OwnedPetCareState, PetBehaviorProfileId } from "./pets";

export const SHARED_ROOM_OWNER_ID_PREFIX = "shared-room";

export type SharedRoomSeedKind = "dev-current-room" | "starter-room";
export type SharedRoomInviteStatus = "open" | "consumed";
export type SharedRoomMemberRole = "creator" | "partner";
export type SharedRoomBootstrapKind =
  | "needs_linking"
  | "pending_link"
  | "paired_room";

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

export interface SharedRoomMembership {
  playerId: string;
  roomId: string;
  partnerPlayerId: string;
  pairCode: string;
  pairedAt: string;
}

export interface SharedPendingPairLink {
  pendingLinkId: string;
  playerIds: string[];
  submittedByPlayerId: string;
  targetPairCode: string;
  confirmationsByPlayerId: Record<string, boolean>;
  expiresAt: string;
  playerDisplayNamesById?: Record<string, string>;
}

export interface SharedRoomInvite {
  code: string;
  roomId: string;
  creatorPlayerId: string;
  status: SharedRoomInviteStatus;
  createdAt: string;
  consumedAt: string | null;
}

export interface SharedRoomFrameMemory {
  furnitureId: string;
  collectionId?: string;
  imageSrc: string;
  caption: string | null;
  updatedAt: string;
  updatedByPlayerId: string;
}

export interface SharedRoomPetRecord {
  id: string;
  type: "minecraft_cat";
  presetId: string;
  displayName: string;
  behaviorProfileId: PetBehaviorProfileId;
  care: OwnedPetCareState;
  spawnPosition: Vector3Tuple;
  adoptedAt: string;
  adoptedByPlayerId: string;
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
  frameMemories: Record<string, SharedRoomFrameMemory>;
  sharedPets: SharedRoomPetRecord[];
}

export interface SharedRoomSession {
  playerId: string;
  partnerId: string | null;
  roomId: string;
  inviteCode: string;
  lastKnownRevision: number;
}

interface SharedRoomBootstrapStateBase {
  playerId: string;
  selfPairCode: string;
}

export interface SharedRoomNeedsLinkingBootstrapState
  extends SharedRoomBootstrapStateBase {
  kind: "needs_linking";
  membership: null;
  pendingLink: null;
}

export interface SharedRoomPendingLinkBootstrapState
  extends SharedRoomBootstrapStateBase {
  kind: "pending_link";
  membership: null;
  pendingLink: SharedPendingPairLink;
}

export interface SharedRoomPairedBootstrapState
  extends SharedRoomBootstrapStateBase {
  kind: "paired_room";
  membership: SharedRoomMembership;
  pendingLink: null;
}

export type SharedRoomBootstrapState =
  | SharedRoomNeedsLinkingBootstrapState
  | SharedRoomPendingLinkBootstrapState
  | SharedRoomPairedBootstrapState;
