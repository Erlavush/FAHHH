// @vitest-environment jsdom

import { act, createElement, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InventoryPanel } from "../src/components/ui";
import type { InventoryStats, PlayerDrawerMode } from "../src/app/types";
import {
  getFurnitureDefinition,
  type FurnitureCatalogCategory,
  type FurnitureDefinition,
  type FurnitureType
} from "../src/lib/furnitureRegistry";
import type { OwnedPet, PetDefinition, PetType } from "../src/lib/pets";
import type { OwnedFurnitureItem } from "../src/lib/roomState";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

type InventoryPanelHarnessProps = {
  initialMode?: PlayerDrawerMode;
  petCatalogMode?: "sandbox" | "shared_room";
};

function createOwnedFurnitureItem(type: FurnitureType, id: string): OwnedFurnitureItem {
  return {
    id,
    type,
    ownerId: "local-player",
    acquiredFrom: "sandbox_catalog"
  };
}

function createInventoryStats(type: FurnitureType, storedCount: number, placedCount: number): InventoryStats {
  return {
    storedItems: Array.from({ length: storedCount }, (_, index) =>
      createOwnedFurnitureItem(type, `${type}-owned-${index + 1}`)
    ),
    storedCount,
    placedCount,
    totalCount: storedCount + placedCount
  };
}

function createOwnedPet(id: string, status: "active_room" | "stored_roster"): OwnedPet {
  return {
    id,
    type: "minecraft_cat",
    presetId: "better_cat_glb",
    acquiredFrom: "pet_shop",
    spawnPosition: [0, 0, 0],
    displayName: status === "active_room" ? "Pudding" : "Mochi",
    status,
    behaviorProfileId: "curious",
    care: {
      hunger: status === "active_room" ? 42 : 78,
      affection: 64,
      energy: 55,
      lastUpdatedAt: "2026-03-28T00:00:00.000Z",
      lastCareActionAt: null
    }
  };
}

function createHarnessProps(overrides: Partial<InventoryPanelHarnessProps> = {}) {
  const fridge = getFurnitureDefinition("fridge");
  const vase = getFurnitureDefinition("vase");
  const petCatalogEntries: PetDefinition[] = [
    {
      type: "minecraft_cat",
      label: "Classic Cat",
      price: 30,
      description: "A soft little roommate for your cozy room.",
      presetId: "better_cat_glb"
    }
  ];
  const catalogSections: readonly (readonly [FurnitureCatalogCategory, FurnitureDefinition[]])[] = [
    ["Floor Furniture", [fridge]],
    ["Accents", [vase]]
  ];
  const storedInventorySections: readonly (readonly [FurnitureCatalogCategory, FurnitureDefinition[]])[] = [
    ["Floor Furniture", [fridge]],
    ["Accents", [vase]]
  ];
  const inventoryByType = new Map<FurnitureType, InventoryStats>([
    ["fridge", createInventoryStats("fridge", 1, 0)],
    ["vase", createInventoryStats("vase", 1, 1)]
  ]);

  return {
    activeCats: overrides.petCatalogMode === "shared_room" ? [] : [createOwnedPet("pet-active", "active_room")],
    catalogSections,
    catsNeedingCareIds: new Set(overrides.petCatalogMode === "shared_room" ? [] : ["pet-active"]),
    className: "spawn-panel--player-drawer",
    hoverPreviewEnabled: false,
    inventoryByType,
    onActivateStoredPet: vi.fn(),
    onBuyFurniture: vi.fn(),
    onBuyPet: vi.fn(),
    onCareForPet: vi.fn(),
    onCloseFurnitureInfo: vi.fn(),
    onOpenFurnitureInfo: vi.fn(),
    onOpenMobStudio: vi.fn(),
    onOpenStudio: vi.fn(),
    onPlaceStoredFurniture: vi.fn(),
    onRemovePet: vi.fn(),
    onSellStoredFurniture: vi.fn(),
    onStorePet: vi.fn(),
    onToggleFurnitureInfo: vi.fn(),
    openFurnitureInfoKey: null,
    ownedPetPresetIds: new Set<string>(),
    ownedPetTypes: new Set<PetType>(),
    petCatalogEntries,
    petCatalogMode: overrides.petCatalogMode ?? "sandbox",
    playerCoins: 180,
    showAuthoringActions: false,
    showPetCatalog: true,
    storedCats: overrides.petCatalogMode === "shared_room" ? [] : [createOwnedPet("pet-stored", "stored_roster")],
    storedInventorySections,
    walletLabel: "Coins"
  };
}

function InventoryPanelHarness({
  initialMode = "inventory",
  petCatalogMode = "sandbox"
}: InventoryPanelHarnessProps) {
  const [activeMode, setActiveMode] = useState<PlayerDrawerMode>(initialMode);
  const props = createHarnessProps({ petCatalogMode });

  return (
    <InventoryPanel
      {...props}
      activeMode={activeMode}
      onChangeMode={setActiveMode}
    />
  );
}

async function renderInventoryPanel(overrides: Partial<InventoryPanelHarnessProps> = {}) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root?.render(createElement(InventoryPanelHarness, overrides));
  });
}

function queryButton(label: string): HTMLButtonElement | null {
  return (
    Array.from(container?.querySelectorAll("button") ?? []).find(
      (button) => button.textContent?.includes(label) === true
    ) ?? null
  ) as HTMLButtonElement | null;
}

describe("InventoryPanel", () => {
  beforeEach(() => {
    container = null;
    root = null;
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }

    root = null;

    if (container) {
      container.remove();
    }

    container = null;
    vi.restoreAllMocks();
  });

  it("renders the room drawer shell, inventory filters, and bottom navigation", async () => {
    await renderInventoryPanel();

    expect(queryButton("Inventory")).not.toBeNull();
    expect(queryButton("Shop")).not.toBeNull();
    expect(queryButton("Pet Care")).not.toBeNull();
    expect(container?.textContent).toContain("Room Drawer");
    expect(container?.textContent).toContain("180 Coins");
    expect(container?.textContent).toContain("Furniture Inventory");
    expect(container?.textContent).toContain("All");
    expect(container?.textContent).toContain("Floor");
    expect(container?.textContent).toContain("Ceiling");
    expect(container?.textContent).toContain("Accents");
    expect(container?.textContent).toContain("1 Stored");
    expect(container?.textContent).toContain("Refrigerator");
    expect(container?.textContent).toContain("Vase");

    await act(async () => {
      queryButton("Floor")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container?.textContent).toContain("Refrigerator");
    expect(container?.textContent).not.toContain("Vase");

    await act(async () => {
      queryButton("Accents")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container?.textContent).toContain("Vase");
    expect(container?.textContent).not.toContain("Refrigerator");

    await act(async () => {
      queryButton("Shop")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container?.textContent).toContain("Furniture Shop");
    expect(container?.textContent).toContain("Buy decor and adopt cats here.");
    expect(container?.textContent).not.toContain("Feed +2");

    await act(async () => {
      queryButton("Pet Care")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container?.textContent).toContain("Take care of the cats already in your room.");
    expect(container?.textContent).toContain("Feed +2");
    expect(container?.textContent).not.toContain("Furniture Shop");
  });

  it("hides sandbox pet care controls in shared room mode", async () => {
    await renderInventoryPanel({ initialMode: "pet_care", petCatalogMode: "shared_room" });

    expect(container?.textContent).toContain("Shared companion care uses the room interaction flow right now.");
    expect(queryButton("Feed +2")).toBeNull();
    expect(queryButton("Pet +1")).toBeNull();
    expect(queryButton("Play +3")).toBeNull();
  });
});