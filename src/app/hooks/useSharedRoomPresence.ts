import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sharedPresenceClient } from "../../lib/sharedPresenceClient";
import type { SharedPresenceStore } from "../../lib/sharedPresenceStore";
import type {
  SharedEditLockRoomSnapshot,
  SharedPairLinkPresenceSnapshot,
  SharedPetLiveState,
  SharedPresenceRoomSnapshot,
  SharedPresenceMotionState,
  SharedPresenceSnapshot
} from "../../lib/sharedPresenceTypes";
import type { SharedPlayerProfile } from "../../lib/sharedRoomTypes";
import type { LocalPlayerPresenceSnapshot } from "../types";
import type { SharedRoomRuntimeBootstrapKind } from "./useSharedRoomRuntime";

export type SharedPresenceFreshness = "offline" | "live" | "holding" | "reconnecting";
export type SharedPresenceStatusTitle =
  | "Waiting for partner"
  | "Partner away"
  | "Partner joined"
  | "Partner reconnecting"
  | "Partner is back"
  | "Together now";

export interface SharedPresenceStatus {
  body: string;
  isBlocking: false;
  title: SharedPresenceStatusTitle;
  tone: "presence" | "success" | "attention";
}

export interface SharedCozyRestEligibility {
  eligible: boolean;
  furnitureId: string | null;
  localSlotId: string | null;
  partnerSlotId: string | null;
}

export interface UseSharedRoomPresenceOptions {
  enabled: boolean;
  bootstrapKind?: SharedRoomRuntimeBootstrapKind;
  localPresence: LocalPlayerPresenceSnapshot | null;
  localSharedPetState?: SharedPetLiveState | null;
  pendingLinkId?: string | null;
  partnerId: string | null;
  profile: SharedPlayerProfile;
  roomId: string | null;
  sharedPresenceStore?: SharedPresenceStore;
  skinSrc: string | null;
}

const PRESENCE_PUBLISH_INTERVAL_MS = 100;
const PRESENCE_POLL_INTERVAL_MS = 100;
const PRESENCE_LIVE_THRESHOLD_MS = 2500;
const PRESENCE_HOLD_THRESHOLD_MS = 6000;
const PRESENCE_RECONNECT_THRESHOLD_MS = 10000;
const PRESENCE_STATUS_SETTLE_MS = 2200;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Shared presence request failed.";
}

function getErrorStatus(error: unknown): number | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status;
  }

  return null;
}

export function buildSharedPresenceSnapshot(
  roomId: string,
  profile: SharedPlayerProfile,
  skinSrc: string | null,
  localPresence: LocalPlayerPresenceSnapshot,
  previousSnapshot: SharedPresenceSnapshot | null = null,
  nowIso = new Date().toISOString()
): SharedPresenceSnapshot {
  const nextMotion = buildSharedPresenceMotion(localPresence, previousSnapshot, nowIso);

  return {
    roomId,
    playerId: profile.playerId,
    displayName: profile.displayName,
    skinSrc,
    position: [...localPresence.position] as SharedPresenceSnapshot["position"],
    facingY: localPresence.facingY,
    activity: localPresence.activity,
    motion: nextMotion,
    pose: localPresence.interactionPose
      ? {
          ...localPresence.interactionPose,
          position: [
            ...localPresence.interactionPose.position
          ] as SharedPresenceSnapshot["position"],
          poseOffset: localPresence.interactionPose.poseOffset
            ? ([...localPresence.interactionPose.poseOffset] as SharedPresenceSnapshot["position"])
            : undefined,
          slotId: localPresence.interactionPose.slotId
        }
      : null,
    updatedAt: nowIso
  };
}

function buildSharedPresenceMotion(
  localPresence: LocalPlayerPresenceSnapshot,
  previousSnapshot: SharedPresenceSnapshot | null,
  nowIso: string
): SharedPresenceMotionState {
  if (localPresence.activity !== "walking" || localPresence.interactionPose) {
    return {
      velocity: [0, 0, 0],
      walkAmount: 0,
      stridePhase: previousSnapshot?.motion?.stridePhase ?? 0
    };
  }

  const previousUpdatedAt = previousSnapshot ? Date.parse(previousSnapshot.updatedAt) : Number.NaN;
  const nextUpdatedAt = Date.parse(nowIso);
  const elapsedSeconds =
    Number.isFinite(previousUpdatedAt) && Number.isFinite(nextUpdatedAt)
      ? Math.max(0.016, (nextUpdatedAt - previousUpdatedAt) / 1000)
      : PRESENCE_PUBLISH_INTERVAL_MS / 1000;
  const previousPosition = previousSnapshot?.position ?? localPresence.position;
  const velocity: SharedPresenceSnapshot["position"] = [
    (localPresence.position[0] - previousPosition[0]) / elapsedSeconds,
    (localPresence.position[1] - previousPosition[1]) / elapsedSeconds,
    (localPresence.position[2] - previousPosition[2]) / elapsedSeconds
  ];
  const horizontalSpeed = Math.hypot(velocity[0], velocity[2]);

  return {
    velocity,
    walkAmount: Math.min(1, horizontalSpeed / 3),
    stridePhase:
      (previousSnapshot?.motion?.stridePhase ?? 0) +
      horizontalSpeed * elapsedSeconds * 4
  };
}

