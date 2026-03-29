import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Leva } from "leva";
import { loadPersistedSandboxState } from "./lib/devLocalState";
import { buildCatCareSummary } from "./lib/catCare";
import { getAppRuntimeMode } from "./lib/appRuntimeConfig";
import { PET_REGISTRY, SANDBOX_PET_CATALOG, type PetType } from "./lib/pets";
import {
  cloneSharedPetLiveState,
  createSharedPetLiveState,
  toRuntimeOwnedPet
} from "./lib/sharedRoomPet";
import { createDefaultRoomState, type RoomState } from "./lib/roomState";
import {
  buildSharedRitualStatus,
  getSharedActivityClaimStatus,
  selectActivePlayerProgression,
  selectPartnerPlayerProgression
} from "./lib/sharedProgression";
import { ROOM_CAMERA_TARGET } from "./lib/sceneTargets";
import { DEFAULT_CAMERA_POSITION, DEFAULT_PLAYER_POSITION } from "./app/constants";
import { AppDeveloperView } from "./app/components/AppDeveloperView";
import { AppPlayerView } from "./app/components/AppPlayerView";
import { AppRoomStage } from "./app/components/AppRoomStage";
import { MemoryFrameDialog } from "./app/components/MemoryFrameDialog";
import { SharedRoomBlockingOverlay } from "./app/components/SharedRoomBlockingOverlay";
import { SharedRoomEntryShell } from "./app/components/SharedRoomEntryShell";
import { ViewModeSwitch } from "./app/components/ViewModeSwitch";
import { getPlayerXpNextLevel, toPcMinigameProgress } from "./app/appShellUtils";
import { useAppRoomActions } from "./app/hooks/useAppRoomActions";
import { useAppShellCallbacks } from "./app/hooks/useAppShellCallbacks";
import { useAppViewPreferences } from "./app/hooks/useAppViewPreferences";
import { useFurnitureInfoPopover } from "./app/hooks/useFurnitureInfoPopover";
import { useLocalRoomSession } from "./app/hooks/useLocalRoomSession";
import { useSandboxInventory } from "./app/hooks/useSandboxInventory";
import { useSandboxWorldClock } from "./app/hooks/useSandboxWorldClock";
import { useSharedRoomPresence } from "./app/hooks/useSharedRoomPresence";
import { useSharedRoomRuntime } from "./app/hooks/useSharedRoomRuntime";
import { useSkinImport } from "./app/hooks/useSkinImport";
import { APP_LEVA_THEME } from "./app/levaTheme";
import {
  getDeveloperQuickActions,
  getDeveloperSessionPanelState,
  getDeveloperWorkspaceTabState,
  getPlayerActionDockState,
  getPlayerCompanionCardState,
  getPlayerRoomDetailsState,
  isDeveloperSurfaceVisible
} from "./app/shellViewModel";
import type {
  AppShellViewMode,
  BuildModeSource,
  PlayerDrawerMode,
  PreviewStudioMode
} from "./app/types";
import { InventoryPanel } from "./components/ui";
import { BackgroundMusicPlayer } from "./components/ui/BackgroundMusicPlayer";
import {
  SHOWCASE_HUD_DAY_LABEL,
  SHOWCASE_SANDBOX_SEED,
  SHOWCASE_WORLD_SETTINGS_SEED
} from "./lib/showcaseSeed";

const SHOWCASE_IMPORTED_CAT_PRESET_ID = "better_cat_tabby_fluffy_tail_orange_eye_grey";

