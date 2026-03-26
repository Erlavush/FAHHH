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
import { buildSharedRoomOwnerId } from "./lib/sharedRoomSeed";
import { getOwnedFurnitureSellPrice } from "./lib/economy";
import { Leva } from "leva";
import { PcMinigameOverlay } from "./components/PcMinigameOverlay";
import {
  applyPcMinigameResult,
  type PcMinigameResult
} from "./lib/pcMinigame";
import {
  ALL_PET_TYPES,
  PET_REGISTRY,
  createOwnedPet,
  type OwnedPet,
  type PetType
} from "./lib/pets";
import { pickPetSpawnPosition } from "./lib/petPathing";
import { DEFAULT_CAMERA_POSITION, DEFAULT_PLAYER_POSITION } from "./app/constants";
import { InventoryPanel } from "./app/components/InventoryPanel";
import { DevPanel } from "./app/components/DevPanel";
import { SceneToolbar } from "./app/components/SceneToolbar";
import { SharedRoomEntryShell } from "./app/components/SharedRoomEntryShell";
import { SharedRoomStatusStrip } from "./app/components/SharedRoomStatusStrip";
import { SharedRoomBlockingOverlay } from "./app/components/SharedRoomBlockingOverlay";
import { useFurnitureInfoPopover } from "./app/hooks/useFurnitureInfoPopover";
import { useSharedRoomPresence } from "./app/hooks/useSharedRoomPresence";
import {
  shouldCommitSharedRoomChange,
  useSharedRoomRuntime
} from "./app/hooks/useSharedRoomRuntime";
import { useSandboxInventory } from "./app/hooks/useSandboxInventory";
import { useSkinImport } from "./app/hooks/useSkinImport";
import { useSandboxWorldClock } from "./app/hooks/useSandboxWorldClock";
import type {
  FurnitureSpawnRequest,
  LocalPlayerPresenceSnapshot,
  PlayerInteractionStatus,
  PreviewStudioMode,
  SceneJumpRequest
} from "./app/types";
import { ROOM_CAMERA_TARGET } from "./lib/sceneTargets";
import { PerformanceMonitor } from "./app/components/PerformanceMonitor";
import {
  loadPersistedWorldSettings,
  savePersistedWorldSettings
} from "./lib/devWorldSettings";
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

