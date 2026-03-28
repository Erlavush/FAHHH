import { describe, expect, it } from "vitest";
import {
  getBehaviorStateDurationMs,
  getCatPauseDurationMs,
  selectCatPausePhase,
  selectPetBehaviorState,
  shouldFollowPlayer
} from "../src/lib/petBehavior";
import type { OwnedPetCareState } from "../src/lib/pets";

function createCareState(overrides?: Partial<OwnedPetCareState>): OwnedPetCareState {
  return {
    hunger: overrides?.hunger ?? 75,
    affection: overrides?.affection ?? 75,
    energy: overrides?.energy ?? 75,
    lastUpdatedAt: overrides?.lastUpdatedAt ?? "2026-03-27T12:00:00.000Z",
    lastCareActionAt: overrides?.lastCareActionAt ?? null
  };
}

describe("petBehavior", () => {
  it("uses a low sit chance for the simple cat wander loop", () => {
    expect(selectCatPausePhase(0.05)).toBe("sitting");
    expect(selectCatPausePhase(0.1)).toBe("idle");
    expect(selectCatPausePhase(0.7)).toBe("idle");
  });

  it("keeps standing idle pauses between three and six seconds", () => {
    expect(getCatPauseDurationMs("idle", 0)).toBe(3000);
    expect(getCatPauseDurationMs("idle", 0.5)).toBe(4500);
    expect(getCatPauseDurationMs("idle", 1)).toBe(6000);
    expect(getCatPauseDurationMs("sitting", 0.2)).toBe(10000);
  });

  it("prefers sleeping when energy is low", () => {
    expect(
      selectPetBehaviorState({
        behaviorProfileId: "lazy",
        care: createCareState({ energy: 12, affection: 60 }),
        playerDistance: 1.2,
        idleTimeMs: 4200,
        randomValue: 0.2
      })
    ).toBe("sleeping");
  });

  it("keeps clingy cats following distant players when affection is high", () => {
    const decisionInput = {
      behaviorProfileId: "clingy" as const,
      care: createCareState({ affection: 92, energy: 82 }),
      playerDistance: 3.4,
      idleTimeMs: 1800,
      randomValue: 0.1
    };

    expect(shouldFollowPlayer(decisionInput)).toBe(true);
    expect(selectPetBehaviorState(decisionInput)).toBe("follow_player");
  });

  it("keeps sleep states longer than roam states", () => {
    expect(getBehaviorStateDurationMs("sleeping", "lazy")).toBeGreaterThan(
      getBehaviorStateDurationMs("roam", "lazy")
    );
    expect(getBehaviorStateDurationMs("sitting", "curious")).toBeGreaterThan(0);
  });
});