function App() {
  const isDev = import.meta.env.DEV;
  const showcaseMode = getAppRuntimeMode() === "showcase";
  const initialSandboxState = useMemo(
    () =>
      loadPersistedSandboxState(
        DEFAULT_CAMERA_POSITION,
        DEFAULT_PLAYER_POSITION,
        createDefaultRoomState(),
        showcaseMode ? SHOWCASE_SANDBOX_SEED : undefined
      ),
    [showcaseMode]
  );
  const preferences = useAppViewPreferences(
    isDev,
    showcaseMode ? SHOWCASE_WORLD_SETTINGS_SEED : undefined
  );
  const {
    skinSrc,
    setSkinSrc,
    skinError,
    skinInputRef,
    handleSkinImport,
    handleSkinFileChange
  } = useSkinImport(initialSandboxState.skinSrc);
  const sharedRoomRuntime = useSharedRoomRuntime({
    devBootstrapRoomState: initialSandboxState.roomState,
    devBootstrapSharedCoins: initialSandboxState.playerCoins,
    devBypassEnabled: showcaseMode ? false : undefined,
    hostedFlowEnabled: showcaseMode ? false : undefined,
    legacySessionEnabled: showcaseMode ? false : undefined
  });
  const devFallbackRoomMode = sharedRoomRuntime.entryMode === "dev_fallback";
  const sharedRoomActive =
    !showcaseMode && sharedRoomRuntime.runtimeSnapshot !== null && !devFallbackRoomMode;
  const roomSession = useLocalRoomSession({
    initialSandboxState,
    skinSrc,
    sharedRoomActive
  });
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
    worldTimeLabel12h,
    ampm,
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
  } = useSandboxWorldClock(
    showcaseMode ? SHOWCASE_WORLD_SETTINGS_SEED : undefined
  );
  const {
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
    developerWorkspaceTab,
    gridSnapEnabled,
    playerCompanionCardExpanded,
    playerRoomDetailsOpen,
    previewStudioMode,
    previewStudioOpen,
    previewStudioSelectedMobId,
    previewStudioSelectedType,
    setBuildModeEnabled,
    setCatalogOpen,
    setDebugOpen,
    setDevPanelActionsCollapsed,
    setDevPanelBuildSettingsCollapsed,
    setDevPanelCameraPropertiesCollapsed,
    setDevPanelCollisionDebugCollapsed,
    setDevPanelLightingFxCollapsed,
    setDevPanelPlayerCoordinatesCollapsed,
    setDevPanelPlayerStateCollapsed,
    setDevPanelWorldSettingsCollapsed,
    setDeveloperWorkspaceTab,
    setGridSnapEnabled,
    setPlayerCompanionCardExpanded,
    setPlayerRoomDetailsOpen,
    setPreviewStudioMode,
    setPreviewStudioOpen,
    setPreviewStudioSelectedMobId,
    setPreviewStudioSelectedType,
    setShellViewMode,
    setShowCollisionDebug,
    setShowInteractionMarkers,
    setShowPlayerCollider,
    shellViewMode,
    showCollisionDebug,
    showInteractionMarkers,
    showPlayerCollider
  } = preferences;
  const {
    breakupResetDialogOpen,
    breakupResetSaving,
    cameraPosition,
    cameraPositionRef,
    cameraResetToken,
    liveFurniturePlacements,
    localPresenceSnapshot,
    localSharedPetState,
    memoryFrameSaving,
    nextSceneJumpRequestIdRef,
    nextSpawnRequestIdRef,
    ownedPets,
    ownedPetsRef,
    pendingSpawnOwnedFurnitureIds,
    pendingSpawnOwnedFurnitureIdsRef,
    pcMinigameProgress,
    playerCoins,
    playerCoinsRef,
    playerInteractionStatus,
    playerPosition,
    playerPositionRef,
    roomState,
    roomStateRef,
    sceneJumpRequest,
    selectedMemoryFrameId,
    setBreakupResetDialogOpen,
    setBreakupResetSaving,
    setCameraPosition,
    setCameraResetToken,
    setLiveFurniturePlacements,
    setLocalPresenceSnapshot,
    setLocalSharedPetState,
    setMemoryFrameSaving,
    setOwnedPets,
    setPendingSpawnOwnedFurnitureIds,
    setPcMinigameProgress,
    setPlayerCoins,
    setPlayerInteractionStatus,
    setPlayerPosition,
    setRoomState,
    setSceneJumpRequest,
    setSelectedMemoryFrameId,
    setSharedPcResult,
    setSpawnRequest,
    setStandRequestToken,
    sharedPcResult,
    soldOwnedFurnitureIdsRef,
    spawnRequest,
    standRequestToken
  } = roomSession;
  const {
    catalogSections,
    inventoryByType,
    storedInventorySections
  } = useSandboxInventory(
    roomState.ownedFurniture,
    liveFurniturePlacements,
    pendingSpawnOwnedFurnitureIds
  );
  const petCatalogEntries = SANDBOX_PET_CATALOG;
  const sharedRoomPlayerId = sharedRoomRuntime.session?.playerId ?? null;
  const displayedPets = useMemo(
    () =>
      sharedRoomActive
        ? (sharedRoomRuntime.runtimeSnapshot?.sharedPets ?? []).map(toRuntimeOwnedPet)
        : ownedPets.filter((pet) => pet.status === "active_room"),
    [ownedPets, sharedRoomActive, sharedRoomRuntime.runtimeSnapshot?.sharedPets]
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
  const ownedPetPresetIds = useMemo(
    () => new Set(ownedPets.map((pet) => pet.presetId)),
    [ownedPets]
  );
  const sandboxCatCareSummary = useMemo(() => buildCatCareSummary(ownedPets), [ownedPets]);
  const activeCats = displayedPets;
  const storedCats = useMemo(
    () => (sharedRoomActive ? [] : ownedPets.filter((pet) => pet.status === "stored_roster")),
    [ownedPets, sharedRoomActive]
  );
  const catsNeedingCare = sharedRoomActive ? [] : sandboxCatCareSummary.catsNeedingCare;
  const catsNeedingCareIds = useMemo(
    () => new Set(catsNeedingCare.map((pet) => pet.id)),
    [catsNeedingCare]
  );
  const unlockedThemeIds = useMemo(
    () => new Set(roomState.metadata.unlockedThemes),
    [roomState.metadata.unlockedThemes]
  );
  const unlockedFurnitureIds = useMemo(
    () => new Set(roomState.metadata.unlockedFurniture),
    [roomState.metadata.unlockedFurniture]
  );
  const runtimeFrameMemories = sharedRoomRuntime.runtimeSnapshot?.frameMemories ?? {};
  const selectedMemoryFrame = selectedMemoryFrameId
    ? runtimeFrameMemories[selectedMemoryFrameId] ?? null
    : null;
  const sharedRoomPresence = useSharedRoomPresence({
    enabled: sharedRoomActive,
    bootstrapKind: sharedRoomRuntime.bootstrapKind,
    localPresence: localPresenceSnapshot,
    localSharedPetState,
    pendingLinkId:
      sharedRoomRuntime.bootstrapKind === "pending_link"
        ? sharedRoomRuntime.pendingLink?.pendingLinkId ?? null
        : null,
    partnerId: sharedRoomRuntime.session?.partnerId ?? null,
    profile: sharedRoomRuntime.profile,
    roomId: sharedRoomRuntime.runtimeSnapshot?.roomId ?? null,
    skinSrc
  });
  const sharedPetAuthorityActive =
    sharedRoomActive &&
    (sharedRoomRuntime.runtimeSnapshot?.sharedPets.length ?? 0) > 0 &&
    (sharedRoomPresence.remotePresence === null ||
      sharedRoomRuntime.profile.playerId.localeCompare(
        sharedRoomRuntime.session?.partnerId ?? sharedRoomRuntime.profile.playerId
      ) <= 0);
  const effectiveSharedPetLiveState = sharedPetAuthorityActive
    ? localSharedPetState ?? sharedRoomPresence.sharedPetState
    : sharedRoomPresence.sharedPetState;
  const sharedRuntimePetRecord = (sharedRoomRuntime.runtimeSnapshot?.sharedPets ?? [])[0] ?? null;

  useEffect(() => {
    if (!sharedRoomActive || !sharedRuntimePetRecord) {
      setLocalSharedPetState(null);
      return;
    }

    if (!sharedPetAuthorityActive) {
      setLocalSharedPetState(null);
      return;
    }

    setLocalSharedPetState((currentState) => {
      if (currentState && currentState.petId === sharedRuntimePetRecord.id) {
        return currentState;
      }

      if (
        sharedRoomPresence.sharedPetState &&
        sharedRoomPresence.sharedPetState.petId === sharedRuntimePetRecord.id
      ) {
        return cloneSharedPetLiveState(sharedRoomPresence.sharedPetState);
      }

      return createSharedPetLiveState(
        sharedRuntimePetRecord,
        sharedRoomRuntime.profile.playerId,
        new Date().toISOString()
      );
    });
  }, [
    setLocalSharedPetState,
    sharedPetAuthorityActive,
    sharedRoomActive,
    sharedRoomPresence.sharedPetState,
    sharedRoomRuntime.profile.playerId,
    sharedRuntimePetRecord
  ]);

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
  const activityStatusNowIso = new Date().toISOString();
  const sharedPcClaimStatusByActivityId =
    sharedRoomActive && sharedRoomRuntime.session?.playerId && sharedRoomRuntime.runtimeSnapshot
      ? {
          pc_snake: getSharedActivityClaimStatus({
            progression: sharedRoomRuntime.runtimeSnapshot.progression,
            activityId: "pc_snake",
            claimMode: "per_player",
            actorPlayerId: sharedRoomRuntime.session.playerId,
            nowIso: activityStatusNowIso
          }),
          pc_block_stacker: getSharedActivityClaimStatus({
            progression: sharedRoomRuntime.runtimeSnapshot.progression,
            activityId: "pc_block_stacker",
            claimMode: "per_player",
            actorPlayerId: sharedRoomRuntime.session.playerId,
            nowIso: activityStatusNowIso
          }),
          pc_pacman: getSharedActivityClaimStatus({
            progression: sharedRoomRuntime.runtimeSnapshot.progression,
            activityId: "pc_pacman",
            claimMode: "per_player",
            actorPlayerId: sharedRoomRuntime.session.playerId,
            nowIso: activityStatusNowIso
          })
        }
      : null;
  const sharedPcPaidTodayByActivityId = sharedPcClaimStatusByActivityId
    ? {
        pc_snake: !sharedPcClaimStatusByActivityId.pc_snake.payoutAvailable,
        pc_block_stacker: !sharedPcClaimStatusByActivityId.pc_block_stacker.payoutAvailable,
        pc_pacman: !sharedPcClaimStatusByActivityId.pc_pacman.payoutAvailable
      }
    : undefined;
  const sharedPcReadyCount = sharedPcClaimStatusByActivityId
    ? Object.values(sharedPcClaimStatusByActivityId).filter((claimStatus) => claimStatus.payoutAvailable)
        .length
    : 0;
  const sharedCozyRestClaimStatus =
    sharedRoomActive && sharedRoomRuntime.session?.playerId && sharedRoomRuntime.runtimeSnapshot
      ? getSharedActivityClaimStatus({
          progression: sharedRoomRuntime.runtimeSnapshot.progression,
          activityId: "cozy_rest",
          claimMode: "couple",
          actorPlayerId: sharedRoomRuntime.session.playerId,
          nowIso: activityStatusNowIso
        })
      : null;
  const togetherDaysCount = sharedRoomRuntime.runtimeSnapshot
    ? sharedRoomRuntime.runtimeSnapshot.progression.couple.togetherDaysCount
    : 0;
  const visitCompletedToday =
    sharedRoomActive && sharedRoomRuntime.session?.playerId && sharedRoomRuntime.runtimeSnapshot
      ? Boolean(
          sharedRoomRuntime.runtimeSnapshot.progression.couple.visitDay.visitedByPlayerId[
            sharedRoomRuntime.session.playerId
          ]
        )
      : false;
  const deskActivityReadyNow = sharedRoomActive ? sharedPcReadyCount > 0 : true;
  const deskActivityPaidToday = sharedRoomActive ? sharedPcReadyCount === 0 : false;
  const cozyRestReadyNow =
    sharedRoomActive &&
    sharedRoomPresence.cozyRestEligibility.eligible &&
    Boolean(sharedCozyRestClaimStatus?.payoutAvailable);
  const cozyRestPaidToday = sharedRoomActive
    ? Boolean(sharedCozyRestClaimStatus && !sharedCozyRestClaimStatus.payoutAvailable)
    : false;
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
    cameraPositionRef.current = cameraPosition;
  }, [cameraPosition, cameraPositionRef]);

  useEffect(() => {
    playerPositionRef.current = playerPosition;
  }, [playerPosition, playerPositionRef]);

  useEffect(() => {
    roomStateRef.current = roomState;
  }, [roomState, roomStateRef]);

  const lastSyncedRevisionRef = useRef<number>(0);

  useEffect(() => {
    if (!sharedRoomActive) {
      lastSyncedRevisionRef.current = 0;
      return;
    }

    const runtimeSnapshot = sharedRoomRuntime.runtimeSnapshot;

    if (!runtimeSnapshot) {
      return;
    }

    const runtimePlayerProgression = selectActivePlayerProgression(
      runtimeSnapshot.progression,
      sharedRoomRuntime.session?.playerId
    );

    if (runtimeSnapshot.revision === lastSyncedRevisionRef.current) {
      if (runtimePlayerProgression && playerCoinsRef.current !== runtimePlayerProgression.coins) {
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
  }, [
    pendingSpawnOwnedFurnitureIdsRef,
    playerCoinsRef,
    roomStateRef,
    setLiveFurniturePlacements,
    setPendingSpawnOwnedFurnitureIds,
    setPlayerCoins,
    setRoomState,
    setSpawnRequest,
    sharedRoomActive,
    sharedRoomRuntime.runtimeSnapshot,
    sharedRoomRuntime.session?.playerId,
    soldOwnedFurnitureIdsRef
  ]);

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
      (placement) => placement.id === selectedMemoryFrameId && placement.type === "wall_frame"
    );

    if (!frameStillExists) {
      setSelectedMemoryFrameId(null);
    }
  }, [
    roomState.furniture,
    selectedMemoryFrameId,
    setBreakupResetDialogOpen,
    setSelectedMemoryFrameId,
    sharedRoomActive
  ]);
  const [playerDrawerMode, setPlayerDrawerMode] = useState<PlayerDrawerMode>("inventory");
  const [buildModeSource, setBuildModeSource] = useState<BuildModeSource>(
    buildModeEnabled ? "manual" : null
  );

  useEffect(() => {
    if (!buildModeEnabled && buildModeSource !== null) {
      setBuildModeSource(null);
    }
  }, [buildModeEnabled, buildModeSource]);

  const handlePlacementBuildSessionComplete = useCallback(() => {
    if (buildModeSource !== "placement") {
      return;
    }

    setBuildModeEnabled(false);
    setBuildModeSource(null);
  }, [buildModeSource, setBuildModeEnabled, setBuildModeSource]);

  const {
    applyLocalSharedSnapshot,
    commitPlayerCoins,
    handleActivateStoredPet,
    handleBuyFurniture,
    handleBuyPet,
    handleCareForPet,
    handleClaimCozyRest,
    handleDeveloperPlayerCoinsCommit,
    handleExitPcMinigame,
    handlePcMinigameComplete,
    handlePlaceStoredFurniture,
    handleRemovePet,
    handleSellStoredFurniture,
    handleStorePet,
    handleUnlockTheme,
    handleUnlockFurniture,
    handleSetTheme,
    updatePendingSpawnOwnedFurnitureIds
  } = useAppRoomActions({
    activePlayerProgression,
    buildModeSource,
    cozyRestReadyNow,
    inventoryByType,
    liveFurniturePlacements,
    ownedPetsRef,
    playerPosition,
    pendingSpawnOwnedFurnitureIdsRef,
    playerCoinsRef,
    roomStateRef,
    setBuildModeEnabled,
    setBuildModeSource,
    setCatalogOpen,
    setLiveFurniturePlacements,
    setOwnedPets,
    setPendingSpawnOwnedFurnitureIds,
    setPcMinigameProgress,
    setPlayerCoins,
    setRoomState,
    setSharedPcResult,
    setSpawnRequest,
    setStandRequestToken,
    sharedRoomActive,
    sharedRoomPlayerId,
    sharedRoomRuntime,
    soldOwnedFurnitureIdsRef,
    nextSpawnRequestIdRef
  });

  const {
    applyTransformChanges,
    commitCameraAxis,
    commitPlayerAxis,
    handleBreakupResetConfirm,
    handleCameraPositionChange,
    openPlayerDrawerMode,
    handleClearMemoryFrame,
    handleCommittedFurnitureChange,
    handleDeveloperQuickAction,
    handleFurnitureSnapshotChange,
    handleOpenMemoryFrame,
    handlePlayerDockAction,
    handlePlayerPositionChange,
    handlePlayerRoomDetailsAction,
    handleRefreshRoomState,
    handleResetCamera,
    handleResetSandboxWithConfirmation,
    handleSaveMemoryFrame,
    handleSelectDeveloperWorkspaceTab,
    handleToggleBuildMode,
    handleToggleCatalog,
    hasUncommittedRoomEdits,
    openMobPreviewStudio,
    openPreviewStudio
  } = useAppShellCallbacks({
    cameraPositionRef,
    catalogOpen,
    commitPlayerCoins,
    handleClaimCozyRest,
    handleSkinImport,
    isDev,
    liveFurniturePlacements,
    pendingSpawnOwnedFurnitureIds,
    pendingSpawnOwnedFurnitureIdsRef,
    playerInteractionStatus,
    playerPositionRef,
    roomState,
    roomStateRef,
    sandboxResetState: showcaseMode ? SHOWCASE_SANDBOX_SEED : undefined,
    selectedMemoryFrameId,
    setBreakupResetDialogOpen,
    setBreakupResetSaving,
    setBuildModeEnabled,
    setBuildModeSource,
    setCameraPosition,
    setCameraResetToken,
    setCatalogOpen,
    setDeveloperWorkspaceTab,
    setGridSnapEnabled,
    setLiveFurniturePlacements,
    setLocalPresenceSnapshot,
    setMemoryFrameSaving,
    setOwnedPets,
    setPcMinigameProgress,
    setPendingSpawnOwnedFurnitureIds,
    setPlayerInteractionStatus,
    setPlayerDrawerMode,
    setPlayerPosition,
    setPlayerRoomDetailsOpen,
    setPreviewStudioMode,
    setPreviewStudioOpen,
    setPreviewStudioSelectedMobId,
    setPreviewStudioSelectedType,
    setRoomState,
    setSceneJumpRequest,
    setSelectedMemoryFrameId,
    setSharedPcResult,
    setShellViewMode,
    setSkinSrc,
    setSpawnRequest,
    setStandRequestToken,
    sharedRoomActive,
    sharedRoomPlayerId,
    sharedRoomRuntime,
    soldOwnedFurnitureIdsRef,
    nextSceneJumpRequestIdRef
  });
  const pcMinigameActive =
    playerInteractionStatus?.phase === "active" &&
    playerInteractionStatus.interactionType === "use_pc";

  const effectiveShellViewMode: AppShellViewMode = isDev ? shellViewMode : "player";
  const hostedEntryFlowActive =
    !showcaseMode &&
    (sharedRoomRuntime.entryMode === "hosted" ||
      sharedRoomRuntime.entryMode === "hosted_unavailable") &&
    sharedRoomRuntime.bootstrapKind !== "room_ready";
  const developerSurfaceVisible =
    isDeveloperSurfaceVisible(effectiveShellViewMode, isDev) && !hostedEntryFlowActive;
  const inviteCode = sharedRoomRuntime.roomDocument?.inviteCode ?? "";
  const memberCount = sharedRoomRuntime.roomDocument?.memberIds.length ?? 0;
  const roomId = sharedRoomRuntime.roomDocument?.roomId ?? null;
  const developerWorkspaceTabs = getDeveloperWorkspaceTabState(developerWorkspaceTab);
  const activeDeveloperTab =
    developerWorkspaceTabs.find((tab) => tab.isActive) ?? developerWorkspaceTabs[0];
  const playerCompanionCardState = getPlayerCompanionCardState({
    activeCatCount: activeCats.length,
    catsNeedingCareCount: catsNeedingCare.length,
    cozyRestPaidToday,
    cozyRestReadyNow,
    deskActivityPaidToday,
    deskActivityReadyNow,
    inviteCode,
    memberCount,
    presenceStatus: sharedRoomPresence.presenceStatus,
    ritualStatus,
    runtimeEntryMode: sharedRoomRuntime.entryMode,
    showcaseMode,
    showInviteCode:
      !showcaseMode &&
      !sharedRoomRuntime.devBypassActive &&
      partnerPlayerProgression === null,
    statusMessage: sharedRoomRuntime.statusMessage,
    storedCatCount: storedCats.length,
    togetherDaysCount,
    visitCompletedToday
  });
  const playerRoomActivityRows = sharedPcClaimStatusByActivityId
    ? [
        { label: "Snake", value: sharedPcClaimStatusByActivityId.pc_snake.payoutAvailable ? "Ready now" : "Paid today" },
        { label: "Block Stacker", value: sharedPcClaimStatusByActivityId.pc_block_stacker.payoutAvailable ? "Ready now" : "Paid today" },
        { label: "Pacman", value: sharedPcClaimStatusByActivityId.pc_pacman.payoutAvailable ? "Ready now" : "Paid today" },
        { label: "Cozy Rest", value: cozyRestPaidToday ? "Paid today" : cozyRestReadyNow ? "Ready now" : "Lie down together" }
      ]
    : [
        { label: "Active Cats", value: playerCompanionCardState.activeCatCountLabel },
        { label: "Stored Cats", value: playerCompanionCardState.storedCatCountLabel },
        { label: "Cat Care", value: playerCompanionCardState.catsNeedingCareLabel },
        { label: "Desk PC", value: "Ready now" },
        {
          label: "Cozy Rest",
          value: showcaseMode
            ? "Shared-room feature"
            : sharedRoomActive
              ? "Lie down together"
              : "Shared room only"
        }
      ];
  const playerActionDockState = getPlayerActionDockState({
    buildModeEnabled,
    catalogOpen,
    cozyRestPaidToday,
    cozyRestReadyNow,
    playerInteractionStatus
  });
  const playerRoomDetailsState = getPlayerRoomDetailsState({
    activityRows: playerRoomActivityRows,
    gridSnapEnabled,
    inviteCode,
    memberCount,
    roomId,
    sharedRoomActive,
    showcaseMode,
    togetherDaysCount,
    visitCompletedToday
  });
  const developerQuickActions = getDeveloperQuickActions(sharedRoomActive);
  const developerSessionPanelState = getDeveloperSessionPanelState({
    inviteCode: inviteCode || null,
    memberCount,
    presenceStatus: sharedRoomPresence.presenceStatus,
    roomId,
    statusMessage: sharedRoomRuntime.statusMessage
  });

  const sharedRoomEntryOverlayNode = showcaseMode ? null : (
    <>
      {!sharedRoomActive && !sharedRoomRuntime.blockingState && !sharedRoomRuntime.devBypassActive ? (
        sharedRoomRuntime.entryMode === "hosted" ? (
          sharedRoomRuntime.bootstrapKind === "signed_out" ||
          sharedRoomRuntime.bootstrapKind === "needs_linking" ||
          sharedRoomRuntime.bootstrapKind === "pending_link" ? (
            <SharedRoomEntryShell
              bootstrapKind={sharedRoomRuntime.bootstrapKind}
              displayName={sharedRoomRuntime.displayName}
              errorMessage={sharedRoomRuntime.inlineError}
              mode="hosted"
              onCancelPairLink={() => { void sharedRoomRuntime.cancelPairLink(); }}
              onConfirmPairLink={() => { void sharedRoomRuntime.confirmPairLink(); }}
              onSignInWithGoogle={() => { void sharedRoomRuntime.signInWithGoogle(); }}
              onSignOut={() => { void sharedRoomRuntime.signOut(); }}
              onSubmitPartnerCode={(code) => { void sharedRoomRuntime.submitPartnerCode(code); }}
              pairLinkPresence={sharedRoomPresence.pairLinkPresence}
              pendingLink={sharedRoomRuntime.pendingLink}
              playerId={sharedRoomRuntime.profile.playerId}
              selfPairCode={sharedRoomRuntime.selfPairCode}
            />
          ) : null
        ) : sharedRoomRuntime.entryMode === "hosted_unavailable" ? (
          <SharedRoomEntryShell detail={sharedRoomRuntime.hostedUnavailableBody} errorMessage={sharedRoomRuntime.inlineError} mode="hosted_unavailable" />
        ) : (
          <SharedRoomEntryShell
            displayName={sharedRoomRuntime.displayName}
            errorMessage={sharedRoomRuntime.inlineError}
            mode="legacy"
            onCreateRoom={() => { void sharedRoomRuntime.createRoom(roomStateRef.current, playerCoinsRef.current); }}
            onDisplayNameChange={sharedRoomRuntime.setDisplayName}
            onJoinRoom={(code) => { void sharedRoomRuntime.joinRoom(code); }}
          />
        )
      ) : null}
    </>
  );

  const sharedRoomBlockingOverlayNode = !showcaseMode && sharedRoomRuntime.blockingState ? (
    <SharedRoomBlockingOverlay
      body={sharedRoomRuntime.blockingState.body}
      onRetry={sharedRoomRuntime.blockingState.retryable ? () => { handleRefreshRoomState(); } : null}
      title={sharedRoomRuntime.blockingState.title}
    />
  ) : null;

  const sharedRoomModalNode = (
    <MemoryFrameDialog
      memory={selectedMemoryFrame}
      onClear={() => { void handleClearMemoryFrame(); }}
      onClose={() => setSelectedMemoryFrameId(null)}
      onSave={handleSaveMemoryFrame}
      open={selectedMemoryFrameId !== null}
      saving={memoryFrameSaving}
    />
  );

  const inventoryPanelNode = useMemo(
    () => (
      <InventoryPanel
        activeCats={sharedRoomActive ? [] : activeCats}
        catalogSections={catalogSections}
        catsNeedingCareIds={catsNeedingCareIds}
        className={developerSurfaceVisible ? "spawn-panel--developer-workspace" : "spawn-panel--player-drawer"}
        activeMode={playerDrawerMode}
        hoverPreviewEnabled={hoverPreviewEnabled}
        inventoryByType={inventoryByType}
        onActivateStoredPet={handleActivateStoredPet}
        onBuyFurniture={handleBuyFurniture}
        onBuyPet={handleBuyPet}
        onChangeMode={setPlayerDrawerMode}
        onCareForPet={handleCareForPet}
        onCloseFurnitureInfo={handleCloseFurnitureInfo}
        onOpenFurnitureInfo={handleOpenFurnitureInfo}
        onOpenMobStudio={openMobPreviewStudio}
        onOpenStudio={openPreviewStudio}
        onPlaceStoredFurniture={handlePlaceStoredFurniture}
        onRemovePet={handleRemovePet}
        onSellStoredFurniture={handleSellStoredFurniture}
        onStorePet={handleStorePet}
        onToggleFurnitureInfo={handleToggleFurnitureInfo}
        onUnlockTheme={handleUnlockTheme}
        onUnlockFurniture={handleUnlockFurniture}
        openFurnitureInfoKey={openFurnitureInfoKey}
        ownedPetPresetIds={ownedPetPresetIds}
        ownedPetTypes={ownedPetTypes}
        petCatalogEntries={activePetCatalogEntries}
        petCatalogMode={sharedRoomActive ? "shared_room" : "sandbox"}
        playerCoins={displayedPlayerCoins}
        storedCats={sharedRoomActive ? [] : storedCats}
        showAuthoringActions={developerSurfaceVisible}
        showPetCatalog
        unlockedThemeIds={unlockedThemeIds}
        unlockedFurnitureIds={unlockedFurnitureIds}
        walletLabel={walletLabel}
        storedInventorySections={storedInventorySections}
      />
    ),
    [
      activeCats,
      activePetCatalogEntries,
      catalogSections,
      catsNeedingCareIds,
      developerSurfaceVisible,
      displayedPlayerCoins,
      handleActivateStoredPet,
      handleBuyFurniture,
      handleBuyPet,
      handleCareForPet,
      handleCloseFurnitureInfo,
      handleOpenFurnitureInfo,
      handlePlaceStoredFurniture,
      handleRemovePet,
      handleSellStoredFurniture,
      handleStorePet,
      handleToggleFurnitureInfo,
      handleUnlockTheme,
      handleUnlockFurniture,
      hoverPreviewEnabled,
      playerDrawerMode,
      inventoryByType,
      openFurnitureInfoKey,
      openMobPreviewStudio,
      openPreviewStudio,
      ownedPetPresetIds,
      ownedPetTypes,
      sharedRoomActive,
      storedCats,
      storedInventorySections,
      unlockedThemeIds,
      unlockedFurnitureIds,
      walletLabel
    ]
  );

  const roomViewProps = useMemo(
    () => ({
      acquireEditLock: sharedRoomActive ? sharedRoomPresence.acquireEditLock : undefined,
      buildModeEnabled,
      buildModeSource,
      gridSnapEnabled,
      spawnRequest,
      cameraResetToken,
      standRequestToken,
      initialCameraPosition: cameraPosition,
      initialPlayerPosition: playerPosition,
      initialFurniturePlacements: roomState.furniture,
      frameMemories: runtimeFrameMemories,
      pets: displayedPets,
      skinSrc,
      localLockedFurnitureIds: sharedRoomPresence.localEditLockIds,
      onSharedEditConflict: sharedRoomActive
        ? () => { void sharedRoomRuntime.recoverFromStaleSharedEdit(); }
        : undefined,
      worldTimeMinutes,
      sunEnabled,
      shadowsEnabled,
      fogEnabled,
      fogDensity,
      ambientMultiplier,
      sunIntensityMultiplier,
      brightness,
      saturation,
      contrast,
      showCollisionDebug,
      showPlayerCollider,
      showInteractionMarkers,
      onCameraPositionChange: handleCameraPositionChange,
      onLocalPresenceChange: setLocalPresenceSnapshot,
      onLocalSharedPetStateChange: setLocalSharedPetState,
      onPlayerPositionChange: handlePlayerPositionChange,
      onFurnitureSnapshotChange: handleFurnitureSnapshotChange,
      onCommittedFurnitureChange: handleCommittedFurnitureChange,
      onInteractionStateChange: setPlayerInteractionStatus,
      onOpenMemoryFrame: sharedRoomActive ? handleOpenMemoryFrame : null,
      onPlacementBuildSessionComplete: handlePlacementBuildSessionComplete,
      partnerLockedFurnitureIds: sharedRoomPresence.partnerEditLockIds,
      releaseEditLock: sharedRoomActive ? sharedRoomPresence.releaseEditLock : undefined,
      remotePresence: sharedRoomPresence.remotePresence,
      renewEditLock: sharedRoomActive ? sharedRoomPresence.renewEditLock : undefined,
      sceneJumpRequest,
      sharedPetAuthorityActive,
      sharedPetLiveState: effectiveSharedPetLiveState,
      roomMetadata: roomState.metadata
    }),
    [
      ambientMultiplier,
      brightness,
      cameraPosition,
      cameraResetToken,
      contrast,
      displayedPets,
      effectiveSharedPetLiveState,
      fogDensity,
      fogEnabled,
      gridSnapEnabled,
      handleCameraPositionChange,
      handleCommittedFurnitureChange,
      handleFurnitureSnapshotChange,
      handleOpenMemoryFrame,
      handlePlayerPositionChange,
      handlePlacementBuildSessionComplete,
      buildModeEnabled,
      buildModeSource,
      playerPosition,
      roomState.furniture,
      roomState.metadata,
      runtimeFrameMemories,
      saturation,
      sceneJumpRequest,
      setLocalPresenceSnapshot,
      setLocalSharedPetState,
      setPlayerInteractionStatus,
      sharedPetAuthorityActive,
      sharedRoomActive,
      sharedRoomPresence.acquireEditLock,
      sharedRoomPresence.localEditLockIds,
      sharedRoomPresence.partnerEditLockIds,
      sharedRoomPresence.releaseEditLock,
      sharedRoomPresence.remotePresence,
      sharedRoomPresence.renewEditLock,
      sharedRoomRuntime.recoverFromStaleSharedEdit,
      shadowsEnabled,
      showCollisionDebug,
      showInteractionMarkers,
      showPlayerCollider,
      skinSrc,
      spawnRequest,
      standRequestToken,
      sunEnabled,
      sunIntensityMultiplier,
      worldTimeMinutes
    ]
  );

  const previewStudioProps = useMemo(
    () => ({
      catalogSections,
      mode: previewStudioMode,
      onClose: () => {
        setPreviewStudioOpen(false);
        setDeveloperWorkspaceTab("room");
      },
      onModeChange: (nextMode: PreviewStudioMode) => {
        setPreviewStudioMode(nextMode);
        setPreviewStudioOpen(true);
        setDeveloperWorkspaceTab(nextMode === "mob_lab" ? "mob_lab" : "preview_studio");
      },
      onSelectMobChange: setPreviewStudioSelectedMobId,
      onSelectTypeChange: setPreviewStudioSelectedType,
      presentation: "workspace" as const,
      selectedMobId: previewStudioSelectedMobId,
      selectedType: previewStudioSelectedType
    }),
    [
      catalogSections,
      previewStudioMode,
      previewStudioSelectedMobId,
      previewStudioSelectedType,
      setDeveloperWorkspaceTab,
      setPreviewStudioMode,
      setPreviewStudioOpen,
      setPreviewStudioSelectedMobId,
      setPreviewStudioSelectedType
    ]
  );

  const roomStageNode = useMemo(
    () => (
      <AppRoomStage
        inventoryPanelNode={inventoryPanelNode}
        previewStudioProps={previewStudioProps}
        roomViewProps={roomViewProps}
      />
    ),
    [inventoryPanelNode, previewStudioProps, roomViewProps]
  );

  const developerStageNode = useMemo(
    () => (
      <AppRoomStage
        inventoryPanelNode={inventoryPanelNode}
        previewStudioProps={previewStudioProps}
        roomViewProps={roomViewProps}
        workspaceTab={developerWorkspaceTab}
      />
    ),
    [developerWorkspaceTab, inventoryPanelNode, previewStudioProps, roomViewProps]
  );

  const modeSwitchNode = useMemo(
    () => <ViewModeSwitch onChange={setShellViewMode} value={effectiveShellViewMode} />,
    [effectiveShellViewMode, setShellViewMode]
  );
  const devPanelProps = {
    className: "dev-panel--workspace",
    visible: debugOpen,
    buildModeEnabled,
    catalogOpen,
    gridSnapEnabled,
    buildSettingsCollapsed: devPanelBuildSettingsCollapsed,
    playerStateCollapsed: devPanelPlayerStateCollapsed,
    playerCoordinatesCollapsed: devPanelPlayerCoordinatesCollapsed,
    cameraPropertiesCollapsed: devPanelCameraPropertiesCollapsed,
    worldSettingsCollapsed: devPanelWorldSettingsCollapsed,
    lightingFxCollapsed: devPanelLightingFxCollapsed,
    collisionDebugCollapsed: devPanelCollisionDebugCollapsed,
    actionsCollapsed: devPanelActionsCollapsed,
    playerCoins: displayedPlayerCoins,
    playerCoinsCommitMode: sharedRoomActive ? ("blur" as const) : ("change" as const),
    playerCoinsSourceLabel: sharedRoomActive ? "Shared room debug edit" : "Local sandbox live edit",
    playerInteractionLabel: playerInteractionStatus?.label ?? "None",
    playerPosition,
    cameraPosition,
    cameraTarget: ROOM_CAMERA_TARGET,
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
    showCollisionDebug,
    showPlayerCollider,
    showInteractionMarkers,
    onToggleBuildMode: handleToggleBuildMode,
    onToggleCatalog: handleToggleCatalog,
    onToggleGridSnap: () => setGridSnapEnabled((current) => !current),
    onBuildSettingsCollapsedChange: setDevPanelBuildSettingsCollapsed,
    onPlayerStateCollapsedChange: setDevPanelPlayerStateCollapsed,
    onPlayerCoordinatesCollapsedChange: setDevPanelPlayerCoordinatesCollapsed,
    onCameraPropertiesCollapsedChange: setDevPanelCameraPropertiesCollapsed,
    onWorldSettingsCollapsedChange: setDevPanelWorldSettingsCollapsed,
    onLightingFxCollapsedChange: setDevPanelLightingFxCollapsed,
    onCollisionDebugCollapsedChange: setDevPanelCollisionDebugCollapsed,
    onActionsCollapsedChange: setDevPanelActionsCollapsed,
    onPlayerCoinsCommit: handleDeveloperPlayerCoinsCommit,
    onPlayerAxisCommit: commitPlayerAxis,
    onCameraAxisCommit: commitCameraAxis,
    onApplyTransforms: applyTransformChanges,
    onResetCamera: handleResetCamera,
    onResetSandbox: handleResetSandboxWithConfirmation,
    onImportSkin: handleSkinImport,
    onUseMinecraftTimeChange: setUseMinecraftTime,
    onMinecraftTimeHoursCommit: setMinecraftTimeHours,
    onTimeLockedChange: setTimeLockedEnabled,
    onLockedTimeHoursCommit: setLockedTimeHours,
    onSyncLockedTime: syncLockedTimeToLocalTime,
    onSunEnabledChange: setSunEnabled,
    onShadowsEnabledChange: setShadowsEnabled,
    onFogEnabledChange: setFogEnabled,
    onFogDensityCommit: setFogDensity,
    onAmbientMultiplierCommit: setAmbientMultiplier,
    onSunIntensityMultiplierCommit: setSunIntensityMultiplier,
    onBrightnessCommit: setBrightness,
    onSaturationCommit: setSaturation,
    onContrastCommit: setContrast,
    onShowCollisionDebugChange: setShowCollisionDebug,
    onShowPlayerColliderChange: setShowPlayerCollider,
    onShowInteractionMarkersChange: setShowInteractionMarkers
  };

  return (
    <>
      <Leva hidden theme={APP_LEVA_THEME} flat titleBar={{ title: "DEV PANEL", drag: true, filter: true }} hideCopyButton />
      <div className="scene-shell">
        {developerSurfaceVisible ? (
          <AppDeveloperView
            activeDeveloperTabLabel={activeDeveloperTab.label}
            debugOpen={debugOpen}
            developerQuickActions={developerQuickActions}
            developerSessionPanelState={developerSessionPanelState}
            developerStageNode={developerStageNode}
            developerWorkspaceTabs={developerWorkspaceTabs}
            devPanelProps={devPanelProps}
            handleDeveloperQuickAction={handleDeveloperQuickAction}
            handleRefreshRoomState={handleRefreshRoomState}
            handleSelectDeveloperWorkspaceTab={handleSelectDeveloperWorkspaceTab}
            isDev={isDev}
            modeSwitchNode={modeSwitchNode}
            roomId={roomId}
            setDebugOpen={setDebugOpen}
            sharedRoomActive={sharedRoomActive}
            sharedRoomBlockingOverlayNode={sharedRoomBlockingOverlayNode}
            sharedRoomModalNode={sharedRoomModalNode}
            skinError={skinError}
          />
        ) : (
          <AppPlayerView
            ampm={ampm}
            breakupResetDialogOpen={breakupResetDialogOpen}
            breakupResetSaving={breakupResetSaving}
            catalogOpen={catalogOpen}
            currentThemeId={roomState.metadata.roomTheme}
            displayedPcMinigameProgress={displayedPcMinigameProgress}
            displayedPlayerCoins={displayedPlayerCoins}
            handleBreakupResetConfirm={handleBreakupResetConfirm}
            handleExitPcMinigame={handleExitPcMinigame}
            handleOpenPetCare={() => openPlayerDrawerMode("pet_care")}
            handlePcMinigameComplete={handlePcMinigameComplete}
            handlePlayerDockAction={handlePlayerDockAction}
            handlePlayerRoomDetailsAction={handlePlayerRoomDetailsAction}
            handleSetTheme={handleSetTheme}
            hostedEntryFlowActive={hostedEntryFlowActive}
            inventoryPanelNode={inventoryPanelNode}
            pcMinigameActive={pcMinigameActive}
            playerActionDockState={playerActionDockState}
            playerCompanionCardExpanded={playerCompanionCardExpanded}
            playerDockMetricLabel={showcaseMode ? SHOWCASE_HUD_DAY_LABEL : undefined}
            playerCompanionCardState={playerCompanionCardState}
            playerLevel={playerLevel}
            showPlayerCompanionCard={!devFallbackRoomMode && (showcaseMode || sharedRoomActive || playerCompanionCardState.petCareActionLabel !== null)}
            playerRoomDetailsOpen={playerRoomDetailsOpen}
            playerRoomDetailsState={playerRoomDetailsState}
            roomStageNode={roomStageNode}
            setBreakupResetDialogOpen={setBreakupResetDialogOpen}
            setPlayerCompanionCardExpanded={setPlayerCompanionCardExpanded}
            setPlayerRoomDetailsOpen={setPlayerRoomDetailsOpen}
            sharedPcPaidTodayByActivityId={sharedPcPaidTodayByActivityId}
            sharedPcResult={sharedPcResult}
            sharedRoomBlockingOverlayNode={sharedRoomBlockingOverlayNode}
            sharedRoomEntryOverlayNode={sharedRoomEntryOverlayNode}
            sharedRoomModalNode={sharedRoomModalNode}
            togetherDaysCount={togetherDaysCount}
            unlockedThemeIds={unlockedThemeIds}
            worldTimeLabel12h={worldTimeLabel12h}
            modeSwitchNode={modeSwitchNode}
            musicPlayerNode={<BackgroundMusicPlayer />}
          />
        )}
        <input ref={skinInputRef} type="file" accept=".png,image/png" className="hidden-input" onChange={handleSkinFileChange} />
      </div>
    </>
  );
}

export default App;










