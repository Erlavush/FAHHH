import {
  ALL_FURNITURE_TYPES,
  getDefaultPlacementSurface,
  getSurfaceRotationY,
  type FurniturePlacementSurface,
  type FurnitureType
} from "./furnitureRegistry";

export type Vector3Tuple = [number, number, number];
export type Vector2Tuple = [number, number];
export type OwnedFurnitureSource = "starter" | "sandbox_catalog";

export const LOCAL_SANDBOX_OWNER_ID = "local-player";

export interface OwnedFurnitureItem {
  id: string;
  type: FurnitureType;
  ownerId: string;
  acquiredFrom: OwnedFurnitureSource;
}

export interface RoomFurniturePlacement {
  id: string;
  type: FurnitureType;
  surface: FurniturePlacementSurface;
  position: Vector3Tuple;
  rotationY: number;
  ownedFurnitureId: string;
  anchorFurnitureId?: string;
  surfaceLocalOffset?: Vector2Tuple;
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
  ownedFurniture: OwnedFurnitureItem[];
}

export const DEFAULT_ROOM_LAYOUT_VERSION = 3;

function createStarterOwnedFurnitureId(placementId: string): string {
  return `owned-${placementId}`;
}

function inferOwnedFurnitureSourceFromPlacementId(placementId: string): OwnedFurnitureSource {
  return placementId.startsWith("starter-") ? "starter" : "sandbox_catalog";
}

const STARTER_FURNITURE: RoomFurniturePlacement[] = [
  {
    id: "starter-rug",
    type: "rug",
    surface: "floor",
    position: [0.1, 0, 1.25],
    rotationY: 0,
    ownedFurnitureId: createStarterOwnedFurnitureId("starter-rug")
  },
  {
    id: "starter-bed",
    type: "bed",
    surface: "floor",
    position: [3.05, 0, -2.75],
    rotationY: 0,
    ownedFurnitureId: createStarterOwnedFurnitureId("starter-bed")
  },
  {
    id: "starter-desk",
    type: "desk",
    surface: "floor",
    position: [-3.2, 0, -4.15],
    rotationY: 0,
    ownedFurnitureId: createStarterOwnedFurnitureId("starter-desk")
  },
  {
    id: "starter-chair",
    type: "chair",
    surface: "floor",
    position: [-3.2, 0, -2.85],
    rotationY: Math.PI,
    ownedFurnitureId: createStarterOwnedFurnitureId("starter-chair")
  },
  {
    id: "starter-table",
    type: "table",
    surface: "floor",
    position: [2.65, 0, 2.2],
    rotationY: Math.PI / 2,
    ownedFurnitureId: createStarterOwnedFurnitureId("starter-table")
  },
  {
    id: "starter-poster",
    type: "poster",
    surface: "wall_back",
    position: [2.95, 1.95, -4.83],
    rotationY: 0,
    ownedFurnitureId: createStarterOwnedFurnitureId("starter-poster")
  },
  {
    id: "starter-wall-frame",
    type: "wall_frame",
    surface: "wall_left",
    position: [-4.83, 1.75, 1.55],
    rotationY: Math.PI / 2,
    ownedFurnitureId: createStarterOwnedFurnitureId("starter-wall-frame")
  }
];

const STARTER_OWNED_FURNITURE: OwnedFurnitureItem[] = STARTER_FURNITURE.map((placement) => ({
  id: placement.ownedFurnitureId,
  type: placement.type,
  ownerId: LOCAL_SANDBOX_OWNER_ID,
  acquiredFrom: "starter"
}));

export const DEFAULT_ROOM_STATE: RoomState = {
  metadata: {
    roomId: "local-sandbox-room",
    roomTheme: "starter-cozy",
    layoutVersion: DEFAULT_ROOM_LAYOUT_VERSION,
    unlockedFurniture: [...ALL_FURNITURE_TYPES]
  },
  furniture: STARTER_FURNITURE,
  ownedFurniture: STARTER_OWNED_FURNITURE
};

export function cloneOwnedFurnitureItem(item: OwnedFurnitureItem): OwnedFurnitureItem {
  return {
    ...item
  };
}

export function cloneOwnedFurnitureItems(items: OwnedFurnitureItem[]): OwnedFurnitureItem[] {
  return items.map(cloneOwnedFurnitureItem);
}

