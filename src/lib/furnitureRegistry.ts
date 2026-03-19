export type FurnitureType =
  | "bed"
  | "desk"
  | "chair"
  | "table"
  | "poster"
  | "wall_frame"
  | "rug";

export type FurnitureSurfaceFamily = "floor" | "wall";
export type FurniturePlacementSurface = "floor" | "wall_back" | "wall_left";
export type FurnitureCatalogCategory = "Floor Furniture" | "Wall Decor" | "Accents";

export interface FurnitureDefinition {
  type: FurnitureType;
  label: string;
  modelKey:
    | "bed"
    | "desk"
    | "chair"
    | "small_table"
    | "poster"
    | "wall_frame"
    | "rug";
  surface: FurnitureSurfaceFamily;
  footprintWidth: number;
  footprintDepth: number;
  defaultRotationY: number;
  category: FurnitureCatalogCategory;
  unlockKey: string;
  starterUnlocked: boolean;
}

export const FURNITURE_REGISTRY: Record<FurnitureType, FurnitureDefinition> = {
  bed: {
    type: "bed",
    label: "Bed",
    modelKey: "bed",
    surface: "floor",
    footprintWidth: 2.7,
    footprintDepth: 4.1,
    defaultRotationY: 0,
    category: "Floor Furniture",
    unlockKey: "starter-bed",
    starterUnlocked: true
  },
  desk: {
    type: "desk",
    label: "Desk + PC",
    modelKey: "desk",
    surface: "floor",
    footprintWidth: 2.5,
    footprintDepth: 1.2,
    defaultRotationY: 0,
    category: "Floor Furniture",
    unlockKey: "starter-desk",
    starterUnlocked: true
  },
  chair: {
    type: "chair",
    label: "Chair",
    modelKey: "chair",
    surface: "floor",
    footprintWidth: 0.86,
    footprintDepth: 1.06,
    defaultRotationY: 0,
    category: "Floor Furniture",
    unlockKey: "starter-chair",
    starterUnlocked: true
  },
  table: {
    type: "table",
    label: "Small Table Set",
    modelKey: "small_table",
    surface: "floor",
    footprintWidth: 1.12,
    footprintDepth: 1.02,
    defaultRotationY: Math.PI / 2,
    category: "Accents",
    unlockKey: "starter-small-table",
    starterUnlocked: true
  },
  poster: {
    type: "poster",
    label: "Poster",
    modelKey: "poster",
    surface: "wall",
    footprintWidth: 1.8,
    footprintDepth: 1.4,
    defaultRotationY: 0,
    category: "Wall Decor",
    unlockKey: "starter-poster",
    starterUnlocked: true
  },
  wall_frame: {
    type: "wall_frame",
    label: "Wall Frame",
    modelKey: "wall_frame",
    surface: "wall",
    footprintWidth: 1.42,
    footprintDepth: 1.06,
    defaultRotationY: 0,
    category: "Wall Decor",
    unlockKey: "starter-wall-frame",
    starterUnlocked: true
  },
  rug: {
    type: "rug",
    label: "Floor Rug",
    modelKey: "rug",
    surface: "floor",
    footprintWidth: 3.8,
    footprintDepth: 2.6,
    defaultRotationY: 0,
    category: "Accents",
    unlockKey: "starter-floor-rug",
    starterUnlocked: true
  }
};

export const ALL_FURNITURE_TYPES = Object.keys(FURNITURE_REGISTRY) as FurnitureType[];

export function getFurnitureDefinition(type: FurnitureType): FurnitureDefinition {
  return FURNITURE_REGISTRY[type];
}

export function getDefaultPlacementSurface(
  type: FurnitureType
): FurniturePlacementSurface {
  return getFurnitureDefinition(type).surface === "wall" ? "wall_back" : "floor";
}

export function getSurfaceRotationY(
  type: FurnitureType,
  surface: FurniturePlacementSurface
): number {
  if (surface === "wall_left") {
    return Math.PI / 2;
  }

  return getFurnitureDefinition(type).defaultRotationY;
}
