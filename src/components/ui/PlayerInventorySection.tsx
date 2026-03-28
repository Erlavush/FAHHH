import { useMemo, useState } from "react";
import type { InventoryStats } from "../../app/types";
import { getOwnedFurnitureSellPrice } from "../../lib/economy";
import type {
  FurnitureCatalogCategory,
  FurnitureDefinition,
  FurnitureType
} from "../../lib/furnitureRegistry";
import { FurniturePreviewThumb } from "./FurniturePreviewThumb";

type InventoryFilter = "all" | "floor" | "ceiling" | "accents";

type InventoryEntryCard = {
  entry: FurnitureDefinition;
  filter: Exclude<InventoryFilter, "all">;
  sellPrice: number;
  storedCount: number;
};

type PlayerInventorySectionProps = {
  inventoryByType: Map<FurnitureType, InventoryStats>;
  onOpenStudio: (type: FurnitureType) => void;
  onPlaceStoredFurniture: (type: FurnitureType) => void;
  onSellStoredFurniture: (type: FurnitureType) => void;
  showAuthoringActions: boolean;
  storedInventorySections: readonly (readonly [FurnitureCatalogCategory, FurnitureDefinition[]])[];
};

const FILTER_OPTIONS: ReadonlyArray<{ label: string; value: InventoryFilter }> = [
  { label: "All", value: "all" },
  { label: "Floor", value: "floor" },
  { label: "Ceiling", value: "ceiling" },
  { label: "Accents", value: "accents" }
];

function getInventoryFilter(entry: FurnitureDefinition): Exclude<InventoryFilter, "all"> {
  if (entry.surface === "floor") {
    return "floor";
  }

  if (entry.surface === "ceiling") {
    return "ceiling";
  }

  return "accents";
}

function getInventoryFilterLabel(filter: Exclude<InventoryFilter, "all">): string {
  switch (filter) {
    case "floor":
      return "Floor";
    case "ceiling":
      return "Ceiling";
    case "accents":
    default:
      return "Accents";
  }
}

export function PlayerInventorySection({
  inventoryByType,
  onOpenStudio,
  onPlaceStoredFurniture,
  onSellStoredFurniture,
  showAuthoringActions,
  storedInventorySections
}: PlayerInventorySectionProps) {
  const [activeFilter, setActiveFilter] = useState<InventoryFilter>("all");

  const inventoryEntries = useMemo<InventoryEntryCard[]>(
    () =>
      storedInventorySections
        .flatMap(([, entries]) =>
          entries.map((entry) => {
            const inventoryStats = inventoryByType.get(entry.type);
            const nextSellItem =
              inventoryStats?.storedItems.find(
                (ownedFurniture) => getOwnedFurnitureSellPrice(ownedFurniture) > 0
              ) ?? inventoryStats?.storedItems[0];

            return {
              entry,
              filter: getInventoryFilter(entry),
              sellPrice: nextSellItem ? getOwnedFurnitureSellPrice(nextSellItem) : 0,
              storedCount: inventoryStats?.storedCount ?? 0
            };
          })
        )
        .filter((entry) => entry.storedCount > 0),
    [inventoryByType, storedInventorySections]
  );

  const filteredEntries = useMemo(
    () =>
      inventoryEntries.filter(
        (entry) => activeFilter === "all" || entry.filter === activeFilter
      ),
    [activeFilter, inventoryEntries]
  );

  return (
    <section className="spawn-section spawn-section--inventory">
      <div className="spawn-section__intro">
        <span className="spawn-section__title">Furniture Inventory</span>
        <p className="spawn-section__description">
          Open the drawer, pick an item, and use Place only when you want a quick build session.
        </p>
      </div>
      <div className="spawn-filter-chips" role="toolbar" aria-label="Inventory filters">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            aria-pressed={activeFilter === option.value}
            className={
              activeFilter === option.value
                ? "spawn-filter-chip spawn-filter-chip--active"
                : "spawn-filter-chip"
            }
            onClick={() => setActiveFilter(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
      {filteredEntries.length > 0 ? (
        <div className="spawn-grid spawn-grid--inventory">
          {filteredEntries.map(({ entry, filter, sellPrice, storedCount }) => (
            <div key={`stored-${entry.type}`} className="spawn-card spawn-card--inventory">
              <FurniturePreviewThumb
                authoringEnabled={showAuthoringActions}
                badgeLabel={`${storedCount} Stored`}
                label={entry.label}
                onOpenStudio={() => onOpenStudio(entry.type)}
                previewSrc={entry.shopPreviewSrc}
                previewScale={entry.shopPreviewScale}
              />
              <div className="spawn-card__content spawn-card__content--inventory">
                <div className="spawn-card__header-row spawn-card__header-row--inventory">
                  <strong>{entry.label}</strong>
                  <span className="spawn-card__inventory-meta">
                    {getInventoryFilterLabel(filter)}
                  </span>
                </div>
                <div className="spawn-card__actions spawn-card__actions--inventory">
                  <button
                    className="spawn-card__button"
                    onClick={() => onPlaceStoredFurniture(entry.type)}
                    type="button"
                  >
                    Place
                  </button>
                  <button
                    className="spawn-card__button spawn-card__button--secondary"
                    onClick={() => onSellStoredFurniture(entry.type)}
                    type="button"
                  >
                    {`Sell: ${sellPrice}`}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="spawn-empty">No furniture stored in this filter yet.</div>
      )}
    </section>
  );
}