import {
  applyPcMinigameResult,
  type PcDeskActivityId,
  type PcMinigameProgress,
  type PcMinigameResult
} from "../pcMinigame";
import type { SharedRoomMember } from "../sharedRoomTypes";
import type {
  SharedActivityClaimMode,
  SharedCoupleProgression,
  SharedCoupleRitualContribution,
  SharedCoupleRitualDay,
  SharedCoupleVisitDay,
  SharedFeaturedActivityDay,
  SharedPlayerDeskPcActivityProgress,
  SharedPlayerDeskPcProgress,
  SharedPlayerProgression,
  SharedRoomActivityClaim,
  SharedRoomActivityClaimDay,
  SharedRoomActivityId,
  SharedRoomActivityRewardClaim,
  SharedRoomProgressionState
} from "../sharedProgressionTypes";
import {
  ROOM_LEVEL_XP_THRESHOLDS,
  SHARED_ROOM_ACTIVITY_IDS
} from "./constants";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizeInteger(value: unknown, fallback = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.floor(value));
}

export function normalizeIsoString(value: unknown, fallback: string | null = null): string | null {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

export function normalizeNowIso(nowIso: string): string {
  const parsed = Date.parse(nowIso);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString();
}

export function normalizeActivityId(value: unknown): SharedRoomActivityId | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value === "pc_runner" ? "pc_pacman" : value;

  return SHARED_ROOM_ACTIVITY_IDS.includes(normalizedValue as SharedRoomActivityId)
    ? (normalizedValue as SharedRoomActivityId)
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

export function createDefaultDeskPcActivityProgress(): SharedPlayerDeskPcActivityProgress {
  return {
    bestScore: 0,
    gamesPlayed: 0,
    lastRewardCoins: 0,
    lastScore: 0,
    lastCompletedAt: null,
    totalCoinsEarned: 0
  };
}

function cloneDeskPcActivityProgress(
  progress: SharedPlayerDeskPcActivityProgress
): SharedPlayerDeskPcActivityProgress {
  return {
    ...progress
  };
}

function createDefaultDeskPcProgress(): SharedPlayerDeskPcProgress {
  return {
    ...createDefaultDeskPcActivityProgress(),
    appsByActivityId: {}
  };
}

function cloneDeskPcProgress(progress: SharedPlayerDeskPcProgress): SharedPlayerDeskPcProgress {
  return {
    ...progress,
    appsByActivityId: Object.fromEntries(
      Object.entries(progress.appsByActivityId ?? {}).map(([activityId, appProgress]) => [
        activityId,
        cloneDeskPcActivityProgress(appProgress)
      ])
    )
  };
}

export function createEmptyVisitDay(dayKey: string): SharedCoupleVisitDay {
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

export function createFeaturedActivityDay(
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

export function createEmptyActivityClaim(
  activityId: SharedRoomActivityId,
  claimMode: SharedActivityClaimMode
): SharedRoomActivityClaim {
  return {
    activityId,
    claimMode,
    perPlayerClaimsByPlayerId: {},
    coupleClaim: null
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

export function cloneProgression(
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

export function createEmptyRitualDay(dayKey: string): SharedCoupleRitualDay {
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

function normalizeDeskPcActivityProgressValue(
  value: unknown
): SharedPlayerDeskPcActivityProgress {
  if (!isRecord(value)) {
    return createDefaultDeskPcActivityProgress();
  }

  return {
    bestScore: normalizeInteger(value.bestScore),
    gamesPlayed: normalizeInteger(value.gamesPlayed),
    lastRewardCoins: normalizeInteger(value.lastRewardCoins),
    lastScore: normalizeInteger(value.lastScore),
    lastCompletedAt: normalizeIsoString(value.lastCompletedAt),
    totalCoinsEarned: normalizeInteger(value.totalCoinsEarned)
  };
}

function mergeDeskPcActivityProgress(
  current: SharedPlayerDeskPcActivityProgress,
  incoming: SharedPlayerDeskPcActivityProgress
): SharedPlayerDeskPcActivityProgress {
  const currentCompletedAt = current.lastCompletedAt ? Date.parse(current.lastCompletedAt) : 0;
  const incomingCompletedAt = incoming.lastCompletedAt ? Date.parse(incoming.lastCompletedAt) : 0;
  const latestProgress = incomingCompletedAt >= currentCompletedAt ? incoming : current;

  return {
    bestScore: Math.max(current.bestScore, incoming.bestScore),
    gamesPlayed: current.gamesPlayed + incoming.gamesPlayed,
    lastRewardCoins: latestProgress.lastRewardCoins,
    lastScore: latestProgress.lastScore,
    lastCompletedAt: latestProgress.lastCompletedAt,
    totalCoinsEarned: current.totalCoinsEarned + incoming.totalCoinsEarned
  };
}

function normalizeDeskPcProgress(deskPc: unknown): SharedPlayerDeskPcProgress {
  if (!isRecord(deskPc)) {
    return createDefaultDeskPcProgress();
  }

  const appsByActivityId: Record<string, SharedPlayerDeskPcActivityProgress> = {};

  if (isRecord(deskPc.appsByActivityId)) {
    Object.entries(deskPc.appsByActivityId).forEach(([activityId, value]) => {
      const normalizedActivityId = activityId === "pc_runner" ? "pc_pacman" : activityId;
      const nextProgress = normalizeDeskPcActivityProgressValue(value);
      const currentProgress = appsByActivityId[normalizedActivityId];

      appsByActivityId[normalizedActivityId] = currentProgress
        ? mergeDeskPcActivityProgress(currentProgress, nextProgress)
        : nextProgress;
    });
  }

  return {
    bestScore: normalizeInteger(deskPc.bestScore),
    gamesPlayed: normalizeInteger(deskPc.gamesPlayed),
    lastRewardCoins: normalizeInteger(deskPc.lastRewardCoins),
    lastScore: normalizeInteger(deskPc.lastScore),
    lastCompletedAt: normalizeIsoString(deskPc.lastCompletedAt),
    totalCoinsEarned: normalizeInteger(deskPc.totalCoinsEarned),
    appsByActivityId
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

export function applyPlayerXp(
  playerProgress: SharedPlayerProgression,
  xpDelta: number,
  nowIso: string
) {
  playerProgress.xp = normalizeInteger(playerProgress.xp + xpDelta);
  playerProgress.level = getLevelForXp(playerProgress.xp);
  playerProgress.updatedAt = nowIso;
}

export function isDeskPcActivityId(activityId: SharedRoomActivityId): activityId is PcDeskActivityId {
  return activityId === "pc_snake" || activityId === "pc_block_stacker" || activityId === "pc_pacman";
}

export function recordDeskPcActivityRun(input: {
  playerProgress: SharedPlayerProgression;
  activityId: PcDeskActivityId;
  score: number;
  rewardCoins: number;
  nowIso: string;
}) {
  const appsByActivityId = {
    ...(input.playerProgress.deskPc.appsByActivityId ?? {})
  };
  const previousAppProgress = appsByActivityId[input.activityId] ?? createDefaultDeskPcActivityProgress();
  const nextAppProgress = applyPcMinigameResult(
    {
      bestScore: previousAppProgress.bestScore,
      lastScore: previousAppProgress.lastScore,
      gamesPlayed: previousAppProgress.gamesPlayed,
      totalCoinsEarned: previousAppProgress.totalCoinsEarned,
      lastRewardCoins: previousAppProgress.lastRewardCoins,
      lastCompletedAt: previousAppProgress.lastCompletedAt
        ? Date.parse(previousAppProgress.lastCompletedAt)
        : null
    } satisfies PcMinigameProgress,
    {
      activityId: input.activityId,
      score: input.score,
      rewardCoins: input.rewardCoins,
      completedAt: Date.parse(input.nowIso)
    } satisfies PcMinigameResult
  );

  appsByActivityId[input.activityId] = {
    bestScore: nextAppProgress.bestScore,
    gamesPlayed: nextAppProgress.gamesPlayed,
    lastRewardCoins: nextAppProgress.lastRewardCoins,
    lastScore: nextAppProgress.lastScore,
    lastCompletedAt: input.nowIso,
    totalCoinsEarned: nextAppProgress.totalCoinsEarned
  };

  input.playerProgress.deskPc = {
    ...input.playerProgress.deskPc,
    bestScore: Math.max(input.playerProgress.deskPc.bestScore, input.score),
    gamesPlayed: input.playerProgress.deskPc.gamesPlayed + 1,
    lastRewardCoins: input.rewardCoins,
    lastScore: input.score,
    lastCompletedAt: input.nowIso,
    totalCoinsEarned: input.playerProgress.deskPc.totalCoinsEarned + input.rewardCoins,
    appsByActivityId
  };
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



