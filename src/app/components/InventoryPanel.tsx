import { getOwnedFurnitureSellPrice } from "../../lib/economy";
import type {
  FurnitureCatalogCategory,
  FurnitureDefinition,
  FurnitureType
} from "../../lib/furnitureRegistry";
import type { PetDefinition, PetType } from "../../lib/pets";
import type { InventoryStats } from "../types";
import { FurnitureInfoControl } from "./FurnitureInfoControl";
import { FurniturePreviewThumb } from "./FurniturePreviewThumb";

type InventoryPanelProps = {
  className?: string;
  playerCoins: number;
  walletLabel?: string;
  showPetCatalog?: boolean;
  showAuthoringActions?: boolean;
  catalogSections: readonly (readonly [FurnitureCatalogCategory, FurnitureDefinition[]])[];
  storedInventorySections: readonly (readonly [FurnitureCatalogCategory, FurnitureDefinition[]])[];
  inventoryByType: Map<FurnitureType, InventoryStats>;
  hoverPreviewEnabled: boolean;
  openFurnitureInfoKey: string | null;
  petCatalogEntries: PetDefinition[];
  ownedPetTypes: Set<PetType>;
  onOpenFurnitureInfo: (key: string) => void;
  onCloseFurnitureInfo: () => void;
  onToggleFurnitureInfo: (key: string) => void;
  onOpenStudio: (type: FurnitureType) => void;
  onOpenMobStudio: (presetId: string) => void;
  onPlaceStoredFurniture: (type: FurnitureType) => void;
  onSellStoredFurniture: (type: FurnitureType) => void;
  onBuyFurniture: (type: FurnitureType) => void;
  onBuyPet: (type: PetType) => void;
};

export function InventoryPanel({
  className,
  playerCoins,
  walletLabel = "Coins",
  showPetCatalog = true,
  showAuthoringActions = true,
  catalogSections,
  storedInventorySections,
  inventoryByType,
  hoverPreviewEnabled,
  openFurnitureInfoKey,
  petCatalogEntries,
  ownedPetTypes,
  onOpenFurnitureInfo,
  onCloseFurnitureInfo,
  onToggleFurnitureInfo,
  onOpenStudio,
  onOpenMobStudio,
  onPlaceStoredFurniture,
  onSellStoredFurniture,
  onBuyFurniture,
  onBuyPet
}: InventoryPanelProps) {
  return (
    <aside className={className ? `spawn-panel ${className}` : "spawn-panel"}>
      <div className="spawn-panel__header">
        <span className="spawn-panel__title">Shared Inventory</span>
        <span className="spawn-panel__coins">{playerCoins} {walletLabel.toLowerCase()}</span>
      </div>
      <p className="spawn-panel__meta">
        {walletLabel} pays for new furniture. Purchased furniture becomes shared room inventory.
      </p>

      {showPetCatalog && petCatalogEntries.length > 0 ? (
        <section className="spawn-section">
          <span className="spawn-section__title">Pet Store</span>
          <div className="spawn-grid">
            {petCatalogEntries.map((pet) => {
              const alreadyOwned = ownedPetTypes.has(pet.type);
              const canAffordPurchase = playerCoins >= pet.price;

              return (
                <div key={pet.type} className="spawn-card">
                  <div className="spawn-card__preview">
                    <div className="spawn-card__preview-fallback">
                      <span>Live Pet Test</span>
                      {showAuthoringActions ? (
                        <button
                          className="spawn-card__preview-link"
                          onClick={() => onOpenMobStudio(pet.presetId)}
                          type="button"
                        >
                          Open Mob Lab
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="spawn-card__content">
                    <div className="spawn-card__header-row">
                      <strong>{pet.label}</strong>
                      <span className="spawn-card__price">{pet.price} coins</span>
                    </div>
                    <div className="spawn-card__stats">
                      <span className="spawn-card__stat">
                        {alreadyOwned ? "Owned" : "Available"}
                      </span>
                      <span className="spawn-card__stat">Preset: {pet.presetId}</span>
                    </div>
                    <span className="spawn-card__hint">{pet.description}</span>
                    <div className="spawn-card__actions">
                      <button
                        className="spawn-card__button"
                        disabled={!canAffordPurchase || alreadyOwned}
                        onClick={() => onBuyPet(pet.type)}
                        type="button"
                      >
                        {alreadyOwned
                          ? "Owned"
                          : canAffordPurchase
                            ? `Adopt for ${pet.price}`
                            : `Need ${pet.price - playerCoins} more`}
                      </button>
                      {showAuthoringActions ? (
                        <button
                          className="spawn-card__button spawn-card__button--secondary"
                          onClick={() => onOpenMobStudio(pet.presetId)}
                          type="button"
                        >
                          Preview
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

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
                          authoringEnabled={showAuthoringActions}
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
          <div className="spawn-empty">No shared items stored yet. Add something from the catalog below.</div>
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
                    authoringEnabled={showAuthoringActions}
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
