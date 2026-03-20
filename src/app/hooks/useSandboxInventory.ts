import { useMemo } from "react";
import {
  FURNITURE_REGISTRY,
  type FurnitureCatalogCategory,
  type FurnitureDefinition,
  type FurnitureType
} from "../../lib/furnitureRegistry";
import { getPlacedOwnedFurnitureIds } from "../../lib/roomState";
import type { OwnedFurnitureItem, RoomFurniturePlacement } from "../../lib/roomState";
import type { InventoryStats } from "../types";

export function useSandboxInventory(
  ownedFurniture: OwnedFurnitureItem[],
  liveFurniturePlacements: RoomFurniturePlacement[],
  pendingSpawnOwnedFurnitureIds: string[]
) {
  const catalogSections = useMemo(() => {
    const grouped = new Map<FurnitureCatalogCategory, FurnitureDefinition[]>();

    (
      Object.values(FURNITURE_REGISTRY) as Array<(typeof FURNITURE_REGISTRY)[FurnitureType]>
    ).forEach((entry) => {
      const currentItems = grouped.get(entry.category) ?? [];
      currentItems.push(entry);
      grouped.set(entry.category, currentItems);
    });

    return Array.from(grouped.entries());
  }, []);

  const inventoryByType = useMemo(() => {
    const placedOwnedFurnitureIds = getPlacedOwnedFurnitureIds(liveFurniturePlacements);
    pendingSpawnOwnedFurnitureIds.forEach((ownedFurnitureId) => {
      placedOwnedFurnitureIds.add(ownedFurnitureId);
    });
    const nextInventory = new Map<FurnitureType, InventoryStats>();

    ownedFurniture.forEach((ownedItem) => {
      const currentStats = nextInventory.get(ownedItem.type) ?? {
        storedItems: [],
        storedCount: 0,
        placedCount: 0,
        totalCount: 0
      };

      currentStats.totalCount += 1;

      if (placedOwnedFurnitureIds.has(ownedItem.id)) {
        currentStats.placedCount += 1;
      } else {
        currentStats.storedCount += 1;
        currentStats.storedItems.push(ownedItem);
      }

      nextInventory.set(ownedItem.type, currentStats);
    });

    return nextInventory;
  }, [liveFurniturePlacements, ownedFurniture, pendingSpawnOwnedFurnitureIds]);

  const storedInventorySections = useMemo(
    () =>
      catalogSections
        .map(([sectionName, entries]) => [
          sectionName,
          entries.filter((entry) => (inventoryByType.get(entry.type)?.storedCount ?? 0) > 0)
        ] as const)
        .filter(([, entries]) => entries.length > 0),
    [catalogSections, inventoryByType]
  );

  const storedInventoryCount = useMemo(
    () =>
      Array.from(inventoryByType.values()).reduce(
        (totalCount, currentEntry) => totalCount + currentEntry.storedCount,
        0
      ),
    [inventoryByType]
  );

  return {
    catalogSections,
    inventoryByType,
    storedInventorySections,
    storedInventoryCount
  };
}