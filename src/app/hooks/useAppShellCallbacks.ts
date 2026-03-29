import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import {
  clonePersistedSandboxState,
  createDefaultSandboxState,
  type PersistedSandboxState
} from "../../lib/devLocalState";
import type { FurnitureType } from "../../lib/furnitureRegistry";
import type { PcMinigameProgress } from "../../lib/pcMinigame";
import type { OwnedPet } from "../../lib/pets";
import { placementListsMatch, vectorsMatch } from "../../lib/roomPlacementEquality";
import { upsertSharedRoomFrameMemory } from "../../lib/sharedRoomMemories";
import { createBreakupResetMutation } from "../../lib/sharedRoomReset";
import {
  getPlacedOwnedFurnitureIds,
  type RoomFurniturePlacement,
  type RoomState,
  type Vector3Tuple
} from "../../lib/roomState";
import { ROOM_CAMERA_TARGET } from "../../lib/sceneTargets";
import { DEFAULT_CAMERA_POSITION, DEFAULT_PLAYER_POSITION } from "../constants";
import type {
  AppShellViewMode,
  BuildModeSource,
  DeveloperWorkspaceTab,
  FurnitureSpawnRequest,
  LocalPlayerPresenceSnapshot,
  PlayerDrawerMode,
  PlayerInteractionStatus,
  PreviewStudioMode,
  SceneJumpRequest
} from "../types";
import { shouldCommitSharedRoomChange, useSharedRoomRuntime } from "./useSharedRoomRuntime";

type SharedPcResult = {
  dailyRitualStatus: string;
  dailyRitualBonusCoins: number;
  dailyRitualBonusXp: number;
  streakCount: number;
} | null;

interface UseAppShellCallbacksInput {
  cameraPositionRef: MutableRefObject<Vector3Tuple>;
  catalogOpen: boolean;
  commitPlayerCoins: (nextCoins: number) => void;
  handleClaimCozyRest: () => void;
  handleSkinImport: () => void;
  isDev: boolean;
  liveFurniturePlacements: RoomFurniturePlacement[];
  pendingSpawnOwnedFurnitureIds: string[];
  pendingSpawnOwnedFurnitureIdsRef: MutableRefObject<Set<string>>;
  playerInteractionStatus: PlayerInteractionStatus;
  playerPositionRef: MutableRefObject<Vector3Tuple>;
  roomState: RoomState;
  roomStateRef: MutableRefObject<RoomState>;
  sandboxResetState?: PersistedSandboxState;
  selectedMemoryFrameId: string | null;
  setBreakupResetDialogOpen: Dispatch<SetStateAction<boolean>>;
  setBreakupResetSaving: Dispatch<SetStateAction<boolean>>;
  setBuildModeEnabled: Dispatch<SetStateAction<boolean>>;
  setBuildModeSource: Dispatch<SetStateAction<BuildModeSource>>;
  setCameraPosition: Dispatch<SetStateAction<Vector3Tuple>>;
  setCameraResetToken: Dispatch<SetStateAction<number>>;
  setCatalogOpen: Dispatch<SetStateAction<boolean>>;
  setDeveloperWorkspaceTab: Dispatch<SetStateAction<DeveloperWorkspaceTab>>;
  setGridSnapEnabled: Dispatch<SetStateAction<boolean>>;
  setLiveFurniturePlacements: Dispatch<SetStateAction<RoomFurniturePlacement[]>>;
  setLocalPresenceSnapshot: Dispatch<SetStateAction<LocalPlayerPresenceSnapshot>>;
  setMemoryFrameSaving: Dispatch<SetStateAction<boolean>>;
  setOwnedPets: Dispatch<SetStateAction<OwnedPet[]>>;
  setPcMinigameProgress: Dispatch<SetStateAction<PcMinigameProgress>>;
  setPendingSpawnOwnedFurnitureIds: Dispatch<SetStateAction<string[]>>;
  setPlayerInteractionStatus: Dispatch<SetStateAction<PlayerInteractionStatus>>;
  setPlayerDrawerMode: Dispatch<SetStateAction<PlayerDrawerMode>>;
  setPlayerPosition: Dispatch<SetStateAction<Vector3Tuple>>;
  setPlayerRoomDetailsOpen: Dispatch<SetStateAction<boolean>>;
  setPreviewStudioMode: Dispatch<SetStateAction<PreviewStudioMode>>;
  setPreviewStudioOpen: Dispatch<SetStateAction<boolean>>;
  setPreviewStudioSelectedMobId: Dispatch<SetStateAction<string>>;
  setPreviewStudioSelectedType: Dispatch<SetStateAction<FurnitureType>>;
  setRoomState: Dispatch<SetStateAction<RoomState>>;
  setSceneJumpRequest: Dispatch<SetStateAction<SceneJumpRequest | null>>;
  setSelectedMemoryFrameId: Dispatch<SetStateAction<string | null>>;
  setSharedPcResult: Dispatch<SetStateAction<SharedPcResult>>;
  setShellViewMode: Dispatch<SetStateAction<AppShellViewMode>>;
  setSkinSrc: Dispatch<SetStateAction<string | null>>;
  setSpawnRequest: Dispatch<SetStateAction<FurnitureSpawnRequest | null>>;
  setStandRequestToken: Dispatch<SetStateAction<number>>;
  sharedRoomActive: boolean;
  sharedRoomPlayerId: string | null;
  sharedRoomRuntime: ReturnType<typeof useSharedRoomRuntime>;
  soldOwnedFurnitureIdsRef: MutableRefObject<Set<string>>;
  nextSceneJumpRequestIdRef: MutableRefObject<number>;
}

