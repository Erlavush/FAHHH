import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { PerspectiveCamera as ThreePerspectiveCamera } from "three";
import type {
  BuildModeSource,
  FurnitureSpawnRequest,
  LocalPlayerPresenceSnapshot,
  PlayerInteractionStatus,
  SceneJumpRequest
} from "../app/types";
import { placementListsMatch } from "../lib/roomPlacementEquality";
import { buildPetNavigationMap, buildPetObstacles } from "../lib/petPathing";
import { getFurnitureDefinition } from "../lib/furnitureRegistry";
import { DEFAULT_IMPORTED_MOB_PRESETS } from "../lib/mobLab";
import type {
  SharedPetLiveState,
  SharedPresenceSnapshot
} from "../lib/sharedPresenceTypes";
import type { SharedRoomFrameMemory } from "../lib/sharedRoomTypes";
import type { OwnedPet } from "../lib/pets";
import type {
  RoomFurniturePlacement,
  RoomMetadata,
  Vector3Tuple
} from "../lib/roomState";
import { ROOM_CAMERA_TARGET } from "../lib/sceneTargets";
import { MinecraftPlayer } from "./MinecraftPlayer";
import {
  CameraTracker,
  RendererExposureController,
  SmoothZoomController
} from "./room-view/CanvasControllers";
import { CollisionDebugOverlay } from "./room-view/CollisionDebugOverlay";
import {
  MAX_CAMERA_DISTANCE,
  MIN_CAMERA_DISTANCE
} from "./room-view/constants";
import { EditDock } from "./room-view/EditDock";
import { FloorStage } from "./room-view/FloorStage";
import { hasFixedWallVerticalPlacement } from "./room-view/helpers";
import { RoomFurnitureLayer } from "./room-view/RoomFurnitureLayer";
import { RoomPetActor } from "./room-view/RoomPetActor";
import { RoomPostProcessing } from "./room-view/RoomPostProcessing";
import { RoomSceneLighting } from "./room-view/RoomSceneLighting";
import { RoomSelectedFurnitureLayer } from "./room-view/RoomSelectedFurnitureLayer";
import { RoomShell } from "./room-view/RoomShell";
import { useRoomFurnitureEditor } from "./room-view/useRoomFurnitureEditor";
import { useRoomViewBuilderGestures } from "./room-view/useRoomViewBuilderGestures";
import { useRoomViewCamera } from "./room-view/useRoomViewCamera";
import { useRoomViewInteractions } from "./room-view/useRoomViewInteractions";
import { useRoomViewLighting } from "./room-view/useRoomViewLighting";
import { useRoomViewSpawn } from "./room-view/useRoomViewSpawn";
import { WallOcclusionController } from "./room-view/WallOcclusionController";

interface RoomViewProps {
  acquireEditLock?: (furnitureId: string) => Promise<boolean>;
  buildModeEnabled: boolean;
  buildModeSource: BuildModeSource;
  gridSnapEnabled: boolean;
  spawnRequest: FurnitureSpawnRequest | null;
  cameraResetToken: number;
  standRequestToken: number;
  initialCameraPosition: Vector3Tuple;
  initialPlayerPosition: Vector3Tuple;
  initialFurniturePlacements: RoomFurniturePlacement[];
  frameMemories: Record<string, SharedRoomFrameMemory>;
  pets: OwnedPet[];
  skinSrc: string | null;
  localLockedFurnitureIds: ReadonlySet<string>;
  onSharedEditConflict?: () => void;
  worldTimeMinutes: number;
  sunEnabled: boolean;
  shadowsEnabled: boolean;
  fogEnabled: boolean;
  fogDensity: number;
  ambientMultiplier: number;
  sunIntensityMultiplier: number;
  brightness: number;
  saturation: number;
  contrast: number;
  showCollisionDebug: boolean;
  showPlayerCollider: boolean;
  showInteractionMarkers: boolean;
  onCameraPositionChange: (position: Vector3Tuple) => void;
  onLocalPresenceChange: (snapshot: LocalPlayerPresenceSnapshot) => void;
  onLocalSharedPetStateChange: (state: SharedPetLiveState | null) => void;
  onPlayerPositionChange: (position: Vector3Tuple) => void;
  onFurnitureSnapshotChange: (placements: RoomFurniturePlacement[]) => void;
  onCommittedFurnitureChange: (placements: RoomFurniturePlacement[]) => void;
  onInteractionStateChange: (status: PlayerInteractionStatus) => void;
  onOpenMemoryFrame: ((furnitureId: string) => void) | null;
  onPlacementBuildSessionComplete?: () => void;
  partnerLockedFurnitureIds: ReadonlySet<string>;
  releaseEditLock?: (furnitureId: string) => Promise<void>;
  remotePresence: SharedPresenceSnapshot | null;
  renewEditLock?: (furnitureId: string) => Promise<boolean>;
  sceneJumpRequest: SceneJumpRequest | null;
  sharedPetAuthorityActive: boolean;
  sharedPetLiveState: SharedPetLiveState | null;
  roomMetadata: RoomMetadata;
}

