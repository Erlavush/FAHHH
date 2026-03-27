import type { SharedPlayerProfile, SharedRoomBootstrapState } from "./sharedRoomTypes";

export interface LoadSharedRoomBootstrapStateInput {
  profile: SharedPlayerProfile;
}

export interface SubmitPairCodeInput {
  profile: SharedPlayerProfile;
  pairCode: string;
}

export interface ConfirmPairLinkInput {
  profile: SharedPlayerProfile;
  pendingLinkId: string;
}

export interface CancelPairLinkInput {
  profile: SharedPlayerProfile;
  pendingLinkId: string;
}

export interface SharedRoomOwnershipStore {
  loadBootstrapState(
    input: LoadSharedRoomBootstrapStateInput
  ): Promise<SharedRoomBootstrapState>;
  submitPairCode(input: SubmitPairCodeInput): Promise<SharedRoomBootstrapState>;
  confirmPairLink(input: ConfirmPairLinkInput): Promise<SharedRoomBootstrapState>;
  cancelPairLink(input: CancelPairLinkInput): Promise<SharedRoomBootstrapState>;
}
