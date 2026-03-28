import type { InventoryStats } from "../../app/types";
import type {
  FurnitureCatalogCategory,
  FurnitureDefinition,
  FurnitureType
} from "../../lib/furnitureRegistry";
import type { PetDefinition, PetType } from "../../lib/pets";
import { FurnitureInfoControl } from "./FurnitureInfoControl";
import { FurniturePreviewThumb } from "./FurniturePreviewThumb";

type PlayerShopSectionProps = {
  catalogSections: readonly (readonly [FurnitureCatalogCategory, FurnitureDefinition[]])[];
  hoverPreviewEnabled: boolean;
  inventoryByType: Map<FurnitureType, InventoryStats>;
  onBuyFurniture: (type: FurnitureType) => void;
  onBuyPet: (pet: PetDefinition) => void;
  onCloseFurnitureInfo: () => void;
  onOpenFurnitureInfo: (key: string) => void;
  onOpenMobStudio: (presetId: string) => void;
  onOpenStudio: (type: FurnitureType) => void;
  onToggleFurnitureInfo: (key: string) => void;
  openFurnitureInfoKey: string | null;
  ownedPetPresetIds: Set<string>;
  ownedPetTypes: Set<PetType>;
  petCatalogEntries: PetDefinition[];
  petCatalogMode: "sandbox" | "shared_room";
  playerCoins: number;
  showAuthoringActions: boolean;
  showPetCatalog: boolean;
};

export function PlayerShopSection({
  catalogSections,
  hoverPreviewEnabled,
  inventoryByType,
  onBuyFurniture,
  onBuyPet,
  onCloseFurnitureInfo,
  onOpenFurnitureInfo,
  onOpenMobStudio,
  onOpenStudio,
  onToggleFurnitureInfo,
  openFurnitureInfoKey,
  ownedPetPresetIds,
  ownedPetTypes,
  petCatalogEntries,
  petCatalogMode,
  playerCoins,
  showAuthoringActions,
  showPetCatalog
}: PlayerShopSectionProps) {
  const sharedPetMode = petCatalogMode === "shared_room";

  return (
    <section className="spawn-section">
      <span className="spawn-section__title">Shop</span>
      <p className="spawn-section__description">Buy decor and adopt cats here.</p>
      {showPetCatalog && petCatalogEntries.length > 0 ? (
        <section className="spawn-subsection">
          <span className="spawn-subsection__title">
            {sharedPetMode ? "Shared Companion" : "Cat Shop"}
          </span>
          <div className="spawn-grid">
            {petCatalogEntries.map((pet) => {
              const alreadyOwned = sharedPetMode
                ? ownedPetTypes.has(pet.type)
                : ownedPetPresetIds.has(pet.presetId);
              const canAffordPurchase = playerCoins >= pet.price;

              return (
                <div key={`${pet.type}-${pet.presetId}`} className="spawn-card">
                  <div className="spawn-card__preview">
                    <div className="spawn-card__preview-fallback">
                      <span>{sharedPetMode ? "Companion preview" : "Cat preview"}</span>
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
                        {alreadyOwned ? (sharedPetMode ? "Already adopted" : "In roster") : "Available"}
                      </span>
                      {showAuthoringActions ? (
                        <span className="spawn-card__stat">Preset: {pet.presetId}</span>
                      ) : null}
                    </div>
                    <span className="spawn-card__hint">{pet.description}</span>
                    <div className="spawn-card__actions">
                      <button
                        className="spawn-card__button"
                        disabled={!canAffordPurchase || alreadyOwned}
                        onClick={() => onBuyPet(pet)}
                        type="button"
                      >
                        {alreadyOwned
                          ? sharedPetMode
                            ? "Already adopted"
                            : "Already in roster"
                          : canAffordPurchase
                            ? sharedPetMode
                              ? "Adopt for the room"
                              : `Adopt for ${pet.price}`
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

      <section className="spawn-subsection">
        <span className="spawn-subsection__title">Furniture Shop</span>
        <div className="spawn-grid">
          {catalogSections.flatMap(([sectionName, entries]) =>
            entries.map((entry) => {
              const inventoryStats = inventoryByType.get(entry.type);
              const canAffordPurchase = playerCoins >= entry.price;

              return (
                <div key={`${sectionName}-${entry.type}`} className="spawn-card">
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
                      <span className="spawn-card__stat">{sectionName}</span>
                      <span className="spawn-card__stat">{inventoryStats?.storedCount ?? 0} stored</span>
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
            })
          )}
        </div>
      </section>
    </section>
  );
}