import type { SharedRoomOwnershipStore } from "../../../lib/sharedRoomOwnershipStore";
import type {
  SharedPendingPairLink,
  SharedPlayerProfile,
  SharedRoomBootstrapState,
  SharedRoomDocument
} from "../../../lib/sharedRoomTypes";
import {
  createBlockingState,
  getSharedRoomErrorMessage,
  HOSTED_LOADING_TITLE,
  HOSTED_VERIFY_ERROR_TITLE
} from "./runtimeMessages";
import type {
  ApplyRoomDocumentFn,
  HostedPlayerIdRef,
  SetBlockingStateFn,
  SetBootstrapKindFn,
  SetInlineErrorFn,
  SetPendingLinkFn,
  SetSelfPairCodeFn
} from "./runtimeTypes";
import type { SharedRoomStore } from "../../../lib/sharedRoomStore";

interface LoadHostedRoomArgs {
  roomId: string;
  nextProfile: SharedPlayerProfile;
  nextSelfPairCode: string | null;
  sharedRoomStore: SharedRoomStore;
  activeHostedPlayerIdRef: HostedPlayerIdRef;
  applyRoomDocument: ApplyRoomDocumentFn;
  clearActiveRoomState: () => void;
  setPendingLink: SetPendingLinkFn;
  setBootstrapKind: SetBootstrapKindFn;
  setBlockingState: SetBlockingStateFn;
  setInlineError: SetInlineErrorFn;
  setSelfPairCode: SetSelfPairCodeFn;
}

interface ApplyHostedBootstrapStateArgs {
  nextBootstrapState: SharedRoomBootstrapState;
  nextProfile: SharedPlayerProfile;
  clearActiveRoomState: () => void;
  setPendingLink: SetPendingLinkFn;
  setBootstrapKind: SetBootstrapKindFn;
  setBlockingState: SetBlockingStateFn;
  setInlineError: SetInlineErrorFn;
  setSelfPairCode: SetSelfPairCodeFn;
  loadHostedRoom: (
    roomId: string,
    nextProfile: SharedPlayerProfile,
    nextSelfPairCode: string | null
  ) => Promise<SharedRoomDocument | null>;
}

interface RefreshHostedBootstrapStateArgs {
  hostedFlowActive: boolean;
  resolvedSharedRoomOwnershipStore: SharedRoomOwnershipStore | null;
  activeHostedPlayerIdRef: HostedPlayerIdRef;
  nextProfile: SharedPlayerProfile;
  clearActiveRoomState: () => void;
  setPendingLink: SetPendingLinkFn;
  setBootstrapKind: SetBootstrapKindFn;
  setBlockingState: SetBlockingStateFn;
  setInlineError: SetInlineErrorFn;
  applyHostedBootstrapState: (
    nextBootstrapState: SharedRoomBootstrapState,
    nextProfile: SharedPlayerProfile
  ) => Promise<SharedRoomDocument | null>;
}

interface SubmitPartnerCodeArgs {
  hostedFlowActive: boolean;
  bootstrapKind: string;
  resolvedSharedRoomOwnershipStore: SharedRoomOwnershipStore | null;
  activeHostedPlayerIdRef: HostedPlayerIdRef;
  profile: SharedPlayerProfile;
  pairCode: string;
  setInlineError: SetInlineErrorFn;
  applyHostedBootstrapState: (
    nextBootstrapState: SharedRoomBootstrapState,
    nextProfile: SharedPlayerProfile
  ) => Promise<SharedRoomDocument | null>;
}

interface PairLinkActionArgs {
  hostedFlowActive: boolean;
  bootstrapKind: string;
  pendingLink: SharedPendingPairLink | null;
  resolvedSharedRoomOwnershipStore: SharedRoomOwnershipStore | null;
  activeHostedPlayerIdRef: HostedPlayerIdRef;
  profile: SharedPlayerProfile;
  setInlineError: SetInlineErrorFn;
  applyHostedBootstrapState: (
    nextBootstrapState: SharedRoomBootstrapState,
    nextProfile: SharedPlayerProfile
  ) => Promise<SharedRoomDocument | null>;
}

