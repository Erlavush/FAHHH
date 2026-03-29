import type { RoomState } from "../../../lib/roomState";
import type { SharedRoomOwnershipStore } from "../../../lib/sharedRoomOwnershipStore";
import type { SharedRoomStore } from "../../../lib/sharedRoomStore";
import type {
  SharedPendingPairLink,
  SharedPlayerProfile,
  SharedRoomDocument,
  SharedRoomFrameMemory,
  SharedRoomPetRecord,
  SharedRoomSession
} from "../../../lib/sharedRoomTypes";
import type { SharedRoomProgressionState } from "../../../lib/sharedProgressionTypes";

export interface SharedRoomRuntimeSnapshot {
  roomId: string;
  inviteCode: string;
  revision: number;
  memberIds: string[];
  members: SharedRoomDocument["members"];
  progression: SharedRoomProgressionState;
  roomState: RoomState;
  frameMemories: Record<string, SharedRoomFrameMemory>;
  sharedPets: SharedRoomPetRecord[];
}

export interface SharedRoomBlockingState {
  title: string;
  body: string;
  retryable: boolean;
}

export type SharedRoomRuntimeBootstrapKind =
  | "legacy"
  | "signed_out"
  | "hosted_unavailable"
  | "needs_linking"
  | "pending_link"
  | "loading_room"
  | "room_ready";

export type SharedRoomRuntimeEntryMode =
  | "legacy"
  | "hosted"
  | "hosted_unavailable"
  | "dev_fallback";

export interface SharedAuthAdapter<User = unknown> {
  signInWithGoogle(): Promise<unknown>;
  signOut(): Promise<void>;
  subscribe(callback: (user: User | null) => void): () => void;
  toSharedPlayerProfile(user: User): SharedPlayerProfile;
}

export type SharedRoomMutation = (
  snapshot: SharedRoomRuntimeSnapshot
) => {
  roomState: RoomState;
  progression: SharedRoomProgressionState;
  frameMemories: Record<string, SharedRoomFrameMemory>;
  sharedPets: SharedRoomPetRecord[];
};

export interface SharedRoomRuntimeOptions {
  devBootstrapRoomState?: RoomState;
  devBootstrapSharedCoins?: number;
  devBypassEnabled?: boolean;
  hostedFlowEnabled?: boolean;
  legacySessionEnabled?: boolean;
  sharedAuthAdapter?: SharedAuthAdapter | null;
  sharedRoomOwnershipStore?: SharedRoomOwnershipStore | null;
  sharedRoomStore?: SharedRoomStore;
}

export interface HostedPlayerIdRef {
  current: string | null;
}

export interface ApplyRoomDocumentFn {
  (nextRoomDocument: SharedRoomDocument, nextProfile?: SharedPlayerProfile): SharedRoomSession;
}

export interface SetBlockingStateFn {
  (nextState: SharedRoomBlockingState | null): void;
}

export interface SetBootstrapKindFn {
  (nextKind: SharedRoomRuntimeBootstrapKind): void;
}

export interface SetInlineErrorFn {
  (nextError: string | null): void;
}

export interface SetPendingLinkFn {
  (nextPendingLink: SharedPendingPairLink | null): void;
}

export interface SetSelfPairCodeFn {
  (nextSelfPairCode: string | null): void;
}