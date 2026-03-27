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
  applyDeskPcCompletionToProgression,
  applyPersonalWalletRefund,
  applyPersonalWalletSpend,
  buildSharedRitualStatus,
  ROOM_LEVEL_XP_THRESHOLDS,
  selectActivePlayerProgression,
  selectPartnerPlayerProgression,
  type SharedDeskPcCompletionProgressionResult
} from "./lib/sharedProgression";
import {
  ALL_PET_TYPES,
  PET_REGISTRY,
  createOwnedPet,
  type OwnedPet,
  type PetType
} from "./lib/pets";
import { pickPetSpawnPosition } from "./lib/petPathing";
import { upsertSharedRoomFrameMemory } from "./lib/sharedRoomMemories";
import {
  createSharedRoomPetRecord,
  toRuntimeOwnedPet
} from "./lib/sharedRoomPet";
import { createBreakupResetMutation } from "./lib/sharedRoomReset";
import { DEFAULT_CAMERA_POSITION, DEFAULT_PLAYER_POSITION } from "./app/constants";
import { DeveloperSessionPanel } from "./app/components/DeveloperSessionPanel";
import { DeveloperWorkspaceHeader } from "./app/components/DeveloperWorkspaceHeader";
import { DeveloperWorkspaceRail } from "./app/components/DeveloperWorkspaceRail";
import { DeveloperWorkspaceShell } from "./app/components/DeveloperWorkspaceShell";
import { BreakupResetDialog } from "./app/components/BreakupResetDialog";
import { DevPanel } from "./app/components/DevPanel";
import { InventoryPanel } from "./app/components/InventoryPanel";
import { MemoryFrameDialog } from "./app/components/MemoryFrameDialog";
import { PerformanceMonitor } from "./app/components/PerformanceMonitor";
import { PlayerActionDock } from "./app/components/PlayerActionDock";
import { PlayerClockChip } from "./app/components/PlayerClockChip";
import { PlayerCompanionCard } from "./app/components/PlayerCompanionCard";
import { PlayerProgressStack } from "./app/components/PlayerProgressStack";
import { PlayerRoomDetailsSheet } from "./app/components/PlayerRoomDetailsSheet";
import { PlayerRoomShell } from "./app/components/PlayerRoomShell";
import { SharedRoomEntryShell } from "./app/components/SharedRoomEntryShell";
import { SharedRoomBlockingOverlay } from "./app/components/SharedRoomBlockingOverlay";
import { ViewModeSwitch } from "./app/components/ViewModeSwitch";
import { useFurnitureInfoPopover } from "./app/hooks/useFurnitureInfoPopover";
import { useSharedRoomPresence } from "./app/hooks/useSharedRoomPresence";
import {
  getDefaultShellViewMode,
  getDeveloperQuickActions,
  getDeveloperSessionPanelState,
  getDeveloperWorkspaceTabState,
  getPlayerActionDockState,
  getPlayerCompanionCardState,
  getPlayerRoomDetailsState,
  isDeveloperSurfaceVisible
} from "./app/shellViewModel";
import {
  shouldCommitSharedRoomChange,
  useSharedRoomRuntime
} from "./app/hooks/useSharedRoomRuntime";
import { useSandboxInventory } from "./app/hooks/useSandboxInventory";
import { useSkinImport } from "./app/hooks/useSkinImport";
import { useSandboxWorldClock } from "./app/hooks/useSandboxWorldClock";
import type {
  AppShellViewMode,
  DeveloperWorkspaceTab,
  FurnitureSpawnRequest,
  LocalPlayerPresenceSnapshot,
  PlayerInteractionStatus,
  PreviewStudioMode,
  SceneJumpRequest
} from "./app/types";
import { ROOM_CAMERA_TARGET } from "./lib/sceneTargets";
import {
  loadPersistedWorldSettings,
  savePersistedWorldSettings
} from "./lib/devWorldSettings";
import {
  placementListsMatch,
  vectorsMatch
} from "./lib/roomPlacementEquality";
import type { SharedPlayerDeskPcProgress } from "./lib/sharedProgressionTypes";
import type { SharedRoomFrameMemory } from "./lib/sharedRoomTypes";

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

function getPlayerXpNextLevel(level: number): number {
  const thresholdIndex = Math.min(
    Math.max(1, Math.floor(level)),
    ROOM_LEVEL_XP_THRESHOLDS.length - 1
  );

  return ROOM_LEVEL_XP_THRESHOLDS[thresholdIndex];
}

function toPcMinigameProgress(
  deskPc: SharedPlayerDeskPcProgress | null | undefined
) {
  return {
    bestScore: deskPc?.bestScore ?? 0,
    lastScore: deskPc?.lastScore ?? 0,
    gamesPlayed: deskPc?.gamesPlayed ?? 0,
    totalCoinsEarned: deskPc?.totalCoinsEarned ?? 0,
    lastRewardCoins: deskPc?.lastRewardCoins ?? 0,
    lastCompletedAt: deskPc?.lastCompletedAt ? Date.parse(deskPc.lastCompletedAt) : null
  };
}

