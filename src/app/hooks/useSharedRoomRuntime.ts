import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  signInWithGoogle as signInWithGoogleDefault,
  signOutSharedAuth,
  subscribeToSharedAuth,
  toSharedPlayerProfile as mapFirebasePlayerProfile
} from "../../lib/firebaseAuth";
import { getSharedBackendState } from "../../lib/sharedBackendConfig";
import { isSharedRoomConflictError, sharedRoomClient } from "../../lib/sharedRoomClient";
import { sharedRoomOwnershipClient } from "../../lib/sharedRoomOwnershipClient";
import {
  cloneRoomState,
  createDefaultRoomState,
  type RoomState
} from "../../lib/roomState";
import { cloneSharedRoomFrameMemories } from "../../lib/sharedRoomMemories";
import { cloneSharedRoomPetRecord } from "../../lib/sharedRoomPet";
import { advanceRitualDayIfNeeded } from "../../lib/sharedProgression";
import type { SharedRoomOwnershipStore } from "../../lib/sharedRoomOwnershipStore";
import type { SharedRoomStore } from "../../lib/sharedRoomStore";
import type {
  SharedPendingPairLink,
  SharedPlayerProfile,
  SharedRoomBootstrapState,
  SharedRoomDocument,
  SharedRoomFrameMemory,
  SharedRoomPetRecord,
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
  frameMemories: Record<string, SharedRoomFrameMemory>;
  sharedPet: SharedRoomPetRecord | null;
}

export interface SharedRoomBlockingState {
  title: string;
  body: string;
  retryable: boolean;
}

export type SharedRoomRuntimeBootstrapKind =
  | "legacy"
  | "signed_out"
  | "hosted_unavailable"
  | "needs_linking"
  | "pending_link"
  | "loading_room"
  | "room_ready";

export type SharedRoomRuntimeEntryMode =
  | "legacy"
  | "hosted"
  | "hosted_unavailable"
  | "dev_fallback";

export interface SharedAuthAdapter<User = unknown> {
  signInWithGoogle(): Promise<unknown>;
  signOut(): Promise<void>;
  subscribe(callback: (user: User | null) => void): () => void;
  toSharedPlayerProfile(user: User): SharedPlayerProfile;
}

type SharedRoomMutation = (
  snapshot: SharedRoomRuntimeSnapshot
) => {
  roomState: RoomState;
  progression: SharedRoomProgressionState;
  frameMemories: Record<string, SharedRoomFrameMemory>;
  sharedPet: SharedRoomPetRecord | null;
};

interface SharedRoomRuntimeOptions {
  devBootstrapRoomState?: RoomState;
  devBootstrapSharedCoins?: number;
  devBypassEnabled?: boolean;
  hostedFlowEnabled?: boolean;
  sharedAuthAdapter?: SharedAuthAdapter | null;
  sharedRoomOwnershipStore?: SharedRoomOwnershipStore | null;
  sharedRoomStore?: SharedRoomStore;
}

const HOSTED_LOADING_TITLE = "Loading your room...";
const HOSTED_VERIFY_ERROR_TITLE = "We couldn't verify your room right now.";
const HOSTED_UNAVAILABLE_TITLE = "Hosted couple room setup is incomplete.";
const PENDING_LINK_POLL_INTERVAL_MS = 1000;
const ROOM_PASSIVE_SYNC_INTERVAL_MS = 1000;

const defaultSharedAuthAdapter: SharedAuthAdapter<unknown> = {
  signInWithGoogle() {
    return signInWithGoogleDefault();
  },
  signOut() {
    return signOutSharedAuth();
  },
  subscribe(callback) {
    return subscribeToSharedAuth((user) => callback(user));
  },
  toSharedPlayerProfile(user) {
    return mapFirebasePlayerProfile(
      user as Parameters<typeof mapFirebasePlayerProfile>[0]
    );
  }
};

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

