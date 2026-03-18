import type { FurnitureInstance, FurnitureType } from "./types";
import { getNextDecorPosition } from "./room/placement";

export interface FurnitureCatalogEntry {
  type: FurnitureType;
  label: string;
  color: string;
  defaultScale: [number, number, number];
  surface: "floor" | "wall" | "table";
}

export const DECOR_CATALOG: FurnitureCatalogEntry[] = [
  {
    type: "plant",
    label: "Plant",
    color: "#7ca269",
    defaultScale: [1, 1, 1],
    surface: "floor"
  },
  {
    type: "lamp",
    label: "Lamp",
    color: "#f0ce72",
    defaultScale: [1, 1, 1],
    surface: "floor"
  },
  {
    type: "stool",
    label: "Stool",
    color: "#d68d66",
    defaultScale: [1, 1, 1],
    surface: "floor"
  },
  {
    type: "book_stack",
    label: "Books",
    color: "#d2ab71",
    defaultScale: [1, 1, 1],
    surface: "table"
  },
  {
    type: "cushion",
    label: "Cushion",
    color: "#d88686",
    defaultScale: [1, 1, 1],
    surface: "floor"
  },
  {
    type: "wall_frame",
    label: "Wall Frame",
    color: "#f5efe6",
    defaultScale: [1, 1, 1],
    surface: "wall"
  },
  {
    type: "poster",
    label: "Poster",
    color: "#f3dd8d",
    defaultScale: [1, 1, 1],
    surface: "wall"
  }
];

export function buildDecorFurniture(
  type: FurnitureType,
  coupleId: string,
  userId: string,
  existingCount: number
): FurnitureInstance {
  const catalogItem = DECOR_CATALOG.find((item) => item.type === type);

  if (!catalogItem) {
    throw new Error(`Unknown decor item: ${type}`);
  }

  const position = getNextDecorPosition(existingCount, catalogItem.surface);

  return {
    id: `${type}-${crypto.randomUUID()}`,
    coupleId,
    type,
    variant: "default",
    surface: catalogItem.surface,
    locked: false,
    placedBy: userId,
    updatedAt: new Date().toISOString(),
    position,
    rotation: [0, 0, 0],
    scale: catalogItem.defaultScale
  };
}
