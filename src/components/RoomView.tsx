import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { PerspectiveCamera as ThreePerspectiveCamera } from "three";
import type {
  FurnitureSpawnRequest,
  LocalPlayerPresenceSnapshot,
  PlayerInteractionStatus,
  SceneJumpRequest
} from "../app/types";
import { placementListsMatch } from "../lib/roomPlacementEquality";
import { getFurnitureDefinition } from "../lib/furnitureRegistry";
import { DEFAULT_IMPORTED_MOB_PRESETS } from "../lib/mobLab";
import type { SharedPresenceSnapshot } from "../lib/sharedPresenceTypes";
import type { OwnedPet } from "../lib/pets";
import type {
  RoomFurniturePlacement,
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
  buildModeEnabled: boolean;
  gridSnapEnabled: boolean;
  spawnRequest: FurnitureSpawnRequest | null;
  cameraResetToken: number;
  standRequestToken: number;
  initialCameraPosition: Vector3Tuple;
  initialPlayerPosition: Vector3Tuple;
  initialFurniturePlacements: RoomFurniturePlacement[];
  pets: OwnedPet[];
  skinSrc: string | null;
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
  onPlayerPositionChange: (position: Vector3Tuple) => void;
  onFurnitureSnapshotChange: (placements: RoomFurniturePlacement[]) => void;
  onCommittedFurnitureChange: (placements: RoomFurniturePlacement[]) => void;
  onInteractionStateChange: (status: PlayerInteractionStatus) => void;
  remotePresence: SharedPresenceSnapshot | null;
  sceneJumpRequest: SceneJumpRequest | null;
}

export function RoomView({
  buildModeEnabled,
  gridSnapEnabled,
  spawnRequest,
  cameraResetToken,
  standRequestToken,
  initialCameraPosition,
  initialPlayerPosition,
  initialFurniturePlacements,
  pets,
  skinSrc,
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
  onPlayerPositionChange,
  onFurnitureSnapshotChange,
  onCommittedFurnitureChange,
  onInteractionStateChange,
  remotePresence,
  sceneJumpRequest
}: RoomViewProps) {
  const initialCameraPositionRef = useRef(initialCameraPosition);
  const initialSceneTarget = ROOM_CAMERA_TARGET;
  const cameraRef = useRef<ThreePerspectiveCamera | null>(null);
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
    wall_right: true
  });

  const {
    committedFurniture,
    furniture,
    hoveredFurnitureId,
    isPlacementBlocked,
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
    buildModeEnabled,
    gridSnapEnabled,
    initialFurniturePlacements,
    playerWorldPosition,
    onFurnitureSnapshotChange,
    onCommittedFurnitureChange
  });

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
    contrast,
    furniture,
    saturation,
    shouldUseReducedRenderQuality,
    sunIntensityMultiplier,
    worldTimeMinutes
  });

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
          surfaceLightAmount={roomSurfaceLightAmount}
          furniture={furniture}
          wallVisibility={wallVisibility}
          shadowsEnabled={shadowsEnabled}
          onWallClick={handleWallClick}
          onWallPointerMove={handleSurfacePointerMove}
          onWallPointerUp={handleSurfacePointerUp}
        />
        <FloorStage
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
              pet={pet}
              preset={preset}
              playerPosition={playerWorldPosition}
              furniture={furniture}
              shadowsEnabled={shadowsEnabled}
            />
          );
        })}
        <RoomFurnitureLayer
          buildModeEnabled={buildModeEnabled}
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
          selectedFurnitureId={selectedFurnitureId}
          setHoveredInteractableFurnitureId={setHoveredInteractableFurnitureId}
          shadowsEnabled={shadowsEnabled}
          wallVisibility={wallVisibility}
          windowSurfaceLightAmount={windowSurfaceLightAmount}
        />
        <RoomSelectedFurnitureLayer
          buildModeEnabled={buildModeEnabled}
          hoveredInteractableFurnitureId={hoveredInteractableFurnitureId}
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
      {buildModeEnabled && selectedFurniture ? (
        <EditDock
          itemLabel={getFurnitureDefinition(selectedFurniture.type).label}
          surfaceLabel={getSelectedSurfaceLabel(selectedFurniture.surface)}
          blocked={isPlacementBlocked}
          canRotate={
            selectedFurniture.surface === "floor" ||
            selectedFurniture.surface === "surface"
          }
          canSwapWall={
            selectedFurniture.surface === "wall_back" ||
            selectedFurniture.surface === "wall_left" ||
            selectedFurniture.surface === "wall_front" ||
            selectedFurniture.surface === "wall_right"
          }
          canNudgeVertical={
            selectedFurniture.surface === "floor" ||
            selectedFurniture.surface === "surface" ||
            !hasFixedWallVerticalPlacement(selectedFurniture.type)
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
