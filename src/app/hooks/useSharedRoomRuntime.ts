import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  signInWithGoogle as signInWithGoogleDefault,
  signOutSharedAuth,
  subscribeToSharedAuth,
  toSharedPlayerProfile as mapFirebasePlayerProfile
} from "../../lib/firebaseAuth";
import { getSharedBackendState } from "../../lib/sharedBackendConfig";
import { sharedRoomClient } from "../../lib/sharedRoomClient";
import { sharedRoomOwnershipClient } from "../../lib/sharedRoomOwnershipClient";
import type { RoomState } from "../../lib/roomState";
import { advanceRitualDayIfNeeded } from "../../lib/sharedProgression";
import type {
  SharedPendingPairLink,
  SharedPlayerProfile,
  SharedRoomBootstrapState,
  SharedRoomDocument
} from "../../lib/sharedRoomTypes";
import {
  clearSharedRoomSession,
  loadOrCreateSharedPlayerProfile,
  loadSharedRoomSession,
  saveSharedPlayerProfile,
  saveSharedRoomSession
} from "../../lib/sharedRoomSession";
import {
  bootstrapDevRoom as bootstrapDevRoomFlow,
  createRoom as createRoomFlow,
  joinRoom as joinRoomFlow,
  loadLegacyRoom as loadLegacyRoomFlow
} from "./shared-room-runtime/bootstrapFlow";
import {
  applyHostedBootstrapState as applyHostedBootstrapStateFlow,
  cancelPairLink as cancelPairLinkFlow,
  confirmPairLink as confirmPairLinkFlow,
  loadHostedRoom as loadHostedRoomFlow,
  refreshHostedBootstrapState as refreshHostedBootstrapStateFlow,
  submitPartnerCode as submitPartnerCodeFlow
} from "./shared-room-runtime/hostedFlow";
import {
  createBlockingState,
  createHostedUnavailableBody,
  getSharedRoomErrorMessage,
  HOSTED_LOADING_TITLE,
  PENDING_LINK_POLL_INTERVAL_MS,
  ROOM_PASSIVE_SYNC_INTERVAL_MS
} from "./shared-room-runtime/runtimeMessages";
import {
  createSharedRoomRuntimeSnapshot,
  createSharedRoomSessionFromDocument,
  shouldCommitSharedRoomChange
} from "./shared-room-runtime/runtimeSnapshot";
import type {
  SharedAuthAdapter,
  SharedRoomBlockingState,
  SharedRoomRuntimeBootstrapKind,
  SharedRoomRuntimeEntryMode,
  SharedRoomRuntimeOptions
} from "./shared-room-runtime/runtimeTypes";
import {
  commitRoomMutation as commitRoomMutationFlow,
  commitRoomState as commitRoomStateFlow,
  recoverFromStaleSharedEdit as recoverFromStaleSharedEditFlow,
  reloadRoom as reloadRoomFlow
} from "./shared-room-runtime/roomCommits";

export type {
  SharedAuthAdapter,
  SharedRoomBlockingState,
  SharedRoomRuntimeBootstrapKind,
  SharedRoomRuntimeEntryMode,
  SharedRoomRuntimeOptions,
  SharedRoomRuntimeSnapshot
} from "./shared-room-runtime/runtimeTypes";
export {
  createSharedRoomRuntimeSnapshot,
  createSharedRoomSessionFromDocument,
  shouldCommitSharedRoomChange
} from "./shared-room-runtime/runtimeSnapshot";

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