export function cloneFurniturePlacement(
  placement: RoomFurniturePlacement
): RoomFurniturePlacement {
  return {
    ...placement,
    position: [...placement.position] as Vector3Tuple,
    surfaceLocalOffset: placement.surfaceLocalOffset
      ? [...placement.surfaceLocalOffset] as Vector2Tuple
      : undefined
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
    furniture: cloneFurniturePlacements(roomState.furniture),
    ownedFurniture: cloneOwnedFurnitureItems(roomState.ownedFurniture)
  };
}

export function createOwnedFurnitureItem(
  type: FurnitureType,
  ownerId = LOCAL_SANDBOX_OWNER_ID,
  options?: {
    id?: string;
    acquiredFrom?: OwnedFurnitureSource;
  }
): OwnedFurnitureItem {
  return {
    id: options?.id ?? `owned-${type}-${crypto.randomUUID()}`,
    type,
    ownerId,
    acquiredFrom: options?.acquiredFrom ?? "sandbox_catalog"
  };
}

export function ensureRoomStateOwnership(roomState: RoomState): RoomState {
  const ownedFurnitureMap = new Map<string, OwnedFurnitureItem>();

  roomState.ownedFurniture.forEach((item) => {
    ownedFurnitureMap.set(item.id, cloneOwnedFurnitureItem(item));
  });

  const normalizedPlacements = roomState.furniture.map((placement) => {
    const normalizedPlacement = cloneFurniturePlacement(placement);
    const ownedFurnitureId =
      normalizedPlacement.ownedFurnitureId || createStarterOwnedFurnitureId(normalizedPlacement.id);
    const existingOwnedFurniture = ownedFurnitureMap.get(ownedFurnitureId);

    if (!existingOwnedFurniture || existingOwnedFurniture.type !== normalizedPlacement.type) {
      ownedFurnitureMap.set(
        ownedFurnitureId,
        createOwnedFurnitureItem(normalizedPlacement.type, existingOwnedFurniture?.ownerId, {
          id: ownedFurnitureId,
          acquiredFrom:
            existingOwnedFurniture?.acquiredFrom ??
            inferOwnedFurnitureSourceFromPlacementId(normalizedPlacement.id)
        })
      );
    }

    return {
      ...normalizedPlacement,
      ownedFurnitureId
    };
  });

  return {
    metadata: {
      ...roomState.metadata,
      unlockedFurniture: [...roomState.metadata.unlockedFurniture]
    },
    furniture: normalizedPlacements,
    ownedFurniture: Array.from(ownedFurnitureMap.values()).map(cloneOwnedFurnitureItem)
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

export function findOwnedFurnitureItem(
  items: OwnedFurnitureItem[],
  ownedFurnitureId: string | null
): OwnedFurnitureItem | null {
  if (!ownedFurnitureId) {
    return null;
  }

  return items.find((item) => item.id === ownedFurnitureId) ?? null;
}

export function getPlacedOwnedFurnitureIds(
  placements: RoomFurniturePlacement[]
): Set<string> {
  return new Set(placements.map((placement) => placement.ownedFurnitureId));
}

export function getStoredOwnedFurnitureItems(
  ownedFurniture: OwnedFurnitureItem[],
  placements: RoomFurniturePlacement[]
): OwnedFurnitureItem[] {
  const placedOwnedFurnitureIds = getPlacedOwnedFurnitureIds(placements);

  return ownedFurniture.filter((item) => !placedOwnedFurnitureIds.has(item.id));
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
  surface = getDefaultPlacementSurface(type),
  options?: Pick<
    RoomFurniturePlacement,
    "anchorFurnitureId" | "surfaceLocalOffset" | "ownedFurnitureId"
  >
): RoomFurniturePlacement {
  const placementId = `${type}-${crypto.randomUUID()}`;

  return {
    id: placementId,
    type,
    surface,
    position,
    rotationY: getSurfaceRotationY(type, surface),
    ownedFurnitureId: options?.ownedFurnitureId ?? `owned-${placementId}`,
    anchorFurnitureId: options?.anchorFurnitureId,
    surfaceLocalOffset: options?.surfaceLocalOffset
  };
}
