import type {
  SharedPendingPairLink,
  SharedRoomBootstrapState,
  SharedRoomMembership
} from "./sharedRoomTypes";

export interface DeriveSharedRoomBootstrapStateInput {
  playerId: string;
  selfPairCode: string;
  membership?: SharedRoomMembership | null;
  pendingLink?: SharedPendingPairLink | null;
}

export interface AssertPairLinkSubmissionAllowedInput {
  actorPlayerId: string;
  targetPlayerId: string;
  actorMembership?: SharedRoomMembership | null;
  targetMembership?: SharedRoomMembership | null;
}

function normalizePlayerId(playerId: string): string {
  return playerId.trim();
}

function normalizeNowIso(nowIso: string): string {
  const parsed = Date.parse(nowIso);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString();
}

export function normalizePairCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function rejectInvalidPairParticipants(playerIds: readonly string[]): string[] {
  const normalizedPlayerIds = playerIds
    .map(normalizePlayerId)
    .filter((playerId) => playerId.length > 0);
  const uniquePlayerIds = [...new Set(normalizedPlayerIds)];

  if (uniquePlayerIds.length < 2) {
    throw new Error("Pair link requires two different players.");
  }

  if (uniquePlayerIds.length > 2) {
    throw new Error("Only two players can belong to one couple room.");
  }

  if (normalizedPlayerIds.length !== uniquePlayerIds.length) {
    throw new Error("Pair link requires two different players.");
  }

  return uniquePlayerIds;
}

export function assertPairLinkSubmissionAllowed({
  actorPlayerId,
  targetPlayerId,
  actorMembership = null,
  targetMembership = null
}: AssertPairLinkSubmissionAllowedInput): string[] {
  const participants = rejectInvalidPairParticipants([actorPlayerId, targetPlayerId]);

  if (actorMembership || targetMembership) {
    throw new Error("Already paired accounts cannot start a new couple room link.");
  }

  return participants;
}

export function isPendingPairLinkReady(
  link: SharedPendingPairLink,
  nowIso: string
): boolean {
  let participantIds: string[];

  try {
    participantIds = rejectInvalidPairParticipants(link.playerIds);
  } catch {
    return false;
  }

  const normalizedNowIso = normalizeNowIso(nowIso);
  const expiresAtMs = Date.parse(link.expiresAt);

  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.parse(normalizedNowIso)) {
    return false;
  }

  return participantIds.every(
    (playerId) => link.confirmationsByPlayerId[playerId] === true
  );
}

export function deriveSharedRoomBootstrapState({
  playerId,
  selfPairCode,
  membership = null,
  pendingLink = null
}: DeriveSharedRoomBootstrapStateInput): SharedRoomBootstrapState {
  const normalizedPlayerId = normalizePlayerId(playerId);
  const normalizedSelfPairCode = normalizePairCode(selfPairCode);

  if (!normalizedPlayerId) {
    throw new Error("Shared room bootstrap state requires a player id.");
  }

  if (!normalizedSelfPairCode) {
    throw new Error("Shared room bootstrap state requires a reusable self pair code.");
  }

  if (membership && pendingLink) {
    throw new Error("Shared room bootstrap state cannot be paired and pending at the same time.");
  }

  if (membership) {
    if (normalizePlayerId(membership.playerId) !== normalizedPlayerId) {
      throw new Error("Shared room membership does not belong to the authenticated player.");
    }

    return {
      kind: "paired_room",
      playerId: normalizedPlayerId,
      selfPairCode: normalizedSelfPairCode,
      membership: {
        ...membership,
        pairCode: normalizePairCode(membership.pairCode)
      },
      pendingLink: null
    };
  }

  if (pendingLink) {
    const participantIds = rejectInvalidPairParticipants(pendingLink.playerIds);

    if (!participantIds.includes(normalizedPlayerId)) {
      throw new Error("Pending pair link does not include the authenticated player.");
    }

    return {
      kind: "pending_link",
      playerId: normalizedPlayerId,
      selfPairCode: normalizedSelfPairCode,
      membership: null,
      pendingLink: {
        ...pendingLink,
        playerIds: participantIds,
        targetPairCode: normalizePairCode(pendingLink.targetPairCode)
      }
    };
  }

  return {
    kind: "needs_linking",
    playerId: normalizedPlayerId,
    selfPairCode: normalizedSelfPairCode,
    membership: null,
    pendingLink: null
  };
}
