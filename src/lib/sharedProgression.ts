import {
  applyPcMinigameResult,
  type PcMinigameProgress,
  type PcMinigameResult
} from "./pcMinigame";
import type { SharedRoomMember, SharedRoomSession } from "./sharedRoomTypes";
import type {
  SharedCoupleProgression,
  SharedCoupleRitualContribution,
  SharedCoupleRitualDay,
  SharedPlayerDeskPcProgress,
  SharedPlayerProgression,
  SharedRoomProgressionState
} from "./sharedProgressionTypes";

export const ROOM_LEVEL_XP_THRESHOLDS = [0, 20, 55, 95, 140, 190] as const;
export const DESK_PC_XP_OFFSET = 4;
export const DAILY_RITUAL_BONUS_COINS = 12;
export const DAILY_RITUAL_BONUS_XP = 16;

export interface SharedRitualStatusView {
  title: string;
  body: string;
  tone: "presence" | "attention" | "success";
  streakCount: number;
  ritualComplete: boolean;
  selfCompleted: boolean;
  partnerCompleted: boolean;
}

export interface SharedDeskPcCompletionProgressionResult {
  progression: SharedRoomProgressionState;
  dailyRitualStatus: "waiting" | "completed";
  dailyRitualBonusCoins: number;
  dailyRitualBonusXp: number;
  streakCount: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeInteger(value: unknown, fallback = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.floor(value));
}

