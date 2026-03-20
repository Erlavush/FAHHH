import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createDefaultSandboxState,
  loadPersistedSandboxState,
  savePersistedSandboxState
} from "./lib/devLocalState";
import {
  FURNITURE_REGISTRY,
  type FurnitureType
} from "./lib/furnitureRegistry";
import {
  createOwnedFurnitureItem,
  createDefaultRoomState,
  getPlacedOwnedFurnitureIds,
  type RoomFurniturePlacement,
  type RoomState,
  type Vector3Tuple
} from "./lib/roomState";
import { getOwnedFurnitureSellPrice } from "./lib/economy";
import { folder, Leva, useControls } from "leva";
import { PcMinigameOverlay } from "./components/PcMinigameOverlay";
import {
  applyPcMinigameResult,
  type PcMinigameResult
} from "./lib/pcMinigame";
import { DEFAULT_CAMERA_POSITION, DEFAULT_PLAYER_POSITION } from "./app/constants";
import { InventoryPanel } from "./app/components/InventoryPanel";
import { SceneToolbar } from "./app/components/SceneToolbar";
import { useFurnitureInfoPopover } from "./app/hooks/useFurnitureInfoPopover";
import { useSandboxInventory } from "./app/hooks/useSandboxInventory";
import { useSkinImport } from "./app/hooks/useSkinImport";
import { useSandboxWorldClock } from "./app/hooks/useSandboxWorldClock";
import type {
  FurnitureSpawnRequest,
  PlayerInteractionStatus
} from "./app/types";
import {
  placementListsMatch,
  vectorsMatch
} from "./lib/roomPlacementEquality";

const RoomView = lazy(async () => {
  const module = await import("./components/RoomView");
  return { default: module.RoomView };
});