export function useSharedRoomRuntime({
  devBootstrapRoomState,
  devBootstrapSharedCoins = 0,
  devBypassEnabled = import.meta.env.DEV,
  hostedFlowEnabled,
  legacySessionEnabled = true,
  sharedAuthAdapter,
  sharedRoomOwnershipStore,
  sharedRoomStore = sharedRoomClient
}: SharedRoomRuntimeOptions = {}) {
  const backendState = useMemo(() => getSharedBackendState(), []);
  const wantsHostedFlow = hostedFlowEnabled ?? backendState.firebaseRequested;
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
  const [session, setSession] = useState(() => loadSharedRoomSession());
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selfPairCode, setSelfPairCode] = useState<string | null>(null);
  const [pendingLink, setPendingLink] = useState<SharedPendingPairLink | null>(null);
  const [bootstrapKind, setBootstrapKind] = useState<SharedRoomRuntimeBootstrapKind>(() => {
    if (hostedFlowUnavailable) {
      return "hosted_unavailable";
    }

    if (hostedFlowActive || (legacySessionEnabled && session) || devBypassActive) {
      return "loading_room";
    }

    return "legacy";
  });
  const [blockingState, setBlockingState] = useState<SharedRoomBlockingState | null>(() => {
    if (hostedFlowUnavailable) {
      return null;
    }

    if (hostedFlowActive) {
      return createBlockingState(HOSTED_LOADING_TITLE, "Checking your couple room.");
    }

    if (legacySessionEnabled && session) {
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
  });
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
    async (roomId: string, loadingBody: string) =>
      loadLegacyRoomFlow({
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
      }),
    [
      applyRoomDocument,
      clearActiveRoomState,
      clearStatusMessage,
      sharedRoomStore
    ]
  );

  const loadHostedRoom = useCallback(
    async (
      roomId: string,
      nextProfile: SharedPlayerProfile,
      nextSelfPairCode: string | null
    ) =>
      loadHostedRoomFlow({
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
      }),
    [applyRoomDocument, clearActiveRoomState, sharedRoomStore]
  );

  const applyHostedBootstrapState = useCallback(
    async (
      nextBootstrapState: SharedRoomBootstrapState,
      nextProfile: SharedPlayerProfile
    ) =>
      applyHostedBootstrapStateFlow({
        nextBootstrapState,
        nextProfile,
        clearActiveRoomState,
        setPendingLink,
        setBootstrapKind,
        setBlockingState,
        setInlineError,
        setSelfPairCode,
        loadHostedRoom
      }),
    [clearActiveRoomState, loadHostedRoom]
  );

  const refreshHostedBootstrapState = useCallback(
    async (nextProfile: SharedPlayerProfile) =>
      refreshHostedBootstrapStateFlow({
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
      }),
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

    if (!legacySessionEnabled) {
      setBlockingState(null);
      setBootstrapKind("legacy");
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
    legacySessionEnabled,
    loadLegacyRoom,
    roomDocument?.roomId,
    session?.roomId
  ]);

  const createRoom = useCallback(
    async (sourceRoomState: RoomState, sharedCoins: number) =>
      createRoomFlow({
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
      }),
    [
      applyRoomDocument,
      hostedFlowActive,
      persistProfile,
      setTimedStatusMessage,
      sharedRoomStore
    ]
  );

  const bootstrapDevRoom = useCallback(
    async () =>
      bootstrapDevRoomFlow({
        devBypassActive,
        persistProfile,
        setInlineError,
        setBootstrapKind,
        setBlockingState,
        sharedRoomStore,
        applyRoomDocument,
        devBootstrapRoomState,
        devBootstrapSharedCoins
      }),
    [
      applyRoomDocument,
      devBootstrapRoomState,
      devBootstrapSharedCoins,
      devBypassActive,
      persistProfile,
      sharedRoomStore
    ]
  );

  const joinRoom = useCallback(
    async (code: string) =>
      joinRoomFlow({
        hostedFlowActive,
        persistProfile,
        setInlineError,
        setBootstrapKind,
        setBlockingState,
        sharedRoomStore,
        applyRoomDocument,
        setTimedStatusMessage,
        code
      }),
    [
      applyRoomDocument,
      hostedFlowActive,
      persistProfile,
      setTimedStatusMessage,
      sharedRoomStore
    ]
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
      roomDocument.sharedPets.length > 0
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
          (roomDocument.sharedPets.length === 0 && nextRoomDocument.sharedPets.length > 0)
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

  const reloadRoom = useCallback(
    async () =>
      reloadRoomFlow({
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
      }),
    [
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
    ]
  );

  const recoverFromStaleSharedEdit = useCallback(
    async () => recoverFromStaleSharedEditFlow({ reloadRoom }),
    [reloadRoom]
  );

  const commitRoomState = useCallback(
    async (
      nextRoomState: RoomState,
      progression: SharedRoomDocument["progression"],
      reason: string
    ) =>
      commitRoomStateFlow({
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
      }),
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
    async (
      reason: string,
      mutate: Parameters<typeof commitRoomMutationFlow>[0]["mutate"]
    ) =>
      commitRoomMutationFlow({
        session,
        roomDocument,
        setTimedStatusMessage,
        sharedRoomStore,
        applyRoomDocument,
        setBlockingState,
        setInlineError,
        reason,
        mutate
      }),
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
    async (pairCode: string) =>
      submitPartnerCodeFlow({
        hostedFlowActive,
        bootstrapKind,
        resolvedSharedRoomOwnershipStore,
        activeHostedPlayerIdRef,
        profile,
        pairCode,
        setInlineError,
        applyHostedBootstrapState
      }),
    [
      applyHostedBootstrapState,
      bootstrapKind,
      hostedFlowActive,
      profile,
      resolvedSharedRoomOwnershipStore
    ]
  );

  const confirmPairLink = useCallback(
    async () =>
      confirmPairLinkFlow({
        hostedFlowActive,
        bootstrapKind,
        pendingLink,
        resolvedSharedRoomOwnershipStore,
        activeHostedPlayerIdRef,
        profile,
        setInlineError,
        applyHostedBootstrapState
      }),
    [
      applyHostedBootstrapState,
      bootstrapKind,
      hostedFlowActive,
      pendingLink,
      profile,
      resolvedSharedRoomOwnershipStore
    ]
  );

  const cancelPairLink = useCallback(
    async () =>
      cancelPairLinkFlow({
        hostedFlowActive,
        bootstrapKind,
        pendingLink,
        resolvedSharedRoomOwnershipStore,
        activeHostedPlayerIdRef,
        profile,
        setInlineError,
        applyHostedBootstrapState
      }),
    [
      applyHostedBootstrapState,
      bootstrapKind,
      hostedFlowActive,
      pendingLink,
      profile,
      resolvedSharedRoomOwnershipStore
    ]
  );

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