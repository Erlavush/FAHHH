export type FurnitureType =
  | "bed"
  | "desk"
  | "chair"
  | "table"
  | "fridge"
  | "office_desk"
  | "office_chair"
  | "vase"
  | "books"
  | "poster"
  | "wall_frame"
  | "rug";

export type FurnitureSurfaceFamily = "floor" | "wall" | "surface";
export type FurniturePlacementSurface = "floor" | "wall_back" | "wall_left" | "surface";
export type FurnitureCatalogCategory =
  | "Floor Furniture"
  | "Wall Decor"
  | "Surface Decor"
  | "Accents";
export type FurnitureInteractionType = "sit" | "lie" | "use_pc";

export interface FurnitureSupportSurface {
  width: number;
  depth: number;
  height: number;
  offsetX?: number;
  offsetZ?: number;
}

export interface FurnitureDefinition {
  type: FurnitureType;
  label: string;
  modelKey:
    | "bed"
    | "desk"
    | "chair"
    | "small_table"
    | "fridge"
    | "office_desk"
    | "office_chair"
    | "vase"
    | "books"
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
  interactionType?: FurnitureInteractionType;
  interactionOffset?: [number, number, number];
  supportSurface?: FurnitureSupportSurface;
}

export const FURNITURE_REGISTRY: Record<FurnitureType, FurnitureDefinition> = {
  bed: {
    type: "bed",
    label: "Bed",
    modelKey: "bed",
    surface: "floor",
    footprintWidth: 3,
    footprintDepth: 4,
    defaultRotationY: 0,
    category: "Floor Furniture",
    unlockKey: "starter-bed",
    starterUnlocked: true,
    interactionType: "lie",
    interactionOffset: [0, 0, 0.2]
  },
  desk: {
    type: "desk",
    label: "Desk + PC",
    modelKey: "desk",
    surface: "floor",
    footprintWidth: 3,
    footprintDepth: 1,
    defaultRotationY: 0,
    category: "Floor Furniture",
    unlockKey: "starter-desk",
    starterUnlocked: true,
    interactionType: "use_pc",
    interactionOffset: [0, 0, 1],
    supportSurface: {
      width: 3,
      depth: 1,
      height: 0.94
    }
  },
  chair: {
    type: "chair",
    label: "Chair",
    modelKey: "chair",
    surface: "floor",
    footprintWidth: 1,
    footprintDepth: 1,
    defaultRotationY: 0,
    category: "Floor Furniture",
    unlockKey: "starter-chair",
    starterUnlocked: true,
    interactionType: "sit",
    interactionOffset: [0, 0, 0.06]
  },
  table: {
    type: "table",
    label: "Small Table Set",
    modelKey: "small_table",
    surface: "floor",
    footprintWidth: 1,
    footprintDepth: 1,
    defaultRotationY: Math.PI / 2,
    category: "Accents",
    unlockKey: "starter-small-table",
    starterUnlocked: true,
    supportSurface: {
      width: 1,
      depth: 1,
      height: 0.81
    }
  },
  fridge: {
    type: "fridge",
    label: "Refrigerator",
    modelKey: "fridge",
    surface: "floor",
    footprintWidth: 1,
    footprintDepth: 1,
    defaultRotationY: 0,
    category: "Floor Furniture",
    unlockKey: "starter-fridge",
    starterUnlocked: true,
    supportSurface: {
      width: 1,
      depth: 1,
      height: 2.1
    }
  },
  office_desk: {
    type: "office_desk",
    label: "Office Desk + PC",
    modelKey: "office_desk",
    surface: "floor",
    footprintWidth: 3,
    footprintDepth: 1,
    defaultRotationY: 0,
    category: "Floor Furniture",
    unlockKey: "starter-office-desk",
    starterUnlocked: true,
    interactionType: "use_pc",
    interactionOffset: [0, 0, -1],
    supportSurface: {
      width: 3,
      depth: 1,
      height: 0.84
    }
  },
  office_chair: {
    type: "office_chair",
    label: "Office Chair",
    modelKey: "office_chair",
    surface: "floor",
    footprintWidth: 1,
    footprintDepth: 1,
    defaultRotationY: 0,
    category: "Floor Furniture",
    unlockKey: "starter-office-chair",
    starterUnlocked: true,
    interactionType: "sit",
    interactionOffset: [0, 0.0625, -0.085]
  },
  vase: {
    type: "vase",
    label: "Flower Vase",
    modelKey: "vase",
    surface: "surface",
    footprintWidth: 0.5,
    footprintDepth: 0.5,
    defaultRotationY: 0,
    category: "Surface Decor",
    unlockKey: "starter-flower-vase",
    starterUnlocked: true
  },
  books: {
    type: "books",
    label: "Book Stack",
    modelKey: "books",
    surface: "surface",
    footprintWidth: 0.75,
    footprintDepth: 0.5,
    defaultRotationY: 0,
    category: "Surface Decor",
    unlockKey: "starter-book-stack",
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
    footprintWidth: 4,
    footprintDepth: 3,
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
  const surfaceFamily = getFurnitureDefinition(type).surface;

  if (surfaceFamily === "wall") {
    return "wall_back";
  }

  if (surfaceFamily === "surface") {
    return "surface";
  }

  return "floor";
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
