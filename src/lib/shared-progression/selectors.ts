import type { SharedRoomSession } from "../sharedRoomTypes";
import type {
  SharedActivityClaimMode,
  SharedPlayerProgression,
  SharedRoomActivityId,
  SharedRoomProgressionState
} from "../sharedProgressionTypes";
import type {
  SharedActivityClaimStatus,
  SharedRitualStatusView
} from "./constants";
import { toRoomDayKey } from "./normalizeProgression";

export function selectActivePlayerProgression(
  progression: SharedRoomProgressionState,
  playerId: string | null | undefined
): SharedPlayerProgression | null {
  if (!playerId) {
    return null;
  }

  return progression.players[playerId] ?? null;
}

export function selectPartnerPlayerProgression(
  progression: SharedRoomProgressionState,
  playerId: string | null | undefined
): SharedPlayerProgression | null {
  if (!playerId) {
    return null;
  }

  return (
    Object.values(progression.players).find(
      (playerProgress) => playerProgress.playerId !== playerId
    ) ?? null
  );
}

export function getSharedActivityClaimStatus(input: {
  progression: SharedRoomProgressionState;
  activityId: SharedRoomActivityId;
  claimMode: SharedActivityClaimMode;
  actorPlayerId: string | null;
  nowIso: string;
}): SharedActivityClaimStatus {
  const currentDayKey = toRoomDayKey(input.nowIso);
  const claim = input.progression.couple.activityClaimsByDayKey[currentDayKey]?.[input.activityId] ?? null;
  const claimMode = claim?.claimMode ?? input.claimMode;
  const selfClaimed = input.actorPlayerId
    ? Boolean(claim?.perPlayerClaimsByPlayerId[input.actorPlayerId])
    : false;
  const coupleClaimed = Boolean(claim?.coupleClaim);

  return {
    dayKey: currentDayKey,
    activityId: input.activityId,
    claimMode,
    payoutAvailable: claimMode === "couple" ? !coupleClaimed : !selfClaimed,
    selfClaimed,
    coupleClaimed,
    claim
  };
}

export function buildSharedRitualStatus(
  progression: SharedRoomProgressionState,
  session: Pick<SharedRoomSession, "playerId" | "partnerId"> | null
): SharedRitualStatusView {
  const streakCount = progression.couple.streakCount;
  const playerId = session?.playerId ?? null;
  const partnerId = session?.partnerId ?? null;
  const selfCompleted = playerId
    ? Boolean(progression.couple.ritual.completionsByPlayerId[playerId])
    : false;
  const partnerCompleted = partnerId
    ? Boolean(progression.couple.ritual.completionsByPlayerId[partnerId])
    : false;

  if (progression.couple.ritual.completedAt) {
    return {
      title: `Streak ${streakCount}`,
      body: "Daily ritual complete.",
      tone: "success",
      streakCount,
      ritualComplete: true,
      selfCompleted,
      partnerCompleted
    };
  }

  if (selfCompleted && !partnerCompleted) {
    return {
      title: `Streak ${streakCount}`,
      body: "Your check-in is done. Waiting on partner.",
      tone: "attention",
      streakCount,
      ritualComplete: false,
      selfCompleted,
      partnerCompleted
    };
  }

  if (!selfCompleted && partnerCompleted) {
    return {
      title: `Streak ${streakCount}`,
      body: "Your partner checked in. Desk in to keep the streak alive.",
      tone: "attention",
      streakCount,
      ritualComplete: false,
      selfCompleted,
      partnerCompleted
    };
  }

  return {
    title: `Streak ${streakCount}`,
    body: "Both partners need one desk check-in today.",
    tone: "presence",
    streakCount,
    ritualComplete: false,
    selfCompleted,
    partnerCompleted
  };
}