const FurniturePreviewStudio = lazy(async () => {
  const module = await import("./components/FurniturePreviewStudio");
  return { default: module.FurniturePreviewStudio };
});

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
  const [debugOpen, setDebugOpen] = useState(true);
  const [previewStudioOpen, setPreviewStudioOpen] = useState(false);
  const [previewStudioSelectedType, setPreviewStudioSelectedType] = useState<FurnitureType>("bed");
  const {
    skinSrc,
    setSkinSrc,
    skinError,
    skinInputRef,
    handleSkinImport,
    handleSkinFileChange
  } = useSkinImport(initialSandboxState.skinSrc);
  const {
    hoverPreviewEnabled,
    openFurnitureInfoKey,
    handleOpenFurnitureInfo,
    handleCloseFurnitureInfo,
    handleToggleFurnitureInfo
  } = useFurnitureInfoPopover();
  const {
    worldTimeMinutes,
    worldTimeLabel,
    timeLocked,
    sunEnabled,
    shadowsEnabled,
    fogEnabled,
    fogDensity,
    ambientMultiplier,
    sunIntensityMultiplier,
    brightness,
    saturation,
    contrast
  } = useSandboxWorldClock();
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
  const [pcMinigameProgress, setPcMinigameProgress] = useState(initialSandboxState.pcMinigame);
  const playerCoinsRef = useRef(initialSandboxState.playerCoins);
  const pendingSpawnOwnedFurnitureIdsRef = useRef(new Set<string>());
  const soldOwnedFurnitureIdsRef = useRef(new Set<string>());
  const nextSpawnRequestIdRef = useRef(1);
  const {
    catalogSections,
    inventoryByType,
    storedInventorySections,
    storedInventoryCount
  } = useSandboxInventory(
    roomState.ownedFurniture,
    liveFurniturePlacements,
    pendingSpawnOwnedFurnitureIds
  );

  useEffect(() => {
    savePersistedSandboxState({
      version: 4,
      skinSrc,
      cameraPosition,
      playerPosition,
      playerCoins,
      roomState,
      pcMinigame: pcMinigameProgress
    });
  }, [cameraPosition, pcMinigameProgress, playerCoins, playerPosition, roomState, skinSrc]);

  const openPreviewStudio = useCallback((type: FurnitureType) => {
    setPreviewStudioSelectedType(type);
    setPreviewStudioOpen(true);
    setCatalogOpen(false);
  }, []);

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

  const handlePcMinigameComplete = useCallback((result: PcMinigameResult): void => {
    setPcMinigameProgress((currentProgress) => applyPcMinigameResult(currentProgress, result));
    addCoins(result.rewardCoins);
  }, []);

  const handleExitPcMinigame = useCallback((): void => {
    setStandRequestToken((currentToken) => currentToken + 1);
  }, []);

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

  const handleToggleBuildMode = useCallback(() => {
    setBuildModeEnabled((current) => {
      if (!current && playerInteractionStatus) {
        return current;
      }

      const nextValue = !current;

      if (!nextValue) {
        setCatalogOpen(false);
      }

      return nextValue;
    });
  }, [playerInteractionStatus]);

  const handleToggleCatalog = useCallback(() => {
    if (playerInteractionStatus) {
      return;
    }

    setBuildModeEnabled(true);
    setCatalogOpen((current) => !current);
  }, [playerInteractionStatus]);

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
  }, []);

  const handleFurnitureSnapshotChange = useCallback((placements: RoomFurniturePlacement[]): void => {
    const placedOwnedFurnitureIds = getPlacedOwnedFurnitureIds(placements);

    updatePendingSpawnOwnedFurnitureIds((currentIds) =>
      currentIds.filter((ownedFurnitureId) => !placedOwnedFurnitureIds.has(ownedFurnitureId))
    );
    setLiveFurniturePlacements((currentPlacements) =>
      placementListsMatch(currentPlacements, placements) ? currentPlacements : placements
    );
  }, [updatePendingSpawnOwnedFurnitureIds]);

  const handleCameraPositionChange = useCallback((position: Vector3Tuple): void => {
    setCameraPosition((currentPosition) =>
      vectorsMatch(currentPosition, position) ? currentPosition : position
    );
  }, []);

  const handlePlayerPositionChange = useCallback((position: Vector3Tuple): void => {
    setPlayerPosition((currentPosition) =>
      vectorsMatch(currentPosition, position) ? currentPosition : position
    );
  }, []);

  function handleResetSandbox(): void {
    const nextSandbox = createDefaultSandboxState(DEFAULT_CAMERA_POSITION, DEFAULT_PLAYER_POSITION);

    setCameraPosition(nextSandbox.cameraPosition);
    setPlayerPosition(nextSandbox.playerPosition);
    setSkinSrc(nextSandbox.skinSrc);
    commitPlayerCoins(nextSandbox.playerCoins);
    setRoomState(nextSandbox.roomState);
    setPcMinigameProgress(nextSandbox.pcMinigame);
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
      pX: { value: playerPosition[0], label: "x", onChange: (v) => { if (typeof v === "number") setPlayerPosition(prev => [v, prev[1], prev[2]]) } },
      pY: { value: playerPosition[1], label: "y", onChange: (v) => { if (typeof v === "number") setPlayerPosition(prev => [prev[0], v, prev[2]]) } },
      pZ: { value: playerPosition[2], label: "z", onChange: (v) => { if (typeof v === "number") setPlayerPosition(prev => [prev[0], prev[1], v]) } }
    }),
    Camera: folder({
      cX: { value: cameraPosition[0], label: "x", onChange: (v) => { if (typeof v === "number") setCameraPosition(prev => [v, prev[1], prev[2]]) } },
      cY: { value: cameraPosition[1], label: "y", onChange: (v) => { if (typeof v === "number") setCameraPosition(prev => [prev[0], v, prev[2]]) } },
      cZ: { value: cameraPosition[2], label: "z", onChange: (v) => { if (typeof v === "number") setCameraPosition(prev => [prev[0], prev[1], v]) } }
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

  const pcMinigameActive =
    playerInteractionStatus?.phase === "active" &&
    playerInteractionStatus.interactionType === "use_pc";

  return (
    <>
      <Leva hidden={!debugOpen} />
      <div className="scene-shell">
        <SceneToolbar
          buildModeEnabled={buildModeEnabled}
          catalogOpen={catalogOpen}
          debugOpen={debugOpen}
          gridSnapEnabled={gridSnapEnabled}
          onImportSkin={handleSkinImport}
          onResetCamera={handleResetCamera}
          onResetRoom={handleResetSandbox}
          onStandRequest={() => setStandRequestToken((current) => current + 1)}
          onToggleBuildMode={handleToggleBuildMode}
          onToggleCatalog={handleToggleCatalog}
          onToggleDebug={() => setDebugOpen((current) => !current)}
          onToggleGridSnap={() => setGridSnapEnabled((current) => !current)}
          onTogglePreviewStudio={() => setPreviewStudioOpen((current) => !current)}
          playerCoins={playerCoins}
          playerInteractionStatus={playerInteractionStatus}
          previewStudioOpen={previewStudioOpen}
          timeLocked={timeLocked}
          worldTimeLabel={worldTimeLabel}
        />

        {catalogOpen ? (
          <InventoryPanel
            catalogSections={catalogSections}
            hoverPreviewEnabled={hoverPreviewEnabled}
            inventoryByType={inventoryByType}
            onBuyFurniture={handleBuyFurniture}
            onCloseFurnitureInfo={handleCloseFurnitureInfo}
            onOpenFurnitureInfo={handleOpenFurnitureInfo}
            onOpenStudio={openPreviewStudio}
            onPlaceStoredFurniture={handlePlaceStoredFurniture}
            onSellStoredFurniture={handleSellStoredFurniture}
            onToggleFurnitureInfo={handleToggleFurnitureInfo}
            openFurnitureInfoKey={openFurnitureInfoKey}
            playerCoins={playerCoins}
            storedInventorySections={storedInventorySections}
          />
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
        {pcMinigameActive ? (
          <PcMinigameOverlay
            currentCoins={playerCoins}
            onComplete={handlePcMinigameComplete}
            onExit={handleExitPcMinigame}
            progress={pcMinigameProgress}
          />
        ) : null}
      </div>
    </>
  );
}

export default App;