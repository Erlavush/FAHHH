import {
  ALL_FURNITURE_TYPES,
  getDefaultPlacementSurface,
  getSurfaceRotationY,
  type FurniturePlacementSurface,
  type FurnitureType
} from "./furnitureRegistry";

export type Vector3Tuple = [number, number, number];

export interface RoomFurniturePlacement {
  id: string;
  type: FurnitureType;
  surface: FurniturePlacementSurface;
  position: Vector3Tuple;
  rotationY: number;
}

export interface RoomMetadata {
  roomId: string;
  roomTheme: string;
  layoutVersion: number;
  unlockedFurniture: FurnitureType[];
}

export interface RoomState {
  metadata: RoomMetadata;
  furniture: RoomFurniturePlacement[];
}

export const DEFAULT_ROOM_LAYOUT_VERSION = 3;

export const DEFAULT_ROOM_STATE: RoomState = {
  metadata: {
    roomId: "local-sandbox-room",
    roomTheme: "starter-cozy",
    layoutVersion: DEFAULT_ROOM_LAYOUT_VERSION,
    unlockedFurniture: [...ALL_FURNITURE_TYPES]
  },
  furniture: [
    {
      id: "starter-rug",
      type: "rug",
      surface: "floor",
      position: [0.1, 0, 1.25],
      rotationY: 0
    },
    {
      id: "starter-bed",
      type: "bed",
      surface: "floor",
      position: [3.05, 0, -2.75],
      rotationY: 0
    },
    {
      id: "starter-desk",
      type: "desk",
      surface: "floor",
      position: [-3.2, 0, -4.15],
      rotationY: 0
    },
    {
      id: "starter-chair",
      type: "chair",
      surface: "floor",
      position: [-3.2, 0, -2.85],
      rotationY: Math.PI
    },
    {
      id: "starter-table",
      type: "table",
      surface: "floor",
      position: [2.65, 0, 2.2],
      rotationY: Math.PI / 2
    },
    {
      id: "starter-poster",
      type: "poster",
      surface: "wall_back",
      position: [2.95, 1.95, -4.83],
      rotationY: 0
    },
    {
      id: "starter-wall-frame",
      type: "wall_frame",
      surface: "wall_left",
      position: [-4.83, 1.75, 1.55],
      rotationY: Math.PI / 2
    }
  ]
};

export function cloneFurniturePlacement(
  placement: RoomFurniturePlacement
): RoomFurniturePlacement {
  return {
    ...placement,
    position: [...placement.position] as Vector3Tuple
  };
}

export function cloneFurniturePlacements(
  placements: RoomFurniturePlacement[]
): RoomFurniturePlacement[] {
  return placements.map(cloneFurniturePlacement);
}

export function cloneRoomState(roomState: RoomState): RoomState {
  return {
    metadata: {
      ...roomState.metadata,
      unlockedFurniture: [...roomState.metadata.unlockedFurniture]
    },
    furniture: cloneFurniturePlacements(roomState.furniture)
  };
}

export function createDefaultRoomState(): RoomState {
  return cloneRoomState(DEFAULT_ROOM_STATE);
}

export function findFurniturePlacement(
  placements: RoomFurniturePlacement[],
  furnitureId: string | null
): RoomFurniturePlacement | null {
  if (!furnitureId) {
    return null;
  }

  return placements.find((item) => item.id === furnitureId) ?? null;
}

export function updateFurniturePlacement(
  placements: RoomFurniturePlacement[],
  furnitureId: string,
  updater: (item: RoomFurniturePlacement) => RoomFurniturePlacement
): RoomFurniturePlacement[] {
  return placements.map((item) => (item.id === furnitureId ? updater(item) : item));
}

export function removeFurniturePlacement(
  placements: RoomFurniturePlacement[],
  furnitureId: string
): RoomFurniturePlacement[] {
  return placements.filter((item) => item.id !== furnitureId);
}

export function createFurniturePlacement(
  type: FurnitureType,
  position: Vector3Tuple,
  surface = getDefaultPlacementSurface(type)
): RoomFurniturePlacement {
  return {
    id: `${type}-${crypto.randomUUID()}`,
    type,
    surface,
    position,
    rotationY: getSurfaceRotationY(type, surface)
  };
}
