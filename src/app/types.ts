import type {
  FurnitureInteractionType,
  FurnitureType
} from "../lib/furnitureRegistry";
import type { OwnedFurnitureItem } from "../lib/roomState";

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