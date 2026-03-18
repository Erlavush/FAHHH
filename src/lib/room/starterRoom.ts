import type { CoupleRoom, FurnitureInstance } from "../types";

export const STARTER_LAYOUT_VERSION = 1;

export function createStarterRoom(coupleId: string): CoupleRoom {
  return {
    id: coupleId,
    coupleId,
    roomTheme: "starter-cozy",
    layoutVersion: STARTER_LAYOUT_VERSION,
    createdAt: new Date().toISOString()
  };
}

export function createStarterFurniture(
  coupleId: string,
  placedBy: string
): FurnitureInstance[] {
  const timestamp = new Date().toISOString();

  return [
    {
      id: "starter-bed",
      coupleId,
      type: "bed",
      variant: "oak",
      surface: "floor",
      locked: true,
      placedBy,
      updatedAt: timestamp,
      position: [-1.25, 0.45, -0.6],
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    },
    {
      id: "starter-desk",
      coupleId,
      type: "desk",
      variant: "oak",
      surface: "floor",
      locked: true,
      placedBy,
      updatedAt: timestamp,
      position: [1.55, 0.45, -0.95],
      rotation: [0, -Math.PI / 2, 0],
      scale: [1, 1, 1]
    },
    {
      id: "starter-pc",
      coupleId,
      type: "pc",
      variant: "simple",
      surface: "table",
      locked: true,
      placedBy,
      updatedAt: timestamp,
      position: [1.58, 1.02, -1.01],
      rotation: [0, -Math.PI / 2, 0],
      scale: [1, 1, 1]
    },
    {
      id: "starter-side-table",
      coupleId,
      type: "side_table",
      variant: "simple",
      surface: "floor",
      locked: true,
      placedBy,
      updatedAt: timestamp,
      position: [-1.82, 0.3, -1.42],
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    },
    {
      id: "starter-vase",
      coupleId,
      type: "vase",
      variant: "blush",
      surface: "table",
      locked: true,
      placedBy,
      updatedAt: timestamp,
      position: [-1.82, 0.78, -1.42],
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    },
    {
      id: "starter-small-frame",
      coupleId,
      type: "small_frame",
      variant: "cream",
      surface: "table",
      locked: true,
      placedBy,
      updatedAt: timestamp,
      position: [-1.67, 0.78, -1.23],
      rotation: [0, Math.PI / 5, 0],
      scale: [1, 1, 1]
    },
    {
      id: "starter-poster",
      coupleId,
      type: "poster",
      variant: "sunny",
      surface: "wall",
      locked: true,
      placedBy,
      updatedAt: timestamp,
      position: [1.5, 1.42, -1.88],
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    },
    {
      id: "starter-wall-frame",
      coupleId,
      type: "wall_frame",
      variant: "cream",
      surface: "wall",
      locked: true,
      placedBy,
      updatedAt: timestamp,
      position: [-0.15, 1.55, -1.88],
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    },
    {
      id: "starter-floor-rug",
      coupleId,
      type: "floor_rug",
      variant: "rose",
      surface: "floor",
      locked: true,
      placedBy,
      updatedAt: timestamp,
      position: [-0.65, 0.02, 0.18],
      rotation: [0, 0.12, 0],
      scale: [1, 1, 1]
    }
  ];
}
