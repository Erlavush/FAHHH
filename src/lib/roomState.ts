import { getFurnitureDefinition, type FurnitureType } from "./furnitureRegistry";

export type Vector3Tuple = [number, number, number];

export interface RoomFurniturePlacement {
  id: string;
  type: FurnitureType;
  position: Vector3Tuple;
  rotationY: number;
}

export interface RoomState {
  furniture: RoomFurniturePlacement[];
}

export const DEFAULT_ROOM_STATE: RoomState = {
  furniture: [
    {
      id: "chair-1",
      type: "chair",
      position: [2.5, 0, 0.5],
      rotationY: 0
    },
    {
      id: "table-1",
      type: "table",
      position: [-2.5, 0, 1.5],
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

export function createDefaultRoomState(): RoomState {
  return {
    furniture: cloneFurniturePlacements(DEFAULT_ROOM_STATE.furniture)
  };
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
  position: Vector3Tuple
): RoomFurniturePlacement {
  const definition = getFurnitureDefinition(type);

  return {
    id: `${type}-${crypto.randomUUID()}`,
    type,
    position,
    rotationY: definition.defaultRotationY
  };
}
