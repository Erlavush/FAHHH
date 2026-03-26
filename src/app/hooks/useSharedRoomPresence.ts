import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sharedPresenceClient } from "../../lib/sharedPresenceClient";
import type { SharedPresenceStore } from "../../lib/sharedPresenceStore";
import type {
  SharedPresenceRoomSnapshot,
  SharedPresenceSnapshot
} from "../../lib/sharedPresenceTypes";
import type { SharedPlayerProfile } from "../../lib/sharedRoomTypes";
import type { LocalPlayerPresenceSnapshot } from "../types";

export type SharedPresenceFreshness = "offline" | "live" | "holding" | "reconnecting";

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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Shared presence request failed.";
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
  const [roomPresence, setRoomPresence] = useState<SharedPresenceRoomSnapshot | null>(null);
  const latestPresenceRef = useRef<SharedPresenceSnapshot | null>(null);

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
      setRoomPresence(null);
      return;
    }

    void loadRoomPresence();
    const pollId = window.setInterval(() => {
      void loadRoomPresence();
    }, PRESENCE_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(pollId);
    };
  }, [enabled, loadRoomPresence, roomId]);

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

  return {
    clearInlineError: () => setInlineError(null),
    inlineError,
    remotePresence,
    remotePresenceFreshness: derivePresenceFreshness(remotePresence),
    roomPresence
  };
}
