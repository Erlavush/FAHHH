import type {
  FurnitureInteractionType,
  FurnitureType
} from "../lib/furnitureRegistry";
import type { OwnedFurnitureItem, Vector3Tuple } from "../lib/roomState";

export type PreviewStudioMode = "furniture" | "mob_lab";

export type FurnitureSpawnRequest = {
  requestId: number;
  type: FurnitureType;
  ownedFurnitureId: string;
};

export type InventoryStats = {
  storedItems: OwnedFurnitureItem[];
  storedCount: number;
  placedCount: number;
  totalCount: number;
};

export type PlayerInteractionStatus =
  | {
      phase: "approaching" | "active";
      label: string;
      interactionType: FurnitureInteractionType;
      furnitureId: string;
    }
  | null;

export type SceneJumpRequest = {
  requestId: number;
  playerPosition: Vector3Tuple;
  cameraPosition: Vector3Tuple;
  cameraTarget: Vector3Tuple;
};