function normalizeIsoString(value: unknown, fallback: string | null = null): string | null {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function normalizeNowIso(nowIso: string): string {
  const parsed = Date.parse(nowIso);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString();
}

function createDefaultDeskPcProgress(): SharedPlayerDeskPcProgress {
  return {
    bestScore: 0,
    gamesPlayed: 0,
    lastRewardCoins: 0,
    lastScore: 0,
    lastCompletedAt: null,
    totalCoinsEarned: 0
  };
}

function cloneDeskPcProgress(progress: SharedPlayerDeskPcProgress): SharedPlayerDeskPcProgress {
  return {
    ...progress
  };
}

function clonePlayerProgression(progress: SharedPlayerProgression): SharedPlayerProgression {
  return {
    ...progress,
    deskPc: cloneDeskPcProgress(progress.deskPc)
  };
}

function cloneRitualContribution(
  contribution: SharedCoupleRitualContribution
): SharedCoupleRitualContribution {
  return {
    ...contribution
  };
}

function cloneRitualDay(day: SharedCoupleRitualDay): SharedCoupleRitualDay {
  return {
    ...day,
    completionsByPlayerId: Object.fromEntries(
      Object.entries(day.completionsByPlayerId).map(([playerId, contribution]) => [
        playerId,
        cloneRitualContribution(contribution)
      ])
    )
  };
}

function cloneCoupleProgression(progress: SharedCoupleProgression): SharedCoupleProgression {
  return {
    ...progress,
    ritual: cloneRitualDay(progress.ritual)
  };
}

function cloneProgression(
  progression: SharedRoomProgressionState
): SharedRoomProgressionState {
  return {
    version: 1,
    players: Object.fromEntries(
      Object.entries(progression.players).map(([playerId, playerProgress]) => [
        playerId,
        clonePlayerProgression(playerProgress)
      ])
    ),
    couple: cloneCoupleProgression(progression.couple),
    migratedFromSharedCoins:
      progression.migratedFromSharedCoins === null
        ? null
        : normalizeInteger(progression.migratedFromSharedCoins)
  };
}

function getLevelForXp(xp: number): number {
  const normalizedXp = normalizeInteger(xp);
  let level = 1;

  for (let index = 1; index < ROOM_LEVEL_XP_THRESHOLDS.length; index += 1) {
    if (normalizedXp >= ROOM_LEVEL_XP_THRESHOLDS[index]) {
      level = index + 1;
    }
  }

  return level;
}

function createInitialPlayerProgression(
  playerId: string,
  coins: number,
  nowIso: string
): SharedPlayerProgression {
  return {
    playerId,
    coins: normalizeInteger(coins),
    xp: 0,
    level: 1,
    deskPc: createDefaultDeskPcProgress(),
    updatedAt: nowIso
  };
}

function createEmptyRitualDay(dayKey: string): SharedCoupleRitualDay {
  return {
    dayKey,
    completionsByPlayerId: {},
    completedAt: null,
    bonusAppliedAt: null
  };
}

function createEmptyCoupleProgression(dayKey: string, nowIso: string): SharedCoupleProgression {
  return {
    streakCount: 0,
    longestStreakCount: 0,
    lastCompletedDayKey: null,
    ritual: createEmptyRitualDay(dayKey),
    updatedAt: nowIso
  };
}

function getCreatorPlayerId(
  memberIds: readonly string[],
  members: readonly SharedRoomMember[]
): string | null {
  const creator = members.find((member) => member.role === "creator");
  if (creator?.playerId) {
    return creator.playerId;
  }

  return memberIds[0] ?? null;
}

function splitLegacySharedCoins(
  memberIds: readonly string[],
  members: readonly SharedRoomMember[],
  legacySharedCoins: number
): Map<string, number> {
  const normalizedCoins = normalizeInteger(legacySharedCoins);
  const uniqueMemberIds = [...new Set(memberIds.filter((memberId) => memberId.length > 0))];
  const allocation = new Map<string, number>();

  if (uniqueMemberIds.length === 0) {
    return allocation;
  }

  const evenShare = Math.floor(normalizedCoins / uniqueMemberIds.length);
  const remainder = normalizedCoins % uniqueMemberIds.length;
  const creatorPlayerId = getCreatorPlayerId(uniqueMemberIds, members);

  uniqueMemberIds.forEach((playerId) => {
    allocation.set(playerId, evenShare);
  });

  if (remainder > 0) {
    const remainderOwner = creatorPlayerId ?? uniqueMemberIds[0];
    allocation.set(remainderOwner, (allocation.get(remainderOwner) ?? 0) + remainder);
  }

  return allocation;
}

function normalizeDeskPcProgress(
  deskPc: unknown
): SharedPlayerDeskPcProgress {
  if (!isRecord(deskPc)) {
    return createDefaultDeskPcProgress();
  }

  return {
    bestScore: normalizeInteger(deskPc.bestScore),
    gamesPlayed: normalizeInteger(deskPc.gamesPlayed),
    lastRewardCoins: normalizeInteger(deskPc.lastRewardCoins),
    lastScore: normalizeInteger(deskPc.lastScore),
    lastCompletedAt: normalizeIsoString(deskPc.lastCompletedAt),
    totalCoinsEarned: normalizeInteger(deskPc.totalCoinsEarned)
  };
}

function normalizePlayerProgression(
  playerId: string,
  value: unknown,
  nowIso: string
): SharedPlayerProgression {
  if (!isRecord(value)) {
    return createInitialPlayerProgression(playerId, 0, nowIso);
  }

  const xp = normalizeInteger(value.xp);
  const level =
    typeof value.level === "number" && Number.isFinite(value.level) && value.level >= 1
      ? Math.floor(value.level)
      : getLevelForXp(xp);

  return {
    playerId,
    coins: normalizeInteger(value.coins),
    xp,
    level,
    deskPc: normalizeDeskPcProgress(value.deskPc),
    updatedAt: normalizeIsoString(value.updatedAt, nowIso) ?? nowIso
  };
}

function normalizeRitualContribution(
  value: unknown
): SharedCoupleRitualContribution | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    source: "desk_pc",
    completedAt: normalizeIsoString(value.completedAt, new Date().toISOString()) ?? new Date().toISOString(),
    score: normalizeInteger(value.score),
    rewardCoins: normalizeInteger(value.rewardCoins)
  };
}

