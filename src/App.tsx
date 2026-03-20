import { ChangeEvent, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createDefaultSandboxState,
  loadPersistedSandboxState,
  savePersistedSandboxState
} from "./lib/devLocalState";
import {
  FURNITURE_REGISTRY,
  type FurnitureDefinition,
  type FurnitureCatalogCategory,
  type FurnitureType
} from "./lib/furnitureRegistry";
import {
  createOwnedFurnitureItem,
  createDefaultRoomState,
  getPlacedOwnedFurnitureIds,
  type OwnedFurnitureItem,
  type RoomFurniturePlacement,
  type RoomState,
  type Vector3Tuple
} from "./lib/roomState";
import { getOwnedFurnitureSellPrice } from "./lib/economy";
import { button, useControls, folder, Leva } from "leva";

type FurnitureSpawnRequest = {
  requestId: number;
  type: FurnitureType;
  ownedFurnitureId: string;
};

type InventoryStats = {
  storedItems: OwnedFurnitureItem[];
  storedCount: number;
  placedCount: number;
  totalCount: number;
};

type PlayerInteractionStatus =
  | {
      phase: "approaching" | "active";
      label: string;
    }
  | null;

type RenderMode = "cinematic" | "basic";

const RoomView = lazy(async () => {
  const module = await import("./components/RoomView");
  return { default: module.RoomView };
});

const FurniturePreviewStudio = lazy(async () => {
  const module = await import("./components/FurniturePreviewStudio");
  return { default: module.FurniturePreviewStudio };
});

const DEFAULT_CAMERA_POSITION: Vector3Tuple = [11.8, 9.6, 11.2];
const DEFAULT_PLAYER_POSITION: Vector3Tuple = [0, 0, 0.85];
const MINUTES_PER_DAY = 24 * 60;

function wrapClockMinutes(minutes: number): number {
  const wrappedMinutes = minutes % MINUTES_PER_DAY;
  return wrappedMinutes < 0 ? wrappedMinutes + MINUTES_PER_DAY : wrappedMinutes;
}

function getLocalClockMinutes(date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

function minutesToControlHours(minutes: number): number {
  return wrapClockMinutes(Math.round(minutes)) / 60;
}

function controlHoursToMinutes(hours: number): number {
  return wrapClockMinutes(Math.round(hours * 60));
}

function formatClock24h(minutes: number): string {
  const normalizedMinutes = wrapClockMinutes(Math.round(minutes));
  const hours = Math.floor(normalizedMinutes / 60);
  const remainingMinutes = normalizedMinutes % 60;

  return `${hours.toString().padStart(2, "0")}:${remainingMinutes.toString().padStart(2, "0")}`;
}

type FurniturePreviewThumbProps = {
  label: string;
  previewSrc: string;
  previewScale?: number;
  onOpenStudio: () => void;
};

type FurnitureInfoControlProps = {
  entry: FurnitureDefinition;
  infoKey: string;
  isOpen: boolean;
  hoverPreviewEnabled: boolean;
  onOpen: (key: string) => void;
  onClose: () => void;
  onToggle: (key: string) => void;
};

function FurniturePreviewThumb({
  label,
  previewSrc,
  previewScale = 1,
  onOpenStudio
}: FurniturePreviewThumbProps) {
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [previewSrc]);

  return (
    <div className="spawn-card__preview">
      {loadFailed ? (
        <div className="spawn-card__preview-fallback">
          <span>Preview pending</span>
          <button
            className="spawn-card__preview-link"
            onClick={onOpenStudio}
            type="button"
          >
            Open Studio
          </button>
        </div>
      ) : (
        <img
          alt={`${label} preview`}
          className="spawn-card__preview-image"
          loading="lazy"
          onError={() => setLoadFailed(true)}
          src={previewSrc}
          style={previewScale === 1 ? undefined : { transform: `scale(${previewScale})` }}
        />
      )}
    </div>
  );
}

function FurnitureInfoControl({
  entry,
  infoKey,
  isOpen,
  hoverPreviewEnabled,
  onOpen,
  onClose,
  onToggle
}: FurnitureInfoControlProps) {
  const descriptionId = `${infoKey.replace(/[^a-z0-9_-]/gi, "-")}-description`;

  return (
    <div
      className="spawn-card__info-wrap"
      onMouseEnter={() => {
        if (hoverPreviewEnabled) {
          onOpen(infoKey);
        }
      }}
      onMouseLeave={() => {
        if (hoverPreviewEnabled) {
          onClose();
        }
      }}
    >
      <button
        aria-controls={descriptionId}
        aria-expanded={isOpen}
        aria-label={`About ${entry.label}`}
        className={`spawn-card__info-button${isOpen ? " spawn-card__info-button--active" : ""}`}
        onClick={() => {
          if (!hoverPreviewEnabled) {
            onToggle(infoKey);
          }
        }}
        onFocus={() => onOpen(infoKey)}
        onBlur={() => {
          if (hoverPreviewEnabled) {
            onClose();
          }
        }}
        type="button"
      >
        i
      </button>
      {isOpen ? (
        <div
          className="spawn-card__info-popover"
          id={descriptionId}
          role="tooltip"
        >
          {entry.shortDescription}
        </div>
      ) : null}
    </div>
  );
}

