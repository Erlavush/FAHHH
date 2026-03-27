import {
  applyPcMinigameResult,
  type PcMinigameProgress,
  type PcMinigameResult
} from "../pcMinigame";
import type {
  SharedActivityClaimMode,
  SharedRoomActivityRewardClaim,
  SharedRoomActivityId,
  SharedRoomProgressionState
} from "../sharedProgressionTypes";
import {
  DAILY_RITUAL_BONUS_COINS,
  DAILY_RITUAL_BONUS_XP,
  DESK_PC_XP_OFFSET,
  type SharedActivityCompletionProgressionResult,
  type SharedDeskPcCompletionProgressionResult
} from "./constants";
import {
  ensureActivityClaim,
  ensureActivityClaimDay,
  rollSharedRoomDayState
} from "./dayState";
import {
  applyPlayerXp,
  cloneProgression,
  isDeskPcActivityId,
  normalizeInteger,
  normalizeNowIso,
  recordDeskPcActivityRun,
  toRoomDayKey
} from "./normalizeProgression";
import { getSharedActivityClaimStatus } from "./selectors";

export function applyPersonalWalletSpend(
  progression: SharedRoomProgressionState,
  actorPlayerId: string,
  cost: number,
  nowIso: string
): SharedRoomProgressionState {
  const normalizedNowIso = normalizeNowIso(nowIso);
  const nextProgression = cloneProgression(progression);
  const actorProgress = nextProgression.players[actorPlayerId];
  const normalizedCost = normalizeInteger(cost);

  if (!actorProgress) {
    throw new Error("Shared player progression not found.");
  }

  if (actorProgress.coins < normalizedCost) {
    throw new Error("Not enough coins.");
  }

  actorProgress.coins -= normalizedCost;
  actorProgress.updatedAt = normalizedNowIso;
  return nextProgression;
}

export function applyPersonalWalletRefund(
  progression: SharedRoomProgressionState,
  actorPlayerId: string,
  amount: number,
  nowIso: string
): SharedRoomProgressionState {
  const normalizedNowIso = normalizeNowIso(nowIso);
  const nextProgression = cloneProgression(progression);
  const actorProgress = nextProgression.players[actorPlayerId];

  if (!actorProgress) {
    throw new Error("Shared player progression not found.");
  }

  actorProgress.coins += normalizeInteger(amount);
  actorProgress.updatedAt = normalizedNowIso;
  return nextProgression;
}

export function applySharedActivityCompletionToProgression(input: {
  progression: SharedRoomProgressionState;
  activityId: SharedRoomActivityId;
  claimMode: SharedActivityClaimMode;
  actorPlayerId: string;
  memberIds: readonly string[];
  rewardCoins: number;
  rewardXp: number;
  score: number;
  nowIso: string;
}): SharedActivityCompletionProgressionResult {
  const normalizedNowIso = normalizeNowIso(input.nowIso);
  const currentDayKey = toRoomDayKey(normalizedNowIso);
  const normalizedMemberIds = [...new Set(input.memberIds.filter((memberId) => memberId.length > 0))];
  const nextProgression = cloneProgression(input.progression);

  rollSharedRoomDayState(nextProgression, currentDayKey, normalizedNowIso);

  const actorProgress = nextProgression.players[input.actorPlayerId];
  if (!actorProgress) {
    throw new Error("Shared player progression not found.");
  }

  const initialClaimStatus = getSharedActivityClaimStatus({
    progression: nextProgression,
    activityId: input.activityId,
    claimMode: input.claimMode,
    actorPlayerId: input.actorPlayerId,
    nowIso: normalizedNowIso
  });
  const payoutGranted = initialClaimStatus.payoutAvailable;
  const rewardCoins = normalizeInteger(input.rewardCoins);
  const rewardXp = normalizeInteger(input.rewardXp);
  const score = normalizeInteger(input.score);
  const appliedRewardCoins = payoutGranted ? rewardCoins : 0;
  const appliedRewardXp = payoutGranted ? rewardXp : 0;

  if (isDeskPcActivityId(input.activityId)) {
    recordDeskPcActivityRun({
      playerProgress: actorProgress,
      activityId: input.activityId,
      score,
      rewardCoins: appliedRewardCoins,
      nowIso: normalizedNowIso
    });
  }

  if (payoutGranted) {
    const claimRecord: SharedRoomActivityRewardClaim = {
      claimedAt: normalizedNowIso,
      rewardCoins,
      rewardXp,
      score
    };
    const claimDay = ensureActivityClaimDay(nextProgression, currentDayKey);
    const claim = ensureActivityClaim(claimDay, input.activityId, input.claimMode);

    if (claim.claimMode === "couple") {
      normalizedMemberIds.forEach((memberId) => {
        const playerProgress = nextProgression.players[memberId];
        if (!playerProgress) {
          return;
        }

        playerProgress.coins += rewardCoins;
        applyPlayerXp(playerProgress, rewardXp, normalizedNowIso);
      });
      claim.coupleClaim = claimRecord;
    } else {
      actorProgress.coins += rewardCoins;
      applyPlayerXp(actorProgress, rewardXp, normalizedNowIso);
      claim.perPlayerClaimsByPlayerId[input.actorPlayerId] = claimRecord;
    }
  }

  nextProgression.couple.updatedAt = normalizedNowIso;

  const finalClaimStatus = getSharedActivityClaimStatus({
    progression: nextProgression,
    activityId: input.activityId,
    claimMode: input.claimMode,
    actorPlayerId: input.actorPlayerId,
    nowIso: normalizedNowIso
  });

  return {
    progression: nextProgression,
    payoutGranted,
    paidToday: !finalClaimStatus.payoutAvailable,
    claimStatus: finalClaimStatus
  };
}

