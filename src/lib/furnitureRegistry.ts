export type FurnitureType = "chair" | "table";

export interface FurnitureDefinition {
  type: FurnitureType;
  label: string;
  modelKey: "chair" | "small_table";
  footprintWidth: number;
  footprintDepth: number;
  defaultRotationY: number;
}

export const FURNITURE_REGISTRY: Record<FurnitureType, FurnitureDefinition> = {
  chair: {
    type: "chair",
    label: "Chair",
    modelKey: "chair",
    footprintWidth: 0.86,
    footprintDepth: 1.06,
    defaultRotationY: 0
  },
  table: {
    type: "table",
    label: "Small Table",
    modelKey: "small_table",
    footprintWidth: 0.98,
    footprintDepth: 0.92,
    defaultRotationY: Math.PI / 2
  }
};

export function getFurnitureDefinition(type: FurnitureType): FurnitureDefinition {
  return FURNITURE_REGISTRY[type];
}
