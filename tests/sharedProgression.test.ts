import { describe, expect, it } from "vitest";
import {
  DAILY_RITUAL_BONUS_COINS,
  DAILY_RITUAL_BONUS_XP,
  DESK_PC_XP_OFFSET,
  advanceRitualDayIfNeeded,
  applyDeskPcCompletionToProgression,
  applyPersonalWalletRefund,
  applyPersonalWalletSpend,
  applySharedActivityCompletionToProgression,
  buildSharedRitualStatus,
  createInitialSharedRoomProgression,
  ensureSharedRoomProgressionMembers,
  recordSharedRoomVisit,
  selectActivePlayerProgression,
  selectFeaturedActivityId
} from "../src/lib/sharedProgression";
import type { SharedRoomProgressionState } from "../src/lib/sharedProgressionTypes";

function createMembers() {
  return [
    {
      playerId: "player-1",
      displayName: "Ari",
      role: "creator" as const,
      joinedAt: "2026-03-26T00:00:00.000Z"
    },
    {
      playerId: "player-2",
      displayName: "Bea",
      role: "partner" as const,
      joinedAt: "2026-03-26T00:01:00.000Z"
    }
  ];
}

function createProgression(legacySharedCoins = 0, nowIso = "2026-03-26T08:00:00.000Z") {
  const members = createMembers();

  return createInitialSharedRoomProgression(
    members.map((member) => member.playerId),
    members,
    legacySharedCoins,
    nowIso
  );
}