function setVectorAxis(position: Vector3Tuple, axis: 0 | 1 | 2, nextValue: number): Vector3Tuple {
  if (axis === 0) {
    return [nextValue, position[1], position[2]];
  }

  if (axis === 1) {
    return [position[0], nextValue, position[2]];
  }

  return [position[0], position[1], nextValue];
}

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
  const initialWorldSettings = useMemo(() => loadPersistedWorldSettings(), []);
  const [buildModeEnabled, setBuildModeEnabled] = useState(
    initialWorldSettings.buildModeEnabled ?? false
  );
  const [catalogOpen, setCatalogOpen] = useState(initialWorldSettings.catalogOpen ?? false);
  const [gridSnapEnabled, setGridSnapEnabled] = useState(
    initialWorldSettings.gridSnapEnabled ?? true
  );
  const [debugOpen, setDebugOpen] = useState(initialWorldSettings.debugOpen ?? true);
  const [previewStudioOpen, setPreviewStudioOpen] = useState(
    initialWorldSettings.previewStudioOpen ?? false
  );
  const [previewStudioMode, setPreviewStudioMode] = useState<PreviewStudioMode>(
    initialWorldSettings.previewStudioMode ?? "furniture"
  );
  const [previewStudioSelectedType, setPreviewStudioSelectedType] = useState<FurnitureType>(
    initialWorldSettings.previewStudioSelectedType ?? "bed"
  );
  const [previewStudioSelectedMobId, setPreviewStudioSelectedMobId] = useState(
    initialWorldSettings.previewStudioSelectedMobId ?? "better_cats_v4_tabby"
  );
  const [devPanelBuildSettingsCollapsed, setDevPanelBuildSettingsCollapsed] = useState(
    initialWorldSettings.devPanelBuildSettingsCollapsed ?? false
  );
  const [devPanelPlayerStateCollapsed, setDevPanelPlayerStateCollapsed] = useState(
    initialWorldSettings.devPanelPlayerStateCollapsed ?? false
  );
  const [devPanelPlayerCoordinatesCollapsed, setDevPanelPlayerCoordinatesCollapsed] = useState(
    initialWorldSettings.devPanelPlayerCoordinatesCollapsed ?? false
  );
  const [devPanelCameraPropertiesCollapsed, setDevPanelCameraPropertiesCollapsed] = useState(
    initialWorldSettings.devPanelCameraPropertiesCollapsed ?? false
  );
  const [devPanelWorldSettingsCollapsed, setDevPanelWorldSettingsCollapsed] = useState(
    initialWorldSettings.devPanelWorldSettingsCollapsed ?? false
  );
  const [devPanelLightingFxCollapsed, setDevPanelLightingFxCollapsed] = useState(
    initialWorldSettings.devPanelLightingFxCollapsed ?? false
  );
  const [devPanelCollisionDebugCollapsed, setDevPanelCollisionDebugCollapsed] = useState(
    initialWorldSettings.devPanelCollisionDebugCollapsed ?? false
  );
  const [devPanelActionsCollapsed, setDevPanelActionsCollapsed] = useState(
    initialWorldSettings.devPanelActionsCollapsed ?? false
  );
  const [showCollisionDebug, setShowCollisionDebug] = useState(
    initialWorldSettings.showCollisionDebug ?? false
  );
  const [showPlayerCollider, setShowPlayerCollider] = useState(
    initialWorldSettings.showPlayerCollider ?? true
  );
  const [showInteractionMarkers, setShowInteractionMarkers] = useState(
    initialWorldSettings.showInteractionMarkers ?? true
  );
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
    useMinecraftTime,
    minecraftTimeHours,
    timeLocked,
    lockedTimeHours,
    sunEnabled,
    shadowsEnabled,
    fogEnabled,
    fogDensity,
    ambientMultiplier,
    sunIntensityMultiplier,
    brightness,
    saturation,
    contrast,
    setUseMinecraftTime,
    setMinecraftTimeHours,
    setTimeLockedEnabled,
    setLockedTimeHours,
    syncLockedTimeToLocalTime,
    setSunEnabled,
    setShadowsEnabled,
    setFogEnabled,
    setFogDensity,
    setAmbientMultiplier,
    setSunIntensityMultiplier,
    setBrightness,
    setSaturation,
    setContrast
  } = useSandboxWorldClock();
  const sharedRoomRuntime = useSharedRoomRuntime({
    devBootstrapRoomState: initialSandboxState.roomState,
    devBootstrapSharedCoins: initialSandboxState.playerCoins
  });
  const sharedRoomActive = sharedRoomRuntime.runtimeSnapshot !== null;
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
  const [sceneJumpRequest, setSceneJumpRequest] = useState<SceneJumpRequest | null>(null);
  const [playerInteractionStatus, setPlayerInteractionStatus] =
    useState<PlayerInteractionStatus>(null);
  const [localPresenceSnapshot, setLocalPresenceSnapshot] =
    useState<LocalPlayerPresenceSnapshot>({
      position: initialSandboxState.playerPosition,
      facingY: 0,
      activity: "idle",
      interactionPose: null
    });
  const [pcMinigameProgress, setPcMinigameProgress] = useState(initialSandboxState.pcMinigame);
  const [ownedPets, setOwnedPets] = useState<OwnedPet[]>(initialSandboxState.pets);
  const cameraPositionRef = useRef(initialSandboxState.cameraPosition);
  const playerPositionRef = useRef(initialSandboxState.playerPosition);
  const playerCoinsRef = useRef(initialSandboxState.playerCoins);
  const roomStateRef = useRef(initialSandboxState.roomState);
  const pendingSpawnOwnedFurnitureIdsRef = useRef(new Set<string>());
  const soldOwnedFurnitureIdsRef = useRef(new Set<string>());
  const nextSpawnRequestIdRef = useRef(1);
  const nextSceneJumpRequestIdRef = useRef(1);
  const {
    catalogSections,
    inventoryByType,
    storedInventorySections
  } = useSandboxInventory(
    roomState.ownedFurniture,
    liveFurniturePlacements,
    pendingSpawnOwnedFurnitureIds
  );
  const petCatalogEntries = useMemo(
    () => ALL_PET_TYPES.map((type) => PET_REGISTRY[type]),
    []
  );
  const ownedPetTypes = useMemo(
    () => new Set<PetType>(ownedPets.map((pet) => pet.type)),
    [ownedPets]
  );
  const sharedRoomPresence = useSharedRoomPresence({
    enabled: sharedRoomActive,
    localPresence: localPresenceSnapshot,
    partnerId: sharedRoomRuntime.session?.partnerId ?? null,
    profile: sharedRoomRuntime.profile,
    roomId: sharedRoomRuntime.runtimeSnapshot?.roomId ?? null,
    skinSrc
  });

  useEffect(() => {
    const persistedRoomState = sharedRoomActive ? createDefaultRoomState() : roomState;
    const persistedPlayerCoins = sharedRoomActive ? initialSandboxState.playerCoins : playerCoins;

    savePersistedSandboxState({
      version: 6,
      skinSrc,
      cameraPosition,
      playerPosition,
      playerCoins: persistedPlayerCoins,
      roomState: persistedRoomState,
      pcMinigame: pcMinigameProgress,
      pets: ownedPets
    });
  }, [
    cameraPosition,
    initialSandboxState.playerCoins,
    ownedPets,
    pcMinigameProgress,
    playerCoins,
    playerPosition,
    roomState,
    sharedRoomActive,
    skinSrc
  ]);

  useEffect(() => {
    savePersistedWorldSettings({
      buildModeEnabled,
      catalogOpen,
      gridSnapEnabled,
      debugOpen,
      previewStudioOpen,
      previewStudioMode,
      previewStudioSelectedType,
      previewStudioSelectedMobId,
      devPanelBuildSettingsCollapsed,
      devPanelPlayerStateCollapsed,
      devPanelPlayerCoordinatesCollapsed,
      devPanelCameraPropertiesCollapsed,
      devPanelWorldSettingsCollapsed,
      devPanelLightingFxCollapsed,
      devPanelCollisionDebugCollapsed,
      devPanelActionsCollapsed,
      showCollisionDebug,
      showPlayerCollider,
      showInteractionMarkers
    });
  }, [
    buildModeEnabled,
    catalogOpen,
    debugOpen,
    devPanelActionsCollapsed,
    devPanelBuildSettingsCollapsed,
    devPanelCameraPropertiesCollapsed,
    devPanelCollisionDebugCollapsed,
    devPanelLightingFxCollapsed,
    devPanelPlayerCoordinatesCollapsed,
    devPanelPlayerStateCollapsed,
    devPanelWorldSettingsCollapsed,
    gridSnapEnabled,
    previewStudioMode,
    previewStudioOpen,
    previewStudioSelectedMobId,
    previewStudioSelectedType,
    showCollisionDebug,
    showInteractionMarkers,
    showPlayerCollider
  ]);

  useEffect(() => {
    cameraPositionRef.current = cameraPosition;
  }, [cameraPosition]);

  useEffect(() => {
    playerPositionRef.current = playerPosition;
  }, [playerPosition]);

  useEffect(() => {
    roomStateRef.current = roomState;
  }, [roomState]);

  useEffect(() => {
    const runtimeSnapshot = sharedRoomRuntime.runtimeSnapshot;

    if (!runtimeSnapshot) {
      return;
    }

    roomStateRef.current = runtimeSnapshot.roomState;
    playerCoinsRef.current = runtimeSnapshot.sharedCoins;
    setRoomState(runtimeSnapshot.roomState);
    setLiveFurniturePlacements(runtimeSnapshot.roomState.furniture);
    setPlayerCoins(runtimeSnapshot.sharedCoins);
    pendingSpawnOwnedFurnitureIdsRef.current.clear();
    soldOwnedFurnitureIdsRef.current.clear();
    setPendingSpawnOwnedFurnitureIds([]);
    setSpawnRequest(null);
  }, [sharedRoomRuntime.runtimeSnapshot]);

  const applyLocalSharedSnapshot = useCallback(
    (nextRoomState: RoomState, nextCoins: number): void => {
      roomStateRef.current = nextRoomState;
      playerCoinsRef.current = nextCoins;
      setRoomState(nextRoomState);
      setLiveFurniturePlacements((currentPlacements) =>
        placementListsMatch(currentPlacements, nextRoomState.furniture)
          ? currentPlacements
          : nextRoomState.furniture
      );
      setPlayerCoins(nextCoins);
    },
    []
  );

  const openPreviewStudio = useCallback((type: FurnitureType) => {
    setPreviewStudioMode("furniture");
    setPreviewStudioSelectedType(type);
    setPreviewStudioOpen(true);
    setCatalogOpen(false);
  }, []);

  const openMobPreviewStudio = useCallback((mobId: string) => {
    setPreviewStudioMode("mob_lab");
    setPreviewStudioSelectedMobId(mobId);
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
    const nextCoins = playerCoinsRef.current + result.rewardCoins;
    commitPlayerCoins(nextCoins);

    if (sharedRoomActive) {
      void sharedRoomRuntime.commitRoomState(
        roomStateRef.current,
        nextCoins,
        "pc_minigame_reward"
      );
    }
  }, [sharedRoomActive, sharedRoomRuntime]);

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

    const ownerId = sharedRoomActive
      ? buildSharedRoomOwnerId(roomStateRef.current.metadata.roomId)
      : undefined;
    const nextRoomState = {
      ...roomStateRef.current,
      ownedFurniture: [
        ...roomStateRef.current.ownedFurniture,
        createOwnedFurnitureItem(type, ownerId)
      ]
    };

    applyLocalSharedSnapshot(nextRoomState, playerCoinsRef.current);

    if (sharedRoomActive) {
      void sharedRoomRuntime.commitRoomState(nextRoomState, playerCoinsRef.current, `buy:${type}`);
    }
  }

  function handleBuyPet(type: PetType): void {
    const petDefinition = PET_REGISTRY[type];

    if (ownedPetTypes.has(type) || !trySpendCoins(petDefinition.price)) {
      return;
    }

    const spawnPosition = pickPetSpawnPosition(playerPosition, liveFurniturePlacements);

    setOwnedPets((currentPets) =>
      currentPets.some((pet) => pet.type === type)
        ? currentPets
        : [...currentPets, createOwnedPet(type, spawnPosition)]
    );
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
    const nextRoomState = {
      ...roomStateRef.current,
      ownedFurniture: roomStateRef.current.ownedFurniture.filter(
        (ownedFurniture) => ownedFurniture.id !== nextSellItem.id
      )
    };
    updatePendingSpawnOwnedFurnitureIds((currentIds) =>
      currentIds.filter((ownedFurnitureId) => ownedFurnitureId !== nextSellItem.id)
    );

    if (sellPrice > 0) {
      addCoins(sellPrice);
    }

    applyLocalSharedSnapshot(nextRoomState, playerCoinsRef.current);

    if (sharedRoomActive) {
      void sharedRoomRuntime.commitRoomState(
        nextRoomState,
        playerCoinsRef.current,
        `sell:${nextSellItem.id}`
      );
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

  const requestSceneJump = useCallback(
    (nextPlayerPosition: Vector3Tuple, nextCameraPosition: Vector3Tuple): void => {
      playerPositionRef.current = nextPlayerPosition;
      cameraPositionRef.current = nextCameraPosition;
      setPlayerPosition((currentPosition) =>
        vectorsMatch(currentPosition, nextPlayerPosition) ? currentPosition : nextPlayerPosition
      );
      setCameraPosition((currentPosition) =>
        vectorsMatch(currentPosition, nextCameraPosition) ? currentPosition : nextCameraPosition
      );
      setSceneJumpRequest({
        requestId: nextSceneJumpRequestIdRef.current,
        playerPosition: nextPlayerPosition,
        cameraPosition: nextCameraPosition,
        cameraTarget: ROOM_CAMERA_TARGET
      });
      nextSceneJumpRequestIdRef.current += 1;
    },
    []
  );

  const updatePlayerAxis = useCallback((axis: 0 | 1 | 2, value: number): void => {
    if (!Number.isFinite(value)) {
      return;
    }

    const nextPlayerPosition = setVectorAxis(playerPositionRef.current, axis, value);
    playerPositionRef.current = nextPlayerPosition;
    setPlayerPosition((currentPosition) =>
      vectorsMatch(currentPosition, nextPlayerPosition) ? currentPosition : nextPlayerPosition
    );
  }, []);

  const updateCameraAxis = useCallback((axis: 0 | 1 | 2, value: number): void => {
    if (!Number.isFinite(value)) {
      return;
    }

    const nextCameraPosition = setVectorAxis(cameraPositionRef.current, axis, value);
    cameraPositionRef.current = nextCameraPosition;
    setCameraPosition((currentPosition) =>
      vectorsMatch(currentPosition, nextCameraPosition) ? currentPosition : nextCameraPosition
    );
  }, []);

  const commitPlayerAxis = useCallback((axis: 0 | 1 | 2, value: number): void => {
    if (!Number.isFinite(value)) {
      return;
    }

    const nextPlayerPosition = setVectorAxis(playerPositionRef.current, axis, value);
    requestSceneJump(nextPlayerPosition, cameraPositionRef.current);
  }, [requestSceneJump]);

  const commitCameraAxis = useCallback((axis: 0 | 1 | 2, value: number): void => {
    if (!Number.isFinite(value)) {
      return;
    }

    const nextCameraPosition = setVectorAxis(cameraPositionRef.current, axis, value);
    requestSceneJump(playerPositionRef.current, nextCameraPosition);
  }, [requestSceneJump]);

  const applyTransformChanges = useCallback(() => {
    requestSceneJump(playerPositionRef.current, cameraPositionRef.current);
  }, [requestSceneJump]);

  function handleResetCamera(): void {
    setCameraPosition(DEFAULT_CAMERA_POSITION);
    setCameraResetToken((current) => current + 1);
  }

  const handleCommittedFurnitureChange = useCallback((placements: RoomFurniturePlacement[]): void => {
    if (placementListsMatch(roomStateRef.current.furniture, placements)) {
      return;
    }

    const nextRoomState = {
      ...roomStateRef.current,
      furniture: placements
    };

    roomStateRef.current = nextRoomState;
    setRoomState(nextRoomState);

    if (sharedRoomActive && shouldCommitSharedRoomChange("committed")) {
      void sharedRoomRuntime.commitRoomState(
        nextRoomState,
        playerCoinsRef.current,
        "committed_furniture_change"
      );
    }
  }, [sharedRoomActive, sharedRoomRuntime]);

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
    cameraPositionRef.current = position;
    setCameraPosition((currentPosition) =>
      vectorsMatch(currentPosition, position) ? currentPosition : position
    );
  }, []);

  const handlePlayerPositionChange = useCallback((position: Vector3Tuple): void => {
    playerPositionRef.current = position;
    setPlayerPosition((currentPosition) =>
      vectorsMatch(currentPosition, position) ? currentPosition : position
    );
  }, []);

  function handleResetSandbox(): void {
    if (sharedRoomActive) {
      void sharedRoomRuntime.reloadRoom();
      return;
    }

    const nextSandbox = createDefaultSandboxState(DEFAULT_CAMERA_POSITION, DEFAULT_PLAYER_POSITION);

    cameraPositionRef.current = nextSandbox.cameraPosition;
    playerPositionRef.current = nextSandbox.playerPosition;
    setCameraPosition(nextSandbox.cameraPosition);
    setPlayerPosition(nextSandbox.playerPosition);
    setLocalPresenceSnapshot({
      position: nextSandbox.playerPosition,
      facingY: 0,
      activity: "idle",
      interactionPose: null
    });
    setSkinSrc(nextSandbox.skinSrc);
    commitPlayerCoins(nextSandbox.playerCoins);
    setRoomState(nextSandbox.roomState);
    setPcMinigameProgress(nextSandbox.pcMinigame);
    setOwnedPets(nextSandbox.pets);
    setLiveFurniturePlacements(nextSandbox.roomState.furniture);
    pendingSpawnOwnedFurnitureIdsRef.current.clear();
    soldOwnedFurnitureIdsRef.current.clear();
    setPendingSpawnOwnedFurnitureIds([]);
    setSpawnRequest(null);
    setSceneJumpRequest({
      requestId: nextSceneJumpRequestIdRef.current,
      playerPosition: DEFAULT_PLAYER_POSITION,
      cameraPosition: DEFAULT_CAMERA_POSITION,
      cameraTarget: ROOM_CAMERA_TARGET
    });
    nextSceneJumpRequestIdRef.current += 1;
    setBuildModeEnabled(false);
    setCatalogOpen(false);
    setGridSnapEnabled(true);
    setPlayerInteractionStatus(null);
    setCameraResetToken((current) => current + 1);
  }

  const levaTheme = useMemo(
    () => ({
      colors: {
        elevation1: "#000000",
        elevation2: "#000000",
        elevation3: "#000000",
        accent1: "#0b0b0b",
        accent2: "#131313",
        accent3: "#1d1d1d",
        highlight1: "#8a8a8a",
        highlight2: "#ffffff",
        highlight3: "#ffffff",
        vivid1: "#ffffff",
        folderWidgetColor: "#ffffff",
        folderTextColor: "#ffffff",
        toolTipBackground: "#000000",
        toolTipText: "#ffffff"
      },
      radii: {
        xs: "0px",
        sm: "0px",
        lg: "0px"
      },
      space: {
        xs: "3px",
        sm: "4px",
        md: "5px",
        rowGap: "3px",
        colGap: "5px"
      },
      fonts: {
        mono: "\"Consolas\", \"Courier New\", monospace",
        sans: "\"Segoe UI\", Tahoma, Geneva, Verdana, sans-serif"
      },
      fontSizes: {
        root: "12px",
        toolTip: "11px"
      },
      sizes: {
        rootWidth: "min(360px, calc(100vw - 12px))",
        controlWidth: "108px",
        numberInputMinWidth: "56px",
        scrubberWidth: "6px",
        scrubberHeight: "14px",
        rowHeight: "24px",
        folderTitleHeight: "24px",
        checkboxSize: "14px",
        joystickWidth: "110px",
        joystickHeight: "110px",
        colorPickerWidth: "200px",
        colorPickerHeight: "110px",
        imagePreviewWidth: "96px",
        imagePreviewHeight: "72px",
        monitorHeight: "44px",
        titleBarHeight: "28px"
      },
      shadows: {
        level1: "none",
        level2: "none"
      },
      borderWidths: {
        root: "1px",
        input: "1px",
        focus: "1px",
        hover: "1px",
        active: "1px",
        folder: "1px"
      },
      fontWeights: {
        label: "700",
        folder: "800",
        button: "700"
      }
    }),
    []
  );

  const pcMinigameActive =
    playerInteractionStatus?.phase === "active" &&
    playerInteractionStatus.interactionType === "use_pc";

  return (
    <>
      <Leva
        hidden
        theme={levaTheme}
        flat
        titleBar={{
          title: "DEV PANEL",
          drag: true,
          filter: true
        }}
        hideCopyButton
      />
      <div className="scene-shell">
        <PerformanceMonitor />
        {sharedRoomActive ? (
          <>
            {!sharedRoomRuntime.devBypassActive ? (
              <SharedRoomStatusStrip
                inviteCode={sharedRoomRuntime.roomDocument?.inviteCode ?? ""}
                memberCount={sharedRoomRuntime.roomDocument?.memberIds.length ?? 0}
                onReloadLatest={() => {
                  void sharedRoomRuntime.reloadRoom();
                }}
                presenceStatus={sharedRoomPresence.presenceStatus}
                roomId={sharedRoomRuntime.roomDocument?.roomId ?? ""}
                statusMessage={sharedRoomRuntime.statusMessage}
              />
            ) : null}
            <DevPanel
              visible={debugOpen}
              buildModeEnabled={buildModeEnabled}
              catalogOpen={catalogOpen}
              gridSnapEnabled={gridSnapEnabled}
              buildSettingsCollapsed={devPanelBuildSettingsCollapsed}
              playerStateCollapsed={devPanelPlayerStateCollapsed}
              playerCoordinatesCollapsed={devPanelPlayerCoordinatesCollapsed}
              cameraPropertiesCollapsed={devPanelCameraPropertiesCollapsed}
              worldSettingsCollapsed={devPanelWorldSettingsCollapsed}
              lightingFxCollapsed={devPanelLightingFxCollapsed}
              collisionDebugCollapsed={devPanelCollisionDebugCollapsed}
              actionsCollapsed={devPanelActionsCollapsed}
              playerCoins={playerCoins}
              playerInteractionLabel={playerInteractionStatus?.label ?? "None"}
              playerPosition={playerPosition}
              cameraPosition={cameraPosition}
              cameraTarget={ROOM_CAMERA_TARGET}
              worldTimeLabel={worldTimeLabel}
              useMinecraftTime={useMinecraftTime}
              minecraftTimeHours={minecraftTimeHours}
              timeLocked={timeLocked}
              lockedTimeHours={lockedTimeHours}
              sunEnabled={sunEnabled}
              shadowsEnabled={shadowsEnabled}
              fogEnabled={fogEnabled}
              fogDensity={fogDensity}
              ambientMultiplier={ambientMultiplier}
              sunIntensityMultiplier={sunIntensityMultiplier}
              brightness={brightness}
              saturation={saturation}
              contrast={contrast}
              showCollisionDebug={showCollisionDebug}
              showPlayerCollider={showPlayerCollider}
              showInteractionMarkers={showInteractionMarkers}
              onToggleBuildMode={handleToggleBuildMode}
              onToggleCatalog={handleToggleCatalog}
              onToggleGridSnap={() => setGridSnapEnabled((current) => !current)}
              onBuildSettingsCollapsedChange={setDevPanelBuildSettingsCollapsed}
              onPlayerStateCollapsedChange={setDevPanelPlayerStateCollapsed}
              onPlayerCoordinatesCollapsedChange={setDevPanelPlayerCoordinatesCollapsed}
              onCameraPropertiesCollapsedChange={setDevPanelCameraPropertiesCollapsed}
              onWorldSettingsCollapsedChange={setDevPanelWorldSettingsCollapsed}
              onLightingFxCollapsedChange={setDevPanelLightingFxCollapsed}
              onCollisionDebugCollapsedChange={setDevPanelCollisionDebugCollapsed}
              onActionsCollapsedChange={setDevPanelActionsCollapsed}
              onPlayerCoinsCommit={commitPlayerCoins}
              onPlayerAxisCommit={commitPlayerAxis}
              onCameraAxisCommit={commitCameraAxis}
              onApplyTransforms={applyTransformChanges}
              onResetCamera={handleResetCamera}
              onResetSandbox={handleResetSandbox}
              onUseMinecraftTimeChange={setUseMinecraftTime}
              onMinecraftTimeHoursCommit={setMinecraftTimeHours}
              onTimeLockedChange={setTimeLockedEnabled}
              onLockedTimeHoursCommit={setLockedTimeHours}
              onSyncLockedTime={syncLockedTimeToLocalTime}
              onSunEnabledChange={setSunEnabled}
              onShadowsEnabledChange={setShadowsEnabled}
              onFogEnabledChange={setFogEnabled}
              onFogDensityCommit={setFogDensity}
              onAmbientMultiplierCommit={setAmbientMultiplier}
              onSunIntensityMultiplierCommit={setSunIntensityMultiplier}
              onBrightnessCommit={setBrightness}
              onSaturationCommit={setSaturation}
              onContrastCommit={setContrast}
              onShowCollisionDebugChange={setShowCollisionDebug}
              onShowPlayerColliderChange={setShowPlayerCollider}
              onShowInteractionMarkersChange={setShowInteractionMarkers}
            />
            <SceneToolbar
              buildModeEnabled={buildModeEnabled}
              catalogOpen={catalogOpen}
              coinsLabel="Shared Coins"
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
            onBuyPet={handleBuyPet}
            onCloseFurnitureInfo={handleCloseFurnitureInfo}
            onOpenFurnitureInfo={handleOpenFurnitureInfo}
            onOpenMobStudio={openMobPreviewStudio}
            onOpenStudio={openPreviewStudio}
            onPlaceStoredFurniture={handlePlaceStoredFurniture}
            onSellStoredFurniture={handleSellStoredFurniture}
            onToggleFurnitureInfo={handleToggleFurnitureInfo}
            openFurnitureInfoKey={openFurnitureInfoKey}
            ownedPetTypes={ownedPetTypes}
            petCatalogEntries={petCatalogEntries}
            playerCoins={playerCoins}
            storedInventorySections={storedInventorySections}
          />
            ) : null}

            {previewStudioOpen ? (
          <Suspense fallback={<div className="preview-studio preview-studio--loading">Loading preview studio...</div>}>
            <FurniturePreviewStudio
              catalogSections={catalogSections}
              mode={previewStudioMode}
              onClose={() => setPreviewStudioOpen(false)}
              onModeChange={setPreviewStudioMode}
              onSelectMobChange={setPreviewStudioSelectedMobId}
              onSelectTypeChange={setPreviewStudioSelectedType}
              selectedMobId={previewStudioSelectedMobId}
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
                pets={ownedPets}
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
                showCollisionDebug={showCollisionDebug}
                showPlayerCollider={showPlayerCollider}
                showInteractionMarkers={showInteractionMarkers}
                onCameraPositionChange={handleCameraPositionChange}
                onLocalPresenceChange={setLocalPresenceSnapshot}
                onPlayerPositionChange={handlePlayerPositionChange}
                onFurnitureSnapshotChange={handleFurnitureSnapshotChange}
                onCommittedFurnitureChange={handleCommittedFurnitureChange}
                onInteractionStateChange={setPlayerInteractionStatus}
                remotePresence={sharedRoomPresence.remotePresence}
                sceneJumpRequest={sceneJumpRequest}
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
          </>
        ) : null}

        {!sharedRoomActive &&
        !sharedRoomRuntime.blockingState &&
        !sharedRoomRuntime.devBypassActive ? (
          <SharedRoomEntryShell
            displayName={sharedRoomRuntime.displayName}
            errorMessage={sharedRoomRuntime.inlineError}
            onCreateRoom={() => {
              void sharedRoomRuntime.createRoom(roomStateRef.current, playerCoinsRef.current);
            }}
            onDisplayNameChange={sharedRoomRuntime.setDisplayName}
            onJoinRoom={(code) => {
              void sharedRoomRuntime.joinRoom(code);
            }}
          />
        ) : null}

        {sharedRoomRuntime.blockingState ? (
          <SharedRoomBlockingOverlay
            body={sharedRoomRuntime.blockingState.body}
            onRetry={
              sharedRoomRuntime.blockingState.retryable
                ? () => {
                    void sharedRoomRuntime.reloadRoom();
                  }
                : null
            }
            title={sharedRoomRuntime.blockingState.title}
          />
        ) : null}
      </div>
    </>
  );
}

export default App;
