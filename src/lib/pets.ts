import type { Vector3Tuple } from "./roomState";

export type PetType = "alexs_mobs_raccoon" | "minecraft_cat";
export type OwnedPetSource = "pet_shop";

export type PetDefinition = {
  type: PetType;
  label: string;
  price: number;
  description: string;
  presetId: string;
};

export type OwnedPet = {
  id: string;
  type: PetType;
  presetId: string;
  acquiredFrom: OwnedPetSource;
  spawnPosition: Vector3Tuple;
};

export const PET_REGISTRY: Record<PetType, PetDefinition> = {
  alexs_mobs_raccoon: {
    type: "alexs_mobs_raccoon",
    label: "Raccoon",
    price: 0,
    description: "Temporary test pet wired to the final Alex's Mobs raccoon preset.",
    presetId: "alexs_mobs_raccoon"
  },
  minecraft_cat: {
    type: "minecraft_cat",
    label: "Cat",
    price: 0,
    description: "A high-fidelity animated cat model using the Better Cats resource pack.",
    presetId: "better_cat_glb"
  }
};

export const ALL_PET_TYPES = Object.keys(PET_REGISTRY) as PetType[];

export function getPetDefinition(type: PetType): PetDefinition {
  return PET_REGISTRY[type];
}

export function cloneOwnedPet(pet: OwnedPet): OwnedPet {
  return {
    ...pet,
    spawnPosition: [...pet.spawnPosition] as Vector3Tuple
  };
}

export function cloneOwnedPets(pets: OwnedPet[]): OwnedPet[] {
  return pets.map(cloneOwnedPet);
}

export function createOwnedPet(
  type: PetType,
  spawnPosition: Vector3Tuple,
  options?: {
    id?: string;
    acquiredFrom?: OwnedPetSource;
  }
): OwnedPet {
  return {
    id: options?.id ?? `pet-${type}-${crypto.randomUUID()}`,
    type,
    presetId: PET_REGISTRY[type].presetId,
    acquiredFrom: options?.acquiredFrom ?? "pet_shop",
    spawnPosition: [...spawnPosition] as Vector3Tuple
  };
}