export function applyDeskPcCompletionToProgression(input: {
  progression: SharedRoomProgressionState;
  actorPlayerId: string;
  result: PcMinigameResult;
  memberIds: readonly string[];
  nowIso: string;
}): SharedDeskPcCompletionProgressionResult {
  const normalizedNowIso = normalizeNowIso(input.nowIso);
  const nextProgression = cloneProgression(input.progression);
  const actorProgress = nextProgression.players[input.actorPlayerId];

  if (!actorProgress) {
    throw new Error("Shared player progression not found.");
  }

  const normalizedRewardCoins = normalizeInteger(input.result.rewardCoins);
  const normalizedScore = normalizeInteger(input.result.score);
  const resultCompletedAtMs =
    typeof input.result.completedAt === "number" && Number.isFinite(input.result.completedAt)
      ? input.result.completedAt
      : Date.parse(normalizedNowIso);
  const resultCompletedAtIso = new Date(resultCompletedAtMs).toISOString();
  const nextDeskPcProgress = applyPcMinigameResult(
    {
      bestScore: actorProgress.deskPc.bestScore,
      lastScore: actorProgress.deskPc.lastScore,
      gamesPlayed: actorProgress.deskPc.gamesPlayed,
      totalCoinsEarned: actorProgress.deskPc.totalCoinsEarned,
      lastRewardCoins: actorProgress.deskPc.lastRewardCoins,
      lastCompletedAt: actorProgress.deskPc.lastCompletedAt
        ? Date.parse(actorProgress.deskPc.lastCompletedAt)
        : null
    } satisfies PcMinigameProgress,
    {
      score: normalizedScore,
      rewardCoins: normalizedRewardCoins,
      completedAt: resultCompletedAtMs
    }
  );
  const personalXpGain = normalizedRewardCoins + DESK_PC_XP_OFFSET;
  const currentDayKey = toRoomDayKey(normalizedNowIso);
  const normalizedMemberIds = [...new Set(input.memberIds.filter((memberId) => memberId.length > 0))];

  actorProgress.deskPc = {
    ...actorProgress.deskPc,
    bestScore: nextDeskPcProgress.bestScore,
    gamesPlayed: nextDeskPcProgress.gamesPlayed,
    lastRewardCoins: nextDeskPcProgress.lastRewardCoins,
    lastScore: nextDeskPcProgress.lastScore,
    lastCompletedAt: resultCompletedAtIso,
    totalCoinsEarned: nextDeskPcProgress.totalCoinsEarned
  };
  actorProgress.coins += normalizedRewardCoins;
  applyPlayerXp(actorProgress, personalXpGain, normalizedNowIso);

  const ritual = nextProgression.couple.ritual;
  const existingContribution = ritual.completionsByPlayerId[input.actorPlayerId] ?? null;

  if (!existingContribution) {
    ritual.completionsByPlayerId[input.actorPlayerId] = {
      source: "desk_pc",
      completedAt: resultCompletedAtIso,
      score: normalizedScore,
      rewardCoins: normalizedRewardCoins
    };
    nextProgression.couple.updatedAt = normalizedNowIso;
  }

  const ritualComplete =
    normalizedMemberIds.length >= 2 &&
    normalizedMemberIds.every((memberId) => Boolean(ritual.completionsByPlayerId[memberId]));
  let dailyRitualBonusCoins = 0;
  let dailyRitualBonusXp = 0;

  if (ritualComplete && !ritual.completedAt && !ritual.bonusAppliedAt) {
    normalizedMemberIds.forEach((memberId) => {
      const playerProgress = nextProgression.players[memberId];
      if (!playerProgress) {
        return;
      }

      playerProgress.coins += DAILY_RITUAL_BONUS_COINS;
      applyPlayerXp(playerProgress, DAILY_RITUAL_BONUS_XP, normalizedNowIso);
    });

    nextProgression.couple.streakCount += 1;
    nextProgression.couple.longestStreakCount = Math.max(
      nextProgression.couple.longestStreakCount,
      nextProgression.couple.streakCount
    );
    nextProgression.couple.lastCompletedDayKey = currentDayKey;
    ritual.completedAt = normalizedNowIso;
    ritual.bonusAppliedAt = normalizedNowIso;
    nextProgression.couple.updatedAt = normalizedNowIso;
    dailyRitualBonusCoins = DAILY_RITUAL_BONUS_COINS;
    dailyRitualBonusXp = DAILY_RITUAL_BONUS_XP;
  }

  return {
    progression: nextProgression,
    dailyRitualStatus:
      dailyRitualBonusCoins > 0 || ritual.completedAt ? "completed" : "waiting",
    dailyRitualBonusCoins,
    dailyRitualBonusXp,
    streakCount: nextProgression.couple.streakCount
  };
}