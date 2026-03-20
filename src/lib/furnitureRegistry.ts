export type FurnitureType =
  | "bed"
  | "desk"
  | "chair"
  | "table"
  | "fridge"
  | "wardrobe"
  | "office_desk"
  | "office_chair"
  | "window"
  | "vase"
  | "books"
  | "poster"
  | "wall_frame"
  | "rug"
  | "floor_lamp";

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

export interface FurnitureWallOpening {
  width: number;
  height: number;
  centerY: number;
  fixedVertical: boolean;
}

export interface FurnitureSunlightPatch {
  width: number;
  depth: number;
  offsetFromWall: number;
}

export interface FurnitureDefinition {
  type: FurnitureType;
  label: string;
  price: number;
  shopPreviewSrc: string;
  shopPreviewScale?: number;
  shortDescription: string;
  modelKey:
    | "bed"
    | "desk"
    | "chair"
    | "small_table"
    | "fridge"
    | "wardrobe"
    | "office_desk"
    | "office_chair"
    | "window"
    | "vase"
    | "books"
    | "poster"
    | "wall_frame"
    | "rug"
    | "floor_lamp";
  surface: FurnitureSurfaceFamily;
  footprintWidth: number;
  footprintDepth: number;
  defaultRotationY: number;
  category: FurnitureCatalogCategory;
  unlockKey: string;
  starterUnlocked: boolean;
  interactionType?: FurnitureInteractionType;
  interactionOffset?: [number, number, number];
  interactionSecondaryOffset?: [number, number, number];
  interactionRotationOffsetY?: number;
  interactionPoseOffset?: [number, number, number];
  interactionSecondaryPoseOffset?: [number, number, number];
  supportSurface?: FurnitureSupportSurface;
  wallOpening?: FurnitureWallOpening;
  sunlightPatch?: FurnitureSunlightPatch;
}

export const FURNITURE_REGISTRY: Record<FurnitureType, FurnitureDefinition> = {
  bed: {
    type: "bed",
    label: "Bed",
    price: 60,
    shopPreviewSrc: "/shop-previews/bed.svg",
    shortDescription: "A double bed for winding down, sleeping in, and sharing the room together.",
    modelKey: "bed",
    surface: "floor",
    footprintWidth: 3,
    footprintDepth: 4,
    defaultRotationY: 0,
    category: "Floor Furniture",
    unlockKey: "starter-bed",
    starterUnlocked: true,
    interactionType: "lie",
    interactionOffset: [-0.62, 0, 0.2],
    interactionSecondaryOffset: [0, 0, 0.5],
    interactionRotationOffsetY: Math.PI,
    interactionPoseOffset: [0, 0.84, 1],
    interactionSecondaryPoseOffset: [0, 0.84, 1]
  },
  desk: {
    type: "desk",
    label: "Desk + PC",
    price: 55,
    shopPreviewSrc: "/shop-previews/desk.svg",
    shortDescription: "A simple study desk with a PC setup for cozy browsing and future minigames.",
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
    price: 18,
    shopPreviewSrc: "/shop-previews/chair.svg",
    shortDescription: "A compact wooden chair that fits neatly beside desks and tables.",
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
    price: 20,
    shopPreviewSrc: "/shop-previews/table.svg",
    shortDescription: "A little accent table that gives your room one more surface for decor.",
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
    price: 45,
    shopPreviewSrc: "/shop-previews/fridge.png",
    shopPreviewScale: 1.18,
    shortDescription: "A chunky fridge that makes the room feel lived-in and ready for late-night snacks.",
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
  wardrobe: {
    type: "wardrobe",
    label: "Wardrobe Closet",
    price: 58,
    shopPreviewSrc: "/shop-previews/wardrobe.svg",
    shortDescription: "A tall wooden wardrobe that makes the room feel fuller, cozier, and more lived-in.",
    modelKey: "wardrobe",
    surface: "floor",
    footprintWidth: 1.5,
    footprintDepth: 0.9,
    defaultRotationY: 0,
    category: "Floor Furniture",
    unlockKey: "starter-wardrobe",
    starterUnlocked: true
  },
  office_desk: {
    type: "office_desk",
    label: "Office Desk + PC",
    price: 72,
    shopPreviewSrc: "/shop-previews/office-desk.png",
    shopPreviewScale: 1.16,
    shortDescription: "A wider work desk with a full PC setup for a more dedicated gaming corner.",
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
    price: 24,
    shopPreviewSrc: "/shop-previews/office-chair.png",
    shopPreviewScale: 1.12,
    shortDescription: "A rolling chair for the desk setup when you want the room to feel more complete.",
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
  window: {
    type: "window",
    label: "Tall Window",
    price: 28,
    shopPreviewSrc: "/shop-previews/window.svg",
    shortDescription: "A tall framed window that opens the wall for warm afternoon light and a softer room mood.",
    modelKey: "window",
    surface: "wall",
    footprintWidth: 1.82,
    footprintDepth: 2.02,
    defaultRotationY: 0,
    category: "Wall Decor",
    unlockKey: "starter-tall-window",
    starterUnlocked: true,
    wallOpening: {
      width: 1.38,
      height: 1.72,
      centerY: 1.82,
      fixedVertical: true
    },
    sunlightPatch: {
      width: 1.9,
      depth: 2.8,
      offsetFromWall: 0.34
    }
  },
  vase: {
    type: "vase",
    label: "Flower Vase",
    price: 10,
    shopPreviewSrc: "/shop-previews/vase.svg",
    shortDescription: "A small flower vase that adds a soft, lovely touch to desks and side tables.",
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
    price: 12,
    shopPreviewSrc: "/shop-previews/books.svg",
    shortDescription: "A tidy stack of books that makes shelves, desks, and corners feel warmer.",
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
    price: 14,
    shopPreviewSrc: "/shop-previews/poster.svg",
    shortDescription: "A simple wall poster to break up empty space and make the room more personal.",
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
    price: 18,
    shopPreviewSrc: "/shop-previews/wall-frame.svg",
    shortDescription: "A framed wall piece ready for memories, couple photos, and custom art later on.",
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
    price: 32,
    shopPreviewSrc: "/shop-previews/rug.svg",
    shortDescription: "A cozy floor rug that helps the room feel softer, warmer, and more finished.",
    modelKey: "rug",
    surface: "floor",
    footprintWidth: 4,
    footprintDepth: 3,
    defaultRotationY: 0,
    category: "Accents",
    unlockKey: "starter-floor-rug",
    starterUnlocked: true
  },
  floor_lamp: {
    type: "floor_lamp",
    label: "Floor Lamp",
    price: 45,
    shopPreviewSrc: "/shop-previews/floor-lamp.svg",
    shortDescription: "A tall warm lamp that lights up the room during those cozy dark nights.",
    modelKey: "floor_lamp",
    surface: "floor",
    footprintWidth: 1,
    footprintDepth: 1,
    defaultRotationY: 0,
    category: "Accents",
    unlockKey: "starter-floor-lamp",
    starterUnlocked: true
  }
};

export const ALL_FURNITURE_TYPES = Object.keys(FURNITURE_REGISTRY) as FurnitureType[];

export function getFurnitureDefinition(type: FurnitureType): FurnitureDefinition {
  return FURNITURE_REGISTRY[type];
}

export function getFurnitureBuyPrice(type: FurnitureType): number {
  return getFurnitureDefinition(type).price;
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