function createHostedUnavailableBody(missingKeys: readonly string[]): string {
  if (missingKeys.length === 0) {
    return "Google sign-in and hosted couple linking are unavailable until the hosted backend is configured.";
  }

  return `Missing Firebase setup: ${missingKeys.join(", ")}. Finish the hosted env config before testing Google sign-in and couple linking.`;
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
    roomState: cloneRoomState(roomDocument.roomState),
    frameMemories: cloneSharedRoomFrameMemories(roomDocument.frameMemories),
    sharedPet: roomDocument.sharedPet
      ? cloneSharedRoomPetRecord(roomDocument.sharedPet)
      : null
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
  hostedFlowEnabled,
  sharedAuthAdapter,
  sharedRoomOwnershipStore,
  sharedRoomStore = sharedRoomClient
}: SharedRoomRuntimeOptions = {}) {
  const backendState = useMemo(() => getSharedBackendState(), []);
  const wantsHostedFlow =
    hostedFlowEnabled ?? backendState.firebaseRequested;
  const resolvedSharedAuthAdapter =
    sharedAuthAdapter === undefined
      ? wantsHostedFlow
        ? defaultSharedAuthAdapter
        : null
      : sharedAuthAdapter;
  const resolvedSharedRoomOwnershipStore =
    sharedRoomOwnershipStore === undefined
      ? wantsHostedFlow
        ? sharedRoomOwnershipClient
        : null
      : sharedRoomOwnershipStore;
  const hostedFlowActive =
    wantsHostedFlow &&
    resolvedSharedAuthAdapter !== null &&
    resolvedSharedRoomOwnershipStore !== null;
  const hostedFlowUnavailable = wantsHostedFlow && !hostedFlowActive;
  const devBypassActive =
    !hostedFlowActive && !hostedFlowUnavailable && devBypassEnabled;
  const hostedUnavailableBody = useMemo(
    () => createHostedUnavailableBody(backendState.firebaseMissingKeys),
    [backendState.firebaseMissingKeys]
  );
  const entryMode: SharedRoomRuntimeEntryMode = hostedFlowActive
    ? "hosted"
    : hostedFlowUnavailable
      ? "hosted_unavailable"
      : devBypassActive
        ? "dev_fallback"
        : "legacy";
  const initialProfile = useMemo(() => loadOrCreateSharedPlayerProfile(), []);
  const [profile, setProfile] = useState<SharedPlayerProfile>(initialProfile);
  const [displayName, setDisplayName] = useState(initialProfile.displayName);
  const [roomDocument, setRoomDocument] = useState<SharedRoomDocument | null>(null);
  const [session, setSession] = useState<SharedRoomSession | null>(() => loadSharedRoomSession());
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selfPairCode, setSelfPairCode] = useState<string | null>(null);
  const [pendingLink, setPendingLink] = useState<SharedPendingPairLink | null>(null);
  const [bootstrapKind, setBootstrapKind] = useState<SharedRoomRuntimeBootstrapKind>(
    () => {
      if (hostedFlowUnavailable) {
        return "hosted_unavailable";
      }

      if (hostedFlowActive || session || devBypassActive) {
        return "loading_room";
      }

      return "legacy";
    }
  );
  const [blockingState, setBlockingState] = useState<SharedRoomBlockingState | null>(
    () => {
      if (hostedFlowUnavailable) {
        return null;
      }

      if (hostedFlowActive) {
        return createBlockingState(
          HOSTED_LOADING_TITLE,
          "Checking your couple room."
        );
      }

      if (session) {
        return createBlockingState(
          "Loading shared room...",
          "Fetching the latest shared room state."
        );
      }

      if (devBypassActive) {
        return createBlockingState(
          "Loading shared room...",
          "Bootstrapping the development shared room."
        );
      }

      return null;
    }
  );
  const statusTimeoutRef = useRef<number | null>(null);
  const devBootstrapRequestRef = useRef(false);
  const activeHostedPlayerIdRef = useRef<string | null>(null);
  const profileRef = useRef(initialProfile);

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

  const clearActiveRoomState = useCallback(() => {
    clearSharedRoomSession();
    setRoomDocument(null);
    setSession(null);
  }, []);

  const adoptProfile = useCallback((nextProfile: SharedPlayerProfile) => {
    saveSharedPlayerProfile(nextProfile);
    setProfile(nextProfile);
    setDisplayName(nextProfile.displayName);
    return nextProfile;
  }, []);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const persistProfile = useCallback(
    (nextDisplayName = displayName): SharedPlayerProfile => {
      const nextProfile = loadOrCreateSharedPlayerProfile(nextDisplayName);
      return adoptProfile(nextProfile);
    },
    [adoptProfile, displayName]
  );

  const applyRoomDocument = useCallback(
    (nextRoomDocument: SharedRoomDocument, nextProfile = profileRef.current) => {
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
      setPendingLink(null);
      setBootstrapKind("room_ready");
      saveSharedRoomSession(nextSession);
      setInlineError(null);
      setBlockingState(null);

      return nextSession;
    },
    []
  );

  const loadLegacyRoom = useCallback(
    async (
      roomId: string,
      loadingBody: string
    ): Promise<SharedRoomDocument | null> => {
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
    },
    [applyRoomDocument, clearActiveRoomState, clearStatusMessage, sharedRoomStore]
  );

  const loadHostedRoom = useCallback(
    async (
      roomId: string,
      nextProfile: SharedPlayerProfile,
      nextSelfPairCode: string | null
    ): Promise<SharedRoomDocument | null> => {
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
    },
    [applyRoomDocument, clearActiveRoomState, sharedRoomStore]
  );

  const applyHostedBootstrapState = useCallback(
    async (
      nextBootstrapState: SharedRoomBootstrapState,
      nextProfile: SharedPlayerProfile
    ) => {
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
    },
    [clearActiveRoomState, loadHostedRoom]
  );

  const refreshHostedBootstrapState = useCallback(
    async (nextProfile: SharedPlayerProfile) => {
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
    },
    [
      applyHostedBootstrapState,
      clearActiveRoomState,
      hostedFlowActive,
      resolvedSharedRoomOwnershipStore
    ]
  );

  useEffect(() => {
    if (!hostedFlowActive || !resolvedSharedAuthAdapter) {
      return;
    }

    const unsubscribe = resolvedSharedAuthAdapter.subscribe((nextUser) => {
      if (!nextUser) {
        activeHostedPlayerIdRef.current = null;
        clearStatusMessage();
        clearActiveRoomState();
        setSelfPairCode(null);
        setPendingLink(null);
        setInlineError(null);
        setBlockingState(null);
        setBootstrapKind("signed_out");
        return;
      }

      const nextProfile = adoptProfile(
        resolvedSharedAuthAdapter.toSharedPlayerProfile(nextUser)
      );

      activeHostedPlayerIdRef.current = nextProfile.playerId;
      void refreshHostedBootstrapState(nextProfile);
    });

    return unsubscribe;
  }, [
    adoptProfile,
    clearActiveRoomState,
    clearStatusMessage,
    hostedFlowActive,
    refreshHostedBootstrapState,
    resolvedSharedAuthAdapter
  ]);

  useEffect(() => {
    if (hostedFlowUnavailable) {
      setBlockingState(null);
      setBootstrapKind("hosted_unavailable");
      return;
    }

    if (hostedFlowActive) {
      return;
    }

    const sessionRoomId = session?.roomId ?? null;

    if (!sessionRoomId) {
      setBlockingState(null);
      setBootstrapKind("legacy");
      return;
    }

    if (roomDocument?.roomId === sessionRoomId) {
      return;
    }

    void loadLegacyRoom(sessionRoomId, "Fetching the latest shared room state.");
  }, [
    hostedFlowActive,
    hostedFlowUnavailable,
    loadLegacyRoom,
    roomDocument?.roomId,
    session?.roomId
  ]);

  const createRoom = useCallback(
    async (sourceRoomState: RoomState, sharedCoins: number) => {
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
    },
    [applyRoomDocument, hostedFlowActive, persistProfile, setTimedStatusMessage, sharedRoomStore]
  );

  const bootstrapDevRoom = useCallback(async () => {
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
    },
    [applyRoomDocument, hostedFlowActive, persistProfile, setTimedStatusMessage, sharedRoomStore]
  );

  useEffect(() => {
    if (
      hostedFlowActive ||
      hostedFlowUnavailable ||
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
  }, [
    bootstrapDevRoom,
    devBypassActive,
    hostedFlowActive,
    hostedFlowUnavailable,
    roomDocument,
    session
  ]);

  useEffect(() => {
    if (
      !hostedFlowActive ||
      bootstrapKind !== "pending_link" ||
      !pendingLink ||
      !resolvedSharedRoomOwnershipStore ||
      activeHostedPlayerIdRef.current !== profile.playerId
    ) {
      return;
    }

    const pollPendingLink = async () => {
      try {
        const nextBootstrapState =
          await resolvedSharedRoomOwnershipStore.loadBootstrapState({
            profile
          });

        if (activeHostedPlayerIdRef.current !== profile.playerId) {
          return;
        }

        if (nextBootstrapState.kind === "paired_room") {
          void applyHostedBootstrapState(nextBootstrapState, profile);
          return;
        }

        setSelfPairCode(nextBootstrapState.selfPairCode);
        setPendingLink(
          nextBootstrapState.kind === "pending_link"
            ? nextBootstrapState.pendingLink
            : null
        );
        setBootstrapKind(nextBootstrapState.kind);
        setBlockingState(null);
      } catch (error) {
        if (activeHostedPlayerIdRef.current !== profile.playerId) {
          return;
        }

        setInlineError(getSharedRoomErrorMessage(error));
      }
    };

    void pollPendingLink();
    const pollId = window.setInterval(() => {
      void pollPendingLink();
    }, PENDING_LINK_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(pollId);
    };
  }, [
    applyHostedBootstrapState,
    bootstrapKind,
    hostedFlowActive,
    pendingLink,
    profile,
    resolvedSharedRoomOwnershipStore
  ]);

  useEffect(() => {
    if (
      bootstrapKind !== "room_ready" ||
      !session?.roomId ||
      !roomDocument ||
      roomDocument.sharedPet
    ) {
      return;
    }

    let cancelled = false;

    const syncSharedPetPresence = async () => {
      try {
        const nextRoomDocument = await sharedRoomStore.loadSharedRoom({
          roomId: session.roomId
        });

        if (cancelled) {
          return;
        }

        if (
          nextRoomDocument.revision > roomDocument.revision ||
          (roomDocument.sharedPet === null && nextRoomDocument.sharedPet !== null)
        ) {
          applyRoomDocument(nextRoomDocument);
        }
      } catch {
        // Passive sync should stay quiet; explicit reload paths still surface errors.
      }
    };

    const pollId = window.setInterval(() => {
      void syncSharedPetPresence();
    }, ROOM_PASSIVE_SYNC_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
    };
  }, [
    applyRoomDocument,
    bootstrapKind,
    roomDocument,
    session?.roomId,
    sharedRoomStore
  ]);

  const reloadRoom = useCallback(async () => {
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
  }, [
    bootstrapKind,
    bootstrapDevRoom,
    devBypassActive,
    hostedFlowActive,
    hostedFlowUnavailable,
    loadHostedRoom,
    loadLegacyRoom,
    profile,
    refreshHostedBootstrapState,
    selfPairCode,
    session,
    setTimedStatusMessage
  ]);

  const recoverFromStaleSharedEdit = useCallback(async () => {
    return reloadRoom();
  }, [reloadRoom]);

  const commitRoomState = useCallback(
    async (
      nextRoomState: RoomState,
      progression: SharedRoomProgressionState,
      reason: string
    ) => {
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
          sharedPet: roomDocument.sharedPet,
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
    [
      applyRoomDocument,
      reloadRoom,
      roomDocument,
      session,
      setTimedStatusMessage,
      sharedRoomStore
    ]
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
          frameMemories: mutationResult.frameMemories,
          sharedPet: mutationResult.sharedPet,
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

  const signInWithGoogle = useCallback(async () => {
    if (!hostedFlowActive || !resolvedSharedAuthAdapter) {
      if (hostedFlowUnavailable) {
        setInlineError(hostedUnavailableBody);
      }
      return null;
    }

    setInlineError(null);

    try {
      return await resolvedSharedAuthAdapter.signInWithGoogle();
    } catch (error) {
      setInlineError(getSharedRoomErrorMessage(error));
      return null;
    }
  }, [
    hostedFlowActive,
    hostedFlowUnavailable,
    hostedUnavailableBody,
    resolvedSharedAuthAdapter
  ]);

  const signOut = useCallback(async () => {
    if (!hostedFlowActive || !resolvedSharedAuthAdapter) {
      clearActiveRoomState();
      setBootstrapKind("legacy");
      return;
    }

    clearStatusMessage();
    setInlineError(null);

    try {
      await resolvedSharedAuthAdapter.signOut();
    } catch (error) {
      setInlineError(getSharedRoomErrorMessage(error));
    }
  }, [
    clearActiveRoomState,
    clearStatusMessage,
    hostedFlowActive,
    resolvedSharedAuthAdapter
  ]);

  const submitPartnerCode = useCallback(
    async (pairCode: string) => {
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
    },
    [
      applyHostedBootstrapState,
      bootstrapKind,
      hostedFlowActive,
      profile,
      resolvedSharedRoomOwnershipStore
    ]
  );

  const confirmPairLink = useCallback(async () => {
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
  }, [
    applyHostedBootstrapState,
    bootstrapKind,
    hostedFlowActive,
    pendingLink,
    profile,
    resolvedSharedRoomOwnershipStore
  ]);

  const cancelPairLink = useCallback(async () => {
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
  }, [
    applyHostedBootstrapState,
    bootstrapKind,
    hostedFlowActive,
    pendingLink,
    profile,
    resolvedSharedRoomOwnershipStore
  ]);

  const clearRoom = useCallback(() => {
    clearActiveRoomState();
    clearStatusMessage();
    setSelfPairCode(null);
    setPendingLink(null);
    setBlockingState(null);
    setInlineError(null);
    setBootstrapKind(
      hostedFlowActive
        ? "signed_out"
        : hostedFlowUnavailable
          ? "hosted_unavailable"
          : "legacy"
    );
  }, [
    clearActiveRoomState,
    clearStatusMessage,
    hostedFlowActive,
    hostedFlowUnavailable
  ]);

  return {
    backendState,
    blockingState,
    bootstrapKind,
    cancelPairLink,
    clearInlineError: () => setInlineError(null),
    clearRoom,
    commitRoomMutation,
    commitRoomState,
    confirmPairLink,
    createRoom,
    devBypassActive,
    displayName,
    entryMode,
    hasPartner: roomDocument?.memberIds.length === 2,
    hostedUnavailableBody,
    inlineError,
    joinRoom,
    pendingLink,
    profile,
    recoverFromStaleSharedEdit,
    reloadRoom,
    roomDocument,
    runtimeSnapshot: roomDocument
      ? createSharedRoomRuntimeSnapshot(roomDocument)
      : null,
    selfPairCode,
    session,
    setDisplayName,
    signInWithGoogle,
    signOut,
    statusMessage,
    submitPartnerCode
  };
}