function App() {
  const isDev = import.meta.env.DEV;
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
  const [shellViewMode, setShellViewMode] = useState<AppShellViewMode>(() =>
    getDefaultShellViewMode(isDev, initialWorldSettings.shellViewMode)
  );
  const [developerWorkspaceTab, setDeveloperWorkspaceTab] = useState<DeveloperWorkspaceTab>(
    initialWorldSettings.developerWorkspaceTab ?? "room"
  );
  const [playerCompanionCardExpanded, setPlayerCompanionCardExpanded] = useState(
    initialWorldSettings.playerCompanionCardExpanded ?? false
  );
  const [playerRoomDetailsOpen, setPlayerRoomDetailsOpen] = useState(false);
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
  const [sharedPcResult, setSharedPcResult] = useState<{
    dailyRitualStatus: string;
    dailyRitualBonusCoins: number;
    dailyRitualBonusXp: number;
    streakCount: number;
  } | null>(null);
  const [ownedPets, setOwnedPets] = useState<OwnedPet[]>(initialSandboxState.pets);
  const [selectedMemoryFrameId, setSelectedMemoryFrameId] = useState<string | null>(null);
  const [memoryFrameSaving, setMemoryFrameSaving] = useState(false);
  const [breakupResetDialogOpen, setBreakupResetDialogOpen] = useState(false);
  const [breakupResetSaving, setBreakupResetSaving] = useState(false);
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
  const sharedRoomPlayerId = sharedRoomRuntime.session?.playerId ?? null;
  const displayedPets = useMemo(
    () =>
      sharedRoomActive
        ? sharedRoomRuntime.runtimeSnapshot?.sharedPet
          ? [toRuntimeOwnedPet(sharedRoomRuntime.runtimeSnapshot.sharedPet)]
          : []
        : ownedPets,
    [ownedPets, sharedRoomActive, sharedRoomRuntime.runtimeSnapshot?.sharedPet]
  );
  const activePetCatalogEntries = useMemo(
    () =>
      sharedRoomActive ? [PET_REGISTRY.minecraft_cat] : petCatalogEntries,
    [petCatalogEntries, sharedRoomActive]
  );
  const ownedPetTypes = useMemo(
    () => new Set<PetType>(displayedPets.map((pet) => pet.type)),
    [displayedPets]
  );
  const runtimeFrameMemories = sharedRoomRuntime.runtimeSnapshot?.frameMemories ?? {};
  const selectedMemoryFrame = selectedMemoryFrameId
    ? runtimeFrameMemories[selectedMemoryFrameId] ?? null
    : null;
  const sharedRoomPresence = useSharedRoomPresence({
    enabled: sharedRoomActive,
    bootstrapKind: sharedRoomRuntime.bootstrapKind,
    localPresence: localPresenceSnapshot,
    pendingLinkId:
      sharedRoomRuntime.bootstrapKind === "pending_link"
        ? sharedRoomRuntime.pendingLink?.pendingLinkId ?? null
        : null,
    partnerId: sharedRoomRuntime.session?.partnerId ?? null,
    profile: sharedRoomRuntime.profile,
    roomId: sharedRoomRuntime.runtimeSnapshot?.roomId ?? null,
    skinSrc
  });
  const activePlayerProgression = useMemo(
    () =>
      sharedRoomRuntime.runtimeSnapshot
        ? selectActivePlayerProgression(
            sharedRoomRuntime.runtimeSnapshot.progression,
            sharedRoomRuntime.session?.playerId
          )
        : null,
    [sharedRoomRuntime.runtimeSnapshot, sharedRoomRuntime.session?.playerId]
  );
  const partnerPlayerProgression = useMemo(
    () =>
      sharedRoomRuntime.runtimeSnapshot
        ? selectPartnerPlayerProgression(
            sharedRoomRuntime.runtimeSnapshot.progression,
            sharedRoomRuntime.session?.playerId
          )
        : null,
    [sharedRoomRuntime.runtimeSnapshot, sharedRoomRuntime.session?.playerId]
  );
  const displayedPlayerCoins = sharedRoomActive
    ? activePlayerProgression?.coins ?? 0
    : playerCoins;
  const displayedPcMinigameProgress = sharedRoomActive
    ? toPcMinigameProgress(activePlayerProgression?.deskPc)
    : pcMinigameProgress;
  const walletLabel = sharedRoomActive ? "Your wallet" : "Coins";
  const playerLevel = activePlayerProgression?.level ?? 1;
  const playerXp = activePlayerProgression?.xp ?? 0;
  const playerXpNextLevel = getPlayerXpNextLevel(playerLevel);
  const ritualStatus = sharedRoomRuntime.runtimeSnapshot
    ? buildSharedRitualStatus(
        sharedRoomRuntime.runtimeSnapshot.progression,
        sharedRoomRuntime.session
      )
    : {
        title: "Streak 0",
        body: "Both partners need one desk check-in today.",
        tone: "presence" as const,
        streakCount: 0,
        ritualComplete: false,
        selfCompleted: false,
        partnerCompleted: false
      };

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
      shellViewMode: isDev ? shellViewMode : "player",
      developerWorkspaceTab,
      playerCompanionCardExpanded,
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
    developerWorkspaceTab,
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
    playerCompanionCardExpanded,
    shellViewMode,
    showCollisionDebug,
    showInteractionMarkers,
    showPlayerCollider,
    isDev
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

  const lastSyncedRevisionRef = useRef<number>(0);

  useEffect(() => {
    const runtimeSnapshot = sharedRoomRuntime.runtimeSnapshot;
    const runtimePlayerProgression = runtimeSnapshot
      ? selectActivePlayerProgression(
          runtimeSnapshot.progression,
          sharedRoomRuntime.session?.playerId
        )
      : null;

    if (!runtimeSnapshot) {
      return;
    }

    if (runtimeSnapshot.revision === lastSyncedRevisionRef.current) {
      if (
        runtimePlayerProgression &&
        playerCoinsRef.current !== runtimePlayerProgression.coins
      ) {
        playerCoinsRef.current = runtimePlayerProgression.coins;
        setPlayerCoins(runtimePlayerProgression.coins);
      }
      return;
    }

    lastSyncedRevisionRef.current = runtimeSnapshot.revision;
    roomStateRef.current = runtimeSnapshot.roomState;
    playerCoinsRef.current = runtimePlayerProgression?.coins ?? 0;

    setRoomState(runtimeSnapshot.roomState);
    setLiveFurniturePlacements(runtimeSnapshot.roomState.furniture);
    setPlayerCoins(runtimePlayerProgression?.coins ?? 0);

    pendingSpawnOwnedFurnitureIdsRef.current.clear();
    soldOwnedFurnitureIdsRef.current.clear();
    setPendingSpawnOwnedFurnitureIds([]);
    setSpawnRequest(null);
  }, [sharedRoomRuntime.runtimeSnapshot, sharedRoomRuntime.session?.playerId]);

  useEffect(() => {
    if (!sharedRoomActive) {
      setSelectedMemoryFrameId(null);
      setBreakupResetDialogOpen(false);
      return;
    }

    if (!selectedMemoryFrameId) {
      return;
    }

    const frameStillExists = roomState.furniture.some(
      (placement) =>
        placement.id === selectedMemoryFrameId && placement.type === "wall_frame"
    );

    if (!frameStillExists) {
      setSelectedMemoryFrameId(null);
    }
  }, [roomState.furniture, selectedMemoryFrameId, sharedRoomActive]);

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
    setDeveloperWorkspaceTab("preview_studio");
    if (isDev) {
      setShellViewMode("developer");
    }
    setCatalogOpen(false);
  }, [isDev]);

  const openMobPreviewStudio = useCallback((mobId: string) => {
    setPreviewStudioMode("mob_lab");
    setPreviewStudioSelectedMobId(mobId);
    setPreviewStudioOpen(true);
    setDeveloperWorkspaceTab("mob_lab");
    if (isDev) {
      setShellViewMode("developer");
    }
    setCatalogOpen(false);
  }, [isDev]);

  const handleSelectDeveloperWorkspaceTab = useCallback((nextTab: DeveloperWorkspaceTab) => {
    setDeveloperWorkspaceTab(nextTab);

    if (nextTab === "preview_studio") {
      setPreviewStudioMode("furniture");
      setPreviewStudioOpen(true);
      return;
    }

    if (nextTab === "mob_lab") {
      setPreviewStudioMode("mob_lab");
      setPreviewStudioOpen(true);
      return;
    }

    setPreviewStudioOpen(false);
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
    if (sharedRoomActive && sharedRoomRuntime.session?.playerId) {
      let nextSharedResult: SharedDeskPcCompletionProgressionResult | null = null;

      void sharedRoomRuntime.commitRoomMutation("pc_minigame_reward", (snapshot) => {
        nextSharedResult = applyDeskPcCompletionToProgression({
          progression: snapshot.progression,
          actorPlayerId: sharedRoomRuntime.session?.playerId ?? "",
          result,
          memberIds: snapshot.memberIds,
          nowIso: new Date().toISOString()
        });

        return {
          roomState: snapshot.roomState,
          progression: nextSharedResult.progression,
          frameMemories: snapshot.frameMemories,
          sharedPet: snapshot.sharedPet
        };
      }).then((nextRoomDocument) => {
        if (nextRoomDocument && nextSharedResult) {
          setSharedPcResult({
            dailyRitualStatus:
              nextSharedResult.dailyRitualStatus === "completed"
                ? "Daily ritual complete"
                : "Check-in saved. Waiting on partner.",
            dailyRitualBonusCoins: nextSharedResult.dailyRitualBonusCoins,
            dailyRitualBonusXp: nextSharedResult.dailyRitualBonusXp,
            streakCount: nextSharedResult.streakCount
          });
        }
      });

      return;
    }

    setPcMinigameProgress((currentProgress) => applyPcMinigameResult(currentProgress, result));
    commitPlayerCoins(playerCoinsRef.current + result.rewardCoins);
    setSharedPcResult(null);
  }, [sharedRoomActive, sharedRoomRuntime]);

  const handleExitPcMinigame = useCallback((): void => {
    setSharedPcResult(null);
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

    if (sharedRoomActive) {
      if (
        !sharedRoomRuntime.session?.playerId ||
        !activePlayerProgression ||
        activePlayerProgression.coins < buyPrice
      ) {
        return;
      }

      void sharedRoomRuntime.commitRoomMutation(`buy:${type}`, (snapshot) => {
        const nextProgression = applyPersonalWalletSpend(
          snapshot.progression,
          sharedRoomRuntime.session?.playerId ?? "",
          buyPrice,
          new Date().toISOString()
        );
        const ownerId = buildSharedRoomOwnerId(snapshot.roomState.metadata.roomId);
        const nextRoomState = {
          ...snapshot.roomState,
          ownedFurniture: [
            ...snapshot.roomState.ownedFurniture,
            createOwnedFurnitureItem(type, ownerId)
          ]
        };

        return {
          roomState: nextRoomState,
          progression: nextProgression,
          frameMemories: snapshot.frameMemories,
          sharedPet: snapshot.sharedPet
        };
      });
      return;
    }

    if (!trySpendCoins(buyPrice)) {
      return;
    }

    const nextRoomState = {
      ...roomStateRef.current,
      ownedFurniture: [
        ...roomStateRef.current.ownedFurniture,
        createOwnedFurnitureItem(type)
      ]
    };

    applyLocalSharedSnapshot(nextRoomState, playerCoinsRef.current);
  }

  function handleBuyPet(type: PetType): void {
    if (sharedRoomActive) {
      if (
        type !== "minecraft_cat" ||
        !sharedRoomPlayerId ||
        !activePlayerProgression ||
        activePlayerProgression.coins < PET_REGISTRY[type].price ||
        sharedRoomRuntime.runtimeSnapshot?.sharedPet
      ) {
        return;
      }

      void sharedRoomRuntime.commitRoomMutation("adopt_shared_pet", (snapshot) => ({
        roomState: snapshot.roomState,
        progression: applyPersonalWalletSpend(
          snapshot.progression,
          sharedRoomPlayerId,
          PET_REGISTRY[type].price,
          new Date().toISOString()
        ),
        frameMemories: snapshot.frameMemories,
        sharedPet: createSharedRoomPetRecord(
          pickPetSpawnPosition(playerPositionRef.current, snapshot.roomState.furniture),
          sharedRoomPlayerId,
          new Date().toISOString()
        )
      }));
      return;
    }

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
    updatePendingSpawnOwnedFurnitureIds((currentIds) =>
      currentIds.filter((ownedFurnitureId) => ownedFurnitureId !== nextSellItem.id)
    );

    if (sharedRoomActive) {
      if (!sharedRoomRuntime.session?.playerId) {
        return;
      }

      void sharedRoomRuntime.commitRoomMutation(`sell:${nextSellItem.id}`, (snapshot) => {
        const snapshotSellItem = snapshot.roomState.ownedFurniture.find(
          (ownedFurniture) => ownedFurniture.id === nextSellItem.id
        );

        if (!snapshotSellItem) {
          return {
            roomState: snapshot.roomState,
            progression: snapshot.progression,
            frameMemories: snapshot.frameMemories,
            sharedPet: snapshot.sharedPet
          };
        }

        const nextProgression =
          sellPrice > 0
            ? applyPersonalWalletRefund(
                snapshot.progression,
                sharedRoomRuntime.session?.playerId ?? "",
                sellPrice,
                new Date().toISOString()
              )
            : snapshot.progression;
        const nextRoomState = {
          ...snapshot.roomState,
          ownedFurniture: snapshot.roomState.ownedFurniture.filter(
            (ownedFurniture) => ownedFurniture.id !== nextSellItem.id
          )
        };

        return {
          roomState: nextRoomState,
          progression: nextProgression,
          frameMemories: snapshot.frameMemories,
          sharedPet: snapshot.sharedPet
        };
      });
      return;
    }

    const nextRoomState = {
      ...roomStateRef.current,
      ownedFurniture: roomStateRef.current.ownedFurniture.filter(
        (ownedFurniture) => ownedFurniture.id !== nextSellItem.id
      )
    };

    if (sellPrice > 0) {
      addCoins(sellPrice);
    }

    applyLocalSharedSnapshot(nextRoomState, playerCoinsRef.current);
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
    setLiveFurniturePlacements(placements);

    // TRUST: placementListsMatch (now order-independent) to prevent sync loops.
    const sharedProgression = sharedRoomRuntime.runtimeSnapshot?.progression;

    if (
      sharedRoomActive &&
      sharedProgression &&
      shouldCommitSharedRoomChange("committed")
    ) {
      void sharedRoomRuntime.commitRoomState(
        nextRoomState,
        sharedProgression,
        "committed_furniture_change"
      );
    }
  }, [sharedRoomActive, sharedRoomRuntime, sharedRoomRuntime.roomDocument?.revision]);

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
      setSharedPcResult(null);
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
    setSharedPcResult(null);
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

  const hasUncommittedRoomEdits =
    pendingSpawnOwnedFurnitureIds.length > 0 ||
    !placementListsMatch(liveFurniturePlacements, roomState.furniture);

  const discardUncommittedRoomEdits = useCallback(() => {
    pendingSpawnOwnedFurnitureIdsRef.current.clear();
    soldOwnedFurnitureIdsRef.current.clear();
    setPendingSpawnOwnedFurnitureIds([]);
    setLiveFurniturePlacements(roomStateRef.current.furniture);
    setSpawnRequest(null);
  }, []);

  const handleOpenMemoryFrame = useCallback(
    (furnitureId: string) => {
      if (
        !sharedRoomActive ||
        !roomState.furniture.some(
          (placement) => placement.id === furnitureId && placement.type === "wall_frame"
        )
      ) {
        return;
      }

      setSelectedMemoryFrameId(furnitureId);
    },
    [roomState.furniture, sharedRoomActive]
  );

  const handleSaveMemoryFrame = useCallback(
    async ({
      imageSrc,
      caption
    }: {
      imageSrc: string;
      caption: string | null;
    }) => {
      if (!selectedMemoryFrameId || !sharedRoomPlayerId) {
        return;
      }

      setMemoryFrameSaving(true);
      try {
        const nextRoomDocument = await sharedRoomRuntime.commitRoomMutation(
          "save_memory_frame",
          (snapshot) => ({
            roomState: snapshot.roomState,
            progression: snapshot.progression,
            frameMemories: upsertSharedRoomFrameMemory(snapshot.frameMemories, {
              furnitureId: selectedMemoryFrameId,
              imageSrc,
              caption,
              updatedAt: new Date().toISOString(),
              updatedByPlayerId: sharedRoomPlayerId
            }),
            sharedPet: snapshot.sharedPet
          })
        );

        if (nextRoomDocument) {
          setSelectedMemoryFrameId(null);
        }
      } finally {
        setMemoryFrameSaving(false);
      }
    },
    [selectedMemoryFrameId, sharedRoomPlayerId, sharedRoomRuntime]
  );

  const handleClearMemoryFrame = useCallback(async () => {
    if (!selectedMemoryFrameId) {
      return;
    }

    setMemoryFrameSaving(true);
    try {
      const nextRoomDocument = await sharedRoomRuntime.commitRoomMutation(
        "clear_memory_frame",
        (snapshot) => {
          const nextFrameMemories = { ...snapshot.frameMemories };
          delete nextFrameMemories[selectedMemoryFrameId];

          return {
            roomState: snapshot.roomState,
            progression: snapshot.progression,
            frameMemories: nextFrameMemories,
            sharedPet: snapshot.sharedPet
          };
        }
      );

      if (nextRoomDocument) {
        setSelectedMemoryFrameId(null);
      }
    } finally {
      setMemoryFrameSaving(false);
    }
  }, [selectedMemoryFrameId, sharedRoomRuntime]);

  const handleRefreshRoomState = useCallback(() => {
    if (
      sharedRoomActive &&
      hasUncommittedRoomEdits &&
      !window.confirm("Discard your unconfirmed changes and load the latest shared room?")
    ) {
      return;
    }

    discardUncommittedRoomEdits();
    void sharedRoomRuntime.reloadRoom();
  }, [
    discardUncommittedRoomEdits,
    hasUncommittedRoomEdits,
    sharedRoomActive,
    sharedRoomRuntime
  ]);

  const handleResetSandboxWithConfirmation = useCallback(() => {
    if (
      isDev &&
      !window.confirm(
        "Reset the local sandbox and developer workspace state? This cannot be undone."
      )
    ) {
      return;
    }

    handleResetSandbox();
  }, [isDev, sharedRoomActive, sharedRoomRuntime.runtimeSnapshot?.revision]);

  const handlePlayerRoomDetailsAction = useCallback(
    (
      actionId:
        | "copy_invite"
        | "refresh_room_state"
        | "toggle_grid_snap"
        | "import_skin"
        | "breakup_reset"
    ) => {
      switch (actionId) {
        case "refresh_room_state":
          handleRefreshRoomState();
          return;
        case "breakup_reset":
          setPlayerRoomDetailsOpen(false);
          setSelectedMemoryFrameId(null);
          setBreakupResetDialogOpen(true);
          return;
        case "toggle_grid_snap":
          setGridSnapEnabled((current) => !current);
          return;
        case "import_skin":
          handleSkinImport();
          return;
        case "copy_invite":
        default:
          return;
      }
    },
    [handleRefreshRoomState, handleSkinImport]
  );

  const handleBreakupResetConfirm = useCallback(async () => {
    if (!sharedRoomPlayerId) {
      return;
    }

    discardUncommittedRoomEdits();
    setBreakupResetSaving(true);

    try {
      const nextRoomDocument = await sharedRoomRuntime.commitRoomMutation(
        "breakup_reset",
        (snapshot) =>
          createBreakupResetMutation(
            snapshot,
            sharedRoomPlayerId,
            new Date().toISOString()
          )
      );

      if (nextRoomDocument) {
        setSharedPcResult(null);
        setBuildModeEnabled(false);
        setCatalogOpen(false);
        setPlayerInteractionStatus(null);
        setSelectedMemoryFrameId(null);
        setBreakupResetDialogOpen(false);
      }
    } finally {
      setBreakupResetSaving(false);
    }
  }, [discardUncommittedRoomEdits, sharedRoomPlayerId, sharedRoomRuntime]);

  const handlePlayerDockAction = useCallback(
    (actionId: "build" | "inventory" | "interaction") => {
      switch (actionId) {
        case "build":
          handleToggleBuildMode();
          return;
        case "inventory":
          handleToggleCatalog();
          return;
        case "interaction":
          setStandRequestToken((current) => current + 1);
          return;
        default:
          return;
      }
    },
    [handleToggleBuildMode, handleToggleCatalog]
  );

  const handleDeveloperQuickAction = useCallback(
    (actionId: "refresh_room_state" | "reset_camera" | "reset_sandbox") => {
      switch (actionId) {
        case "refresh_room_state":
          handleRefreshRoomState();
          return;
        case "reset_camera":
          handleResetCamera();
          return;
        case "reset_sandbox":
          handleResetSandboxWithConfirmation();
          return;
        default:
          return;
      }
    },
    [handleRefreshRoomState, handleResetSandboxWithConfirmation]
  );

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

  const effectiveShellViewMode: AppShellViewMode = isDev ? shellViewMode : "player";
  const hostedEntryFlowActive =
    sharedRoomRuntime.entryMode === "hosted" &&
    sharedRoomRuntime.bootstrapKind !== "room_ready";
  const developerSurfaceVisible =
    isDeveloperSurfaceVisible(effectiveShellViewMode, isDev) &&
    !hostedEntryFlowActive;
  const inviteCode = sharedRoomRuntime.roomDocument?.inviteCode ?? "";
  const memberCount = sharedRoomRuntime.roomDocument?.memberIds.length ?? 0;
  const roomId = sharedRoomRuntime.roomDocument?.roomId ?? null;
  const developerWorkspaceTabs = getDeveloperWorkspaceTabState(developerWorkspaceTab);
  const activeDeveloperTab =
    developerWorkspaceTabs.find((tab) => tab.isActive) ?? developerWorkspaceTabs[0];
  const playerCompanionCardState = getPlayerCompanionCardState({
    inviteCode,
    memberCount,
    presenceStatus: sharedRoomPresence.presenceStatus,
    ritualStatus,
    showInviteCode: !sharedRoomRuntime.devBypassActive && partnerPlayerProgression === null,
    statusMessage: sharedRoomRuntime.statusMessage
  });
  const playerActionDockState = getPlayerActionDockState({
    buildModeEnabled,
    catalogOpen,
    playerInteractionStatus
  });
  const playerRoomDetailsState = getPlayerRoomDetailsState({
    gridSnapEnabled,
    inviteCode,
    memberCount,
    roomId,
    sharedRoomActive
  });
  const developerQuickActions = getDeveloperQuickActions(sharedRoomActive);
  const developerSessionPanelState = getDeveloperSessionPanelState({
    inviteCode: inviteCode || null,
    memberCount,
    presenceStatus: sharedRoomPresence.presenceStatus,
    roomId,
    statusMessage: sharedRoomRuntime.statusMessage
  });

  const sharedRoomEntryOverlayNode = (
    <>
      {!sharedRoomActive &&
      !sharedRoomRuntime.blockingState &&
      !sharedRoomRuntime.devBypassActive ? (
        sharedRoomRuntime.entryMode === "hosted" ? (
          sharedRoomRuntime.bootstrapKind === "signed_out" ||
          sharedRoomRuntime.bootstrapKind === "needs_linking" ||
          sharedRoomRuntime.bootstrapKind === "pending_link" ? (
            <SharedRoomEntryShell
              bootstrapKind={sharedRoomRuntime.bootstrapKind}
              displayName={sharedRoomRuntime.displayName}
              errorMessage={sharedRoomRuntime.inlineError}
              mode="hosted"
              onCancelPairLink={() => {
                void sharedRoomRuntime.cancelPairLink();
              }}
              onConfirmPairLink={() => {
                void sharedRoomRuntime.confirmPairLink();
              }}
              onSignInWithGoogle={() => {
                void sharedRoomRuntime.signInWithGoogle();
              }}
              onSignOut={() => {
                void sharedRoomRuntime.signOut();
              }}
              onSubmitPartnerCode={(code) => {
                void sharedRoomRuntime.submitPartnerCode(code);
              }}
              pairLinkPresence={sharedRoomPresence.pairLinkPresence}
              pendingLink={sharedRoomRuntime.pendingLink}
              playerId={sharedRoomRuntime.profile.playerId}
              selfPairCode={sharedRoomRuntime.selfPairCode}
            />
          ) : null
        ) : (
          <SharedRoomEntryShell
            displayName={sharedRoomRuntime.displayName}
            errorMessage={sharedRoomRuntime.inlineError}
            mode="legacy"
            onCreateRoom={() => {
              void sharedRoomRuntime.createRoom(roomStateRef.current, playerCoinsRef.current);
            }}
            onDisplayNameChange={sharedRoomRuntime.setDisplayName}
            onJoinRoom={(code) => {
              void sharedRoomRuntime.joinRoom(code);
            }}
          />
        )
      ) : null}
    </>
  );

  const sharedRoomBlockingOverlayNode = sharedRoomRuntime.blockingState ? (
    <SharedRoomBlockingOverlay
      body={sharedRoomRuntime.blockingState.body}
      onRetry={
        sharedRoomRuntime.blockingState.retryable
          ? () => {
              handleRefreshRoomState();
            }
          : null
      }
      title={sharedRoomRuntime.blockingState.title}
    />
  ) : null;

  const sharedRoomModalNode = (
    <>
      <MemoryFrameDialog
        memory={selectedMemoryFrame}
        onClear={() => {
          void handleClearMemoryFrame();
        }}
        onClose={() => setSelectedMemoryFrameId(null)}
        onSave={handleSaveMemoryFrame}
        open={selectedMemoryFrameId !== null}
        saving={memoryFrameSaving}
      />
    </>
  );

  const roomStageNode = (
    <Suspense fallback={<div className="canvas-fallback">Loading scene...</div>}>
      <RoomView
        acquireEditLock={sharedRoomPresence.acquireEditLock}
        buildModeEnabled={buildModeEnabled}
        gridSnapEnabled={gridSnapEnabled}
        spawnRequest={spawnRequest}
        cameraResetToken={cameraResetToken}
        standRequestToken={standRequestToken}
        initialCameraPosition={cameraPosition}
        initialPlayerPosition={playerPosition}
        initialFurniturePlacements={roomState.furniture}
        frameMemories={runtimeFrameMemories}
        pets={displayedPets}
        skinSrc={skinSrc}
        localLockedFurnitureIds={sharedRoomPresence.localEditLockIds}
        onSharedEditConflict={() => {
          void sharedRoomRuntime.recoverFromStaleSharedEdit();
        }}
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
        onOpenMemoryFrame={sharedRoomActive ? handleOpenMemoryFrame : null}
        partnerLockedFurnitureIds={sharedRoomPresence.partnerEditLockIds}
        releaseEditLock={sharedRoomPresence.releaseEditLock}
        remotePresence={sharedRoomPresence.remotePresence}
        renewEditLock={sharedRoomPresence.renewEditLock}
        sceneJumpRequest={sceneJumpRequest}
      />
    </Suspense>
  );

  const previewStudioNode = (
    <Suspense fallback={<div className="preview-studio preview-studio--loading">Loading preview studio...</div>}>
      <FurniturePreviewStudio
        catalogSections={catalogSections}
        mode={previewStudioMode}
        onClose={() => {
          setPreviewStudioOpen(false);
          setDeveloperWorkspaceTab("room");
        }}
        onModeChange={(nextMode) => {
          setPreviewStudioMode(nextMode);
          setPreviewStudioOpen(true);
          setDeveloperWorkspaceTab(nextMode === "mob_lab" ? "mob_lab" : "preview_studio");
        }}
        onSelectMobChange={setPreviewStudioSelectedMobId}
        onSelectTypeChange={setPreviewStudioSelectedType}
        presentation="workspace"
        selectedMobId={previewStudioSelectedMobId}
        selectedType={previewStudioSelectedType}
      />
    </Suspense>
  );

  const inventoryPanelNode = (
    <InventoryPanel
      catalogSections={catalogSections}
      className={
        developerSurfaceVisible ? "spawn-panel--developer-workspace" : "spawn-panel--player-drawer"
      }
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
      petCatalogEntries={activePetCatalogEntries}
      petCatalogMode={sharedRoomActive ? "shared_room" : "sandbox"}
      playerCoins={displayedPlayerCoins}
      showAuthoringActions={developerSurfaceVisible}
      showPetCatalog
      walletLabel={walletLabel}
      storedInventorySections={storedInventorySections}
    />
  );

  let developerStageNode = roomStageNode;

  if (developerWorkspaceTab === "inventory") {
    developerStageNode = (
      <div className="developer-workspace-shell__panel-stage">{inventoryPanelNode}</div>
    );
  } else if (
    developerWorkspaceTab === "preview_studio" ||
    developerWorkspaceTab === "mob_lab"
  ) {
    developerStageNode = (
      <div className="developer-workspace-shell__panel-stage">{previewStudioNode}</div>
    );
  }

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
        {developerSurfaceVisible ? (
          <DeveloperWorkspaceShell
            header={
              <DeveloperWorkspaceHeader
                activeTabLabel={activeDeveloperTab.label}
                inspectorVisible={debugOpen}
                modeSwitch={
                  isDev ? (
                    <ViewModeSwitch
                      onChange={setShellViewMode}
                      value={effectiveShellViewMode}
                    />
                  ) : null
                }
                onQuickAction={handleDeveloperQuickAction}
                onToggleInspector={() => setDebugOpen((current) => !current)}
                quickActions={developerQuickActions}
                roomId={roomId}
              />
            }
            inspector={
              <DevPanel
                className="dev-panel--workspace"
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
                playerCoins={displayedPlayerCoins}
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
                onResetSandbox={handleResetSandboxWithConfirmation}
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
            }
            overlays={
              <>
                {sharedRoomActive ? sharedRoomBlockingOverlayNode : null}
                {sharedRoomModalNode}
              </>
            }
            rail={
              <DeveloperWorkspaceRail
                onSelectTab={handleSelectDeveloperWorkspaceTab}
                tabs={developerWorkspaceTabs}
              />
            }
            stage={developerStageNode}
            utility={
              <div className="developer-workspace-shell__utility-stack">
                <DeveloperSessionPanel
                  onRefreshRoomState={sharedRoomActive ? handleRefreshRoomState : null}
                  state={developerSessionPanelState}
                />
                <PerformanceMonitor />
                {skinError ? <div className="scene-note scene-note--inline">{skinError}</div> : null}
              </div>
            }
          />
        ) : (
          <PlayerRoomShell
            bottomCenter={
              hostedEntryFlowActive ? null : (
              <PlayerActionDock
                actions={playerActionDockState.actions}
                onAction={handlePlayerDockAction}
                statusLabel={playerActionDockState.statusLabel}
              />
              )
            }
            bottomLeft={
              hostedEntryFlowActive ? null : (
              <PlayerProgressStack
                coins={displayedPlayerCoins}
                playerLevel={playerLevel}
                playerXp={playerXp}
                playerXpNextLevel={playerXpNextLevel}
                streakCount={ritualStatus.streakCount}
                walletLabel={walletLabel}
              />
              )
            }
            drawer={hostedEntryFlowActive ? null : catalogOpen ? inventoryPanelNode : null}
            overlays={
              <>
                {sharedRoomBlockingOverlayNode}
                {sharedRoomEntryOverlayNode}
                {!hostedEntryFlowActive ? (
                  <PlayerRoomDetailsSheet
                    onAction={handlePlayerRoomDetailsAction}
                    onClose={() => setPlayerRoomDetailsOpen(false)}
                    open={playerRoomDetailsOpen}
                    state={playerRoomDetailsState}
                  />
                ) : null}
                {!hostedEntryFlowActive ? (
                  <BreakupResetDialog
                    onClose={() => setBreakupResetDialogOpen(false)}
                    onConfirm={handleBreakupResetConfirm}
                    open={breakupResetDialogOpen}
                    saving={breakupResetSaving}
                  />
                ) : null}
                {!hostedEntryFlowActive && pcMinigameActive ? (
                  <PcMinigameOverlay
                    currentCoins={displayedPlayerCoins}
                    dailyRitualBonusCoins={sharedPcResult?.dailyRitualBonusCoins ?? 0}
                    dailyRitualBonusXp={sharedPcResult?.dailyRitualBonusXp ?? 0}
                    dailyRitualStatus={sharedPcResult?.dailyRitualStatus ?? null}
                    onComplete={handlePcMinigameComplete}
                    onExit={handleExitPcMinigame}
                    progress={displayedPcMinigameProgress}
                    streakCount={sharedPcResult?.streakCount ?? ritualStatus.streakCount}
                  />
                ) : null}
                {sharedRoomModalNode}
              </>
            }
            stage={roomStageNode}
            topLeft={
              hostedEntryFlowActive ? null : (
                <PlayerClockChip label={worldTimeLabel} timeLocked={timeLocked} />
              )
            }
            topRight={
              hostedEntryFlowActive ? null : (
              <div className="player-room-shell__top-right-stack">
                <PlayerCompanionCard
                  expanded={playerCompanionCardExpanded}
                  onOpenDetails={() => setPlayerRoomDetailsOpen(true)}
                  onToggleExpanded={() =>
                    setPlayerCompanionCardExpanded((current) => !current)
                  }
                  state={playerCompanionCardState}
                />
                {skinError ? <div className="scene-note scene-note--inline">{skinError}</div> : null}
              </div>
              )
            }
            viewSwitch={
              isDev && !hostedEntryFlowActive ? (
                <ViewModeSwitch
                  onChange={setShellViewMode}
                  value={effectiveShellViewMode}
                />
              ) : null
            }
          />
        )}

        <input
          ref={skinInputRef}
          type="file"
          accept=".png,image/png"
          className="hidden-input"
          onChange={handleSkinFileChange}
        />
      </div>
    </>
  );
}

export default App;
