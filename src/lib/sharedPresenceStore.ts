import type {
  AcquireSharedEditLockInput,
  LeavePairLinkPresenceInput,
  LeaveSharedPresenceInput,
  LoadPairLinkPresenceInput,
  LoadSharedRoomLocksInput,
  LoadSharedRoomPresenceInput,
  ReleaseSharedEditLockInput,
  RenewSharedEditLockInput,
  SharedEditLockRoomSnapshot,
  SharedPairLinkPresenceSnapshot,
  SharedPresenceRoomSnapshot,
  SharedPresenceSnapshot,
  UpsertPairLinkPresenceInput,
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
  upsertPairLinkPresence(
    input: UpsertPairLinkPresenceInput
  ): Promise<SharedPairLinkPresenceSnapshot>;
  loadPairLinkPresence(
    input: LoadPairLinkPresenceInput
  ): Promise<SharedPairLinkPresenceSnapshot>;
  leavePairLinkPresence(
    input: LeavePairLinkPresenceInput
  ): Promise<SharedPairLinkPresenceSnapshot>;
}
