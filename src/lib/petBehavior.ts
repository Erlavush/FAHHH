import type { OwnedPetCareState, PetBehaviorProfileId } from "./pets";

export type PetBehaviorState = "roam" | "follow_player" | "sitting" | "licking" | "sleeping";
export type CatPausePhase = "idle" | "sitting";

interface PetBehaviorDecisionInput {
  behaviorProfileId: PetBehaviorProfileId;
  care: OwnedPetCareState;
  playerDistance: number;
  idleTimeMs: number;
  randomValue?: number;
}

const CAT_IDLE_MIN_DURATION_MS = 3000;
const CAT_IDLE_MAX_DURATION_MS = 6000;
const CAT_SIT_DURATION_MS = 10000;
const CAT_SIT_CHANCE = 0.1;

export function selectCatPausePhase(randomValue = 0.5): CatPausePhase {
  return randomValue < CAT_SIT_CHANCE ? "sitting" : "idle";
}

export function getCatPauseDurationMs(
  pausePhase: CatPausePhase,
  randomValue = 0.5
): number {
  if (pausePhase === "sitting") {
    return CAT_SIT_DURATION_MS;
  }

  return CAT_IDLE_MIN_DURATION_MS + randomValue * (CAT_IDLE_MAX_DURATION_MS - CAT_IDLE_MIN_DURATION_MS);
}

export function getBehaviorStateDurationMs(
  behaviorState: PetBehaviorState,
  behaviorProfileId: PetBehaviorProfileId = "curious"
): number {
  switch (behaviorState) {
    case "follow_player":
      return behaviorProfileId === "clingy" ? 2200 : 1600;
    case "sitting":
      return behaviorProfileId === "lazy" ? 3800 : 2600;
    case "licking":
      return 1900;
    case "sleeping":
      return behaviorProfileId === "lazy" ? 7200 : 5600;
    case "roam":
    default:
      return behaviorProfileId === "zoomies" ? 1400 : 2200;
  }
}

export function shouldFollowPlayer({
  behaviorProfileId,
  care,
  playerDistance,
  idleTimeMs
}: PetBehaviorDecisionInput): boolean {
  if (idleTimeMs < 700 || care.energy < 30) {
    return false;
  }

  const minimumDistance =
    behaviorProfileId === "clingy"
      ? 1.5
      : behaviorProfileId === "curious"
        ? 2.2
        : 2.8;
  const affectionThreshold =
    behaviorProfileId === "clingy"
      ? 45
      : behaviorProfileId === "curious"
        ? 65
        : 80;

  return playerDistance >= minimumDistance && care.affection >= affectionThreshold;
}

export function selectPetBehaviorState({
  behaviorProfileId,
  care,
  playerDistance,
  idleTimeMs,
  randomValue = 0.5
}: PetBehaviorDecisionInput): PetBehaviorState {
  if (care.energy <= 18) {
    return "sleeping";
  }

  if (shouldFollowPlayer({ behaviorProfileId, care, playerDistance, idleTimeMs, randomValue })) {
    return "follow_player";
  }

  if (idleTimeMs < 1200) {
    return behaviorProfileId === "zoomies" && care.energy >= 70 ? "follow_player" : "roam";
  }

  if (care.energy <= 35) {
    return randomValue < 0.8 ? "sleeping" : "sitting";
  }

  if (behaviorProfileId === "lazy") {
    return randomValue < 0.55 ? "sleeping" : "sitting";
  }

  if (behaviorProfileId === "zoomies" && care.energy >= 65 && idleTimeMs < 2800) {
    return "roam";
  }

  if (care.affection <= 35) {
    return randomValue < 0.55 ? "licking" : "sitting";
  }

  if (behaviorProfileId === "curious") {
    return randomValue < 0.45 ? "licking" : "sitting";
  }

  return randomValue < 0.35 ? "licking" : "sitting";
}
