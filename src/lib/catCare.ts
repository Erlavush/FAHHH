import {
  cloneOwnedPet,
  countOwnedPetsByStatus,
  type OwnedPet,
  type OwnedPetCareState
} from "./pets";

export type CatCareActionId = "feed" | "pet" | "play";

export type CatCareActionResult = {
  actionId: CatCareActionId;
  pet: OwnedPet;
  rewardCoins: number;
};

export type CatCareSummary = {
  totalCatCount: number;
  activeCatCount: number;
  storedCatCount: number;
  catsNeedingCare: OwnedPet[];
  catsNeedingCareCount: number;
};

type CatCareActionConfig = {
  hungerDelta: number;
  affectionDelta: number;
  energyDelta: number;
  rewardCoins: number;
};

const CARE_DECAY_PER_MINUTE = {
  hunger: 2,
  affection: 1,
  energy: 1
} as const;

const CARE_ATTENTION_THRESHOLD = 55;
const MAX_DECAY_MINUTES_PER_TICK = 20;

const CAT_CARE_ACTIONS: Record<CatCareActionId, CatCareActionConfig> = {
  feed: {
    hungerDelta: 35,
    affectionDelta: 0,
    energyDelta: 0,
    rewardCoins: 2
  },
  pet: {
    hungerDelta: 0,
    affectionDelta: 25,
    energyDelta: 0,
    rewardCoins: 1
  },
  play: {
    hungerDelta: 0,
    affectionDelta: 10,
    energyDelta: 20,
    rewardCoins: 3
  }
};

function clampCareValue(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getElapsedDecayMinutes(lastUpdatedAt: string, nowIso: string): number {
  const lastUpdatedAtMs = Date.parse(lastUpdatedAt);
  const nowMs = Date.parse(nowIso);

  if (!Number.isFinite(lastUpdatedAtMs) || !Number.isFinite(nowMs) || nowMs <= lastUpdatedAtMs) {
    return 0;
  }

  return Math.min(
    MAX_DECAY_MINUTES_PER_TICK,
    Math.floor((nowMs - lastUpdatedAtMs) / 60000)
  );
}

function updateCareState(
  care: OwnedPetCareState,
  updates: {
    hunger?: number;
    affection?: number;
    energy?: number;
    lastUpdatedAt: string;
    lastCareActionAt?: string | null;
  }
): OwnedPetCareState {
  return {
    hunger: clampCareValue(updates.hunger ?? care.hunger),
    affection: clampCareValue(updates.affection ?? care.affection),
    energy: clampCareValue(updates.energy ?? care.energy),
    lastUpdatedAt: updates.lastUpdatedAt,
    lastCareActionAt:
      updates.lastCareActionAt === undefined ? care.lastCareActionAt : updates.lastCareActionAt
  };
}

function needsCareValue(value: number): boolean {
  return value < 55;
}

function petNeedsCare(pet: OwnedPet): boolean {
  return [pet.care.hunger, pet.care.affection, pet.care.energy].some(needsCareValue);
}

export function tickOwnedPetCareState(pet: OwnedPet, nowIso: string): OwnedPet {
  const elapsedDecayMinutes = getElapsedDecayMinutes(pet.care.lastUpdatedAt, nowIso);

  if (elapsedDecayMinutes <= 0) {
    return pet;
  }

  const nextPet = cloneOwnedPet(pet);
  nextPet.care = updateCareState(pet.care, {
    hunger: pet.care.hunger - elapsedDecayMinutes * CARE_DECAY_PER_MINUTE.hunger,
    affection: pet.care.affection - elapsedDecayMinutes * CARE_DECAY_PER_MINUTE.affection,
    energy: pet.care.energy - elapsedDecayMinutes * CARE_DECAY_PER_MINUTE.energy,
    lastUpdatedAt: nowIso
  });
  return nextPet;
}

export function selectCatsNeedingCare(pets: OwnedPet[]): OwnedPet[] {
  return pets.filter(petNeedsCare);
}

export function applyCatCareAction(
  pet: OwnedPet,
  actionId: CatCareActionId,
  nowIso: string
): CatCareActionResult {
  const currentPet = tickOwnedPetCareState(pet, nowIso);
  const action = CAT_CARE_ACTIONS[actionId];
  const nextPet = cloneOwnedPet(currentPet);
  nextPet.care = updateCareState(currentPet.care, {
    hunger: currentPet.care.hunger + action.hungerDelta,
    affection: currentPet.care.affection + action.affectionDelta,
    energy: currentPet.care.energy + action.energyDelta,
    lastUpdatedAt: nowIso,
    lastCareActionAt: nowIso
  });

  return {
    actionId,
    pet: nextPet,
    rewardCoins: action.rewardCoins
  };
}

export function buildCatCareSummary(pets: OwnedPet[]): CatCareSummary {
  const catsNeedingCare = selectCatsNeedingCare(pets);

  return {
    totalCatCount: pets.length,
    activeCatCount: countOwnedPetsByStatus(pets, "active_room"),
    storedCatCount: countOwnedPetsByStatus(pets, "stored_roster"),
    catsNeedingCare,
    catsNeedingCareCount: catsNeedingCare.length
  };
}