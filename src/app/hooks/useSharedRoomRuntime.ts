import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isSharedRoomConflictError, sharedRoomClient } from "../../lib/sharedRoomClient";
import {
  cloneRoomState,
  createDefaultRoomState,
  type RoomState
} from "../../lib/roomState";
import { advanceRitualDayIfNeeded } from "../../lib/sharedProgression";
import type { SharedRoomStore } from "../../lib/sharedRoomStore";
import type {
  SharedPlayerProfile,
  SharedRoomDocument,
  SharedRoomSession
} from "../../lib/sharedRoomTypes";
import type { SharedRoomProgressionState } from "../../lib/sharedProgressionTypes";
import {
  clearSharedRoomSession,
  loadOrCreateSharedPlayerProfile,
  loadSharedRoomSession,
  saveSharedPlayerProfile,
  saveSharedRoomSession
} from "../../lib/sharedRoomSession";

export interface SharedRoomRuntimeSnapshot {
  roomId: string;
  inviteCode: string;
  revision: number;
  memberIds: string[];
  members: SharedRoomDocument["members"];
  progression: SharedRoomProgressionState;
  roomState: RoomState;
}

export interface SharedRoomBlockingState {
  title: string;
  body: string;
  retryable: boolean;
}

type SharedRoomMutation = (
  snapshot: SharedRoomRuntimeSnapshot
) => {
  roomState: RoomState;
  progression: SharedRoomProgressionState;
};

interface SharedRoomRuntimeOptions {
  devBootstrapRoomState?: RoomState;
  devBootstrapSharedCoins?: number;
  devBypassEnabled?: boolean;
  sharedRoomStore?: SharedRoomStore;
}

function getSharedRoomErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Shared room request failed.";
}

function createBlockingState(
  title: string,
  body: string,
  retryable = false
): SharedRoomBlockingState {
  return {
    title,
    body,
    retryable
  };
}

export function createSharedRoomSessionFromDocument(
  playerId: string,
  roomDocument: SharedRoomDocument
): SharedRoomSession {
  const partnerId =
    roomDocument.memberIds.find((memberId) => memberId !== playerId) ?? null;

  return {
    playerId,
    partnerId,
    roomId: roomDocument.roomId,
    inviteCode: roomDocument.inviteCode,
    lastKnownRevision: roomDocument.revision
  };
}

export function createSharedRoomRuntimeSnapshot(
  roomDocument: SharedRoomDocument
): SharedRoomRuntimeSnapshot {
  return {
    roomId: roomDocument.roomId,
    inviteCode: roomDocument.inviteCode,
    revision: roomDocument.revision,
    memberIds: [...roomDocument.memberIds],
    members: roomDocument.members.map((member) => ({ ...member })),
    progression: advanceRitualDayIfNeeded(
      roomDocument.progression,
      roomDocument.memberIds,
      roomDocument.members,
      new Date().toISOString()
    ),
    roomState: cloneRoomState(roomDocument.roomState)
  };
}

export function shouldCommitSharedRoomChange(
  changeKind: "snapshot" | "committed"
): boolean {
  return changeKind === "committed";
}

