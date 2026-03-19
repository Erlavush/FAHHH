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

export const DEFAULT_ROOM_STATE: RoomState = {
  metadata: {
    roomId: "local-sandbox-room",
    roomTheme: "starter-cozy",
    layoutVersion: 2,
    unlockedFurniture: [...ALL_FURNITURE_TYPES]
  },
  furniture: [
    {
      id: "starter-rug",
      type: "rug",
      surface: "floor",
      position: [0, 0, 1.5],
      rotationY: 0
    },
    {
      id: "starter-bed",
      type: "bed",
      surface: "floor",
      position: [4.9, 0, -4.7],
      rotationY: 0
    },
    {
      id: "starter-desk",
      type: "desk",
      surface: "floor",
      position: [-5.4, 0, -5.6],
      rotationY: 0
    },
    {
      id: "starter-chair",
      type: "chair",
      surface: "floor",
      position: [-5.4, 0, -3.8],
      rotationY: Math.PI
    },
    {
      id: "starter-table",
      type: "table",
      surface: "floor",
      position: [3.2, 0, 2.5],
      rotationY: Math.PI / 2
    },
    {
      id: "starter-poster",
      type: "poster",
      surface: "wall_back",
      position: [2.2, 1.9, -7.83],
      rotationY: 0
    },
    {
      id: "starter-wall-frame",
      type: "wall_frame",
      surface: "wall_left",
      position: [-7.83, 1.75, 1.8],
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
