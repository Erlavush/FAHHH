import {
  applyPcMinigameResult,
  type PcMinigameProgress,
  type PcMinigameResult
} from "./pcMinigame";
import type { SharedRoomMember, SharedRoomSession } from "./sharedRoomTypes";
import type {
  SharedActivityClaimMode,
  SharedCoupleProgression,
  SharedCoupleRitualContribution,
  SharedCoupleRitualDay,
  SharedCoupleVisitDay,
  SharedFeaturedActivityDay,
  SharedPlayerDeskPcProgress,
  SharedPlayerProgression,
  SharedRoomActivityClaim,
  SharedRoomActivityClaimDay,
  SharedRoomActivityId,
  SharedRoomActivityRewardClaim,
  SharedRoomProgressionState
} from "./sharedProgressionTypes";

export const ROOM_LEVEL_XP_THRESHOLDS = [0, 20, 55, 95, 140, 190] as const;
export const DESK_PC_XP_OFFSET = 4;
export const DAILY_RITUAL_BONUS_COINS = 12;
export const DAILY_RITUAL_BONUS_XP = 16;
export const SHARED_ROOM_ACTIVITY_IDS = [
  "pc_snake",
  "pc_block_stacker",
  "pc_runner",
  "cozy_rest"
] as const satisfies readonly SharedRoomActivityId[];

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

function normalizeActivityId(value: unknown): SharedRoomActivityId | null {
  if (typeof value !== "string") {
    return null;
  }

  return SHARED_ROOM_ACTIVITY_IDS.includes(value as SharedRoomActivityId)
    ? (value as SharedRoomActivityId)
    : null;
}

function getDefaultClaimMode(activityId: SharedRoomActivityId): SharedActivityClaimMode {
  return activityId === "cozy_rest" ? "couple" : "per_player";
}

function normalizeClaimMode(
  value: unknown,
  activityId: SharedRoomActivityId
): SharedActivityClaimMode {
  return value === "per_player" || value === "couple"
    ? value
    : getDefaultClaimMode(activityId);
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

function createEmptyVisitDay(dayKey: string): SharedCoupleVisitDay {
  return {
    dayKey,
    visitedByPlayerId: {},
    countedAt: null
  };
}

function cloneVisitDay(day: SharedCoupleVisitDay): SharedCoupleVisitDay {
  return {
    ...day,
    visitedByPlayerId: { ...day.visitedByPlayerId }
  };
}

export function selectFeaturedActivityId(dayKey: string): SharedRoomActivityId {
  const seed = Array.from(dayKey).reduce(
    (total, character, index) => total + character.charCodeAt(0) * (index + 1),
    0
  );

  return SHARED_ROOM_ACTIVITY_IDS[seed % SHARED_ROOM_ACTIVITY_IDS.length];
}

function createFeaturedActivityDay(
  dayKey: string,
  nowIso: string
): SharedFeaturedActivityDay {
  return {
    dayKey,
    activityId: selectFeaturedActivityId(dayKey),
    selectedAt: nowIso
  };
}

function cloneFeaturedActivityDay(
  activity: SharedFeaturedActivityDay | null
): SharedFeaturedActivityDay | null {
  if (!activity) {
    return null;
  }

  return {
    ...activity
  };
}

function normalizeVisitDay(value: unknown, dayKey: string): SharedCoupleVisitDay {
  if (!isRecord(value)) {
    return createEmptyVisitDay(dayKey);
  }

  const visitedByPlayerId = isRecord(value.visitedByPlayerId)
    ? Object.fromEntries(
        Object.entries(value.visitedByPlayerId)
          .map(([playerId, visitedAt]) => [playerId, normalizeIsoString(visitedAt)] as const)
          .filter((entry): entry is [string, string] => entry[1] !== null)
      )
    : {};

  return {
    dayKey: normalizeIsoString(value.dayKey, dayKey) ?? dayKey,
    visitedByPlayerId,
    countedAt: normalizeIsoString(value.countedAt)
  };
}

function normalizeFeaturedActivity(
  value: unknown,
  dayKey: string,
  nowIso: string
): SharedFeaturedActivityDay {
  if (!isRecord(value)) {
    return createFeaturedActivityDay(dayKey, nowIso);
  }

  const normalizedDayKey = normalizeIsoString(value.dayKey, dayKey) ?? dayKey;
  const activityId = normalizeActivityId(value.activityId) ?? selectFeaturedActivityId(normalizedDayKey);

  return {
    dayKey: normalizedDayKey,
    activityId,
    selectedAt: normalizeIsoString(value.selectedAt, nowIso) ?? nowIso
  };
}

function normalizeActivityRewardClaim(
  value: unknown,
  nowIso: string
): SharedRoomActivityRewardClaim | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    claimedAt: normalizeIsoString(value.claimedAt, nowIso) ?? nowIso,
    rewardCoins: normalizeInteger(value.rewardCoins),
    rewardXp: normalizeInteger(value.rewardXp),
    score: normalizeInteger(value.score)
  };
}

function cloneActivityRewardClaim(
  claim: SharedRoomActivityRewardClaim
): SharedRoomActivityRewardClaim {
  return {
    ...claim
  };
}

