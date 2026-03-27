import {
  cloneRoomState,
  createDefaultRoomState,
  type RoomState
} from "../../../lib/roomState";
import type { SharedRoomStore } from "../../../lib/sharedRoomStore";
import type {
  SharedPendingPairLink,
  SharedPlayerProfile,
  SharedRoomDocument
} from "../../../lib/sharedRoomTypes";
import {
  createBlockingState,
  getSharedRoomErrorMessage
} from "./runtimeMessages";
import type {
  ApplyRoomDocumentFn,
  SetBlockingStateFn,
  SetBootstrapKindFn,
  SetInlineErrorFn,
  SetPendingLinkFn,
  SetSelfPairCodeFn
} from "./runtimeTypes";

interface LoadLegacyRoomArgs {
  roomId: string;
  loadingBody: string;
  sharedRoomStore: SharedRoomStore;
  applyRoomDocument: ApplyRoomDocumentFn;
  clearActiveRoomState: () => void;
  clearStatusMessage: () => void;
  setBlockingState: SetBlockingStateFn;
  setBootstrapKind: SetBootstrapKindFn;
  setInlineError: SetInlineErrorFn;
  setSelfPairCode: SetSelfPairCodeFn;
  setPendingLink: SetPendingLinkFn;
}

interface CreateRoomArgs {
  hostedFlowActive: boolean;
  persistProfile: (nextDisplayName?: string) => SharedPlayerProfile;
  setInlineError: SetInlineErrorFn;
  setBootstrapKind: SetBootstrapKindFn;
  setBlockingState: SetBlockingStateFn;
  sharedRoomStore: SharedRoomStore;
  applyRoomDocument: ApplyRoomDocumentFn;
  setTimedStatusMessage: (message: string | null) => void;
  sourceRoomState: RoomState;
  sharedCoins: number;
}

interface BootstrapDevRoomArgs {
  devBypassActive: boolean;
  persistProfile: (nextDisplayName?: string) => SharedPlayerProfile;
  setInlineError: SetInlineErrorFn;
  setBootstrapKind: SetBootstrapKindFn;
  setBlockingState: SetBlockingStateFn;
  sharedRoomStore: SharedRoomStore;
  applyRoomDocument: ApplyRoomDocumentFn;
  devBootstrapRoomState?: RoomState;
  devBootstrapSharedCoins: number;
}

interface JoinRoomArgs {
  hostedFlowActive: boolean;
  persistProfile: (nextDisplayName?: string) => SharedPlayerProfile;
  setInlineError: SetInlineErrorFn;
  setBootstrapKind: SetBootstrapKindFn;
  setBlockingState: SetBlockingStateFn;
  sharedRoomStore: SharedRoomStore;
  applyRoomDocument: ApplyRoomDocumentFn;
  setTimedStatusMessage: (message: string | null) => void;
  code: string;
}

export async function loadLegacyRoom({
  roomId,
  loadingBody,
  sharedRoomStore,
  applyRoomDocument,
  clearActiveRoomState,
  clearStatusMessage,
  setBlockingState,
  setBootstrapKind,
  setInlineError,
  setSelfPairCode,
  setPendingLink
}: LoadLegacyRoomArgs): Promise<SharedRoomDocument | null> {
  setBlockingState(createBlockingState("Loading shared room...", loadingBody));
  setBootstrapKind("loading_room");

  try {
    const nextRoomDocument = await sharedRoomStore.loadSharedRoom({ roomId });
    applyRoomDocument(nextRoomDocument);
    return nextRoomDocument;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 404
    ) {
      clearStatusMessage();
      clearActiveRoomState();
      setSelfPairCode(null);
      setPendingLink(null);
      setBootstrapKind("legacy");
      setBlockingState(null);
      setInlineError(null);
      return null;
    }

    setBlockingState(
      createBlockingState(
        "We couldn't load the shared room. Retry to fetch the latest room state.",
        "Any unconfirmed local changes will be discarded before the shared room reloads.",
        true
      )
    );
    setInlineError(getSharedRoomErrorMessage(error));
    return null;
  }
}

export async function createRoom({
  hostedFlowActive,
  persistProfile,
  setInlineError,
  setBootstrapKind,
  setBlockingState,
  sharedRoomStore,
  applyRoomDocument,
  setTimedStatusMessage,
  sourceRoomState,
  sharedCoins
}: CreateRoomArgs): Promise<SharedRoomDocument | null> {
  if (hostedFlowActive) {
    return null;
  }

  const nextProfile = persistProfile();
  setInlineError(null);
  setBootstrapKind("loading_room");
  setBlockingState(
    createBlockingState("Loading shared room...", "Creating your shared room.")
  );

  try {
    const nextRoomDocument = await sharedRoomStore.createSharedRoom({
      profile: nextProfile,
      sourceRoomState,
      seedKind: "dev-current-room",
      sharedCoins
    });

    applyRoomDocument(nextRoomDocument, nextProfile);
    setTimedStatusMessage("Room ready to share");
    return nextRoomDocument;
  } catch (error) {
    setBootstrapKind("legacy");
    setBlockingState(null);
    setInlineError(getSharedRoomErrorMessage(error));
    return null;
  }
}

export async function bootstrapDevRoom({
  devBypassActive,
  persistProfile,
  setInlineError,
  setBootstrapKind,
  setBlockingState,
  sharedRoomStore,
  applyRoomDocument,
  devBootstrapRoomState,
  devBootstrapSharedCoins
}: BootstrapDevRoomArgs): Promise<SharedRoomDocument | null> {
  if (!devBypassActive) {
    return null;
  }

  const nextProfile = persistProfile();
  setInlineError(null);
  setBootstrapKind("loading_room");
  setBlockingState(
    createBlockingState(
      "Loading shared room...",
      "Bootstrapping the development shared room."
    )
  );

  try {
    const nextRoomDocument = await sharedRoomStore.bootstrapDevSharedRoom({
      profile: nextProfile,
      sourceRoomState: cloneRoomState(
        devBootstrapRoomState ?? createDefaultRoomState()
      ),
      sharedCoins: devBootstrapSharedCoins
    });

    applyRoomDocument(nextRoomDocument, nextProfile);
    return nextRoomDocument;
  } catch (error) {
    setBlockingState(
      createBlockingState(
        "We couldn't load the shared room. Retry to fetch the latest room state.",
        "Any unconfirmed local changes will be discarded before the shared room reloads.",
        true
      )
    );
    setInlineError(getSharedRoomErrorMessage(error));
    return null;
  }
}

export async function joinRoom({
  hostedFlowActive,
  persistProfile,
  setInlineError,
  setBootstrapKind,
  setBlockingState,
  sharedRoomStore,
  applyRoomDocument,
  setTimedStatusMessage,
  code
}: JoinRoomArgs): Promise<SharedRoomDocument | null> {
  if (hostedFlowActive) {
    return null;
  }

  const nextProfile = persistProfile();
  setInlineError(null);
  setBootstrapKind("loading_room");
  setBlockingState(
    createBlockingState("Loading shared room...", "Joining your partner's room.")
  );

  try {
    const nextRoomDocument = await sharedRoomStore.joinSharedRoom({
      code,
      profile: nextProfile
    });

    applyRoomDocument(nextRoomDocument, nextProfile);
    setTimedStatusMessage("Shared room updated");
    return nextRoomDocument;
  } catch (error) {
    setBootstrapKind("legacy");
    setBlockingState(null);
    setInlineError(getSharedRoomErrorMessage(error));
    return null;
  }
}