export async function loadHostedRoom({
  roomId,
  nextProfile,
  nextSelfPairCode,
  sharedRoomStore,
  activeHostedPlayerIdRef,
  applyRoomDocument,
  clearActiveRoomState,
  setPendingLink,
  setBootstrapKind,
  setBlockingState,
  setInlineError,
  setSelfPairCode
}: LoadHostedRoomArgs): Promise<SharedRoomDocument | null> {
  setBootstrapKind("loading_room");
  setBlockingState(
    createBlockingState(
      HOSTED_LOADING_TITLE,
      "Verifying your couple room and loading the latest shared state."
    )
  );

  try {
    const nextRoomDocument = await sharedRoomStore.loadSharedRoom({ roomId });

    if (activeHostedPlayerIdRef.current !== nextProfile.playerId) {
      return null;
    }

    applyRoomDocument(nextRoomDocument, nextProfile);
    setSelfPairCode(nextSelfPairCode);
    return nextRoomDocument;
  } catch (error) {
    if (activeHostedPlayerIdRef.current !== nextProfile.playerId) {
      return null;
    }

    clearActiveRoomState();
    setPendingLink(null);
    setBootstrapKind("loading_room");
    setBlockingState(
      createBlockingState(
        HOSTED_VERIFY_ERROR_TITLE,
        "Retry to verify your couple room and load the latest shared state.",
        true
      )
    );
    setInlineError(getSharedRoomErrorMessage(error));
    return null;
  }
}

export async function applyHostedBootstrapState({
  nextBootstrapState,
  nextProfile,
  clearActiveRoomState,
  setPendingLink,
  setBootstrapKind,
  setBlockingState,
  setInlineError,
  setSelfPairCode,
  loadHostedRoom
}: ApplyHostedBootstrapStateArgs): Promise<SharedRoomDocument | null> {
  setInlineError(null);
  setSelfPairCode(nextBootstrapState.selfPairCode);

  if (nextBootstrapState.kind === "needs_linking") {
    clearActiveRoomState();
    setPendingLink(null);
    setBootstrapKind("needs_linking");
    setBlockingState(null);
    return null;
  }

  if (nextBootstrapState.kind === "pending_link") {
    clearActiveRoomState();
    setPendingLink(nextBootstrapState.pendingLink);
    setBootstrapKind("pending_link");
    setBlockingState(null);
    return null;
  }

  setPendingLink(null);
  return loadHostedRoom(
    nextBootstrapState.membership.roomId,
    nextProfile,
    nextBootstrapState.selfPairCode
  );
}

export async function refreshHostedBootstrapState({
  hostedFlowActive,
  resolvedSharedRoomOwnershipStore,
  activeHostedPlayerIdRef,
  nextProfile,
  clearActiveRoomState,
  setPendingLink,
  setBootstrapKind,
  setBlockingState,
  setInlineError,
  applyHostedBootstrapState
}: RefreshHostedBootstrapStateArgs): Promise<SharedRoomDocument | null> {
  if (
    !hostedFlowActive ||
    !resolvedSharedRoomOwnershipStore ||
    activeHostedPlayerIdRef.current !== nextProfile.playerId
  ) {
    return null;
  }

  setInlineError(null);
  setBootstrapKind("loading_room");
  setBlockingState(
    createBlockingState(HOSTED_LOADING_TITLE, "Checking your couple room.")
  );

  try {
    const nextBootstrapState =
      await resolvedSharedRoomOwnershipStore.loadBootstrapState({
        profile: nextProfile
      });

    if (activeHostedPlayerIdRef.current !== nextProfile.playerId) {
      return null;
    }

    return applyHostedBootstrapState(nextBootstrapState, nextProfile);
  } catch (error) {
    if (activeHostedPlayerIdRef.current !== nextProfile.playerId) {
      return null;
    }

    clearActiveRoomState();
    setPendingLink(null);
    setBootstrapKind("loading_room");
    setBlockingState(
      createBlockingState(
        HOSTED_VERIFY_ERROR_TITLE,
        "Retry to verify your couple room and load the latest shared state.",
        true
      )
    );
    setInlineError(getSharedRoomErrorMessage(error));
    return null;
  }
}