export function RoomView({
  acquireEditLock,
  buildModeEnabled,
  buildModeSource,
  gridSnapEnabled,
  spawnRequest,
  cameraResetToken,
  standRequestToken,
  initialCameraPosition,
  initialPlayerPosition,
  initialFurniturePlacements,
  frameMemories,
  pets,
  skinSrc,
  localLockedFurnitureIds,
  onSharedEditConflict,
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
  onCameraPositionChange,
  onLocalPresenceChange,
  onLocalSharedPetStateChange,
  onPlayerPositionChange,
  onFurnitureSnapshotChange,
  onCommittedFurnitureChange,
  onInteractionStateChange,
  onOpenMemoryFrame,
  onPlacementBuildSessionComplete,
  partnerLockedFurnitureIds,
  releaseEditLock,
  remotePresence,
  renewEditLock,
  sceneJumpRequest,
  sharedPetAuthorityActive,
  sharedPetLiveState,
  roomMetadata
}: RoomViewProps) {
  const initialCameraPositionRef = useRef(initialCameraPosition);
  const initialSceneTarget = ROOM_CAMERA_TARGET;
  const cameraRef = useRef<ThreePerspectiveCamera | null>(null);
  const playerWorldPositionRef = useRef<Vector3Tuple>(initialPlayerPosition);
  const orbitControlsRef = useRef<any>(null);
  const zoomTargetDistanceRef = useRef<number | null>(null);
  const [playerWorldPosition, setPlayerWorldPosition] =
    useState<Vector3Tuple>(initialPlayerPosition);
  const [localPlayerTransform, setLocalPlayerTransform] = useState<{
    facingY: number;
    position: Vector3Tuple;
  }>({
    facingY: 0,
    position: initialPlayerPosition
  });
  const [wallVisibility, setWallVisibility] = useState<Record<string, boolean>>({
    wall_back: true,
    wall_left: true,
    wall_front: true,
    wall_right: true,
    ceiling: false
  });

  const {
    busyFurniture,
    committedFurniture,
    furniture,
    hoveredFurnitureId,
    isPlacementBlocked,
    isSelectedFurnitureBusyByPartner,
    selectedFurniture,
    selectedFurnitureId,
    beginNewFurnitureEditing,
    finishFurnitureEditingSession,
    handleCancelFurniturePlacement,
    handleConfirmFurniturePlacement,
    handleDeselectFurniture,
    handleNudgeSelectedFurniture,
    handleNudgeSelectedFurnitureVertical,
    handleRotateSelectedFurniture,
    handleStoreFurniturePlacement,
    handleSwapSelectedWall,
    selectFurnitureForEditing,
    setFurniture,
    setHoveredFurnitureId,
    updateFurnitureItem
  } = useRoomFurnitureEditor({
    acquireEditLock,
    buildModeEnabled,
    gridSnapEnabled,
    initialFurniturePlacements,
    localLockedFurnitureIds,
    onSharedEditConflict,
    playerWorldPosition,
    onFurnitureSnapshotChange,
    onCommittedFurnitureChange,
    partnerLockedFurnitureIds,
    releaseEditLock,
    renewEditLock
  });

  const previousSelectedFurnitureIdRef = useRef<string | null>(selectedFurnitureId);

  useEffect(() => {
    const previousSelectedFurnitureId = previousSelectedFurnitureIdRef.current;

    if (
      buildModeSource === "placement" &&
      previousSelectedFurnitureId !== null &&
      selectedFurnitureId === null
    ) {
      onPlacementBuildSessionComplete?.();
    }

    previousSelectedFurnitureIdRef.current = selectedFurnitureId;
  }, [buildModeSource, onPlacementBuildSessionComplete, selectedFurnitureId]);

  const {
    hoveredInteractableFurnitureId,
    interactionCursor,
    isDraggingFurniture,
    isTransformingFurniture,
    handleBuildSurfaceClick,
    handleCanvasPointerLeave,
    handleFurnitureClick,
    handleFurnitureDoubleClick,
    handleFurniturePointerDown,
    handleFurniturePointerMove,
    handleFurniturePointerUp,
    handlePivotDrag,
    handleSurfacePointerMove,
    handleSurfacePointerUp,
    resetBuilderGestureState,
    setHoveredInteractableFurnitureId
  } = useRoomViewBuilderGestures({
    buildModeEnabled,
    finishFurnitureEditingSession,
    furniture,
    gridSnapEnabled,
    hoveredFurnitureId,
    orbitControlsRef,
    selectedFurniture,
    selectedFurnitureId,
    setHoveredFurnitureId,
    selectFurnitureForEditing,
    updateFurnitureItem
  });

  const clearHoveredInteractableFurnitureId = useCallback(() => {
    setHoveredInteractableFurnitureId(null);
  }, [setHoveredInteractableFurnitureId]);

  const {
    activeInteraction,
    handleFloorMoveCommand: handlePlayerFloorMoveCommand,
    handleFurnitureInteractionCommand,
    handlePlayerActorPositionChange,
    interactionHint,
    jumpPlayerToPosition,
    pendingInteraction,
    playerPresenceActivity,
    playerInteractionPose,
    playerTeleportRequest,
    resetPlayerInteractions,
    targetPosition
  } = useRoomViewInteractions({
    buildModeEnabled,
    clearHoveredInteractableFurnitureId,
    furniture,
    initialPlayerPosition,
    isDraggingFurniture,
    isTransformingFurniture,
    onInteractionStateChange,
    onPlayerPositionChange,
    playerWorldPosition,
    remotePresence,
    setPlayerWorldPosition,
    standRequestToken
  });

  const {
    canvasDpr,
    canvasGl,
    handleCanvasWheel,
    orbitMouseButtons,
    prefersTouchControls,
    shouldUseReducedRenderQuality
  } = useRoomViewCamera({
    cameraRef,
    cameraResetToken,
    initialCameraPosition,
    initialSceneTarget,
    isTransformingFurniture,
    jumpPlayerToPosition,
    onCameraPositionChange,
    orbitControlsRef,
    sceneJumpRequest,
    zoomTargetDistanceRef
  });

  const {
    ambientLightIntensity,
    hemisphereGroundColor,
    hemisphereLightIntensity,
    hemisphereSkyColor,
    lightingState,
    moonOpacity,
    moonShadowMapSize,
    pointLightIntensity,
    pointLightPosition,
    pointLightVisible,
    postProcessing,
    roomSurfaceLightAmount,
    sceneBackdrop,
    sceneFogColor,
    sceneToneMappingExposure,
    sunLightEnabled,
    sunLightIntensity,
    sunShadowMapSize,
    sunShadowNormalBias,
    sunShadowRadius,
    windowSurfaceLightAmount
  } = useRoomViewLighting({
    ambientMultiplier,
    brightness,
    buildModeEnabled,
    contrast,
    furniture,
    petCount: pets.length,
    saturation,
    shouldUseReducedRenderQuality,
    sunIntensityMultiplier,
    worldTimeMinutes
  });

  const petObstacles = useMemo(() => buildPetObstacles(furniture), [furniture]);

  const petNavigationMap = useMemo(() => buildPetNavigationMap(petObstacles), [petObstacles]);

  useRoomViewSpawn({
    beginNewFurnitureEditing,
    furniture,
    gridSnapEnabled,
    playerWorldPosition,
    setFurniture,
    spawnRequest,
    targetPosition
  });

  useLayoutEffect(() => {
    if (placementListsMatch(committedFurniture, initialFurniturePlacements)) {
      return;
    }

    resetPlayerInteractions();
  }, [
    committedFurniture,
    initialFurniturePlacements,
    resetPlayerInteractions
  ]);

  const handleFloorMoveCommand = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      handlePlayerFloorMoveCommand(event, handleBuildSurfaceClick);
    },
    [handleBuildSurfaceClick, handlePlayerFloorMoveCommand]
  );

  const handleWallClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      handleBuildSurfaceClick(event);
    },
    [handleBuildSurfaceClick]
  );

  const handlePlayerActorTransformChange = useCallback(
    (position: Vector3Tuple, facingY: number) => {
      playerWorldPositionRef.current = position;
      handlePlayerActorPositionChange(position);
      setLocalPlayerTransform((currentTransform) =>
        Math.abs(currentTransform.facingY - facingY) < 0.0001 &&
        currentTransform.position[0] === position[0] &&
        currentTransform.position[1] === position[1] &&
        currentTransform.position[2] === position[2]
          ? currentTransform
          : {
              facingY,
              position
            }
      );
    },
    [handlePlayerActorPositionChange]
  );

  useEffect(() => {
    playerWorldPositionRef.current = playerWorldPosition;
  }, [playerWorldPosition]);

  useEffect(() => {
    onLocalPresenceChange({
      position: [...localPlayerTransform.position] as Vector3Tuple,
      facingY: localPlayerTransform.facingY,
      activity: playerPresenceActivity,
      interactionPose: playerInteractionPose
        ? {
            ...playerInteractionPose,
            position: [...playerInteractionPose.position] as Vector3Tuple,
            poseOffset: playerInteractionPose.poseOffset
              ? ([...playerInteractionPose.poseOffset] as Vector3Tuple)
              : undefined
          }
        : null
    });
  }, [
    localPlayerTransform.facingY,
    localPlayerTransform.position,
    onLocalPresenceChange,
    playerInteractionPose,
    playerPresenceActivity
  ]);

  const editDockFurniture = selectedFurniture ?? busyFurniture;

  return (
    <div
      className="canvas-wrap"
      style={{
        cursor: interactionCursor,
        background: sceneBackdrop
      }}
      onContextMenu={(event) => {
        event.preventDefault();
      }}
      onWheel={handleCanvasWheel}
      onPointerLeave={handleCanvasPointerLeave}
    >
      <Canvas
        shadows={shadowsEnabled}
        dpr={canvasDpr}
        gl={canvasGl}
      >
        <RendererExposureController exposure={sceneToneMappingExposure} />
        <fogExp2 attach="fog" color={sceneFogColor} density={fogEnabled ? fogDensity : 0} />
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          position={initialCameraPositionRef.current}
          fov={24}
          onUpdate={(camera) => {
            camera.lookAt(
              initialSceneTarget[0],
              initialSceneTarget[1],
              initialSceneTarget[2]
            );
          }}
        />
        <OrbitControls
          ref={orbitControlsRef}
          enabled={!isTransformingFurniture && !isDraggingFurniture}
          enableRotate={!isTransformingFurniture && !isDraggingFurniture}
          enablePan={false}
          enableZoom={false}
          screenSpacePanning={false}
          minDistance={MIN_CAMERA_DISTANCE}
          maxDistance={MAX_CAMERA_DISTANCE}
          target={initialSceneTarget}
          minPolarAngle={0.18}
          maxPolarAngle={1.5}
          mouseButtons={orbitMouseButtons}
        />
        <SmoothZoomController
          cameraRef={cameraRef}
          orbitControlsRef={orbitControlsRef}
          zoomTargetDistanceRef={zoomTargetDistanceRef}
        />
        <RoomSceneLighting
          ambientLightIntensity={ambientLightIntensity}
          hemisphereGroundColor={hemisphereGroundColor}
          hemisphereLightIntensity={hemisphereLightIntensity}
          hemisphereSkyColor={hemisphereSkyColor}
          lightingState={lightingState}
          moonOpacity={moonOpacity}
          moonShadowMapSize={moonShadowMapSize}
          pointLightIntensity={pointLightIntensity}
          pointLightPosition={pointLightPosition}
          pointLightVisible={pointLightVisible}
          shadowsEnabled={shadowsEnabled}
          sunEnabled={sunEnabled}
          sunLightEnabled={sunLightEnabled}
          sunLightIntensity={sunLightIntensity}
          sunShadowMapSize={sunShadowMapSize}
          sunShadowNormalBias={sunShadowNormalBias}
          sunShadowRadius={sunShadowRadius}
        />
        <WallOcclusionController onVisibilityChange={setWallVisibility} />
        <RoomShell
          roomTheme={roomMetadata.roomTheme}
          surfaceLightAmount={roomSurfaceLightAmount}
          furniture={furniture}
          wallVisibility={wallVisibility}
          shadowsEnabled={shadowsEnabled}
          onWallClick={handleWallClick}
          onWallPointerMove={handleSurfacePointerMove}
          onWallPointerUp={handleSurfacePointerUp}
          onCeilingClick={handleWallClick}
          onCeilingPointerMove={handleSurfacePointerMove}
          onCeilingPointerUp={handleSurfacePointerUp}
        />
        <FloorStage
          roomTheme={roomMetadata.roomTheme}
          targetPosition={targetPosition}
          onFloorMoveCommand={handleFloorMoveCommand}
          onFloorPointerMove={handleSurfacePointerMove}
          onFloorPointerUp={handleSurfacePointerUp}
          surfaceLightAmount={roomSurfaceLightAmount}
          checkerEnabled={false}
          floorPrimaryColor="#f1f1f1"
          floorSecondaryColor="#e5e5e5"
          shadowsEnabled={shadowsEnabled}
        />
        {showCollisionDebug ? (
          <CollisionDebugOverlay
            furniture={furniture}
            playerPosition={playerWorldPosition}
            pendingInteraction={pendingInteraction}
            activeInteraction={activeInteraction}
            showPlayerCollider={showPlayerCollider}
            showInteractionMarkers={showInteractionMarkers}
          />
        ) : null}
        <MinecraftPlayer
          initialPosition={initialPlayerPosition}
          teleportPosition={playerTeleportRequest?.position ?? null}
          teleportRequestId={playerTeleportRequest?.requestId ?? 0}
          skinSrc={skinSrc}
          targetPosition={targetPosition}
          furniture={furniture}
          interaction={playerInteractionPose}
          onTransformChange={handlePlayerActorTransformChange}
          shadowsEnabled={shadowsEnabled}
        />
        {remotePresence ? (
          <MinecraftPlayer
            key={remotePresence.playerId}
            mode="remote"
            displayName={remotePresence.displayName}
            initialPosition={remotePresence.position}
            initialFacingY={remotePresence.facingY}
            teleportPosition={null}
            teleportRequestId={0}
            skinSrc={remotePresence.skinSrc}
            targetPosition={remotePresence.position}
            targetFacingY={remotePresence.facingY}
            remoteMotion={remotePresence.motion}
            furniture={furniture}
            interaction={remotePresence.pose}
            shadowsEnabled={shadowsEnabled}
          />
        ) : null}
        {pets.map((pet) => {
          const preset = DEFAULT_IMPORTED_MOB_PRESETS[pet.presetId];

          if (!preset) {
            return null;
          }

          return (
            <RoomPetActor
              key={pet.id}
              authorityActive={sharedPetAuthorityActive}
              pet={pet}
              preset={preset}
              navigationMap={petNavigationMap}
              obstacles={petObstacles}
              playerPositionRef={playerWorldPositionRef}
              onSharedLiveStateChange={onLocalSharedPetStateChange}
              shadowsEnabled={shadowsEnabled}
              sharedLiveState={
                sharedPetLiveState?.petId === pet.id ? sharedPetLiveState : null
              }
            />
          );
        })}
        <RoomFurnitureLayer
          buildModeEnabled={buildModeEnabled}
          busyFurnitureIds={partnerLockedFurnitureIds}
          frameMemories={frameMemories}
          furniture={furniture}
          hoveredFurnitureId={hoveredFurnitureId}
          hoveredInteractableFurnitureId={hoveredInteractableFurnitureId}
          isDraggingFurniture={isDraggingFurniture}
          nightFactor={lightingState.nightFactor}
          onFurnitureClick={handleFurnitureClick}
          onFurnitureDoubleClick={handleFurnitureDoubleClick}
          onFurniturePointerDown={handleFurniturePointerDown}
          onFurniturePointerMove={handleFurniturePointerMove}
          onFurniturePointerUp={handleFurniturePointerUp}
          onInteractionCommand={handleFurnitureInteractionCommand}
          onOpenMemoryFrame={onOpenMemoryFrame}
          selectedFurnitureId={selectedFurnitureId}
          setHoveredInteractableFurnitureId={setHoveredInteractableFurnitureId}
          shadowsEnabled={shadowsEnabled}
          wallVisibility={wallVisibility}
          windowSurfaceLightAmount={windowSurfaceLightAmount}
        />
        <RoomSelectedFurnitureLayer
          buildModeEnabled={buildModeEnabled}
          frameMemories={frameMemories}
          hoveredInteractableFurnitureId={hoveredInteractableFurnitureId}
          isBusyByPartner={isSelectedFurnitureBusyByPartner}
          isPlacementBlocked={isPlacementBlocked}
          nightFactor={lightingState.nightFactor}
          onCancelPlacement={handleCancelFurniturePlacement}
          onConfirmPlacement={handleConfirmFurniturePlacement}
          onFurnitureClick={handleFurnitureClick}
          onFurnitureDoubleClick={handleFurnitureDoubleClick}
          onFurniturePointerDown={handleFurniturePointerDown}
          onFurniturePointerMove={handleFurniturePointerMove}
          onFurniturePointerUp={handleFurniturePointerUp}
          onInteractionCommand={handleFurnitureInteractionCommand}
          onOpenMemoryFrame={onOpenMemoryFrame}
          onPivotDrag={handlePivotDrag}
          onStorePlacement={handleStoreFurniturePlacement}
          prefersTouchControls={prefersTouchControls}
          resetBuilderGestureState={resetBuilderGestureState}
          selectedFurniture={selectedFurniture}
          setHoveredInteractableFurnitureId={setHoveredInteractableFurnitureId}
          shadowsEnabled={shadowsEnabled}
          wallVisibility={wallVisibility}
          windowSurfaceLightAmount={windowSurfaceLightAmount}
        />
        <RoomPostProcessing
          aoIntensity={postProcessing.aoIntensity}
          aoRadius={postProcessing.aoRadius}
          bloomIntensity={postProcessing.bloomIntensity}
          bloomThreshold={postProcessing.bloomThreshold}
          brightness={postProcessing.brightness}
          contrast={postProcessing.contrast}
          multisampling={postProcessing.multisampling}
          saturation={postProcessing.saturation}
          shouldApplyBrightnessContrast={postProcessing.shouldApplyBrightnessContrast}
          shouldApplyHueSaturation={postProcessing.shouldApplyHueSaturation}
          shouldUseAmbientOcclusion={postProcessing.shouldUseAmbientOcclusion}
          shouldUseBloom={postProcessing.shouldUseBloom}
          vignetteDarkness={postProcessing.vignetteDarkness}
          vignetteOffset={postProcessing.vignetteOffset}
        />
        <CameraTracker onCameraPositionChange={onCameraPositionChange} />
      </Canvas>
      {buildModeEnabled && editDockFurniture ? (
        <EditDock
          busyHelper={
            busyFurniture && !selectedFurniture
              ? "Try another item or wait a moment."
              : null
          }
          busyTitle={
            busyFurniture && !selectedFurniture
              ? "Your partner is editing this item"
              : null
          }
          itemLabel={getFurnitureDefinition(editDockFurniture.type).label}
          surfaceLabel={getSelectedSurfaceLabel(editDockFurniture.surface)}
          blocked={
            busyFurniture && !selectedFurniture
              ? true
              : isPlacementBlocked || isSelectedFurnitureBusyByPartner
          }
          canRotate={
            editDockFurniture.surface === "floor" ||
            editDockFurniture.surface === "ceiling" ||
            editDockFurniture.surface === "surface"
          }
          canSwapWall={
            editDockFurniture.surface === "wall_back" ||
            editDockFurniture.surface === "wall_left" ||
            editDockFurniture.surface === "wall_front" ||
            editDockFurniture.surface === "wall_right"
          }
          canNudgeVertical={
            editDockFurniture.surface === "floor" ||
            editDockFurniture.surface === "ceiling" ||
            editDockFurniture.surface === "surface" ||
            !hasFixedWallVerticalPlacement(editDockFurniture.type)
          }
          onNudgeNegativeHorizontal={() => {
            handleNudgeSelectedFurniture(-1);
          }}
          onNudgePositiveHorizontal={() => {
            handleNudgeSelectedFurniture(1);
          }}
          onNudgeNegativeVertical={() => {
            handleNudgeSelectedFurnitureVertical(-1);
          }}
          onNudgePositiveVertical={() => {
            handleNudgeSelectedFurnitureVertical(1);
          }}
          onRotateLeft={() => {
            handleRotateSelectedFurniture(-1);
          }}
          onRotateRight={() => {
            handleRotateSelectedFurniture(1);
          }}
          onSwapWall={handleSwapSelectedWall}
          onDeselect={handleDeselectFurniture}
        />
      ) : null}
      {interactionHint ? (
        <div
          className="interaction-hint"
          style={{
            left: `${interactionHint.left}px`,
            top: `${interactionHint.top}px`
          }}
        >
          {interactionHint.message}
        </div>
      ) : null}
    </div>
  );
}

function getSelectedSurfaceLabel(
  surface: RoomFurniturePlacement["surface"]
) {
  switch (surface) {
    case "floor":
      return "Floor item";
    case "surface":
      return "Surface decor";
    case "ceiling":
      return "Ceiling item";
    case "wall_back":
      return "Back wall";
    case "wall_left":
      return "Left wall";
    case "wall_front":
      return "Front wall";
    case "wall_right":
      return "Right wall";
    default:
      return "Furniture";
  }
}
