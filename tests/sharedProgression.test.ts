import { describe, expect, it } from "vitest";
import {
  DAILY_RITUAL_BONUS_COINS,
  DAILY_RITUAL_BONUS_XP,
  DESK_PC_XP_OFFSET,
  advanceRitualDayIfNeeded,
  applyDeskPcCompletionToProgression,
  applyPersonalWalletRefund,
  applyPersonalWalletSpend,
  buildSharedRitualStatus,
  createInitialSharedRoomProgression,
  ensureSharedRoomProgressionMembers,
  selectActivePlayerProgression
} from "../src/lib/sharedProgression";

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

  it("resets the streak after an unfinished day is missed", () => {
    const baseProgression = createProgression(0);

    baseProgression.couple.streakCount = 3;
    baseProgression.couple.longestStreakCount = 5;
    baseProgression.couple.ritual.dayKey = "2026-03-26";
    baseProgression.couple.ritual.completionsByPlayerId["player-1"] = {
      source: "desk_pc",
      completedAt: "2026-03-26T13:00:00.000Z",
      score: 11,
      rewardCoins: 8
    };

    const nextDayProgression = advanceRitualDayIfNeeded(
      baseProgression,
      ["player-1", "player-2"],
      createMembers(),
      "2026-03-27T08:00:00.000Z"
    );

    expect(nextDayProgression.couple.streakCount).toBe(0);
    expect(nextDayProgression.couple.longestStreakCount).toBe(5);
    expect(nextDayProgression.couple.ritual.dayKey).toBe("2026-03-27");
    expect(nextDayProgression.couple.ritual.completionsByPlayerId).toEqual({});
  });
});