export function useSharedRoomRuntime({
  devBootstrapRoomState,
  devBootstrapSharedCoins = 0,
  devBypassEnabled = import.meta.env.DEV,
  sharedRoomStore = sharedRoomClient
}: SharedRoomRuntimeOptions = {}) {
  const devBypassActive = devBypassEnabled;
  const initialProfile = useMemo(() => loadOrCreateSharedPlayerProfile(), []);
  const [profile, setProfile] = useState<SharedPlayerProfile>(initialProfile);
  const [displayName, setDisplayName] = useState(initialProfile.displayName);
  const [roomDocument, setRoomDocument] = useState<SharedRoomDocument | null>(null);
  const [session, setSession] = useState<SharedRoomSession | null>(() => loadSharedRoomSession());
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [blockingState, setBlockingState] = useState<SharedRoomBlockingState | null>(
    session
      ? createBlockingState(
          "Loading shared room...",
          "Fetching the latest shared room state."
        )
      : devBypassActive
        ? createBlockingState(
            "Loading shared room...",
            "Bootstrapping the development shared room."
          )
      : null
  );
  const statusTimeoutRef = useRef<number | null>(null);
  const devBootstrapRequestRef = useRef(false);

  const clearStatusMessage = useCallback(() => {
    if (statusTimeoutRef.current !== null) {
      window.clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = null;
    }

    setStatusMessage(null);
  }, []);

  const setTimedStatusMessage = useCallback(
    (message: string | null) => {
      clearStatusMessage();

      if (!message) {
        return;
      }

      setStatusMessage(message);
      statusTimeoutRef.current = window.setTimeout(() => {
        setStatusMessage(null);
        statusTimeoutRef.current = null;
      }, 2200);
    },
    [clearStatusMessage]
  );

  useEffect(() => clearStatusMessage, [clearStatusMessage]);

  const persistProfile = useCallback(
    (nextDisplayName = displayName): SharedPlayerProfile => {
      const nextProfile = loadOrCreateSharedPlayerProfile(nextDisplayName);
      saveSharedPlayerProfile(nextProfile);
      setProfile(nextProfile);
      setDisplayName(nextProfile.displayName);
      return nextProfile;
    },
    [displayName]
  );

  const applyRoomDocument = useCallback(
    (nextRoomDocument: SharedRoomDocument, nextProfile = profile) => {
      const normalizedRoomDocument: SharedRoomDocument = {
        ...nextRoomDocument,
        progression: advanceRitualDayIfNeeded(
          nextRoomDocument.progression,
          nextRoomDocument.memberIds,
          nextRoomDocument.members,
          new Date().toISOString()
        )
      };
      const nextSession = createSharedRoomSessionFromDocument(
        nextProfile.playerId,
        normalizedRoomDocument
      );

      setRoomDocument(normalizedRoomDocument);
      setSession(nextSession);
      saveSharedRoomSession(nextSession);
      setInlineError(null);
      setBlockingState(null);

      return nextSession;
    },
    [profile]
  );

  const loadRoom = useCallback(
    async (
      roomId: string,
      blockingTitle: string,
      blockingBody: string
    ): Promise<SharedRoomDocument | null> => {
      setBlockingState(createBlockingState(blockingTitle, blockingBody));

      try {
        const nextRoomDocument = await sharedRoomStore.loadSharedRoom({ roomId });
        applyRoomDocument(nextRoomDocument);
        return nextRoomDocument;
      } catch (error) {
        // If the room doesn't exist anymore (e.g. database reset), don't keep trying to load it!
        if (
          error &&
          typeof error === "object" &&
          "status" in error &&
          error.status === 404
        ) {
          clearRoom();
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
    },
    [applyRoomDocument, sharedRoomStore]
  );

  useEffect(() => {
    const sessionRoomId = session?.roomId ?? null;

    if (!sessionRoomId) {
      setBlockingState(null);
      return;
    }

    if (roomDocument?.roomId === sessionRoomId) {
      return;
    }

    void loadRoom(
      sessionRoomId,
      "Loading shared room...",
      "Fetching the latest shared room state."
    );
  }, [loadRoom, roomDocument?.roomId, session?.roomId]);

  const createRoom = useCallback(
    async (sourceRoomState: RoomState, sharedCoins: number) => {
      const nextProfile = persistProfile();
      setInlineError(null);
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
        setBlockingState(null);
        setInlineError(getSharedRoomErrorMessage(error));
        return null;
      }
    },
    [applyRoomDocument, persistProfile, setTimedStatusMessage, sharedRoomStore]
  );

  const bootstrapDevRoom = useCallback(async () => {
    if (!devBypassActive) {
      return null;
    }

    const nextProfile = persistProfile();
    setInlineError(null);
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
  }, [
    applyRoomDocument,
    devBootstrapRoomState,
    devBootstrapSharedCoins,
    devBypassActive,
    persistProfile,
    sharedRoomStore
  ]);

  const joinRoom = useCallback(
    async (code: string) => {
      const nextProfile = persistProfile();
      setInlineError(null);
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
        setBlockingState(null);
        setInlineError(getSharedRoomErrorMessage(error));
        return null;
      }
    },
    [applyRoomDocument, persistProfile, setTimedStatusMessage, sharedRoomStore]
  );

  useEffect(() => {
    if (
      !devBypassActive ||
      session ||
      roomDocument ||
      devBootstrapRequestRef.current
    ) {
      return;
    }

    devBootstrapRequestRef.current = true;
    void bootstrapDevRoom().finally(() => {
      devBootstrapRequestRef.current = false;
    });
  }, [bootstrapDevRoom, devBypassActive, roomDocument, session]);

  const reloadRoom = useCallback(async () => {
    if (!session && devBypassActive) {
      return bootstrapDevRoom();
    }

    if (!session) {
      return null;
    }

    setTimedStatusMessage("Reloading latest room...");

    return loadRoom(
      session.roomId,
      "Reloading latest room...",
      "Fetching the latest shared room state."
    );
  }, [bootstrapDevRoom, devBypassActive, loadRoom, session, setTimedStatusMessage]);

  const recoverFromStaleSharedEdit = useCallback(async () => {
    return reloadRoom();
  }, [reloadRoom]);

  const commitRoomState = useCallback(
    async (
      nextRoomState: RoomState,
      progression: SharedRoomProgressionState,
      reason: string
    ) => {
      if (!session) {
        return null;
      }

      setTimedStatusMessage("Saving shared room...");

      try {
        const nextRoomDocument = await sharedRoomStore.commitSharedRoomState({
          roomId: session.roomId,
          expectedRevision: session.lastKnownRevision,
          roomState: nextRoomState,
          progression,
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
    },
    [applyRoomDocument, reloadRoom, session, setTimedStatusMessage, sharedRoomStore]
  );

  const commitRoomMutation = useCallback(
    async (reason: string, mutate: SharedRoomMutation) => {
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
    },
    [applyRoomDocument, roomDocument, session, setTimedStatusMessage, sharedRoomStore]
  );

  const clearRoom = useCallback(() => {
    clearSharedRoomSession();
    clearStatusMessage();
    setRoomDocument(null);
    setSession(null);
    setBlockingState(null);
    setInlineError(null);
  }, [clearStatusMessage]);

  return {
    blockingState,
    clearInlineError: () => setInlineError(null),
    clearRoom,
    commitRoomMutation,
    commitRoomState,
    createRoom,
    devBypassActive,
    displayName,
    hasPartner: roomDocument?.memberIds.length === 2,
    inlineError,
    joinRoom,
    profile,
    recoverFromStaleSharedEdit,
    reloadRoom,
    roomDocument,
    runtimeSnapshot: roomDocument
      ? createSharedRoomRuntimeSnapshot(roomDocument)
      : null,
    session,
    setDisplayName,
    statusMessage
  };
}
