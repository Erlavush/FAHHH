import type { InventoryStats, PlayerDrawerMode } from "../../app/types";
import { getPlayerDrawerTabsState } from "../../app/shellViewModel";
import type {
  FurnitureCatalogCategory,
  FurnitureDefinition,
  FurnitureType
} from "../../lib/furnitureRegistry";
import type { OwnedPet, PetDefinition, PetType } from "../../lib/pets";
import { PlayerDrawerTabs } from "./PlayerDrawerTabs";
import { PlayerInventorySection } from "./PlayerInventorySection";
import { PlayerPetCareSection } from "./PlayerPetCareSection";
import { PlayerShopSection } from "./PlayerShopSection";

export type InventoryPanelProps = {
  activeCats?: OwnedPet[];
  activeMode: PlayerDrawerMode;
  catalogSections: readonly (readonly [FurnitureCatalogCategory, FurnitureDefinition[]])[];
  catsNeedingCareIds?: Set<string>;
  className?: string;
  hoverPreviewEnabled: boolean;
  inventoryByType: Map<FurnitureType, InventoryStats>;
  onActivateStoredPet?: (petId: string) => void;
  onBuyFurniture: (type: FurnitureType) => void;
  onBuyPet: (pet: PetDefinition) => void;
  onCareForPet?: (petId: string, actionId: "feed" | "pet" | "play") => void;
  onChangeMode: (mode: PlayerDrawerMode) => void;
  onCloseFurnitureInfo: () => void;
  onOpenFurnitureInfo: (key: string) => void;
  onOpenMobStudio: (presetId: string) => void;
  onOpenStudio: (type: FurnitureType) => void;
  onPlaceStoredFurniture: (type: FurnitureType) => void;
  onRemovePet?: (petId: string) => void;
  onSellStoredFurniture: (type: FurnitureType) => void;
  onStorePet?: (petId: string) => void;
  onToggleFurnitureInfo: (key: string) => void;
  openFurnitureInfoKey: string | null;
  ownedPetPresetIds: Set<string>;
  ownedPetTypes: Set<PetType>;
  petCatalogEntries: PetDefinition[];
  petCatalogMode?: "sandbox" | "shared_room";
  playerCoins: number;
  showAuthoringActions?: boolean;
  showPetCatalog?: boolean;
  storedCats?: OwnedPet[];
  storedInventorySections: readonly (readonly [FurnitureCatalogCategory, FurnitureDefinition[]])[];
  walletLabel?: string;
};

export function InventoryPanel({
  activeCats = [],
  activeMode,
  catalogSections,
  catsNeedingCareIds,
  className,
  hoverPreviewEnabled,
  inventoryByType,
  onActivateStoredPet,
  onBuyFurniture,
  onBuyPet,
  onCareForPet,
  onChangeMode,
  onCloseFurnitureInfo,
  onOpenFurnitureInfo,
  onOpenMobStudio,
  onOpenStudio,
  onPlaceStoredFurniture,
  onRemovePet,
  onSellStoredFurniture,
  onStorePet,
  onToggleFurnitureInfo,
  openFurnitureInfoKey,
  ownedPetPresetIds,
  ownedPetTypes,
  petCatalogEntries,
  petCatalogMode = "sandbox",
  playerCoins,
  showAuthoringActions = true,
  showPetCatalog = true,
  storedCats = [],
  storedInventorySections,
  walletLabel = "Coins"
}: InventoryPanelProps) {
  const sharedPetMode = petCatalogMode === "shared_room";
  const sharedRoomPetCareMessage = "Shared companion care uses the room interaction flow right now.";
  const drawerTabs = getPlayerDrawerTabsState(
    activeMode,
    sharedPetMode,
    catsNeedingCareIds?.size ?? 0
  );
  const coinsValue = playerCoins.toLocaleString();

  return (
    <aside className={className ? `spawn-panel ${className}` : "spawn-panel"} data-active-mode={activeMode}>
      <div className="spawn-panel__header">
        <span className="spawn-panel__title">Room Drawer</span>
        <div className="spawn-panel__coins" aria-label={`${coinsValue} ${walletLabel}`} title={`${coinsValue} ${walletLabel}`}>
          <span className="spawn-panel__coins-value">{coinsValue} Coins</span>
          <span aria-hidden="true" className="spawn-panel__coins-plus">+</span>
        </div>
      </div>
      <div className="spawn-panel__body">
        {activeMode === "inventory" ? (
          <PlayerInventorySection
            inventoryByType={inventoryByType}
            onOpenStudio={onOpenStudio}
            onPlaceStoredFurniture={onPlaceStoredFurniture}
            onSellStoredFurniture={onSellStoredFurniture}
            showAuthoringActions={showAuthoringActions}
            storedInventorySections={storedInventorySections}
          />
        ) : null}
        {activeMode === "shop" ? (
          <PlayerShopSection
            catalogSections={catalogSections}
            hoverPreviewEnabled={hoverPreviewEnabled}
            inventoryByType={inventoryByType}
            onBuyFurniture={onBuyFurniture}
            onBuyPet={onBuyPet}
            onCloseFurnitureInfo={onCloseFurnitureInfo}
            onOpenFurnitureInfo={onOpenFurnitureInfo}
            onOpenMobStudio={onOpenMobStudio}
            onOpenStudio={onOpenStudio}
            onToggleFurnitureInfo={onToggleFurnitureInfo}
            openFurnitureInfoKey={openFurnitureInfoKey}
            ownedPetPresetIds={ownedPetPresetIds}
            ownedPetTypes={ownedPetTypes}
            petCatalogEntries={petCatalogEntries}
            petCatalogMode={petCatalogMode}
            playerCoins={playerCoins}
            showAuthoringActions={showAuthoringActions}
            showPetCatalog={showPetCatalog}
          />
        ) : null}
        {activeMode === "pet_care" ? (
          <PlayerPetCareSection
            activeCats={activeCats}
            catsNeedingCareIds={catsNeedingCareIds}
            onActivateStoredPet={onActivateStoredPet}
            onCareForPet={onCareForPet}
            onRemovePet={onRemovePet}
            onStorePet={onStorePet}
            petCatalogMode={petCatalogMode}
            sharedRoomMessage={sharedRoomPetCareMessage}
            storedCats={storedCats}
          />
        ) : null}
      </div>
      <PlayerDrawerTabs onChangeMode={onChangeMode} tabs={drawerTabs} />
    </aside>
  );
}