function setVectorAxis(position: Vector3Tuple, axis: 0 | 1 | 2, nextValue: number): Vector3Tuple {
  if (axis === 0) {
    return [nextValue, position[1], position[2]];
  }

  if (axis === 1) {
    return [position[0], nextValue, position[2]];
  }

  return [position[0], position[1], nextValue];
}

export function useAppShellCallbacks({
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
  sandboxResetState,
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
}: UseAppShellCallbacksInput) {
  const openPreviewStudio = useCallback((type: FurnitureType) => {
    setPreviewStudioMode("furniture");
    setPreviewStudioSelectedType(type);
    setPreviewStudioOpen(true);
    setDeveloperWorkspaceTab("preview_studio");
    if (isDev) {
      setShellViewMode("developer");
    }
    setCatalogOpen(false);
  }, [isDev, setCatalogOpen, setDeveloperWorkspaceTab, setPreviewStudioMode, setPreviewStudioOpen, setPreviewStudioSelectedType, setShellViewMode]);

  const openMobPreviewStudio = useCallback((mobId: string) => {
    setPreviewStudioMode("mob_lab");
    setPreviewStudioSelectedMobId(mobId);
    setPreviewStudioOpen(true);
    setDeveloperWorkspaceTab("mob_lab");
    if (isDev) {
      setShellViewMode("developer");
    }
    setCatalogOpen(false);
  }, [isDev, setCatalogOpen, setDeveloperWorkspaceTab, setPreviewStudioMode, setPreviewStudioOpen, setPreviewStudioSelectedMobId, setShellViewMode]);

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
  }, [setDeveloperWorkspaceTab, setPreviewStudioMode, setPreviewStudioOpen]);

  const handleToggleBuildMode = useCallback(() => {
    setBuildModeEnabled((current) => {
      if (!current && playerInteractionStatus) {
        return current;
      }

      const nextValue = !current;
      setBuildModeSource(nextValue ? "manual" : null);
      return nextValue;
    });
  }, [playerInteractionStatus, setBuildModeEnabled, setBuildModeSource]);

  const handleToggleCatalog = useCallback(() => {
    if (playerInteractionStatus) {
      return;
    }

    setCatalogOpen((current) => !current);
  }, [playerInteractionStatus, setCatalogOpen]);

  const openPlayerDrawerMode = useCallback((mode: PlayerDrawerMode) => {
    if (playerInteractionStatus) {
      return;
    }

    setPlayerDrawerMode(mode);
    setCatalogOpen(true);
  }, [playerInteractionStatus, setCatalogOpen, setPlayerDrawerMode]);

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
    [cameraPositionRef, nextSceneJumpRequestIdRef, playerPositionRef, setCameraPosition, setPlayerPosition, setSceneJumpRequest]
  );

  const commitPlayerAxis = useCallback((axis: 0 | 1 | 2, value: number): void => {
    if (!Number.isFinite(value)) {
      return;
    }

    const nextPlayerPosition = setVectorAxis(playerPositionRef.current, axis, value);
    requestSceneJump(nextPlayerPosition, cameraPositionRef.current);
  }, [cameraPositionRef, playerPositionRef, requestSceneJump]);

  const commitCameraAxis = useCallback((axis: 0 | 1 | 2, value: number): void => {
    if (!Number.isFinite(value)) {
      return;
    }

    const nextCameraPosition = setVectorAxis(cameraPositionRef.current, axis, value);
    requestSceneJump(playerPositionRef.current, nextCameraPosition);
  }, [cameraPositionRef, playerPositionRef, requestSceneJump]);

  const applyTransformChanges = useCallback(() => {
    requestSceneJump(playerPositionRef.current, cameraPositionRef.current);
  }, [cameraPositionRef, playerPositionRef, requestSceneJump]);

  const handleResetCamera = useCallback((): void => {
    setCameraPosition(DEFAULT_CAMERA_POSITION);
    setCameraResetToken((current) => current + 1);
  }, [setCameraPosition, setCameraResetToken]);

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

    const sharedProgression = sharedRoomRuntime.runtimeSnapshot?.progression;

    if (sharedRoomActive && sharedProgression && shouldCommitSharedRoomChange("committed")) {
      void sharedRoomRuntime.commitRoomState(
        nextRoomState,
        sharedProgression,
        "committed_furniture_change"
      );
    }
  }, [roomStateRef, setLiveFurniturePlacements, setRoomState, sharedRoomActive, sharedRoomRuntime]);

  const handleFurnitureSnapshotChange = useCallback((placements: RoomFurniturePlacement[]): void => {
    const placedOwnedFurnitureIds = getPlacedOwnedFurnitureIds(placements);

    setPendingSpawnOwnedFurnitureIds((currentIds) => {
      const nextIds = currentIds.filter(
        (ownedFurnitureId) => !placedOwnedFurnitureIds.has(ownedFurnitureId)
      );
      pendingSpawnOwnedFurnitureIdsRef.current = new Set(nextIds);
      return nextIds;
    });
    setLiveFurniturePlacements((currentPlacements) =>
      placementListsMatch(currentPlacements, placements) ? currentPlacements : placements
    );
  }, [pendingSpawnOwnedFurnitureIdsRef, setLiveFurniturePlacements, setPendingSpawnOwnedFurnitureIds]);

  const handleCameraPositionChange = useCallback((position: Vector3Tuple): void => {
    cameraPositionRef.current = position;
    setCameraPosition((currentPosition) =>
      vectorsMatch(currentPosition, position) ? currentPosition : position
    );
  }, [cameraPositionRef, setCameraPosition]);

  const handlePlayerPositionChange = useCallback((position: Vector3Tuple): void => {
    playerPositionRef.current = position;
    setPlayerPosition((currentPosition) =>
      vectorsMatch(currentPosition, position) ? currentPosition : position
    );
  }, [playerPositionRef, setPlayerPosition]);
  const handleResetSandbox = useCallback((): void => {
    if (sharedRoomActive) {
      setSharedPcResult(null);
      void sharedRoomRuntime.reloadRoom();
      return;
    }

    const nextSandbox = sandboxResetState
      ? clonePersistedSandboxState(sandboxResetState)
      : createDefaultSandboxState(DEFAULT_CAMERA_POSITION, DEFAULT_PLAYER_POSITION);

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
      playerPosition: nextSandbox.playerPosition,
      cameraPosition: nextSandbox.cameraPosition,
      cameraTarget: ROOM_CAMERA_TARGET
    });
    nextSceneJumpRequestIdRef.current += 1;
    setBuildModeEnabled(false);
    setCatalogOpen(false);
    setGridSnapEnabled(true);
    setPlayerInteractionStatus(null);
    setCameraResetToken((current) => current + 1);
  }, [cameraPositionRef, commitPlayerCoins, nextSceneJumpRequestIdRef, pendingSpawnOwnedFurnitureIdsRef, playerPositionRef, sandboxResetState, setBuildModeEnabled, setCameraPosition, setCameraResetToken, setCatalogOpen, setGridSnapEnabled, setLiveFurniturePlacements, setLocalPresenceSnapshot, setOwnedPets, setPcMinigameProgress, setPendingSpawnOwnedFurnitureIds, setPlayerInteractionStatus, setPlayerPosition, setRoomState, setSceneJumpRequest, setSharedPcResult, setSkinSrc, setSpawnRequest, sharedRoomActive, sharedRoomRuntime, soldOwnedFurnitureIdsRef]);

  const hasUncommittedRoomEdits =
    pendingSpawnOwnedFurnitureIds.length > 0 ||
    !placementListsMatch(liveFurniturePlacements, roomState.furniture);

  const discardUncommittedRoomEdits = useCallback(() => {
    pendingSpawnOwnedFurnitureIdsRef.current.clear();
    soldOwnedFurnitureIdsRef.current.clear();
    setPendingSpawnOwnedFurnitureIds([]);
    setLiveFurniturePlacements(roomStateRef.current.furniture);
    setSpawnRequest(null);
  }, [pendingSpawnOwnedFurnitureIdsRef, roomStateRef, setLiveFurniturePlacements, setPendingSpawnOwnedFurnitureIds, setSpawnRequest, soldOwnedFurnitureIdsRef]);

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
    [roomState.furniture, setSelectedMemoryFrameId, sharedRoomActive]
  );

  const handleSaveMemoryFrame = useCallback(
    async ({ imageSrc, caption }: { imageSrc: string; caption: string | null }) => {
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
            sharedPets: snapshot.sharedPets
          })
        );

        if (nextRoomDocument) {
          setSelectedMemoryFrameId(null);
        }
      } finally {
        setMemoryFrameSaving(false);
      }
    },
    [selectedMemoryFrameId, setMemoryFrameSaving, setSelectedMemoryFrameId, sharedRoomPlayerId, sharedRoomRuntime]
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
            sharedPets: snapshot.sharedPets
          };
        }
      );

      if (nextRoomDocument) {
        setSelectedMemoryFrameId(null);
      }
    } finally {
      setMemoryFrameSaving(false);
    }
  }, [selectedMemoryFrameId, setMemoryFrameSaving, setSelectedMemoryFrameId, sharedRoomRuntime]);
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
  }, [discardUncommittedRoomEdits, hasUncommittedRoomEdits, sharedRoomActive, sharedRoomRuntime]);

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
  }, [handleResetSandbox, isDev]);

  const handlePlayerRoomDetailsAction = useCallback(
    (
      actionId:
        | "copy_invite"
        | "refresh_room_state"
        | "toggle_grid_snap"
        | "import_skin"
        | "breakup_reset"
        | "reset_sandbox"
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
        case "reset_sandbox":
          handleResetSandboxWithConfirmation();
          return;
        case "copy_invite":
        default:
          return;
      }
    },
    [handleRefreshRoomState, handleResetSandboxWithConfirmation, handleSkinImport, setBreakupResetDialogOpen, setGridSnapEnabled, setPlayerRoomDetailsOpen, setSelectedMemoryFrameId]
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
          createBreakupResetMutation(snapshot, sharedRoomPlayerId, new Date().toISOString())
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
  }, [discardUncommittedRoomEdits, setBreakupResetDialogOpen, setBreakupResetSaving, setBuildModeEnabled, setCatalogOpen, setPlayerInteractionStatus, setSelectedMemoryFrameId, setSharedPcResult, sharedRoomPlayerId, sharedRoomRuntime]);

  const handlePlayerDockAction = useCallback(
    (actionId: "build" | "inventory" | "interaction" | "cozy_rest") => {
      switch (actionId) {
        case "build":
          handleToggleBuildMode();
          return;
        case "inventory":
          if (catalogOpen) {
            setCatalogOpen(false);
            return;
          }

          openPlayerDrawerMode("inventory");
          return;
        case "interaction":
          setStandRequestToken((current) => current + 1);
          return;
        case "cozy_rest":
          handleClaimCozyRest();
          return;
        default:
          return;
      }
    },
    [catalogOpen, handleClaimCozyRest, handleToggleBuildMode, openPlayerDrawerMode, setCatalogOpen, setStandRequestToken]
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
    [handleRefreshRoomState, handleResetCamera, handleResetSandboxWithConfirmation]
  );

  return {
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
    openPlayerDrawerMode,
    openPreviewStudio
  };
}




