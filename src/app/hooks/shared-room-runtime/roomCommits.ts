import type { RoomState } from "../../../lib/roomState";
import { isSharedRoomConflictError } from "../../../lib/sharedRoomClient";
import type { SharedRoomStore } from "../../../lib/sharedRoomStore";
import type {
  SharedPlayerProfile,
  SharedRoomDocument,
  SharedRoomSession
} from "../../../lib/sharedRoomTypes";
import type { SharedRoomProgressionState } from "../../../lib/sharedProgressionTypes";
import {
  createBlockingState,
  getSharedRoomErrorMessage
} from "./runtimeMessages";
import { createSharedRoomRuntimeSnapshot } from "./runtimeSnapshot";
import type {
  ApplyRoomDocumentFn,
  HostedPlayerIdRef,
  SetBlockingStateFn,
  SetBootstrapKindFn,
  SetInlineErrorFn,
  SharedRoomMutation
} from "./runtimeTypes";

interface ReloadRoomArgs {
  hostedFlowActive: boolean;
  activeHostedPlayerIdRef: HostedPlayerIdRef;
  profile: SharedPlayerProfile;
  bootstrapKind: string;
  refreshHostedBootstrapState: (
    nextProfile: SharedPlayerProfile
  ) => Promise<SharedRoomDocument | null>;
  session: SharedRoomSession | null;
  setTimedStatusMessage: (message: string | null) => void;
  loadHostedRoom: (
    roomId: string,
    nextProfile: SharedPlayerProfile,
    nextSelfPairCode: string | null
  ) => Promise<SharedRoomDocument | null>;
  selfPairCode: string | null;
  hostedFlowUnavailable: boolean;
  setBootstrapKind: SetBootstrapKindFn;
  setBlockingState: SetBlockingStateFn;
  devBypassActive: boolean;
  bootstrapDevRoom: () => Promise<SharedRoomDocument | null>;
  loadLegacyRoom: (
    roomId: string,
    loadingBody: string
  ) => Promise<SharedRoomDocument | null>;
}

interface CommitRoomStateArgs {
  session: SharedRoomSession | null;
  roomDocument: SharedRoomDocument | null;
  setTimedStatusMessage: (message: string | null) => void;
  sharedRoomStore: SharedRoomStore;
  applyRoomDocument: ApplyRoomDocumentFn;
  reloadRoom: () => Promise<SharedRoomDocument | null>;
  setBlockingState: SetBlockingStateFn;
  setInlineError: SetInlineErrorFn;
  nextRoomState: RoomState;
  progression: SharedRoomProgressionState;
  reason: string;
}

interface CommitRoomMutationArgs {
  session: SharedRoomSession | null;
  roomDocument: SharedRoomDocument | null;
  setTimedStatusMessage: (message: string | null) => void;
  sharedRoomStore: SharedRoomStore;
  applyRoomDocument: ApplyRoomDocumentFn;
  setBlockingState: SetBlockingStateFn;
  setInlineError: SetInlineErrorFn;
  reason: string;
  mutate: SharedRoomMutation;
}

export async function reloadRoom({
  hostedFlowActive,
  activeHostedPlayerIdRef,
  profile,
  bootstrapKind,
  refreshHostedBootstrapState,
  session,
  setTimedStatusMessage,
  loadHostedRoom,
  selfPairCode,
  hostedFlowUnavailable,
  setBootstrapKind,
  setBlockingState,
  devBypassActive,
  bootstrapDevRoom,
  loadLegacyRoom
}: ReloadRoomArgs): Promise<SharedRoomDocument | null> {
  if (hostedFlowActive) {
    if (
      activeHostedPlayerIdRef.current &&
      activeHostedPlayerIdRef.current === profile.playerId &&
      bootstrapKind !== "room_ready"
    ) {
      return refreshHostedBootstrapState(profile);
    }

    if (!session) {
      return null;
    }

    setTimedStatusMessage("Reloading latest room...");
    return loadHostedRoom(session.roomId, profile, selfPairCode);
  }

  if (hostedFlowUnavailable) {
    setBootstrapKind("hosted_unavailable");
    setBlockingState(null);
    return null;
  }

  if (!session && devBypassActive) {
    return bootstrapDevRoom();
  }

  if (!session) {
    return null;
  }

  setTimedStatusMessage("Reloading latest room...");
  return loadLegacyRoom(session.roomId, "Fetching the latest shared room state.");
}