export function derivePresenceFreshness(
  presence: SharedPresenceSnapshot | null,
  now = Date.now()
): SharedPresenceFreshness {
  if (!presence) {
    return "offline";
  }

  const updatedAt = Date.parse(presence.updatedAt);

  if (!Number.isFinite(updatedAt)) {
    return "reconnecting";
  }

  const age = Math.max(0, now - updatedAt);

  if (age <= PRESENCE_LIVE_THRESHOLD_MS) {
    return "live";
  }

  if (age <= PRESENCE_HOLD_THRESHOLD_MS) {
    return "holding";
  }

  if (age <= PRESENCE_RECONNECT_THRESHOLD_MS) {
    return "reconnecting";
  }

  return "offline";
}

export function createSharedPresenceStatus(
  title: SharedPresenceStatusTitle
): SharedPresenceStatus {
  switch (title) {
    case "Partner joined":
      return {
        title,
        body: "Your partner just entered the room.",
        isBlocking: false,
        tone: "presence"
      };
    case "Partner away":
      return {
        title,
        body: "Your partner is offline right now. The room stays usable while they are away.",
        isBlocking: false,
        tone: "presence"
      };
    case "Partner reconnecting":
      return {
        title,
        body: "Holding the last known partner position while presence reconnects.",
        isBlocking: false,
        tone: "attention"
      };
    case "Partner is back":
      return {
        title,
        body: "Presence is live again and the room stays usable.",
        isBlocking: false,
        tone: "success"
      };
    case "Together now":
      return {
        title,
        body: "Both partners are live in the shared room.",
        isBlocking: false,
        tone: "success"
      };
    case "Waiting for partner":
    default:
      return {
        title: "Waiting for partner",
        body: "The room stays usable while your partner is away.",
        isBlocking: false,
        tone: "presence"
      };
  }
}

export function deriveSharedCozyRestEligibility(input: {
  localPresence: LocalPlayerPresenceSnapshot | null;
  remotePresence: SharedPresenceSnapshot | null;
  remotePresenceFreshness: SharedPresenceFreshness;
}): SharedCozyRestEligibility {
  const localPose = input.localPresence?.interactionPose;
  const remotePose = input.remotePresence?.pose;

  if (
    input.remotePresenceFreshness !== "live" ||
    localPose?.type !== "lie" ||
    remotePose?.type !== "lie"
  ) {
    return {
      eligible: false,
      furnitureId: null,
      localSlotId: localPose?.slotId ?? null,
      partnerSlotId: remotePose?.slotId ?? null
    };
  }

  if (
    localPose.furnitureId !== remotePose.furnitureId ||
    !localPose.slotId ||
    !remotePose.slotId ||
    localPose.slotId === remotePose.slotId
  ) {
    return {
      eligible: false,
      furnitureId:
        localPose.furnitureId === remotePose.furnitureId ? localPose.furnitureId ?? null : null,
      localSlotId: localPose.slotId ?? null,
      partnerSlotId: remotePose.slotId ?? null
    };
  }

  return {
    eligible: true,
    furnitureId: localPose.furnitureId ?? null,
    localSlotId: localPose.slotId ?? null,
    partnerSlotId: remotePose.slotId ?? null
  };
}

