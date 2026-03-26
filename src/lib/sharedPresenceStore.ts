import type {
  AcquireSharedEditLockInput,
  LeaveSharedPresenceInput,
  LoadSharedRoomLocksInput,
  LoadSharedRoomPresenceInput,
  ReleaseSharedEditLockInput,
  RenewSharedEditLockInput,
  SharedEditLockRoomSnapshot,
  SharedPresenceRoomSnapshot,
  SharedPresenceSnapshot,
  UpsertSharedPresenceInput
} from "./sharedPresenceTypes";

export interface SharedPresenceStore {
  acquireEditLock(
    input: AcquireSharedEditLockInput
  ): Promise<SharedEditLockRoomSnapshot>;
  loadRoomLocks(
    input: LoadSharedRoomLocksInput
  ): Promise<SharedEditLockRoomSnapshot>;
  upsertPresence(input: UpsertSharedPresenceInput): Promise<SharedPresenceSnapshot>;
  loadRoomPresence(
    input: LoadSharedRoomPresenceInput
  ): Promise<SharedPresenceRoomSnapshot>;
  leavePresence(input: LeaveSharedPresenceInput): Promise<SharedPresenceRoomSnapshot>;
  releaseEditLock(
    input: ReleaseSharedEditLockInput
  ): Promise<SharedEditLockRoomSnapshot>;
  renewEditLock(
    input: RenewSharedEditLockInput
  ): Promise<SharedEditLockRoomSnapshot>;
}
