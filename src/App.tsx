import { useEffect, useMemo, useRef } from "react";
import { Leva } from "leva";
import { loadPersistedSandboxState } from "./lib/devLocalState";
import { ALL_PET_TYPES, PET_REGISTRY, type PetType } from "./lib/pets";
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
  PreviewStudioMode
} from "./app/types";
import { InventoryPanel } from "./components/ui";

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
  const preferences = useAppViewPreferences(isDev);
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
    devBootstrapSharedCoins: initialSandboxState.playerCoins
  });
  const sharedRoomActive = sharedRoomRuntime.runtimeSnapshot !== null;
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
  } = useSandboxWorldClock();
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
  } = roomSession;  const {
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
    Boolean(sharedRoomRuntime.runtimeSnapshot?.sharedPet) &&
    (sharedRoomPresence.remotePresence === null ||
      sharedRoomRuntime.profile.playerId.localeCompare(
        sharedRoomRuntime.session?.partnerId ?? sharedRoomRuntime.profile.playerId
      ) <= 0);
  const effectiveSharedPetLiveState = sharedPetAuthorityActive
    ? localSharedPetState ?? sharedRoomPresence.sharedPetState
    : sharedRoomPresence.sharedPetState;
  const sharedRuntimePetRecord = sharedRoomRuntime.runtimeSnapshot?.sharedPet ?? null;

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
          pc_runner: getSharedActivityClaimStatus({
            progression: sharedRoomRuntime.runtimeSnapshot.progression,
            activityId: "pc_runner",
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
        pc_runner: !sharedPcClaimStatusByActivityId.pc_runner.payoutAvailable
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
  ]);  const {
    applyLocalSharedSnapshot,
    commitPlayerCoins,
    handleBuyFurniture,
    handleBuyPet,
    handleClaimCozyRest,
    handleDeveloperPlayerCoinsCommit,
    handleExitPcMinigame,
    handlePcMinigameComplete,
    handlePlaceStoredFurniture,
    handleSellStoredFurniture,
    updatePendingSpawnOwnedFurnitureIds
  } = useAppRoomActions({
    activePlayerProgression,
    cozyRestReadyNow,
    inventoryByType,
    liveFurniturePlacements,
    ownedPetTypes,
    playerPosition,
    pendingSpawnOwnedFurnitureIdsRef,
    playerCoinsRef,
    roomStateRef,
    setBuildModeEnabled,
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
    selectedMemoryFrameId,
    setBreakupResetDialogOpen,
    setBreakupResetSaving,
    setBuildModeEnabled,
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
    developerWorkspaceTabs.find((tab) => tab.isActive) ?? developerWorkspaceTabs[0];  const playerRoomActivityRows = sharedPcClaimStatusByActivityId
    ? [
        { label: "Snake", value: sharedPcClaimStatusByActivityId.pc_snake.payoutAvailable ? "Ready now" : "Paid today" },
        { label: "Block Stacker", value: sharedPcClaimStatusByActivityId.pc_block_stacker.payoutAvailable ? "Ready now" : "Paid today" },
        { label: "Runner", value: sharedPcClaimStatusByActivityId.pc_runner.payoutAvailable ? "Ready now" : "Paid today" },
        { label: "Cozy Rest", value: cozyRestPaidToday ? "Paid today" : cozyRestReadyNow ? "Ready now" : "Lie down together" }
      ]
    : [
        { label: "Desk PC", value: "Ready now" },
        { label: "Cozy Rest", value: sharedRoomActive ? "Lie down together" : "Shared room only" }
      ];
  const playerCompanionCardState = getPlayerCompanionCardState({
    cozyRestPaidToday,
    cozyRestReadyNow,
    deskActivityPaidToday,
    deskActivityReadyNow,
    inviteCode,
    memberCount,
    presenceStatus: sharedRoomPresence.presenceStatus,
    ritualStatus,
    runtimeEntryMode: sharedRoomRuntime.entryMode,
    showInviteCode: !sharedRoomRuntime.devBypassActive && partnerPlayerProgression === null,
    statusMessage: sharedRoomRuntime.statusMessage,
    togetherDaysCount,
    visitCompletedToday
  });
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

  const sharedRoomEntryOverlayNode = (
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

  const sharedRoomBlockingOverlayNode = sharedRoomRuntime.blockingState ? (
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

  const inventoryPanelNode = (
    <InventoryPanel
      catalogSections={catalogSections}
      className={developerSurfaceVisible ? "spawn-panel--developer-workspace" : "spawn-panel--player-drawer"}
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

  const roomViewProps = {
    acquireEditLock: sharedRoomPresence.acquireEditLock,
    buildModeEnabled,
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
    onSharedEditConflict: () => { void sharedRoomRuntime.recoverFromStaleSharedEdit(); },
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
    partnerLockedFurnitureIds: sharedRoomPresence.partnerEditLockIds,
    releaseEditLock: sharedRoomPresence.releaseEditLock,
    remotePresence: sharedRoomPresence.remotePresence,
    renewEditLock: sharedRoomPresence.renewEditLock,
    sceneJumpRequest,
    sharedPetAuthorityActive,
    sharedPetLiveState: effectiveSharedPetLiveState
  };
  const previewStudioProps = {
    catalogSections,
    mode: previewStudioMode,
    onClose: () => { setPreviewStudioOpen(false); setDeveloperWorkspaceTab("room"); },
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
  };
  const roomStageNode = <AppRoomStage inventoryPanelNode={inventoryPanelNode} previewStudioProps={previewStudioProps} roomViewProps={roomViewProps} />;
  const developerStageNode = <AppRoomStage inventoryPanelNode={inventoryPanelNode} previewStudioProps={previewStudioProps} roomViewProps={roomViewProps} workspaceTab={developerWorkspaceTab} />;
  const modeSwitchNode = <ViewModeSwitch onChange={setShellViewMode} value={effectiveShellViewMode} />;
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
            displayedPcMinigameProgress={displayedPcMinigameProgress}
            displayedPlayerCoins={displayedPlayerCoins}
            handleBreakupResetConfirm={handleBreakupResetConfirm}
            handleExitPcMinigame={handleExitPcMinigame}
            handlePcMinigameComplete={handlePcMinigameComplete}
            handlePlayerDockAction={handlePlayerDockAction}
            handlePlayerRoomDetailsAction={handlePlayerRoomDetailsAction}
            hostedEntryFlowActive={hostedEntryFlowActive}
            inventoryPanelNode={inventoryPanelNode}
            pcMinigameActive={pcMinigameActive}
            playerActionDockState={playerActionDockState}
            playerCompanionCardExpanded={playerCompanionCardExpanded}
            playerCompanionCardState={playerCompanionCardState}
            playerLevel={playerLevel}
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
            worldTimeLabel12h={worldTimeLabel12h}
            modeSwitchNode={modeSwitchNode}
          />
        )}
        <input ref={skinInputRef} type="file" accept=".png,image/png" className="hidden-input" onChange={handleSkinFileChange} />
      </div>
    </>
  );
}

export default App;
