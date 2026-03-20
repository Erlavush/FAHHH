import {
  getFurnitureBuyPrice,
  type FurnitureType
} from "./furnitureRegistry";
import type { OwnedFurnitureItem } from "./roomState";

export const DEFAULT_STARTING_COINS = 180;

export function getOwnedFurnitureSellPrice(
  ownedFurniture: Pick<OwnedFurnitureItem, "type" | "acquiredFrom">
): number {
  // Starter furniture should be removable, but it should not mint free coins.
  if (ownedFurniture.acquiredFrom === "starter") {
    return 0;
  }

  // Keep shop swaps forgiving until quests/minigames add reliable earn loops.
  return getFurnitureBuyPrice(ownedFurniture.type as FurnitureType);
}