function normalizeCoupleProgression(
  couple: unknown,
  dayKey: string,
  nowIso: string
): SharedCoupleProgression {
  if (!isRecord(couple)) {
    return createEmptyCoupleProgression(dayKey, nowIso);
  }

  const rawRitual = isRecord(couple.ritual) ? couple.ritual : {};
  const rawCompletions = isRecord(rawRitual.completionsByPlayerId)
    ? rawRitual.completionsByPlayerId
    : {};
  const completionsByPlayerId = Object.fromEntries(
    Object.entries(rawCompletions)
      .map(([playerId, contribution]) => [playerId, normalizeRitualContribution(contribution)] as const)
      .filter((entry): entry is [string, SharedCoupleRitualContribution] => entry[1] !== null)
  );

  return {
    streakCount: normalizeInteger(couple.streakCount),
    longestStreakCount: normalizeInteger(couple.longestStreakCount),
    lastCompletedDayKey: normalizeIsoString(couple.lastCompletedDayKey),
    ritual: {
      dayKey:
        typeof rawRitual.dayKey === "string" && rawRitual.dayKey.length > 0
          ? rawRitual.dayKey
          : dayKey,
      completionsByPlayerId,
      completedAt: normalizeIsoString(rawRitual.completedAt),
      bonusAppliedAt: normalizeIsoString(rawRitual.bonusAppliedAt)
    },
    updatedAt: normalizeIsoString(couple.updatedAt, nowIso) ?? nowIso
  };
}

function applyPlayerXp(
  playerProgress: SharedPlayerProgression,
  xpDelta: number,
  nowIso: string
) {
  playerProgress.xp = normalizeInteger(playerProgress.xp + xpDelta);
  playerProgress.level = getLevelForXp(playerProgress.xp);
  playerProgress.updatedAt = nowIso;
}

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

export function toRoomDayKey(nowIso: string): string {
  return normalizeNowIso(nowIso).slice(0, 10);
}

export function createInitialSharedRoomProgression(
  memberIds: readonly string[],
  members: readonly SharedRoomMember[],
  legacySharedCoins: number,
  nowIso: string
): SharedRoomProgressionState {
  const normalizedNowIso = normalizeNowIso(nowIso);
  const dayKey = toRoomDayKey(normalizedNowIso);
  const allocatedCoins = splitLegacySharedCoins(memberIds, members, legacySharedCoins);

  return {
    version: 1,
    players: Object.fromEntries(
      [...new Set(memberIds.filter((memberId) => memberId.length > 0))].map((playerId) => [
        playerId,
        createInitialPlayerProgression(playerId, allocatedCoins.get(playerId) ?? 0, normalizedNowIso)
      ])
    ),
    couple: createEmptyCoupleProgression(dayKey, normalizedNowIso),
    migratedFromSharedCoins: normalizeInteger(legacySharedCoins)
  };
}

export function ensureSharedRoomProgressionMembers(
  progression: SharedRoomProgressionState,
  memberIds: readonly string[],
  members: readonly SharedRoomMember[],
  nowIso: string
): SharedRoomProgressionState {
  const normalizedNowIso = normalizeNowIso(nowIso);
  const normalizedMemberIds = [...new Set(memberIds.filter((memberId) => memberId.length > 0))];
  const dayKey = toRoomDayKey(normalizedNowIso);
  const sourcePlayers = isRecord(progression.players) ? progression.players : {};
  const nextProgression: SharedRoomProgressionState = {
    version: 1,
    players: {},
    couple: normalizeCoupleProgression(progression.couple, dayKey, normalizedNowIso),
    migratedFromSharedCoins:
      progression.migratedFromSharedCoins === null
        ? null
        : normalizeInteger(progression.migratedFromSharedCoins)
  };

  normalizedMemberIds.forEach((playerId) => {
    nextProgression.players[playerId] = normalizePlayerProgression(
      playerId,
      sourcePlayers[playerId],
      normalizedNowIso
    );
  });

  Object.entries(sourcePlayers).forEach(([playerId, playerProgress]) => {
    if (!(playerId in nextProgression.players)) {
      nextProgression.players[playerId] = normalizePlayerProgression(
        playerId,
        playerProgress,
        normalizedNowIso
      );
    }
  });

  if (Object.keys(nextProgression.players).length === 0) {
    return createInitialSharedRoomProgression(normalizedMemberIds, members, 0, normalizedNowIso);
  }

  return nextProgression;
}

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

  if (ritualDayKey === currentDayKey) {
    return nextProgression;
  }

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

  nextProgression.couple.ritual = createEmptyRitualDay(currentDayKey);
  nextProgression.couple.updatedAt = normalizedNowIso;
  return nextProgression;
}
