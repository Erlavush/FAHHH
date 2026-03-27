import type {
  SharedActivityClaimMode,
  SharedRoomActivityClaim,
  SharedRoomActivityClaimDay,
  SharedRoomActivityId,
  SharedRoomProgressionState
} from "../sharedProgressionTypes";
import type { SharedRoomMember } from "../sharedRoomTypes";
import {
  cloneProgression,
  createEmptyActivityClaim,
  createEmptyRitualDay,
  createEmptyVisitDay,
  createFeaturedActivityDay,
  ensureSharedRoomProgressionMembers,
  normalizeNowIso,
  toRoomDayKey
} from "./normalizeProgression";

function getUtcDayTime(dayKey: string): number {
  return Date.parse(`${dayKey}T00:00:00.000Z`);
}

function getDayDifference(currentDayKey: string, previousDayKey: string): number {
  const currentDayTime = getUtcDayTime(currentDayKey);
  const previousDayTime = getUtcDayTime(previousDayKey);

  if (!Number.isFinite(currentDayTime) || !Number.isFinite(previousDayTime)) {
    return 0;
  }

  return Math.floor((currentDayTime - previousDayTime) / 86_400_000);
}

export function rollSharedRoomDayState(
  progression: SharedRoomProgressionState,
  currentDayKey: string,
  nowIso: string
): void {
  let changed = false;

  if (progression.couple.visitDay.dayKey !== currentDayKey) {
    progression.couple.visitDay = createEmptyVisitDay(currentDayKey);
    changed = true;
  }

  if (
    !progression.couple.featuredActivity ||
    progression.couple.featuredActivity.dayKey !== currentDayKey
  ) {
    progression.couple.featuredActivity = createFeaturedActivityDay(currentDayKey, nowIso);
    changed = true;
  }

  if (progression.couple.ritual.dayKey !== currentDayKey) {
    progression.couple.ritual = createEmptyRitualDay(currentDayKey);
    changed = true;
  }

  if (changed) {
    progression.couple.updatedAt = nowIso;
  }
}

export function ensureActivityClaimDay(
  progression: SharedRoomProgressionState,
  dayKey: string
): SharedRoomActivityClaimDay {
  const existingDay = progression.couple.activityClaimsByDayKey[dayKey];
  if (existingDay) {
    return existingDay;
  }

  const nextDay: SharedRoomActivityClaimDay = {};
  progression.couple.activityClaimsByDayKey[dayKey] = nextDay;
  return nextDay;
}

export function ensureActivityClaim(
  claimDay: SharedRoomActivityClaimDay,
  activityId: SharedRoomActivityId,
  claimMode: SharedActivityClaimMode
): SharedRoomActivityClaim {
  const existingClaim = claimDay[activityId];
  if (existingClaim) {
    return existingClaim;
  }

  const nextClaim = createEmptyActivityClaim(activityId, claimMode);
  claimDay[activityId] = nextClaim;
  return nextClaim;
}

export function recordSharedRoomVisit(input: {
  progression: SharedRoomProgressionState;
  actorPlayerId: string;
  memberIds: readonly string[];
  nowIso: string;
}): SharedRoomProgressionState {
  const normalizedNowIso = normalizeNowIso(input.nowIso);
  const currentDayKey = toRoomDayKey(normalizedNowIso);
  const normalizedMemberIds = [...new Set(input.memberIds.filter((memberId) => memberId.length > 0))];
  const nextProgression = cloneProgression(input.progression);

  rollSharedRoomDayState(nextProgression, currentDayKey, normalizedNowIso);

  if (!(input.actorPlayerId in nextProgression.players)) {
    throw new Error("Shared player progression not found.");
  }

  if (!nextProgression.couple.visitDay.visitedByPlayerId[input.actorPlayerId]) {
    nextProgression.couple.visitDay.visitedByPlayerId[input.actorPlayerId] = normalizedNowIso;
    nextProgression.couple.updatedAt = normalizedNowIso;
  }

  const allMembersVisited =
    normalizedMemberIds.length >= 2 &&
    normalizedMemberIds.every((memberId) => Boolean(nextProgression.couple.visitDay.visitedByPlayerId[memberId]));

  if (allMembersVisited && !nextProgression.couple.visitDay.countedAt) {
    nextProgression.couple.visitDay.countedAt = normalizedNowIso;
    nextProgression.couple.togetherDaysCount += 1;
    nextProgression.couple.bestTogetherDaysCount = Math.max(
      nextProgression.couple.bestTogetherDaysCount,
      nextProgression.couple.togetherDaysCount
    );
    nextProgression.couple.lastTogetherDayKey = currentDayKey;
    nextProgression.couple.updatedAt = normalizedNowIso;
  }

  return nextProgression;
}

export function advanceRitualDayIfNeeded(
  progression: SharedRoomProgressionState,
  memberIds: readonly string[],
  members: readonly SharedRoomMember[],
  nowIso: string
): SharedRoomProgressionState {
  const normalizedNowIso = normalizeNowIso(nowIso);
  const currentDayKey = toRoomDayKey(normalizedNowIso);
  const nextProgression = ensureSharedRoomProgressionMembers(
    progression,
    memberIds,
    members,
    normalizedNowIso
  );
  const ritualDayKey = nextProgression.couple.ritual.dayKey;

  if (ritualDayKey !== currentDayKey) {
    const previousCompletedDayKey = nextProgression.couple.lastCompletedDayKey;
    const previousDayWasCompleted = Boolean(nextProgression.couple.ritual.completedAt);
    const missedCompletedDay =
      previousCompletedDayKey !== null &&
      getDayDifference(currentDayKey, previousCompletedDayKey) > 1;
    const missedIncompleteDay =
      !previousDayWasCompleted && getDayDifference(currentDayKey, ritualDayKey) >= 1;

    if (missedCompletedDay || missedIncompleteDay) {
      nextProgression.couple.streakCount = 0;
    }
  }

  rollSharedRoomDayState(nextProgression, currentDayKey, normalizedNowIso);
  return nextProgression;
}