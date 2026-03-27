import { describe, expect, it } from "vitest";
import { createInitialSharedRoomProgression } from "../src/lib/sharedProgression";
import { applyDebugWalletTarget } from "../src/lib/debugWallet";

function createProgression(activePlayerCoins = 70) {
  const nowIso = "2026-03-27T00:00:00.000Z";
  const progression = createInitialSharedRoomProgression(
    ["player-1", "player-2"],
    [
      {
        playerId: "player-1",
        displayName: "Ari",
        role: "creator",
        joinedAt: nowIso
      },
      {
        playerId: "player-2",
        displayName: "Bea",
        role: "partner",
        joinedAt: nowIso
      }
    ],
    0,
    nowIso
  );

  progression.players["player-1"]!.coins = activePlayerCoins;
  progression.players["player-2"]!.coins = 70;
  return progression;
}

describe("applyDebugWalletTarget", () => {
  it("raises the active wallet to a target coin amount", () => {
    const nextProgression = applyDebugWalletTarget(
      createProgression(0),
      "player-1",
      245,
      "2026-03-27T12:00:00.000Z"
    );

    expect(nextProgression.players["player-1"]?.coins).toBe(245);
    expect(nextProgression.players["player-2"]?.coins).toBe(70);
  });

  it("lowers the active wallet to a target coin amount", () => {
    const nextProgression = applyDebugWalletTarget(
      createProgression(245),
      "player-1",
      32,
      "2026-03-27T12:00:00.000Z"
    );

    expect(nextProgression.players["player-1"]?.coins).toBe(32);
  });
});
