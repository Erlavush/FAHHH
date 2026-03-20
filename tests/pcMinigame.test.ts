import { describe, expect, it } from "vitest";
import {
  PC_MINIGAME_COOLDOWN_MS,
  applyPcMinigameResult,
  createDefaultPcMinigameProgress,
  formatPcMinigameCooldown,
  getPcMinigameCooldownRemaining,
  getPcMinigameRewardCoins
} from "../src/lib/pcMinigame";

describe("pcMinigame", () => {
  it("creates a clean default progress state", () => {
    expect(createDefaultPcMinigameProgress()).toEqual({
      bestScore: 0,
      lastScore: 0,
      gamesPlayed: 0,
      totalCoinsEarned: 0,
      lastRewardCoins: 0,
      lastCompletedAt: null
    });
  });

  it("scales rewards from score and caps the payout", () => {
    expect(getPcMinigameRewardCoins(0)).toBe(0);
    expect(getPcMinigameRewardCoins(9)).toBe(6);
    expect(getPcMinigameRewardCoins(999)).toBe(24);
  });

  it("tracks best score, total coins, and cooldown timing from a completed run", () => {
    const baseProgress = createDefaultPcMinigameProgress();
    const completedAt = 1_700_000_000_000;
    const resultProgress = applyPcMinigameResult(baseProgress, {
      score: 17,
      rewardCoins: 11,
      completedAt
    });

    expect(resultProgress).toEqual({
      bestScore: 17,
      lastScore: 17,
      gamesPlayed: 1,
      totalCoinsEarned: 11,
      lastRewardCoins: 11,
      lastCompletedAt: completedAt
    });
    expect(getPcMinigameCooldownRemaining(completedAt, completedAt + 15_000)).toBe(
      PC_MINIGAME_COOLDOWN_MS - 15_000
    );
    expect(formatPcMinigameCooldown(15_000)).toBe("00:15");
  });
});
