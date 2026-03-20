import { getOwnedFurnitureSellPrice } from "../../lib/economy";
import type {
  FurnitureCatalogCategory,
  FurnitureDefinition,
  FurnitureType
} from "../../lib/furnitureRegistry";
import type { InventoryStats } from "../types";
import { FurnitureInfoControl } from "./FurnitureInfoControl";
import { FurniturePreviewThumb } from "./FurniturePreviewThumb";

type InventoryPanelProps = {
  playerCoins: number;
  catalogSections: readonly (readonly [FurnitureCatalogCategory, FurnitureDefinition[]])[];
  storedInventorySections: readonly (readonly [FurnitureCatalogCategory, FurnitureDefinition[]])[];
  inventoryByType: Map<FurnitureType, InventoryStats>;
  hoverPreviewEnabled: boolean;
  openFurnitureInfoKey: string | null;
  onOpenFurnitureInfo: (key: string) => void;
  onCloseFurnitureInfo: () => void;
  onToggleFurnitureInfo: (key: string) => void;
  onOpenStudio: (type: FurnitureType) => void;
  onPlaceStoredFurniture: (type: FurnitureType) => void;
  onSellStoredFurniture: (type: FurnitureType) => void;
  onBuyFurniture: (type: FurnitureType) => void;
};

export function InventoryPanel({
  playerCoins,
  catalogSections,
  storedInventorySections,
  inventoryByType,
  hoverPreviewEnabled,
  openFurnitureInfoKey,
  onOpenFurnitureInfo,
  onCloseFurnitureInfo,
  onToggleFurnitureInfo,
  onOpenStudio,
  onPlaceStoredFurniture,
  onSellStoredFurniture,
  onBuyFurniture
}: InventoryPanelProps) {
  return (
    <aside className="spawn-panel">
      <div className="spawn-panel__header">
        <span className="spawn-panel__title">Room Inventory</span>
        <span className="spawn-panel__coins">{playerCoins} coins</span>
      </div>
      <p className="spawn-panel__meta">
        Buy furniture with coins, place stored items into the room, and sell extras you do not
        need.
      </p>
      <section className="spawn-section">
        <span className="spawn-section__title">Stored Items</span>
        {storedInventorySections.length > 0 ? (
          <>
            {storedInventorySections.map(([sectionName, entries]) => (
              <section key={`stored-${sectionName}`} className="spawn-subsection">
                <span className="spawn-subsection__title">{sectionName}</span>
                <div className="spawn-grid">
                  {entries.map((entry) => {
                    const inventoryStats = inventoryByType.get(entry.type);
                    const nextSellItem =
                      inventoryStats?.storedItems.find(
                        (ownedFurniture) => getOwnedFurnitureSellPrice(ownedFurniture) > 0
                      ) ?? inventoryStats?.storedItems[0];
                    const sellPrice = nextSellItem
                      ? getOwnedFurnitureSellPrice(nextSellItem)
                      : 0;

                    return (
                      <div key={`stored-${entry.type}`} className="spawn-card">
                        <FurniturePreviewThumb
                          label={entry.label}
                          onOpenStudio={() => onOpenStudio(entry.type)}
                          previewSrc={entry.shopPreviewSrc}
                          previewScale={entry.shopPreviewScale}
                        />
                        <div className="spawn-card__content">
                          <div className="spawn-card__header-row">
                            <strong>{entry.label}</strong>
                            <span className="spawn-card__price">{entry.price} coins</span>
                          </div>
                          <div className="spawn-card__stats">
                            <span className="spawn-card__stat">
                              {`${inventoryStats?.storedCount ?? 0} stored`}
                            </span>
                            <span className="spawn-card__stat">
                              {`${inventoryStats?.placedCount ?? 0} in room`}
                            </span>
                          </div>
                          <span className="spawn-card__hint">
                            {sellPrice > 0
                              ? `Sell one stored copy for ${sellPrice} coins.`
                              : "Starter furniture can be removed, but it does not refund coins."}
                          </span>
                          <div className="spawn-card__actions">
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
                              {sellPrice > 0 ? `Sell +${sellPrice}` : "Remove"}
                            </button>
                            <FurnitureInfoControl
                              entry={entry}
                              hoverPreviewEnabled={hoverPreviewEnabled}
                              infoKey={`stored:${entry.type}`}
                              isOpen={openFurnitureInfoKey === `stored:${entry.type}`}
                              onClose={onCloseFurnitureInfo}
                              onOpen={onOpenFurnitureInfo}
                              onToggle={onToggleFurnitureInfo}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </>
        ) : (
          <div className="spawn-empty">
            No stored items yet. Add something from the catalog below.
          </div>
        )}
      </section>

      {catalogSections.map(([sectionName, entries]) => (
        <section key={sectionName} className="spawn-section">
          <span className="spawn-section__title">{sectionName}</span>
          <div className="spawn-grid">
            {entries.map((entry) => {
              const inventoryStats = inventoryByType.get(entry.type);
              const canAffordPurchase = playerCoins >= entry.price;

              return (
                <div key={entry.type} className="spawn-card">
                  <FurniturePreviewThumb
                    label={entry.label}
                    onOpenStudio={() => onOpenStudio(entry.type)}
                    previewSrc={entry.shopPreviewSrc}
                    previewScale={entry.shopPreviewScale}
                  />
                  <div className="spawn-card__content">
                    <div className="spawn-card__header-row">
                      <strong>{entry.label}</strong>
                      <span className="spawn-card__price">{entry.price} coins</span>
                    </div>
                    <div className="spawn-card__stats">
                      <span className="spawn-card__stat">
                        {`${inventoryStats?.storedCount ?? 0} stored`}
                      </span>
                      <span className="spawn-card__stat">
                        {`${inventoryStats?.placedCount ?? 0} in room`}
                      </span>
                    </div>
                    <span className="spawn-card__hint">
                      Costs {entry.price} coins. Purchased copies refund their full price for now.
                    </span>
                    <div className="spawn-card__actions">
                      <button
                        className="spawn-card__button"
                        disabled={!canAffordPurchase}
                        onClick={() => onBuyFurniture(entry.type)}
                        type="button"
                      >
                        {canAffordPurchase
                          ? `Buy for ${entry.price}`
                          : `Need ${entry.price - playerCoins} more`}
                      </button>
                      <FurnitureInfoControl
                        entry={entry}
                        hoverPreviewEnabled={hoverPreviewEnabled}
                        infoKey={`catalog:${entry.type}`}
                        isOpen={openFurnitureInfoKey === `catalog:${entry.type}`}
                        onClose={onCloseFurnitureInfo}
                        onOpen={onOpenFurnitureInfo}
                        onToggle={onToggleFurnitureInfo}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </aside>
  );
}