export function useSharedRoomPresence({
  enabled,
  bootstrapKind,
  localPresence,
  localSharedPetState = null,
  pendingLinkId = null,
  partnerId,
  profile,
  roomId,
  sharedPresenceStore = sharedPresenceClient,
  skinSrc
}: UseSharedRoomPresenceOptions) {
  const currentBootstrapKind = bootstrapKind ?? (enabled ? "room_ready" : "signed_out");
  const roomPresenceEnabled = enabled && currentBootstrapKind === "room_ready";
  const pairLinkPresenceEnabled =
    currentBootstrapKind === "pending_link" && Boolean(pendingLinkId);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [presenceStatus, setPresenceStatus] = useState<SharedPresenceStatus>(
    createSharedPresenceStatus("Waiting for partner")
  );
  const [roomLocks, setRoomLocks] = useState<SharedEditLockRoomSnapshot | null>(null);
  const [roomPresence, setRoomPresence] = useState<SharedPresenceRoomSnapshot | null>(null);
  const [sharedPetState, setSharedPetState] = useState<SharedPetLiveState | null>(null);
  const [pairLinkPresence, setPairLinkPresence] =
    useState<SharedPairLinkPresenceSnapshot | null>(null);
  const hadLivePartnerRef = useRef(false);
  const latestLocalPresenceRef = useRef<LocalPlayerPresenceSnapshot | null>(null);
  const latestSharedPetStateRef = useRef<SharedPetLiveState | null>(null);
  const lastPublishedPresenceRef = useRef<SharedPresenceSnapshot | null>(null);
  const previousFreshnessRef = useRef<SharedPresenceFreshness>("offline");
  const statusTimeoutRef = useRef<number | null>(null);

  const clearStatusTimeout = useCallback(() => {
    if (statusTimeoutRef.current !== null) {
      window.clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!roomPresenceEnabled || !roomId || !localPresence) {
      latestLocalPresenceRef.current = null;
      return;
    }

    latestLocalPresenceRef.current = localPresence;
  }, [localPresence, roomId, roomPresenceEnabled]);

  useEffect(() => {
    latestSharedPetStateRef.current = localSharedPetState;
  }, [localSharedPetState]);

  const loadRoomPresence = useCallback(async (): Promise<SharedPresenceRoomSnapshot | null> => {
    if (!roomPresenceEnabled || !roomId) {
      setRoomPresence(null);
      return null;
    }

    try {
      const nextRoomPresence = await sharedPresenceStore.loadRoomPresence({ roomId });
      setInlineError(null);
      setRoomPresence(nextRoomPresence);
      setSharedPetState(nextRoomPresence.sharedPetState);
      return nextRoomPresence;
    } catch (error) {
      setInlineError(getErrorMessage(error));
      return null;
    }
  }, [roomId, roomPresenceEnabled, sharedPresenceStore]);

  const loadRoomLocks = useCallback(async (): Promise<SharedEditLockRoomSnapshot | null> => {
    if (!roomPresenceEnabled || !roomId) {
      setRoomLocks(null);
      return null;
    }

    try {
      const nextRoomLocks = await sharedPresenceStore.loadRoomLocks({ roomId });
      setInlineError(null);
      setRoomLocks(nextRoomLocks);
      return nextRoomLocks;
    } catch (error) {
      setInlineError(getErrorMessage(error));
      return null;
    }
  }, [roomId, roomPresenceEnabled, sharedPresenceStore]);

  const publishPresence = useCallback(async (): Promise<void> => {
    if (!roomPresenceEnabled || !roomId) {
      return;
    }
    const latestLocalPresence = latestLocalPresenceRef.current;

    if (!latestLocalPresence) {
      return;
    }

    const nextPresence = buildSharedPresenceSnapshot(
      roomId!,
      profile,
      skinSrc,
      latestLocalPresence,
      lastPublishedPresenceRef.current
    );

    try {
      await sharedPresenceStore.upsertPresence({
        presence: nextPresence,
        sharedPetState: latestSharedPetStateRef.current ?? undefined
      });
      setInlineError(null);
      lastPublishedPresenceRef.current = nextPresence;
    } catch (error) {
      setInlineError(getErrorMessage(error));
    }
  }, [profile, roomId, roomPresenceEnabled, sharedPresenceStore, skinSrc]);

  const loadPairLinkPresence = useCallback(
    async (): Promise<SharedPairLinkPresenceSnapshot | null> => {
      if (!pairLinkPresenceEnabled || !pendingLinkId) {
        setPairLinkPresence(null);
        return null;
      }

      try {
        const nextPairLinkPresence =
          await sharedPresenceStore.loadPairLinkPresence({ pendingLinkId });
        setInlineError(null);
        setPairLinkPresence(nextPairLinkPresence);
        return nextPairLinkPresence;
      } catch (error) {
        setInlineError(getErrorMessage(error));
        return null;
      }
    },
    [pairLinkPresenceEnabled, pendingLinkId, sharedPresenceStore]
  );

  const publishPairLinkPresence = useCallback(async (): Promise<void> => {
    if (!pairLinkPresenceEnabled || !pendingLinkId) {
      return;
    }

    try {
      const nextPairLinkPresence =
        await sharedPresenceStore.upsertPairLinkPresence({
          pendingLinkId,
          playerId: profile.playerId,
          displayName: profile.displayName
        });
      setInlineError(null);
      setPairLinkPresence(nextPairLinkPresence);
    } catch (error) {
      setInlineError(getErrorMessage(error));
    }
  }, [
    pairLinkPresenceEnabled,
    pendingLinkId,
    profile.displayName,
    profile.playerId,
    sharedPresenceStore
  ]);

  useEffect(() => {
    if (!roomPresenceEnabled || !roomId) {
      setRoomLocks(null);
      setRoomPresence(null);
      setSharedPetState(null);
      return;
    }

    void loadRoomPresence();
    void loadRoomLocks();
    const pollId = window.setInterval(() => {
      void loadRoomPresence();
      void loadRoomLocks();
    }, PRESENCE_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(pollId);
    };
  }, [loadRoomLocks, loadRoomPresence, roomId, roomPresenceEnabled]);

  useEffect(() => {
    if (!roomPresenceEnabled || !roomId || !localPresence) {
      return;
    }

    void publishPresence();
    const publishId = window.setInterval(() => {
      void publishPresence();
    }, PRESENCE_PUBLISH_INTERVAL_MS);

    return () => {
      window.clearInterval(publishId);
    };
  }, [localPresence, publishPresence, roomId, roomPresenceEnabled]);

  useEffect(() => {
    if (!pairLinkPresenceEnabled || !pendingLinkId) {
      setPairLinkPresence(null);
      return;
    }

    void loadPairLinkPresence();
    const pollId = window.setInterval(() => {
      void loadPairLinkPresence();
    }, PRESENCE_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(pollId);
    };
  }, [loadPairLinkPresence, pairLinkPresenceEnabled, pendingLinkId]);

  useEffect(() => {
    if (!pairLinkPresenceEnabled || !pendingLinkId) {
      return;
    }

    void publishPairLinkPresence();
    const publishId = window.setInterval(() => {
      void publishPairLinkPresence();
    }, PRESENCE_PUBLISH_INTERVAL_MS);

    return () => {
      window.clearInterval(publishId);
    };
  }, [pairLinkPresenceEnabled, pendingLinkId, publishPairLinkPresence]);

  useEffect(() => clearStatusTimeout, [clearStatusTimeout]);

  useEffect(() => {
    if (!roomPresenceEnabled || !roomId) {
      return;
    }

    return () => {
      void sharedPresenceStore.leavePresence({
        roomId,
        playerId: profile.playerId
      });
    };
  }, [profile.playerId, roomId, roomPresenceEnabled, sharedPresenceStore]);

  useEffect(() => {
    if (!pairLinkPresenceEnabled || !pendingLinkId) {
      return;
    }

    return () => {
      void sharedPresenceStore.leavePairLinkPresence({
        pendingLinkId,
        playerId: profile.playerId
      });
    };
  }, [
    pairLinkPresenceEnabled,
    pendingLinkId,
    profile.playerId,
    sharedPresenceStore
  ]);

  const remotePresence = useMemo(() => {
    const presences = roomPresence?.presences ?? [];

    if (partnerId) {
      return presences.find((presence) => presence.playerId === partnerId) ?? null;
    }

    return presences.find((presence) => presence.playerId !== profile.playerId) ?? null;
  }, [partnerId, profile.playerId, roomPresence?.presences]);

  const partnerEditLockIds = useMemo(() => {
    const nextPartnerLockIds = new Set<string>();

    for (const lock of roomLocks?.locks ?? []) {
      const isPartnerLock = partnerId
        ? lock.playerId === partnerId
        : lock.playerId !== profile.playerId;

      if (isPartnerLock) {
        nextPartnerLockIds.add(lock.furnitureId);
      }
    }

    return nextPartnerLockIds;
  }, [partnerId, profile.playerId, roomLocks?.locks]);

  const localEditLockIds = useMemo(() => {
    const nextLocalLockIds = new Set<string>();

    for (const lock of roomLocks?.locks ?? []) {
      if (lock.playerId === profile.playerId) {
        nextLocalLockIds.add(lock.furnitureId);
      }
    }

    return nextLocalLockIds;
  }, [profile.playerId, roomLocks?.locks]);

  const remotePresenceFreshness = derivePresenceFreshness(remotePresence);
  const cozyRestEligibility = useMemo(
    () =>
      deriveSharedCozyRestEligibility({
        localPresence,
        remotePresence,
        remotePresenceFreshness
      }),
    [localPresence, remotePresence, remotePresenceFreshness]
  );

  useEffect(() => {
    hadLivePartnerRef.current = false;
    previousFreshnessRef.current = "offline";
    clearStatusTimeout();
    setRoomLocks(null);
    setPresenceStatus(
      createSharedPresenceStatus(partnerId ? "Partner away" : "Waiting for partner")
    );
    setSharedPetState(null);
    lastPublishedPresenceRef.current = null;
  }, [clearStatusTimeout, partnerId, roomId]);

  useEffect(() => {
    const previousFreshness = previousFreshnessRef.current;

    clearStatusTimeout();

    if (remotePresenceFreshness === "live") {
      if (!hadLivePartnerRef.current) {
        hadLivePartnerRef.current = true;
        setPresenceStatus(createSharedPresenceStatus("Partner joined"));
        statusTimeoutRef.current = window.setTimeout(() => {
          setPresenceStatus(createSharedPresenceStatus("Together now"));
          statusTimeoutRef.current = null;
        }, PRESENCE_STATUS_SETTLE_MS);
      } else if (previousFreshness !== "live") {
        setPresenceStatus(createSharedPresenceStatus("Partner is back"));
        statusTimeoutRef.current = window.setTimeout(() => {
          setPresenceStatus(createSharedPresenceStatus("Together now"));
          statusTimeoutRef.current = null;
        }, PRESENCE_STATUS_SETTLE_MS);
      } else {
        setPresenceStatus(createSharedPresenceStatus("Together now"));
      }
    } else if (
      remotePresenceFreshness === "holding" ||
      remotePresenceFreshness === "reconnecting"
    ) {
      setPresenceStatus(createSharedPresenceStatus("Partner reconnecting"));
    } else {
      setPresenceStatus(
        createSharedPresenceStatus(partnerId ? "Partner away" : "Waiting for partner")
      );
    }

    previousFreshnessRef.current = remotePresenceFreshness;
  }, [clearStatusTimeout, partnerId, remotePresenceFreshness]);

  const acquireEditLock = useCallback(
    async (furnitureId: string): Promise<boolean> => {
    if (!roomPresenceEnabled || !roomId) {
      return true;
    }

      try {
        const nextRoomLocks = await sharedPresenceStore.acquireEditLock({
          roomId,
          furnitureId,
          playerId: profile.playerId,
          displayName: profile.displayName
        });
        setInlineError(null);
        setRoomLocks(nextRoomLocks);
        return true;
      } catch (error) {
        const status = getErrorStatus(error);

        if (status === 409) {
          setInlineError(null);
          void loadRoomLocks();
          return false;
        }

        setInlineError(getErrorMessage(error));
        return false;
      }
    },
    [
      loadRoomLocks,
      profile.displayName,
      profile.playerId,
      roomId,
      roomPresenceEnabled,
      sharedPresenceStore
    ]
  );

  const renewEditLock = useCallback(
    async (furnitureId: string): Promise<boolean> => {
    if (!roomPresenceEnabled || !roomId) {
      return true;
    }

      try {
        const nextRoomLocks = await sharedPresenceStore.renewEditLock({
          roomId,
          furnitureId,
          playerId: profile.playerId,
          displayName: profile.displayName
        });
        setInlineError(null);
        setRoomLocks(nextRoomLocks);
        return true;
      } catch (error) {
        const status = getErrorStatus(error);

        if (status === 409 || status === 410) {
          setInlineError(null);
          void loadRoomLocks();
          return false;
        }

        setInlineError(getErrorMessage(error));
        return false;
      }
    },
    [
      loadRoomLocks,
      profile.displayName,
      profile.playerId,
      roomId,
      roomPresenceEnabled,
      sharedPresenceStore
    ]
  );

  const releaseEditLock = useCallback(
    async (furnitureId: string): Promise<void> => {
    if (!roomPresenceEnabled || !roomId) {
      return;
    }

      try {
        const nextRoomLocks = await sharedPresenceStore.releaseEditLock({
          roomId,
          furnitureId,
          playerId: profile.playerId
        });
        setInlineError(null);
        setRoomLocks(nextRoomLocks);
      } catch (error) {
        setInlineError(getErrorMessage(error));
      }
    },
    [profile.playerId, roomId, roomPresenceEnabled, sharedPresenceStore]
  );

  return {
    acquireEditLock,
    clearInlineError: () => setInlineError(null),
    cozyRestEligibility,
    inlineError,
    localEditLockIds,
    pairLinkPresence,
    presenceStatus,
    partnerEditLockIds,
    releaseEditLock,
    remotePresence,
    remotePresenceFreshness,
    renewEditLock,
    sharedPetState,
    roomLocks,
    roomPresence
  };
}