describe("sharedProgression", () => {
  it("splits legacy shared coins across the room members", () => {
    const progression = createProgression(11);

    expect(progression.players["player-1"]?.coins).toBe(6);
    expect(progression.players["player-2"]?.coins).toBe(5);
    expect(progression.migratedFromSharedCoins).toBe(11);
  });

  it("returns the active player wallet and the empty ritual banner", () => {
    const progression = createProgression(12);
    const activePlayer = selectActivePlayerProgression(progression, "player-1");
    const ritualStatus = buildSharedRitualStatus(progression, {
      playerId: "player-1",
      partnerId: "player-2"
    });

    expect(activePlayer).toMatchObject({
      playerId: "player-1",
      coins: 6,
      level: 1,
      xp: 0
    });
    expect(ritualStatus.body).toBe("Both partners need one desk check-in today.");
  });

  it("keeps the waiting ritual banner once the active player has checked in", () => {
    const firstRun = applyDeskPcCompletionToProgression({
      progression: createProgression(0),
      actorPlayerId: "player-1",
      result: {
        score: 14,
        rewardCoins: 9,
        completedAt: Date.parse("2026-03-26T09:00:00.000Z")
      },
      memberIds: ["player-1", "player-2"],
      nowIso: "2026-03-26T09:00:00.000Z"
    });
    const ritualStatus = buildSharedRitualStatus(firstRun.progression, {
      playerId: "player-1",
      partnerId: "player-2"
    });

    expect(ritualStatus.body).toBe("Your check-in is done. Waiting on partner.");
  });

  it("adds missing member records without rewriting existing progress", () => {
    const progression = createProgression(0);

    progression.players["player-1"] = {
      ...progression.players["player-1"],
      coins: 44,
      xp: 88,
      level: 3,
      deskPc: {
        bestScore: 21,
        gamesPlayed: 3,
        lastRewardCoins: 12,
        lastScore: 19,
        lastCompletedAt: "2026-03-26T07:00:00.000Z",
        totalCoinsEarned: 20
      }
    };
    delete progression.players["player-2"];

    const ensured = ensureSharedRoomProgressionMembers(
      progression,
      ["player-1", "player-2"],
      createMembers(),
      "2026-03-26T10:00:00.000Z"
    );

    expect(ensured.players["player-1"]).toMatchObject({
      coins: 44,
      xp: 88,
      level: 3,
      deskPc: {
        bestScore: 21,
        gamesPlayed: 3,
        lastRewardCoins: 12,
        lastScore: 19,
        lastCompletedAt: "2026-03-26T07:00:00.000Z",
        totalCoinsEarned: 20
      }
    });
    expect(ensured.players["player-2"]).toMatchObject({
      coins: 0,
      xp: 0,
      level: 1
    });
  });

  it("migrates legacy streak fields into Together Days without losing progress", () => {
    const progression = createProgression(0);
    const legacyProgression = {
      ...progression,
      couple: {
        streakCount: 4,
        longestStreakCount: 7,
        lastCompletedDayKey: "2026-03-24",
        ritual: {
          dayKey: "2026-03-26",
          completionsByPlayerId: {},
          completedAt: null,
          bonusAppliedAt: null
        },
        updatedAt: "2026-03-26T08:00:00.000Z"
      }
    } as unknown as SharedRoomProgressionState;

    const ensured = ensureSharedRoomProgressionMembers(
      legacyProgression,
      ["player-1", "player-2"],
      createMembers(),
      "2026-03-26T10:00:00.000Z"
    );

    expect(ensured.couple.togetherDaysCount).toBe(4);
    expect(ensured.couple.bestTogetherDaysCount).toBe(7);
    expect(ensured.couple.lastTogetherDayKey).toBe("2026-03-24");
  });

  it("seeds visit day and featured activity for the current room day", () => {
    const progression = createProgression(0);

    expect(progression.couple.visitDay).toEqual({
      dayKey: "2026-03-26",
      visitedByPlayerId: {},
      countedAt: null
    });
    expect(progression.couple.featuredActivity?.dayKey).toBe("2026-03-26");
    expect(["pc_snake", "pc_block_stacker", "pc_runner", "cozy_rest"]).toContain(
      progression.couple.featuredActivity?.activityId
    );
    expect(progression.couple.activityClaimsByDayKey).toEqual({});
  });

  it("normalizes mixed per-player and couple claim records", () => {
    const progression = createProgression(0);
    const rawProgression = {
      ...progression,
      couple: {
        ...progression.couple,
        activityClaimsByDayKey: {
          "2026-03-26": {
            pc_snake: {
              activityId: "pc_snake",
              claimMode: "per_player",
              perPlayerClaimsByPlayerId: {
                "player-1": {
                  claimedAt: "2026-03-26T10:00:00.000Z",
                  rewardCoins: 6,
                  rewardXp: 4,
                  score: 12
                }
              },
              coupleClaim: null
            },
            cozy_rest: {
              activityId: "cozy_rest",
              claimMode: "couple",
              perPlayerClaimsByPlayerId: {},
              coupleClaim: {
                claimedAt: "2026-03-26T11:00:00.000Z",
                rewardCoins: 10,
                rewardXp: 6,
                score: 0
              }
            }
          }
        }
      }
    } as SharedRoomProgressionState;

    const ensured = ensureSharedRoomProgressionMembers(
      rawProgression,
      ["player-1", "player-2"],
      createMembers(),
      "2026-03-26T12:00:00.000Z"
    );

    expect(
      ensured.couple.activityClaimsByDayKey["2026-03-26"]?.pc_snake?.perPlayerClaimsByPlayerId[
        "player-1"
      ]
    ).toMatchObject({
      rewardCoins: 6,
      rewardXp: 4,
      score: 12
    });
    expect(ensured.couple.activityClaimsByDayKey["2026-03-26"]?.cozy_rest?.coupleClaim).toMatchObject({
      rewardCoins: 10,
      rewardXp: 6,
      score: 0
    });
  });

  it("increments Together Days once when both partners visit the same room day", () => {
    const firstVisit = recordSharedRoomVisit({
      progression: createProgression(0),
      actorPlayerId: "player-1",
      memberIds: ["player-1", "player-2"],
      nowIso: "2026-03-26T09:00:00.000Z"
    });

    expect(firstVisit.couple.togetherDaysCount).toBe(0);
    expect(firstVisit.couple.visitDay.visitedByPlayerId["player-1"]).toBe(
      "2026-03-26T09:00:00.000Z"
    );
    expect(firstVisit.couple.visitDay.countedAt).toBeNull();

    const countedVisit = recordSharedRoomVisit({
      progression: firstVisit,
      actorPlayerId: "player-2",
      memberIds: ["player-1", "player-2"],
      nowIso: "2026-03-26T09:05:00.000Z"
    });

    expect(countedVisit.couple.togetherDaysCount).toBe(1);
    expect(countedVisit.couple.bestTogetherDaysCount).toBe(1);
    expect(countedVisit.couple.lastTogetherDayKey).toBe("2026-03-26");
    expect(countedVisit.couple.visitDay.countedAt).toBe("2026-03-26T09:05:00.000Z");

    const duplicateVisit = recordSharedRoomVisit({
      progression: countedVisit,
      actorPlayerId: "player-1",
      memberIds: ["player-1", "player-2"],
      nowIso: "2026-03-26T10:00:00.000Z"
    });

    expect(duplicateVisit.couple.togetherDaysCount).toBe(1);
    expect(duplicateVisit.couple.visitDay.countedAt).toBe("2026-03-26T09:05:00.000Z");
  });

  it("spends only the acting player's wallet and rejects overspend", () => {
    const baseProgression = createProgression(20);
    const spentProgression = applyPersonalWalletSpend(
      baseProgression,
      "player-1",
      7,
      "2026-03-26T10:30:00.000Z"
    );

    expect(spentProgression.players["player-1"]?.coins).toBe(3);
    expect(spentProgression.players["player-2"]?.coins).toBe(10);
    expect(() =>
      applyPersonalWalletSpend(baseProgression, "player-1", 99, "2026-03-26T10:31:00.000Z")
    ).toThrow("Not enough coins.");
    expect(baseProgression.players["player-1"]?.coins).toBe(10);
  });

  it("refunds only the acting player's wallet without touching couple ritual state", () => {
    const baseProgression = createProgression(0);
    baseProgression.players["player-1"].coins = 4;
    const refundedProgression = applyPersonalWalletRefund(
      baseProgression,
      "player-1",
      6,
      "2026-03-26T10:45:00.000Z"
    );

    expect(refundedProgression.players["player-1"]?.coins).toBe(10);
    expect(refundedProgression.players["player-2"]?.coins).toBe(0);
    expect(refundedProgression.couple.ritual).toEqual(baseProgression.couple.ritual);
  });

  it("awards the ritual bonus to both partners when the second partner completes the day", () => {
    const firstRun = applyDeskPcCompletionToProgression({
      progression: createProgression(0),
      actorPlayerId: "player-1",
      result: {
        score: 10,
        rewardCoins: 8,
        completedAt: Date.parse("2026-03-26T11:00:00.000Z")
      },
      memberIds: ["player-1", "player-2"],
      nowIso: "2026-03-26T11:00:00.000Z"
    });
    const secondRun = applyDeskPcCompletionToProgression({
      progression: firstRun.progression,
      actorPlayerId: "player-2",
      result: {
        score: 12,
        rewardCoins: 10,
        completedAt: Date.parse("2026-03-26T12:00:00.000Z")
      },
      memberIds: ["player-1", "player-2"],
      nowIso: "2026-03-26T12:00:00.000Z"
    });

    expect(secondRun.dailyRitualStatus).toBe("completed");
    expect(secondRun.dailyRitualBonusCoins).toBe(DAILY_RITUAL_BONUS_COINS);
    expect(secondRun.dailyRitualBonusXp).toBe(DAILY_RITUAL_BONUS_XP);
    expect(secondRun.progression.players["player-1"]?.coins).toBe(20);
    expect(secondRun.progression.players["player-2"]?.coins).toBe(22);
    expect(secondRun.progression.players["player-2"]?.xp).toBe(
      10 + DESK_PC_XP_OFFSET + DAILY_RITUAL_BONUS_XP
    );
    expect(secondRun.progression.couple.streakCount).toBe(1);
    expect(secondRun.progression.couple.ritual.completedAt).toBe("2026-03-26T12:00:00.000Z");
  });

  it("does not let the same player complete the ritual twice in one room day", () => {
    const firstRun = applyDeskPcCompletionToProgression({
      progression: createProgression(0),
      actorPlayerId: "player-1",
      result: {
        score: 9,
        rewardCoins: 7,
        completedAt: Date.parse("2026-03-26T11:00:00.000Z")
      },
      memberIds: ["player-1", "player-2"],
      nowIso: "2026-03-26T11:00:00.000Z"
    });
    const secondRun = applyDeskPcCompletionToProgression({
      progression: firstRun.progression,
      actorPlayerId: "player-1",
      result: {
        score: 13,
        rewardCoins: 9,
        completedAt: Date.parse("2026-03-26T12:00:00.000Z")
      },
      memberIds: ["player-1", "player-2"],
      nowIso: "2026-03-26T12:00:00.000Z"
    });

    expect(Object.keys(secondRun.progression.couple.ritual.completionsByPlayerId)).toEqual([
      "player-1"
    ]);
    expect(secondRun.progression.couple.ritual.completedAt).toBeNull();
    expect(secondRun.progression.players["player-1"]?.coins).toBe(16);
  });

  it("preserves a partial ritual contribution across a reload in the same room day", () => {
    const firstRun = applyDeskPcCompletionToProgression({
      progression: createProgression(0),
      actorPlayerId: "player-1",
      result: {
        score: 11,
        rewardCoins: 8,
        completedAt: Date.parse("2026-03-26T13:00:00.000Z")
      },
      memberIds: ["player-1", "player-2"],
      nowIso: "2026-03-26T13:00:00.000Z"
    });
    const reloadedProgression = advanceRitualDayIfNeeded(
      firstRun.progression,
      ["player-1", "player-2"],
      createMembers(),
      "2026-03-26T21:00:00.000Z"
    );

    expect(reloadedProgression.couple.ritual.dayKey).toBe("2026-03-26");
    expect(reloadedProgression.couple.ritual.completionsByPlayerId["player-1"]).toMatchObject({
      source: "desk_pc"
    });
    expect(reloadedProgression.couple.ritual.completedAt).toBeNull();
  });

  it("blocks duplicate room-day claims while reporting payout status", () => {
    const firstClaim = applySharedActivityCompletionToProgression({
      progression: createProgression(0),
      activityId: "pc_snake",
      claimMode: "per_player",
      actorPlayerId: "player-1",
      memberIds: ["player-1", "player-2"],
      rewardCoins: 6,
      rewardXp: 4,
      score: 12,
      nowIso: "2026-03-26T10:00:00.000Z"
    });

    expect(firstClaim.payoutGranted).toBe(true);
    expect(firstClaim.progression.players["player-1"]?.coins).toBe(6);
    expect(firstClaim.progression.players["player-1"]?.xp).toBe(4);
    expect(
      firstClaim.progression.couple.activityClaimsByDayKey["2026-03-26"]?.pc_snake
        ?.perPlayerClaimsByPlayerId["player-1"]
    ).toMatchObject({
      claimedAt: "2026-03-26T10:00:00.000Z",
      rewardCoins: 6,
      rewardXp: 4,
      score: 12
    });

    const duplicateClaim = applySharedActivityCompletionToProgression({
      progression: firstClaim.progression,
      activityId: "pc_snake",
      claimMode: "per_player",
      actorPlayerId: "player-1",
      memberIds: ["player-1", "player-2"],
      rewardCoins: 9,
      rewardXp: 7,
      score: 18,
      nowIso: "2026-03-26T10:30:00.000Z"
    });

    expect(duplicateClaim.payoutGranted).toBe(false);
    expect(duplicateClaim.progression.players["player-1"]?.coins).toBe(6);
    expect(duplicateClaim.progression.players["player-1"]?.xp).toBe(4);
    expect(
      duplicateClaim.progression.couple.activityClaimsByDayKey["2026-03-26"]?.pc_snake
        ?.perPlayerClaimsByPlayerId["player-1"]
    ).toMatchObject({
      claimedAt: "2026-03-26T10:00:00.000Z",
      rewardCoins: 6,
      rewardXp: 4,
      score: 12
    });
  });

  it("does not reset Together Days after a missed room day", () => {
    const baseProgression = createProgression(0);

    baseProgression.couple.togetherDaysCount = 3;
    baseProgression.couple.bestTogetherDaysCount = 5;
    baseProgression.couple.lastTogetherDayKey = "2026-03-24";
    baseProgression.couple.visitDay = {
      dayKey: "2026-03-26",
      visitedByPlayerId: {
        "player-1": "2026-03-26T13:00:00.000Z"
      },
      countedAt: null
    };
    baseProgression.couple.featuredActivity = {
      dayKey: "2026-03-26",
      activityId: "pc_snake",
      selectedAt: "2026-03-26T08:00:00.000Z"
    };
    baseProgression.couple.activityClaimsByDayKey["2026-03-26"] = {
      pc_snake: {
        activityId: "pc_snake",
        claimMode: "per_player",
        perPlayerClaimsByPlayerId: {
          "player-1": {
            claimedAt: "2026-03-26T13:30:00.000Z",
            rewardCoins: 6,
            rewardXp: 4,
            score: 12
          }
        },
        coupleClaim: null
      }
    };

    const nextDayProgression = advanceRitualDayIfNeeded(
      baseProgression,
      ["player-1", "player-2"],
      createMembers(),
      "2026-03-27T08:00:00.000Z"
    );

    expect(nextDayProgression.couple.togetherDaysCount).toBe(3);
    expect(nextDayProgression.couple.bestTogetherDaysCount).toBe(5);
    expect(nextDayProgression.couple.lastTogetherDayKey).toBe("2026-03-24");
    expect(nextDayProgression.couple.visitDay).toEqual({
      dayKey: "2026-03-27",
      visitedByPlayerId: {},
      countedAt: null
    });
    expect(nextDayProgression.couple.featuredActivity).toEqual({
      dayKey: "2026-03-27",
      activityId: selectFeaturedActivityId("2026-03-27"),
      selectedAt: "2026-03-27T08:00:00.000Z"
    });
    expect(
      nextDayProgression.couple.activityClaimsByDayKey["2026-03-26"]?.pc_snake
        ?.perPlayerClaimsByPlayerId["player-1"]
    ).toMatchObject({
      rewardCoins: 6,
      rewardXp: 4,
      score: 12
    });
    expect(nextDayProgression.couple.ritual.dayKey).toBe("2026-03-27");
  });
});