export async function submitPartnerCode({
  hostedFlowActive,
  bootstrapKind,
  resolvedSharedRoomOwnershipStore,
  activeHostedPlayerIdRef,
  profile,
  pairCode,
  setInlineError,
  applyHostedBootstrapState
}: SubmitPartnerCodeArgs): Promise<SharedRoomDocument | null> {
  if (
    !hostedFlowActive ||
    bootstrapKind !== "needs_linking" ||
    !resolvedSharedRoomOwnershipStore ||
    activeHostedPlayerIdRef.current !== profile.playerId
  ) {
    return null;
  }

  setInlineError(null);

  try {
    const nextBootstrapState =
      await resolvedSharedRoomOwnershipStore.submitPairCode({
        profile,
        pairCode
      });

    if (activeHostedPlayerIdRef.current !== profile.playerId) {
      return null;
    }

    return applyHostedBootstrapState(nextBootstrapState, profile);
  } catch (error) {
    if (activeHostedPlayerIdRef.current === profile.playerId) {
      setInlineError(getSharedRoomErrorMessage(error));
    }

    return null;
  }
}

export async function confirmPairLink({
  hostedFlowActive,
  bootstrapKind,
  pendingLink,
  resolvedSharedRoomOwnershipStore,
  activeHostedPlayerIdRef,
  profile,
  setInlineError,
  applyHostedBootstrapState
}: PairLinkActionArgs): Promise<SharedRoomDocument | null> {
  if (
    !hostedFlowActive ||
    bootstrapKind !== "pending_link" ||
    !pendingLink ||
    !resolvedSharedRoomOwnershipStore ||
    activeHostedPlayerIdRef.current !== profile.playerId
  ) {
    return null;
  }

  setInlineError(null);

  try {
    const nextBootstrapState =
      await resolvedSharedRoomOwnershipStore.confirmPairLink({
        profile,
        pendingLinkId: pendingLink.pendingLinkId
      });

    if (activeHostedPlayerIdRef.current !== profile.playerId) {
      return null;
    }

    return applyHostedBootstrapState(nextBootstrapState, profile);
  } catch (error) {
    if (activeHostedPlayerIdRef.current === profile.playerId) {
      setInlineError(getSharedRoomErrorMessage(error));
    }

    return null;
  }
}

export async function cancelPairLink({
  hostedFlowActive,
  bootstrapKind,
  pendingLink,
  resolvedSharedRoomOwnershipStore,
  activeHostedPlayerIdRef,
  profile,
  setInlineError,
  applyHostedBootstrapState
}: PairLinkActionArgs): Promise<SharedRoomDocument | null> {
  if (
    !hostedFlowActive ||
    bootstrapKind !== "pending_link" ||
    !pendingLink ||
    !resolvedSharedRoomOwnershipStore ||
    activeHostedPlayerIdRef.current !== profile.playerId
  ) {
    return null;
  }

  setInlineError(null);

  try {
    const nextBootstrapState =
      await resolvedSharedRoomOwnershipStore.cancelPairLink({
        profile,
        pendingLinkId: pendingLink.pendingLinkId
      });

    if (activeHostedPlayerIdRef.current !== profile.playerId) {
      return null;
    }

    return applyHostedBootstrapState(nextBootstrapState, profile);
  } catch (error) {
    if (activeHostedPlayerIdRef.current === profile.playerId) {
      setInlineError(getSharedRoomErrorMessage(error));
    }

    return null;
  }
}