import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sharedPresenceClient } from "../../lib/sharedPresenceClient";
import type { SharedPresenceStore } from "../../lib/sharedPresenceStore";
import type {
  SharedEditLockRoomSnapshot,
  SharedPresenceRoomSnapshot,
  SharedPresenceSnapshot
} from "../../lib/sharedPresenceTypes";
import type { SharedPlayerProfile } from "../../lib/sharedRoomTypes";
import type { LocalPlayerPresenceSnapshot } from "../types";

export type SharedPresenceFreshness = "offline" | "live" | "holding" | "reconnecting";
export type SharedPresenceStatusTitle =
  | "Waiting for partner"
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

export interface UseSharedRoomPresenceOptions {
  enabled: boolean;
  localPresence: LocalPlayerPresenceSnapshot | null;
  partnerId: string | null;
  profile: SharedPlayerProfile;
  roomId: string | null;
  sharedPresenceStore?: SharedPresenceStore;
  skinSrc: string | null;
}

const PRESENCE_PUBLISH_INTERVAL_MS = 500;
const PRESENCE_POLL_INTERVAL_MS = 1000;
const PRESENCE_LIVE_THRESHOLD_MS = 2500;
const PRESENCE_HOLD_THRESHOLD_MS = 6000;
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
  localPresence: LocalPlayerPresenceSnapshot
): SharedPresenceSnapshot {
  return {
    roomId,
    playerId: profile.playerId,
    displayName: profile.displayName,
    skinSrc,
    position: [...localPresence.position] as SharedPresenceSnapshot["position"],
    facingY: localPresence.facingY,
    activity: localPresence.activity,
    pose: localPresence.interactionPose
      ? {
          ...localPresence.interactionPose,
          position: [
            ...localPresence.interactionPose.position
          ] as SharedPresenceSnapshot["position"],
          poseOffset: localPresence.interactionPose.poseOffset
            ? ([...localPresence.interactionPose.poseOffset] as SharedPresenceSnapshot["position"])
            : undefined
        }
      : null,
    updatedAt: new Date().toISOString()
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

  return "reconnecting";
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

export function useSharedRoomPresence({
  enabled,
  localPresence,
  partnerId,
  profile,
  roomId,
  sharedPresenceStore = sharedPresenceClient,
  skinSrc
}: UseSharedRoomPresenceOptions) {
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [presenceStatus, setPresenceStatus] = useState<SharedPresenceStatus>(
    createSharedPresenceStatus("Waiting for partner")
  );
  const [roomLocks, setRoomLocks] = useState<SharedEditLockRoomSnapshot | null>(null);
  const [roomPresence, setRoomPresence] = useState<SharedPresenceRoomSnapshot | null>(null);
  const hadLivePartnerRef = useRef(false);
  const latestPresenceRef = useRef<SharedPresenceSnapshot | null>(null);
  const previousFreshnessRef = useRef<SharedPresenceFreshness>("offline");
  const statusTimeoutRef = useRef<number | null>(null);

  const clearStatusTimeout = useCallback(() => {
    if (statusTimeoutRef.current !== null) {
      window.clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled || !roomId || !localPresence) {
      latestPresenceRef.current = null;
      return;
    }

    latestPresenceRef.current = buildSharedPresenceSnapshot(
      roomId,
      profile,
      skinSrc,
      localPresence
    );
  }, [enabled, localPresence, profile, roomId, skinSrc]);

  const loadRoomPresence = useCallback(async (): Promise<SharedPresenceRoomSnapshot | null> => {
    if (!enabled || !roomId) {
      setRoomPresence(null);
      return null;
    }

    try {
      const nextRoomPresence = await sharedPresenceStore.loadRoomPresence({ roomId });
      setInlineError(null);
      setRoomPresence(nextRoomPresence);
      return nextRoomPresence;
    } catch (error) {
      setInlineError(getErrorMessage(error));
      return null;
    }
  }, [enabled, roomId, sharedPresenceStore]);

  const loadRoomLocks = useCallback(async (): Promise<SharedEditLockRoomSnapshot | null> => {
    if (!enabled || !roomId) {
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
  }, [enabled, roomId, sharedPresenceStore]);

  const publishPresence = useCallback(async (): Promise<void> => {
    if (!enabled) {
      return;
    }

    const presence = latestPresenceRef.current;

    if (!presence) {
      return;
    }

    try {
      await sharedPresenceStore.upsertPresence({ presence });
      setInlineError(null);
    } catch (error) {
      setInlineError(getErrorMessage(error));
    }
  }, [enabled, sharedPresenceStore]);

  useEffect(() => {
    if (!enabled || !roomId) {
      setRoomLocks(null);
      setRoomPresence(null);
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
  }, [enabled, loadRoomLocks, loadRoomPresence, roomId]);

  useEffect(() => {
    if (!enabled || !roomId || !localPresence) {
      return;
    }

    void publishPresence();
    const publishId = window.setInterval(() => {
      void publishPresence();
    }, PRESENCE_PUBLISH_INTERVAL_MS);

    return () => {
      window.clearInterval(publishId);
    };
  }, [enabled, localPresence, publishPresence, roomId]);

  useEffect(() => clearStatusTimeout, [clearStatusTimeout]);

  useEffect(() => {
    if (!enabled || !roomId) {
      return;
    }

    return () => {
      void sharedPresenceStore.leavePresence({
        roomId,
        playerId: profile.playerId
      });
    };
  }, [enabled, profile.playerId, roomId, sharedPresenceStore]);

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

  useEffect(() => {
    hadLivePartnerRef.current = false;
    previousFreshnessRef.current = "offline";
    clearStatusTimeout();
    setRoomLocks(null);
    setPresenceStatus(createSharedPresenceStatus("Waiting for partner"));
  }, [clearStatusTimeout, roomId]);

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
      setPresenceStatus(createSharedPresenceStatus("Waiting for partner"));
    }

    previousFreshnessRef.current = remotePresenceFreshness;
  }, [clearStatusTimeout, remotePresenceFreshness]);

  const acquireEditLock = useCallback(
    async (furnitureId: string): Promise<boolean> => {
      if (!enabled || !roomId) {
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
      enabled,
      loadRoomLocks,
      profile.displayName,
      profile.playerId,
      roomId,
      sharedPresenceStore
    ]
  );

  const renewEditLock = useCallback(
    async (furnitureId: string): Promise<boolean> => {
      if (!enabled || !roomId) {
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
      enabled,
      loadRoomLocks,
      profile.displayName,
      profile.playerId,
      roomId,
      sharedPresenceStore
    ]
  );

  const releaseEditLock = useCallback(
    async (furnitureId: string): Promise<void> => {
      if (!enabled || !roomId) {
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
    [enabled, profile.playerId, roomId, sharedPresenceStore]
  );

  return {
    acquireEditLock,
    clearInlineError: () => setInlineError(null),
    inlineError,
    localEditLockIds,
    presenceStatus,
    partnerEditLockIds,
    releaseEditLock,
    remotePresence,
    remotePresenceFreshness,
    renewEditLock,
    roomLocks,
    roomPresence
  };
}