const LEVA_SETTINGS_KEY = "cozy-room-leva-settings";

interface LevaSettings {
  minecraftTimeMinutes?: number;
  useMinecraftTimeToggle?: boolean;
  renderMode?: RenderMode;
  sunEnabled?: boolean;
  shadowsEnabled?: boolean;
  fogEnabled?: boolean;
  fogDensity?: number;
  ambientMultiplier?: number;
  sunIntensityMultiplier?: number;
  brightness?: number;
  saturation?: number;
  contrast?: number;
}

function getInitialLevaSettings(): LevaSettings {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") return {};
  try {
    const data = window.localStorage.getItem(LEVA_SETTINGS_KEY);
    return data ? (JSON.parse(data) as LevaSettings) : {};
  } catch {
    return {};
  }
}
const savedSettings = getInitialLevaSettings();

function App() {
  const initialSandboxState = useMemo(
    () =>
      loadPersistedSandboxState(
        DEFAULT_CAMERA_POSITION,
        DEFAULT_PLAYER_POSITION,
        createDefaultRoomState()
      ),
    []
  );
  const [buildModeEnabled, setBuildModeEnabled] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [gridSnapEnabled, setGridSnapEnabled] = useState(true);
  const [skinSrc, setSkinSrc] = useState<string | null>(initialSandboxState.skinSrc);
  const [skinError, setSkinError] = useState<string | null>(null);
  const [debugOpen, setDebugOpen] = useState(true);
  const [previewStudioOpen, setPreviewStudioOpen] = useState(false);
  const [previewStudioSelectedType, setPreviewStudioSelectedType] = useState<FurnitureType>("bed");
  const [openFurnitureInfoKey, setOpenFurnitureInfoKey] = useState<string | null>(null);
  const [hoverPreviewEnabled, setHoverPreviewEnabled] = useState(false);
  const [realTimeMinutes, setRealTimeMinutes] = useState(() => getLocalClockMinutes());
  const [minecraftTimeMinutes, setMinecraftTimeMinutes] = useState(savedSettings.minecraftTimeMinutes ?? 360); // Start at 6:00 AM
  const [useMinecraftTime, setUseMinecraftTime] = useState(savedSettings.useMinecraftTimeToggle ?? true);
  const [timeLocked, setTimeLocked] = useState(false);
  const [lockedTimeMinutes, setLockedTimeMinutes] = useState(() =>
    wrapClockMinutes(Math.round(getLocalClockMinutes()))
  );
  const worldTimeMinutes = timeLocked ? lockedTimeMinutes : (useMinecraftTime ? minecraftTimeMinutes : realTimeMinutes);
  const worldTimeLabel = useMemo(() => formatClock24h(worldTimeMinutes), [worldTimeMinutes]);
  const localTimeLabel = useMemo(() => formatClock24h(realTimeMinutes), [realTimeMinutes]);

  const [
    {
      renderMode,
      sunEnabled,
      shadowsEnabled,
      fogEnabled,
      fogDensity,
      ambientMultiplier,
      sunIntensityMultiplier,
      brightness,
      saturation,
      contrast
    },
    setWorldSettings
  ] = useControls(
    "World Settings",
    () => ({
      localClock: {
        value: localTimeLabel,
        editable: false,
        label: "Local Time"
      },
      worldClock: {
        value: worldTimeLabel,
        editable: false,
        label: "World Time"
      },
      useMinecraftTimeToggle: {
        value: useMinecraftTime,
        label: "Use Minecraft Time",
        onChange: (v: boolean) => setUseMinecraftTime(v)
      },
      renderMode: {
        value: savedSettings.renderMode ?? "basic",
        label: "Render Mode",
        options: {
          Basic: "basic",
          Cinematic: "cinematic"
        }
      },
      minecraftTime24h: {
        value: (minecraftTimeMinutes / 60) % 24,
        min: 0,
        max: 23.99,
        step: 0.1,
        label: "Minecraft Time (24h)",
        render: (get) => get("World Settings.useMinecraftTimeToggle"),
        onChange: (v: number, path: string, ctx: { initial: boolean }) => {
          if (!ctx.initial) {
            setMinecraftTimeMinutes(v * 60);
          }
        }
      },
      lockTimeOfDay: {
        value: timeLocked,
        label: "Lock Time",
        transient: false,
        onChange: (value: boolean, _path: string, context: { initial: boolean }) => {
          if (context.initial) {
            return;
          }

          if (value) {
            setLockedTimeMinutes(wrapClockMinutes(Math.round(realTimeMinutes)));
          }

          setTimeLocked(value);
        }
      },
      lockedTime24h: {
        value: minutesToControlHours(lockedTimeMinutes),
        min: 0,
        max: 23.983333333333334,
        step: 1 / 60,
        label: "Locked Time (24h)",
        render: (get) => get("World Settings.lockTimeOfDay"),
        transient: false,
        onChange: (value: number, _path: string, context: { initial: boolean }) => {
          if (context.initial) {
            return;
          }

          setLockedTimeMinutes(controlHoursToMinutes(value));
        }
      },
      syncLockToNow: button(() => {
        setTimeLocked(true);
        setLockedTimeMinutes(wrapClockMinutes(Math.round(realTimeMinutes)));
      }),
      sunEnabled: savedSettings.sunEnabled ?? true,
      shadowsEnabled: savedSettings.shadowsEnabled ?? true,
      "Sky & Atmosphere": folder({
        fogEnabled: savedSettings.fogEnabled ?? true,
        fogDensity: { value: savedSettings.fogDensity ?? 0.02, min: 0, max: 0.1, step: 0.001 }
      }),
      "Lighting & Shadows": folder({
        ambientMultiplier: { value: savedSettings.ambientMultiplier ?? 1.0, min: 0.0, max: 3.0, step: 0.1 },
        sunIntensityMultiplier: { value: savedSettings.sunIntensityMultiplier ?? 1.0, min: 0.0, max: 3.0, step: 0.1 }
      }),
      "Post-Processing": folder({
        brightness: { value: savedSettings.brightness ?? 1.0, min: 0.0, max: 2.0, step: 0.05 },
        saturation: { value: savedSettings.saturation ?? 1.0, min: 0.0, max: 2.0, step: 0.05 },
        contrast: { value: savedSettings.contrast ?? 1.0, min: 0.0, max: 2.0, step: 0.05 }
      })
    }),
    []
  );
  const normalizedRenderMode: RenderMode = renderMode === "cinematic" ? "cinematic" : "basic";
  const [cameraPosition, setCameraPosition] = useState<Vector3Tuple>(initialSandboxState.cameraPosition);
  const [playerPosition, setPlayerPosition] = useState<Vector3Tuple>(initialSandboxState.playerPosition);
  const [playerCoins, setPlayerCoins] = useState(initialSandboxState.playerCoins);
  const [roomState, setRoomState] = useState<RoomState>(initialSandboxState.roomState);
  const [liveFurniturePlacements, setLiveFurniturePlacements] = useState<RoomFurniturePlacement[]>(
    initialSandboxState.roomState.furniture
  );
  const [pendingSpawnOwnedFurnitureIds, setPendingSpawnOwnedFurnitureIds] = useState<string[]>([]);
  const [spawnRequest, setSpawnRequest] = useState<FurnitureSpawnRequest | null>(null);
  const [cameraResetToken, setCameraResetToken] = useState(0);
  const [standRequestToken, setStandRequestToken] = useState(0);
  const [playerInteractionStatus, setPlayerInteractionStatus] =
    useState<PlayerInteractionStatus>(null);
  const playerCoinsRef = useRef(initialSandboxState.playerCoins);
  const pendingSpawnOwnedFurnitureIdsRef = useRef(new Set<string>());
  const soldOwnedFurnitureIdsRef = useRef(new Set<string>());
  const skinInputRef = useRef<HTMLInputElement | null>(null);
  const nextSpawnRequestIdRef = useRef(1);

  useEffect(() => {
    const syncLocalClock = () => {
      setRealTimeMinutes(getLocalClockMinutes());
    };

    syncLocalClock();
    const localIntervalId = window.setInterval(syncLocalClock, 1000);

    return () => {
      window.clearInterval(localIntervalId);
    };
  }, []);

  useEffect(() => {
    if (!useMinecraftTime || timeLocked) {
      return;
    }

    let lastTime = Date.now();
    const syncMinecraftClock = () => {
      const now = Date.now();
      const deltaMs = now - lastTime;
      lastTime = now;
      const deltaGameMinutes = deltaMs * 0.0012; // 24 hours (1440 min) per 20 real minutes (1,200,000 ms) = 0.0012
      setMinecraftTimeMinutes((prev) => (prev + deltaGameMinutes) % 1440);
    };

    const mcIntervalId = window.setInterval(syncMinecraftClock, 250);

    return () => {
      window.clearInterval(mcIntervalId);
    };
  }, [timeLocked, useMinecraftTime]);

  useEffect(() => {
    setWorldSettings({
      localClock: localTimeLabel,
      worldClock: worldTimeLabel,
      useMinecraftTimeToggle: useMinecraftTime,
      renderMode: normalizedRenderMode,
      minecraftTime24h: (minecraftTimeMinutes / 60) % 24,
      lockTimeOfDay: timeLocked,
      lockedTime24h: minutesToControlHours(lockedTimeMinutes)
    });
  }, [
    localTimeLabel,
    lockedTimeMinutes,
    minecraftTimeMinutes,
    normalizedRenderMode,
    setWorldSettings,
    timeLocked,
    worldTimeLabel,
    useMinecraftTime
  ]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.localStorage === "undefined") return;
    try {
      window.localStorage.setItem(LEVA_SETTINGS_KEY, JSON.stringify({
        minecraftTimeMinutes,
        useMinecraftTimeToggle: useMinecraftTime,
        renderMode: normalizedRenderMode,
        sunEnabled,
        shadowsEnabled,
        fogEnabled,
        fogDensity,
        ambientMultiplier,
        sunIntensityMultiplier,
        brightness,
        saturation,
        contrast
      }));
    } catch {}
  }, [minecraftTimeMinutes, useMinecraftTime, normalizedRenderMode, sunEnabled, shadowsEnabled, fogEnabled, fogDensity, ambientMultiplier, sunIntensityMultiplier, brightness, saturation, contrast]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const handleChange = () => {
      setHoverPreviewEnabled(mediaQuery.matches);
    };

    handleChange();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (!target.closest(".spawn-card__info-wrap")) {
        setOpenFurnitureInfoKey(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const vectorsMatch = useCallback((first: Vector3Tuple, second: Vector3Tuple) => {
    return (
      Math.abs(first[0] - second[0]) < 0.0001 &&
      Math.abs(first[1] - second[1]) < 0.0001 &&
      Math.abs(first[2] - second[2]) < 0.0001
    );
  }, []);

  const placementListsMatch = useCallback(
    (first: RoomFurniturePlacement[], second: RoomFurniturePlacement[]) => {
      return (
        first.length === second.length &&
        first.every((placement, index) => {
          const other = second[index];

          return (
            placement.id === other.id &&
            placement.type === other.type &&
            placement.surface === other.surface &&
            placement.ownedFurnitureId === other.ownedFurnitureId &&
            placement.anchorFurnitureId === other.anchorFurnitureId &&
            Math.abs(placement.position[0] - other.position[0]) < 0.0001 &&
            Math.abs(placement.position[1] - other.position[1]) < 0.0001 &&
            Math.abs(placement.position[2] - other.position[2]) < 0.0001 &&
            Math.abs((placement.surfaceLocalOffset?.[0] ?? 0) - (other.surfaceLocalOffset?.[0] ?? 0)) < 0.0001 &&
            Math.abs((placement.surfaceLocalOffset?.[1] ?? 0) - (other.surfaceLocalOffset?.[1] ?? 0)) < 0.0001 &&
            Math.abs(placement.rotationY - other.rotationY) < 0.0001
          );
        })
      );
    },
    []
  );

  useEffect(() => {
    savePersistedSandboxState({
      version: 3,
      skinSrc,
      cameraPosition,
      playerPosition,
      playerCoins,
      roomState
    });
  }, [cameraPosition, playerCoins, playerPosition, roomState, skinSrc]);

  const catalogSections = useMemo(() => {
    const grouped = new Map<FurnitureCatalogCategory, FurnitureDefinition[]>();

    (Object.values(FURNITURE_REGISTRY) as Array<(typeof FURNITURE_REGISTRY)[FurnitureType]>).forEach(
      (entry) => {
        const currentItems = grouped.get(entry.category) ?? [];
        currentItems.push(entry);
        grouped.set(entry.category, currentItems);
      }
    );

    return Array.from(grouped.entries());
  }, []);

  const inventoryByType = useMemo(() => {
    const placedOwnedFurnitureIds = getPlacedOwnedFurnitureIds(liveFurniturePlacements);
    pendingSpawnOwnedFurnitureIds.forEach((ownedFurnitureId) => {
      placedOwnedFurnitureIds.add(ownedFurnitureId);
    });
    const nextInventory = new Map<FurnitureType, InventoryStats>();

    roomState.ownedFurniture.forEach((ownedFurniture) => {
      const currentStats = nextInventory.get(ownedFurniture.type) ?? {
        storedItems: [],
        storedCount: 0,
        placedCount: 0,
        totalCount: 0
      };

      currentStats.totalCount += 1;

      if (placedOwnedFurnitureIds.has(ownedFurniture.id)) {
        currentStats.placedCount += 1;
      } else {
        currentStats.storedCount += 1;
        currentStats.storedItems.push(ownedFurniture);
      }

      nextInventory.set(ownedFurniture.type, currentStats);
    });

    return nextInventory;
  }, [liveFurniturePlacements, pendingSpawnOwnedFurnitureIds, roomState.ownedFurniture]);

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

  const openPreviewStudio = useCallback((type: FurnitureType) => {
    setPreviewStudioSelectedType(type);
    setPreviewStudioOpen(true);
    setCatalogOpen(false);
  }, []);

  const handleOpenFurnitureInfo = useCallback((infoKey: string) => {
    setOpenFurnitureInfoKey(infoKey);
  }, []);

  const handleCloseFurnitureInfo = useCallback(() => {
    setOpenFurnitureInfoKey(null);
  }, []);

  const handleToggleFurnitureInfo = useCallback((infoKey: string) => {
    setOpenFurnitureInfoKey((currentKey) => (currentKey === infoKey ? null : infoKey));
  }, []);

  function handleSkinImport(): void {
    skinInputRef.current?.click();
  }

  function handleSkinFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== "image/png") {
      setSkinError("Use a PNG skin file in the normal Minecraft format.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        setSkinError("That skin file could not be read.");
        return;
      }

      const image = new Image();
      image.onload = () => {
        if (image.width !== 64 || (image.height !== 64 && image.height !== 32)) {
          setSkinError("Use a 64x64 or 64x32 Minecraft skin PNG.");
          return;
        }

        setSkinSrc(result);
        setSkinError(null);
      };
      image.onerror = () => {
        setSkinError("That skin image could not be loaded.");
      };
      image.src = result;
    };

    reader.onerror = () => {
      setSkinError("That skin file could not be read.");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function commitPlayerCoins(nextCoins: number): void {
    const normalizedCoins = Math.max(0, Math.floor(nextCoins));
    playerCoinsRef.current = normalizedCoins;
    setPlayerCoins(normalizedCoins);
  }

  function trySpendCoins(cost: number): boolean {
    if (playerCoinsRef.current < cost) {
      return false;
    }

    commitPlayerCoins(playerCoinsRef.current - cost);
    return true;
  }

  function addCoins(amount: number): void {
    commitPlayerCoins(playerCoinsRef.current + amount);
  }

  const updatePendingSpawnOwnedFurnitureIds = useCallback(
    (updater: (currentIds: string[]) => string[]): void => {
      setPendingSpawnOwnedFurnitureIds((currentIds) => {
        const nextIds = updater(currentIds);
        pendingSpawnOwnedFurnitureIdsRef.current = new Set(nextIds);
        return nextIds;
      });
    },
    []
  );

  function handleBuyFurniture(type: FurnitureType): void {
    const buyPrice = FURNITURE_REGISTRY[type].price;

    if (!trySpendCoins(buyPrice)) {
      return;
    }

    setRoomState((currentRoomState) => ({
      ...currentRoomState,
      ownedFurniture: [...currentRoomState.ownedFurniture, createOwnedFurnitureItem(type)]
    }));
  }

  function handleSpawnFurniture(type: FurnitureType, ownedFurnitureId: string): void {
    if (
      pendingSpawnOwnedFurnitureIdsRef.current.has(ownedFurnitureId) ||
      getPlacedOwnedFurnitureIds(liveFurniturePlacements).has(ownedFurnitureId)
    ) {
      return;
    }

    setBuildModeEnabled(true);
    setCatalogOpen(true);
    pendingSpawnOwnedFurnitureIdsRef.current.add(ownedFurnitureId);
    updatePendingSpawnOwnedFurnitureIds((currentIds) =>
      currentIds.includes(ownedFurnitureId) ? currentIds : [...currentIds, ownedFurnitureId]
    );
    setSpawnRequest({
      requestId: nextSpawnRequestIdRef.current,
      type,
      ownedFurnitureId
    });
    nextSpawnRequestIdRef.current += 1;
  }

  function handlePlaceStoredFurniture(type: FurnitureType): void {
    const nextStoredOwnedFurniture = inventoryByType
      .get(type)
      ?.storedItems.find(
        (ownedFurniture) => !pendingSpawnOwnedFurnitureIdsRef.current.has(ownedFurniture.id)
      );

    if (!nextStoredOwnedFurniture) {
      return;
    }

    handleSpawnFurniture(type, nextStoredOwnedFurniture.id);
  }

  function handleSellStoredFurniture(type: FurnitureType): void {
    const storedItems = (inventoryByType.get(type)?.storedItems ?? []).filter(
      (ownedFurniture) => !pendingSpawnOwnedFurnitureIdsRef.current.has(ownedFurniture.id)
    );
    const nextSellItem =
      storedItems.find((item) => getOwnedFurnitureSellPrice(item) > 0) ?? storedItems[0];

    if (!nextSellItem) {
      return;
    }

    if (soldOwnedFurnitureIdsRef.current.has(nextSellItem.id)) {
      return;
    }

    const sellPrice = getOwnedFurnitureSellPrice(nextSellItem);
    soldOwnedFurnitureIdsRef.current.add(nextSellItem.id);

    setRoomState((currentRoomState) => ({
      ...currentRoomState,
      ownedFurniture: currentRoomState.ownedFurniture.filter(
        (ownedFurniture) => ownedFurniture.id !== nextSellItem.id
      )
    }));
    updatePendingSpawnOwnedFurnitureIds((currentIds) =>
      currentIds.filter((ownedFurnitureId) => ownedFurnitureId !== nextSellItem.id)
    );

    if (sellPrice > 0) {
      addCoins(sellPrice);
    }
  }

  function handleResetCamera(): void {
    setCameraPosition(DEFAULT_CAMERA_POSITION);
    setCameraResetToken((current) => current + 1);
  }

  const handleCommittedFurnitureChange = useCallback((placements: RoomFurniturePlacement[]): void => {
    setRoomState((currentRoomState) => {
      if (placementListsMatch(currentRoomState.furniture, placements)) {
        return currentRoomState;
      }

      return {
        ...currentRoomState,
        furniture: placements
      };
    });
  }, [placementListsMatch]);

  const handleFurnitureSnapshotChange = useCallback((placements: RoomFurniturePlacement[]): void => {
    const placedOwnedFurnitureIds = getPlacedOwnedFurnitureIds(placements);

    updatePendingSpawnOwnedFurnitureIds((currentIds) =>
      currentIds.filter((ownedFurnitureId) => !placedOwnedFurnitureIds.has(ownedFurnitureId))
    );
    setLiveFurniturePlacements((currentPlacements) =>
      placementListsMatch(currentPlacements, placements) ? currentPlacements : placements
    );
  }, [placementListsMatch, updatePendingSpawnOwnedFurnitureIds]);

  const handleCameraPositionChange = useCallback((position: Vector3Tuple): void => {
    setCameraPosition((currentPosition) =>
      vectorsMatch(currentPosition, position) ? currentPosition : position
    );
  }, [vectorsMatch]);

  const handlePlayerPositionChange = useCallback((position: Vector3Tuple): void => {
    setPlayerPosition((currentPosition) =>
      vectorsMatch(currentPosition, position) ? currentPosition : position
    );
  }, [vectorsMatch]);

  function handleResetSandbox(): void {
    const nextSandbox = createDefaultSandboxState(DEFAULT_CAMERA_POSITION, DEFAULT_PLAYER_POSITION);

    setCameraPosition(nextSandbox.cameraPosition);
    setPlayerPosition(nextSandbox.playerPosition);
    setSkinSrc(nextSandbox.skinSrc);
    commitPlayerCoins(nextSandbox.playerCoins);
    setRoomState(nextSandbox.roomState);
    setLiveFurniturePlacements(nextSandbox.roomState.furniture);
    pendingSpawnOwnedFurnitureIdsRef.current.clear();
    soldOwnedFurnitureIdsRef.current.clear();
    setPendingSpawnOwnedFurnitureIds([]);
    setSpawnRequest(null);
    setBuildModeEnabled(false);
    setCatalogOpen(false);
    setGridSnapEnabled(true);
    setPlayerInteractionStatus(null);
    setCameraResetToken((current) => current + 1);
  }

  const [, setLiveCoords] = useControls("Live Coordinates", () => ({
    Player: folder({
      pX: { value: playerPosition[0], label: 'x', onChange: (v) => { if (typeof v === 'number') setPlayerPosition(prev => [v, prev[1], prev[2]]) } },
      pY: { value: playerPosition[1], label: 'y', onChange: (v) => { if (typeof v === 'number') setPlayerPosition(prev => [prev[0], v, prev[2]]) } },
      pZ: { value: playerPosition[2], label: 'z', onChange: (v) => { if (typeof v === 'number') setPlayerPosition(prev => [prev[0], prev[1], v]) } }
    }),
    Camera: folder({
      cX: { value: cameraPosition[0], label: 'x', onChange: (v) => { if (typeof v === 'number') setCameraPosition(prev => [v, prev[1], prev[2]]) } },
      cY: { value: cameraPosition[1], label: 'y', onChange: (v) => { if (typeof v === 'number') setCameraPosition(prev => [prev[0], v, prev[2]]) } },
      cZ: { value: cameraPosition[2], label: 'z', onChange: (v) => { if (typeof v === 'number') setCameraPosition(prev => [prev[0], prev[1], v]) } }
    })
  }));

  const [, setRoomStateUI] = useControls("Room State", () => ({
    Theme: { value: roomState.metadata.roomTheme, editable: false },
    Layout: { value: `v${roomState.metadata.layoutVersion}`, editable: false },
    Items: { value: `${roomState.furniture.length}`, editable: false },
    Owned: { value: `${roomState.ownedFurniture.length}`, editable: false },
    Stored: { value: `${storedInventoryCount}`, editable: false },
    Coins: { value: `${playerCoins}`, editable: false }
  }));

  useEffect(() => {
    setLiveCoords({
      pX: playerPosition[0],
      pY: playerPosition[1],
      pZ: playerPosition[2],
      cX: cameraPosition[0],
      cY: cameraPosition[1],
      cZ: cameraPosition[2]
    } as any);
  }, [playerPosition, cameraPosition, setLiveCoords]);

  useEffect(() => {
    setRoomStateUI({
      Theme: roomState.metadata.roomTheme,
      Layout: `v${roomState.metadata.layoutVersion}`,
      Items: `${roomState.furniture.length}`,
      Owned: `${roomState.ownedFurniture.length}`,
      Stored: `${storedInventoryCount}`,
      Coins: `${playerCoins}`
    });
  }, [playerCoins, roomState, setRoomStateUI, storedInventoryCount]);

  return (
    <>
      <Leva hidden={!debugOpen} />
      <div className="scene-shell">
      <div className="scene-toolbar">
        <button
          className={`camera-toggle${buildModeEnabled ? " camera-toggle--active" : ""}`}
          disabled={playerInteractionStatus !== null && !buildModeEnabled}
          onClick={() =>
            setBuildModeEnabled((current) => {
              if (!current && playerInteractionStatus) {
                return current;
              }

              const nextValue = !current;

              if (!nextValue) {
                setCatalogOpen(false);
              }

              return nextValue;
            })
          }
          type="button"
        >
          {buildModeEnabled ? "Build Mode: On" : "Build Mode: Off"}
        </button>
        <button
          className={`camera-toggle${catalogOpen ? " camera-toggle--active" : ""}`}
          disabled={playerInteractionStatus !== null}
          onClick={() => {
            if (playerInteractionStatus) {
              return;
            }

            setBuildModeEnabled(true);
            setCatalogOpen((current) => !current);
          }}
          type="button"
        >
          {catalogOpen ? "Inventory: On" : "Inventory: Off"}
        </button>
        <button
          className={`camera-toggle${gridSnapEnabled ? " camera-toggle--active" : ""}`}
          onClick={() => setGridSnapEnabled((current) => !current)}
          type="button"
        >
          {gridSnapEnabled ? "Grid Snap: On" : "Grid Snap: Off"}
        </button>
        <div className="camera-toggle camera-toggle--status">
          Coins: {playerCoins}
        </div>
        <div className="camera-toggle camera-toggle--status">
          {timeLocked ? `Time Locked: ${worldTimeLabel}` : `Time: ${worldTimeLabel}`}
        </div>
        <button className="camera-toggle" onClick={handleSkinImport} type="button">
          Import Minecraft Skin
        </button>
        <button
          className={`camera-toggle${previewStudioOpen ? " camera-toggle--active" : ""}`}
          onClick={() => setPreviewStudioOpen((current) => !current)}
          type="button"
        >
          {previewStudioOpen ? "Preview Studio: On" : "Preview Studio"}
        </button>
        <button className="camera-toggle" onClick={handleResetCamera} type="button">
          Reset Camera
        </button>
        <button className="camera-toggle" onClick={handleResetSandbox} type="button">
          Reset Room
        </button>
        {playerInteractionStatus ? (
          <button
            className="camera-toggle camera-toggle--active"
            onClick={() => setStandRequestToken((current) => current + 1)}
            type="button"
          >
            {playerInteractionStatus.phase === "active"
              ? `Stand Up (${playerInteractionStatus.label})`
              : `Cancel ${playerInteractionStatus.label}`}
          </button>
        ) : null}
        <button
          className={`camera-toggle${debugOpen ? " camera-toggle--active" : ""}`}
          onClick={() => setDebugOpen((current) => !current)}
          type="button"
        >
          {debugOpen ? "Dev Panel: On" : "Dev Panel: Off"}
        </button>
      </div>

      {catalogOpen ? (
        <aside className="spawn-panel">
          <div className="spawn-panel__header">
            <span className="spawn-panel__title">Room Inventory</span>
            <span className="spawn-panel__coins">{playerCoins} coins</span>
          </div>
          <p className="spawn-panel__meta">
            Buy furniture with coins, place stored items into the room, and sell extras you do not need.
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
                              onOpenStudio={() => openPreviewStudio(entry.type)}
                              previewSrc={entry.shopPreviewSrc}
                              previewScale={entry.shopPreviewScale}
                            />
                            <div className="spawn-card__content">
                              <div className="spawn-card__header-row">
                                <strong>{entry.label}</strong>
                                <span className="spawn-card__price">{entry.price} coins</span>
                              </div>
                              <div className="spawn-card__stats">
                                <span className="spawn-card__stat">{`${inventoryStats?.storedCount ?? 0} stored`}</span>
                                <span className="spawn-card__stat">{`${inventoryStats?.placedCount ?? 0} in room`}</span>
                              </div>
                              <span className="spawn-card__hint">
                                {sellPrice > 0
                                  ? `Sell one stored copy for ${sellPrice} coins.`
                                  : "Starter furniture can be removed, but it does not refund coins."}
                              </span>
                              <div className="spawn-card__actions">
                                <button
                                  className="spawn-card__button"
                                  onClick={() => handlePlaceStoredFurniture(entry.type)}
                                  type="button"
                                >
                                  Place
                                </button>
                                <button
                                  className="spawn-card__button spawn-card__button--secondary"
                                  onClick={() => handleSellStoredFurniture(entry.type)}
                                  type="button"
                                >
                                  {sellPrice > 0 ? `Sell +${sellPrice}` : "Remove"}
                                </button>
                                <FurnitureInfoControl
                                  entry={entry}
                                  hoverPreviewEnabled={hoverPreviewEnabled}
                                  infoKey={`stored:${entry.type}`}
                                  isOpen={openFurnitureInfoKey === `stored:${entry.type}`}
                                  onClose={handleCloseFurnitureInfo}
                                  onOpen={handleOpenFurnitureInfo}
                                  onToggle={handleToggleFurnitureInfo}
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
              <div className="spawn-empty">No stored items yet. Add something from the catalog below.</div>
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
                        onOpenStudio={() => openPreviewStudio(entry.type)}
                        previewSrc={entry.shopPreviewSrc}
                        previewScale={entry.shopPreviewScale}
                      />
                      <div className="spawn-card__content">
                        <div className="spawn-card__header-row">
                          <strong>{entry.label}</strong>
                          <span className="spawn-card__price">{entry.price} coins</span>
                        </div>
                        <div className="spawn-card__stats">
                          <span className="spawn-card__stat">{`${inventoryStats?.storedCount ?? 0} stored`}</span>
                          <span className="spawn-card__stat">{`${inventoryStats?.placedCount ?? 0} in room`}</span>
                        </div>
                        <span className="spawn-card__hint">
                          Costs {entry.price} coins. Purchased copies refund their full price for now.
                        </span>
                        <div className="spawn-card__actions">
                          <button
                            className="spawn-card__button"
                            disabled={!canAffordPurchase}
                            onClick={() => handleBuyFurniture(entry.type)}
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
                            onClose={handleCloseFurnitureInfo}
                            onOpen={handleOpenFurnitureInfo}
                            onToggle={handleToggleFurnitureInfo}
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
      ) : null}

      {previewStudioOpen ? (
        <Suspense fallback={<div className="preview-studio preview-studio--loading">Loading preview studio...</div>}>
          <FurniturePreviewStudio
            catalogSections={catalogSections}
            onClose={() => setPreviewStudioOpen(false)}
            onSelectTypeChange={setPreviewStudioSelectedType}
            selectedType={previewStudioSelectedType}
          />
        </Suspense>
      ) : null}

      {skinError ? <div className="scene-note">{skinError}</div> : null}



      <input
        ref={skinInputRef}
        type="file"
        accept=".png,image/png"
        className="hidden-input"
        onChange={handleSkinFileChange}
      />

      <Suspense fallback={<div className="canvas-fallback">Loading scene...</div>}>
        <RoomView
          buildModeEnabled={buildModeEnabled}
          gridSnapEnabled={gridSnapEnabled}
          spawnRequest={spawnRequest}
          cameraResetToken={cameraResetToken}
          standRequestToken={standRequestToken}
          initialCameraPosition={cameraPosition}
          initialPlayerPosition={playerPosition}
          initialFurniturePlacements={roomState.furniture}
          skinSrc={skinSrc}
          worldTimeMinutes={worldTimeMinutes}
          renderMode={normalizedRenderMode}
          sunEnabled={sunEnabled}
          shadowsEnabled={shadowsEnabled}
          fogEnabled={fogEnabled}
          fogDensity={fogDensity}
          ambientMultiplier={ambientMultiplier}
          sunIntensityMultiplier={sunIntensityMultiplier}
          brightness={brightness}
          saturation={saturation}
          contrast={contrast}
          onCameraPositionChange={handleCameraPositionChange}
          onPlayerPositionChange={handlePlayerPositionChange}
          onFurnitureSnapshotChange={handleFurnitureSnapshotChange}
          onCommittedFurnitureChange={handleCommittedFurnitureChange}
          onInteractionStateChange={setPlayerInteractionStatus}
        />
      </Suspense>
    </div>
    </>
  );
}

export default App;