function normalizeActivityClaim(
  activityId: SharedRoomActivityId,
  value: unknown,
  nowIso: string
): SharedRoomActivityClaim | null {
  if (!isRecord(value)) {
    return null;
  }

  const claimMode = normalizeClaimMode(value.claimMode, activityId);
  const perPlayerClaimsByPlayerId = isRecord(value.perPlayerClaimsByPlayerId)
    ? Object.fromEntries(
        Object.entries(value.perPlayerClaimsByPlayerId)
          .map(([playerId, claim]) => [playerId, normalizeActivityRewardClaim(claim, nowIso)] as const)
          .filter((entry): entry is [string, SharedRoomActivityRewardClaim] => entry[1] !== null)
      )
    : {};

  return {
    activityId,
    claimMode,
    perPlayerClaimsByPlayerId,
    coupleClaim: normalizeActivityRewardClaim(value.coupleClaim, nowIso)
  };
}

function cloneActivityClaim(claim: SharedRoomActivityClaim): SharedRoomActivityClaim {
  return {
    ...claim,
    perPlayerClaimsByPlayerId: Object.fromEntries(
      Object.entries(claim.perPlayerClaimsByPlayerId).map(([playerId, playerClaim]) => [
        playerId,
        cloneActivityRewardClaim(playerClaim)
      ])
    ),
    coupleClaim: claim.coupleClaim ? cloneActivityRewardClaim(claim.coupleClaim) : null
  };
}

function cloneActivityClaimDay(day: SharedRoomActivityClaimDay): SharedRoomActivityClaimDay {
  return Object.fromEntries(
    Object.entries(day).map(([activityId, claim]) => [activityId, cloneActivityClaim(claim)])
  ) as SharedRoomActivityClaimDay;
}

function normalizeActivityClaimDay(
  value: unknown,
  nowIso: string
): SharedRoomActivityClaimDay {
  if (!isRecord(value)) {
    return {};
  }

  const dayClaims: SharedRoomActivityClaimDay = {};

  Object.entries(value).forEach(([activityKey, claimValue]) => {
    const activityId = normalizeActivityId(activityKey);
    if (!activityId) {
      return;
    }

    const claim = normalizeActivityClaim(activityId, claimValue, nowIso);
    if (!claim) {
      return;
    }

    dayClaims[activityId] = claim;
  });

  return dayClaims;
}

function normalizeActivityClaimsByDayKey(
  value: unknown,
  nowIso: string
): Record<string, SharedRoomActivityClaimDay> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([dayKey, claimDay]) => [dayKey, normalizeActivityClaimDay(claimDay, nowIso)])
  );
}

function cloneActivityClaimsByDayKey(
  claimsByDayKey: Record<string, SharedRoomActivityClaimDay>
): Record<string, SharedRoomActivityClaimDay> {
  return Object.fromEntries(
    Object.entries(claimsByDayKey).map(([dayKey, claimDay]) => [dayKey, cloneActivityClaimDay(claimDay)])
  );
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
    visitDay: cloneVisitDay(progress.visitDay),
    featuredActivity: cloneFeaturedActivityDay(progress.featuredActivity),
    activityClaimsByDayKey: cloneActivityClaimsByDayKey(progress.activityClaimsByDayKey),
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
    togetherDaysCount: 0,
    bestTogetherDaysCount: 0,
    lastTogetherDayKey: null,
    visitDay: createEmptyVisitDay(dayKey),
    featuredActivity: createFeaturedActivityDay(dayKey, nowIso),
    activityClaimsByDayKey: {},
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

function normalizeDeskPcProgress(deskPc: unknown): SharedPlayerDeskPcProgress {
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
  value: unknown,
  nowIso: string
): SharedCoupleRitualContribution | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    source: "desk_pc",
    completedAt: normalizeIsoString(value.completedAt, nowIso) ?? nowIso,
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
      .map(([playerId, contribution]) => [playerId, normalizeRitualContribution(contribution, nowIso)] as const)
      .filter((entry): entry is [string, SharedCoupleRitualContribution] => entry[1] !== null)
  );
  const legacyStreakCount = normalizeInteger(couple.streakCount);
  const legacyLongestStreakCount = normalizeInteger(couple.longestStreakCount);
  const lastCompletedDayKey = normalizeIsoString(couple.lastCompletedDayKey);
  const togetherDaysCount = normalizeInteger(couple.togetherDaysCount, legacyStreakCount);
  const bestTogetherDaysCount = Math.max(
    togetherDaysCount,
    normalizeInteger(couple.bestTogetherDaysCount, legacyLongestStreakCount)
  );

  return {
    streakCount: legacyStreakCount,
    longestStreakCount: legacyLongestStreakCount,
    lastCompletedDayKey,
    togetherDaysCount,
    bestTogetherDaysCount,
    lastTogetherDayKey: normalizeIsoString(couple.lastTogetherDayKey, lastCompletedDayKey),
    visitDay: normalizeVisitDay(couple.visitDay, dayKey),
    featuredActivity: normalizeFeaturedActivity(couple.featuredActivity, dayKey, nowIso),
    activityClaimsByDayKey: normalizeActivityClaimsByDayKey(couple.activityClaimsByDayKey, nowIso),
    ritual: {
      dayKey: normalizeIsoString(rawRitual.dayKey, dayKey) ?? dayKey,
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
