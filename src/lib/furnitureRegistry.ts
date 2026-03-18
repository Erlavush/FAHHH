export type FurnitureType = "chair" | "table" | "poster";
export type FurnitureSurface = "floor" | "wall_back";

export interface FurnitureDefinition {
  type: FurnitureType;
  label: string;
  modelKey: "chair" | "small_table" | "poster";
  surface: FurnitureSurface;
  footprintWidth: number;
  footprintDepth: number;
  defaultRotationY: number;
}

export const FURNITURE_REGISTRY: Record<FurnitureType, FurnitureDefinition> = {
  chair: {
    type: "chair",
    label: "Chair",
    modelKey: "chair",
    surface: "floor",
    footprintWidth: 0.86,
    footprintDepth: 1.06,
    defaultRotationY: 0
  },
  table: {
    type: "table",
    label: "Small Table",
    modelKey: "small_table",
    surface: "floor",
    footprintWidth: 0.98,
    footprintDepth: 0.92,
    defaultRotationY: Math.PI / 2
  },
  poster: {
    type: "poster",
    label: "Poster",
    modelKey: "poster",
    surface: "wall_back",
    footprintWidth: 1.8,
    footprintDepth: 1.4,
    defaultRotationY: 0
  }
};

export function getFurnitureDefinition(type: FurnitureType): FurnitureDefinition {
  return FURNITURE_REGISTRY[type];
}
