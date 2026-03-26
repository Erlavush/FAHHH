import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cloneRoomState, type RoomState } from "../../lib/roomState";
import { sharedRoomClient } from "../../lib/sharedRoomClient";
import type { SharedRoomStore } from "../../lib/sharedRoomStore";
import type {
  SharedPlayerProfile,
  SharedRoomDocument,
  SharedRoomSession
} from "../../lib/sharedRoomTypes";
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
  sharedCoins: number;
  memberIds: string[];
  roomState: RoomState;
}

export interface SharedRoomBlockingState {
  title: string;
  body: string;
  retryable: boolean;
}

interface SharedRoomRuntimeOptions {
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
    sharedCoins: roomDocument.sharedCoins,
    memberIds: [...roomDocument.memberIds],
    roomState: cloneRoomState(roomDocument.roomState)
  };
}

export function shouldCommitSharedRoomChange(
  changeKind: "snapshot" | "committed"
): boolean {
  return changeKind === "committed";
}

export function useSharedRoomRuntime({
  sharedRoomStore = sharedRoomClient
}: SharedRoomRuntimeOptions = {}) {
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
      : null
  );
  const statusTimeoutRef = useRef<number | null>(null);

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
      const nextSession = createSharedRoomSessionFromDocument(
        nextProfile.playerId,
        nextRoomDocument
      );

      setRoomDocument(nextRoomDocument);
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

  const reloadRoom = useCallback(async () => {
    if (!session) {
      return null;
    }

    setTimedStatusMessage("Reloading latest room...");

    return loadRoom(
      session.roomId,
      "Reloading latest room...",
      "Fetching the latest shared room state."
    );
  }, [loadRoom, session, setTimedStatusMessage]);

  const commitRoomState = useCallback(
    async (nextRoomState: RoomState, sharedCoins: number, reason: string) => {
      if (!session) {
        return null;
      }

      setTimedStatusMessage("Saving shared room...");

      try {
        const nextRoomDocument = await sharedRoomStore.commitSharedRoomState({
          roomId: session.roomId,
          expectedRevision: session.lastKnownRevision,
          roomState: nextRoomState,
          sharedCoins,
          reason
        });

        applyRoomDocument(nextRoomDocument);
        setTimedStatusMessage("Shared room updated");
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
    },
    [applyRoomDocument, session, setTimedStatusMessage, sharedRoomStore]
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
    commitRoomState,
    createRoom,
    displayName,
    hasPartner: roomDocument?.memberIds.length === 2,
    inlineError,
    joinRoom,
    profile,
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
