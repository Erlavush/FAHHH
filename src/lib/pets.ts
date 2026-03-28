import type { Vector3Tuple } from "./roomState";

export type PetType = "minecraft_cat";
export type OwnedPetSource = "pet_shop";
export type OwnedPetStatus = "active_room" | "stored_roster";
export type PetBehaviorProfileId = "lazy" | "curious" | "clingy" | "zoomies";

export type PetDefinition = {
  type: PetType;
  label: string;
  price: number;
  description: string;
  presetId: string;
};

export type OwnedPetCareState = {
  hunger: number;
  affection: number;
  energy: number;
  lastUpdatedAt: string;
  lastCareActionAt: string | null;
};

export type OwnedPet = {
  id: string;
  type: PetType;
  presetId: string;
  acquiredFrom: OwnedPetSource;
  spawnPosition: Vector3Tuple;
  displayName: string;
  status: OwnedPetStatus;
  behaviorProfileId: PetBehaviorProfileId;
  care: OwnedPetCareState;
};

const DEFAULT_PET_CARE_VALUE = 75;
const DEFAULT_PET_STATUS: OwnedPetStatus = "active_room";
const DEFAULT_PET_BEHAVIOR_PROFILE: PetBehaviorProfileId = "curious";

export const PET_REGISTRY: Record<PetType, PetDefinition> = {
  minecraft_cat: {
    type: "minecraft_cat",
    label: "Cat",
    price: 0,
    description: "A high-fidelity animated cat model using the Better Cats resource pack.",
    presetId: "better_cat_glb"
  }
};

export const SANDBOX_PET_CATALOG: PetDefinition[] = [
  {
    ...PET_REGISTRY.minecraft_cat,
    label: "Classic Cat",
    description: "The original Better Cats room companion.",
    presetId: "better_cat_glb"
  },
  {
    ...PET_REGISTRY.minecraft_cat,
    label: "Fluffy Tabby Cat",
    description: "Showcase Better Cats import with a fluffy body, bent ears, and a fluffy tail.",
    presetId: "better_cat_tabby_fluffy_tail_orange_eye_grey"
  },
  {
    ...PET_REGISTRY.minecraft_cat,
    label: "Base-Ears Bobtail Cat",
    description: "Better Cats export with a base body, base ears, and a bobtail.",
    presetId: "better_cat_base_body_base_ears_bobtail"
  },
  {
    ...PET_REGISTRY.minecraft_cat,
    label: "Fluffy Base-Ears Cat",
    description: "Better Cats export with a fluffy body, base ears, and a fluffy tail.",
    presetId: "better_cat_fluffy_body_base_ears_flufftail"
  },
  {
    ...PET_REGISTRY.minecraft_cat,
    label: "Big-Ears Bobtail Cat",
    description: "Better Cats export with a fluffy body, big ears, and a bobtail.",
    presetId: "better_cat_fluffy_body_big_ears_bobtail"
  }
];

export const ALL_PET_TYPES = Object.keys(PET_REGISTRY) as PetType[];

export function getPetDefinition(type: PetType): PetDefinition {
  return PET_REGISTRY[type];
}

export function createOwnedPetCareState(
  nowIso: string,
  overrides?: Partial<OwnedPetCareState>
): OwnedPetCareState {
  return {
    hunger: overrides?.hunger ?? DEFAULT_PET_CARE_VALUE,
    affection: overrides?.affection ?? DEFAULT_PET_CARE_VALUE,
    energy: overrides?.energy ?? DEFAULT_PET_CARE_VALUE,
    lastUpdatedAt: overrides?.lastUpdatedAt ?? nowIso,
    lastCareActionAt: overrides?.lastCareActionAt ?? null
  };
}

export function cloneOwnedPet(pet: OwnedPet): OwnedPet {
  return {
    ...pet,
    spawnPosition: [...pet.spawnPosition] as Vector3Tuple,
    care: {
      ...pet.care
    }
  };
}

export function cloneOwnedPets(pets: OwnedPet[]): OwnedPet[] {
  return pets.map(cloneOwnedPet);
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function countOwnedPetsByType(pets: OwnedPet[], type: PetType): number {
  return pets.filter((pet) => pet.type === type).length;
}

export function countOwnedPetsByPresetId(pets: OwnedPet[], presetId: string): number {
  return pets.filter((pet) => pet.presetId === presetId).length;
}

export function countOwnedPetsByStatus(
  pets: OwnedPet[],
  status: OwnedPetStatus,
  type?: PetType
): number {
  return pets.filter(
    (pet) => pet.status === status && (type === undefined || pet.type === type)
  ).length;
}

export function getNextPetDisplayName(type: PetType, pets: OwnedPet[]): string {
  const baseLabel = PET_REGISTRY[type].label;
  const numberedLabelPattern = new RegExp(`^${escapeRegExp(baseLabel)}\\s+(\\d+)$`);
  const highestAssignedIndex = pets.reduce((highestIndex, pet) => {
    if (pet.type !== type) {
      return highestIndex;
    }

    if (pet.displayName === baseLabel) {
      return Math.max(highestIndex, 1);
    }

    const labelMatch = pet.displayName.match(numberedLabelPattern);

    if (!labelMatch) {
      return highestIndex;
    }

    return Math.max(highestIndex, Number.parseInt(labelMatch[1] ?? "0", 10));
  }, 0);

  return `${baseLabel} ${highestAssignedIndex + 1}`;
}

export function createOwnedPet(
  type: PetType,
  spawnPosition: Vector3Tuple,
  options?: {
    id?: string;
    acquiredFrom?: OwnedPetSource;
    presetId?: string;
    displayName?: string;
    status?: OwnedPetStatus;
    behaviorProfileId?: PetBehaviorProfileId;
    nowIso?: string;
  }
): OwnedPet {
  const nowIso = options?.nowIso ?? new Date().toISOString();

  return {
    id: options?.id ?? `pet-${type}-${crypto.randomUUID()}`,
    type,
    presetId: options?.presetId ?? PET_REGISTRY[type].presetId,
    acquiredFrom: options?.acquiredFrom ?? "pet_shop",
    spawnPosition: [...spawnPosition] as Vector3Tuple,
    displayName: options?.displayName ?? PET_REGISTRY[type].label,
    status: options?.status ?? DEFAULT_PET_STATUS,
    behaviorProfileId: options?.behaviorProfileId ?? DEFAULT_PET_BEHAVIOR_PROFILE,
    care: createOwnedPetCareState(nowIso)
  };
}
