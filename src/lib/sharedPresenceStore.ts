import type {
  LeaveSharedPresenceInput,
  LoadSharedRoomPresenceInput,
  SharedPresenceRoomSnapshot,
  SharedPresenceSnapshot,
  UpsertSharedPresenceInput
} from "./sharedPresenceTypes";

export interface SharedPresenceStore {
  upsertPresence(input: UpsertSharedPresenceInput): Promise<SharedPresenceSnapshot>;
  loadRoomPresence(
    input: LoadSharedRoomPresenceInput
  ): Promise<SharedPresenceRoomSnapshot>;
  leavePresence(input: LeaveSharedPresenceInput): Promise<SharedPresenceRoomSnapshot>;
}
