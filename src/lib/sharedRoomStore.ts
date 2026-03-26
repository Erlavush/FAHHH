import type { RoomState } from "./roomState";
import type {
  SharedPlayerProfile,
  SharedRoomDocument,
  SharedRoomSeedKind
} from "./sharedRoomTypes";

export interface CreateSharedRoomInput {
  profile: SharedPlayerProfile;
  sourceRoomState: RoomState;
  seedKind?: SharedRoomSeedKind;
  sharedCoins: number;
}

export interface JoinSharedRoomInput {
  code: string;
  profile: SharedPlayerProfile;
}

export interface BootstrapDevSharedRoomInput {
  profile: SharedPlayerProfile;
  sourceRoomState: RoomState;
  sharedCoins: number;
}

export interface LoadSharedRoomInput {
  roomId: string;
}

export interface CommitSharedRoomStateInput {
  roomId: string;
  expectedRevision: number;
  roomState: RoomState;
  sharedCoins: number;
  reason: string;
}

export interface SharedRoomStore {
  bootstrapDevSharedRoom(input: BootstrapDevSharedRoomInput): Promise<SharedRoomDocument>;
  createSharedRoom(input: CreateSharedRoomInput): Promise<SharedRoomDocument>;
  joinSharedRoom(input: JoinSharedRoomInput): Promise<SharedRoomDocument>;
  loadSharedRoom(input: LoadSharedRoomInput): Promise<SharedRoomDocument>;
  commitSharedRoomState(input: CommitSharedRoomStateInput): Promise<SharedRoomDocument>;
}