export async function recoverFromStaleSharedEdit(input: {
  reloadRoom: () => Promise<SharedRoomDocument | null>;
}): Promise<SharedRoomDocument | null> {
  return input.reloadRoom();
}

export async function commitRoomState({
  session,
  roomDocument,
  setTimedStatusMessage,
  sharedRoomStore,
  applyRoomDocument,
  reloadRoom,
  setBlockingState,
  setInlineError,
  nextRoomState,
  progression,
  reason
}: CommitRoomStateArgs): Promise<SharedRoomDocument | null> {
  if (!session || !roomDocument) {
    return null;
  }

  setTimedStatusMessage("Saving shared room...");

  try {
    const nextRoomDocument = await sharedRoomStore.commitSharedRoomState({
      roomId: session.roomId,
      expectedRevision: session.lastKnownRevision,
      roomState: nextRoomState,
      progression,
      frameMemories: roomDocument.frameMemories,
      sharedPets: roomDocument.sharedPets,
      reason
    });

    applyRoomDocument(nextRoomDocument);
    setTimedStatusMessage("Shared room updated");
    return nextRoomDocument;
  } catch (error) {
    if (isSharedRoomConflictError(error)) {
      void reloadRoom();
      return null;
    }

    setBlockingState(
      createBlockingState(
        "We couldn't save your changes to the shared room. Retry to fetch the latest room state and try again.",
        "Any unconfirmed local changes may be discarded before the shared room reloads.",
        true
      )
    );
    setInlineError(getSharedRoomErrorMessage(error));
    return null;
  }
}

export async function commitRoomMutation({
  session,
  roomDocument,
  setTimedStatusMessage,
  sharedRoomStore,
  applyRoomDocument,
  setBlockingState,
  setInlineError,
  reason,
  mutate
}: CommitRoomMutationArgs): Promise<SharedRoomDocument | null> {
  if (!session || !roomDocument) {
    return null;
  }

  async function attemptCommit(
    sourceRoomDocument: SharedRoomDocument
  ): Promise<SharedRoomDocument> {
    const mutationResult = mutate(createSharedRoomRuntimeSnapshot(sourceRoomDocument));

    return sharedRoomStore.commitSharedRoomState({
      roomId: sourceRoomDocument.roomId,
      expectedRevision: sourceRoomDocument.revision,
      roomState: mutationResult.roomState,
      progression: mutationResult.progression,
      frameMemories: mutationResult.frameMemories,
      sharedPets: mutationResult.sharedPets,
      reason
    });
  }

  setTimedStatusMessage("Saving shared room...");

  try {
    const nextRoomDocument = await attemptCommit(roomDocument);
    applyRoomDocument(nextRoomDocument);
    setTimedStatusMessage("Shared room updated");
    return nextRoomDocument;
  } catch (error) {
    if (isSharedRoomConflictError(error)) {
      setTimedStatusMessage("Reloading latest room...");

      try {
        const latestRoomDocument = await sharedRoomStore.loadSharedRoom({
          roomId: session.roomId
        });
        applyRoomDocument(latestRoomDocument);

        const replayedRoomDocument = await attemptCommit(latestRoomDocument);
        applyRoomDocument(replayedRoomDocument);
        setTimedStatusMessage("Shared room updated");
        return replayedRoomDocument;
      } catch (replayError) {
        error = replayError;
      }
    }

    setBlockingState(
      createBlockingState(
        "We couldn't save your changes to the shared room. Retry to fetch the latest room state and try again.",
        "Any unconfirmed local changes may be discarded before the shared room reloads.",
        true
      )
    );
    setInlineError(getSharedRoomErrorMessage(error));
    return null;
  }
}