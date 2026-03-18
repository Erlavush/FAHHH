import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, PerspectiveCamera, PivotControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CanvasTexture,
  Euler,
  Matrix4,
  MOUSE,
  NearestFilter,
  Plane,
  Quaternion,
  Ray,
  SRGBColorSpace,
  Vector3
} from "three";
import { ChairModel } from "./ChairModel";
import { SmallTableModel } from "./SmallTableModel";
import {
  loadPersistedFurniturePlacements,
  savePersistedFurniturePlacements,
  type PersistedFurniturePlacement
} from "../lib/devLocalState";
import { getFurnitureDefinition } from "../lib/furnitureRegistry";
import { getFurnitureCollisionReason, type CollisionReason } from "../lib/furnitureCollision";
import {
  createFurniturePlacement,
  cloneFurniturePlacement,
  cloneFurniturePlacements,
  createDefaultRoomState,
  findFurniturePlacement,
  removeFurniturePlacement,
  updateFurniturePlacement,
  type Vector3Tuple
} from "../lib/roomState";
import { MinecraftPlayer } from "./MinecraftPlayer";

const TILE_SIZE = 1;
const GRID_SIZE = 16;
const HALF_FLOOR_SIZE = (GRID_SIZE * TILE_SIZE) / 2;
const CHAIR_GIZMO_SCREEN_SIZE = 90;
const CHAIR_GIZMO_LINE_WIDTH = 3;
const chairDragPosition = new Vector3();
const chairDragQuaternion = new Quaternion();
const chairDragScale = new Vector3();
const chairDragEuler = new Euler(0, 0, 0, "YXZ");
const floorPlane = new Plane(new Vector3(0, 1, 0), 0);
const floorHitPoint = new Vector3();
const spawnCandidateOffsets: Array<[number, number]> = [
  [0, 0],
  [1.5, 0],
  [-1.5, 0],
  [0, 1.5],
  [0, -1.5],
  [2.5, 1.5],
  [-2.5, 1.5],
  [2.5, -1.5],
  [-2.5, -1.5],
  [3.5, 0],
  [-3.5, 0]
];
const CHAIR_GIZMO_OFFSET: [number, number, number] = [0, 0.68, 0];
const CHAIR_ACTIONS_OFFSET: [number, number, number] = [0, 1.95, 0];

function createConcreteTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create the concrete texture.");
  }

  context.fillStyle = "#e7e7e7";
  context.fillRect(0, 0, 16, 16);

  const accents = [
    { x: 1, y: 2, color: "#d9d9d9" },
    { x: 4, y: 1, color: "#f5f5f5" },
    { x: 7, y: 3, color: "#dbdbdb" },
    { x: 11, y: 2, color: "#f0f0f0" },
    { x: 13, y: 5, color: "#d5d5d5" },
    { x: 3, y: 7, color: "#f4f4f4" },
    { x: 6, y: 8, color: "#d7d7d7" },
    { x: 10, y: 9, color: "#eeeeee" },
    { x: 14, y: 11, color: "#d9d9d9" },
    { x: 2, y: 12, color: "#f2f2f2" },
    { x: 8, y: 13, color: "#dadada" },
    { x: 12, y: 14, color: "#f8f8f8" }
  ];

  accents.forEach((accent) => {
    context.fillStyle = accent.color;
    context.fillRect(accent.x, accent.y, 1, 1);
  });

  const texture = new CanvasTexture(canvas);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = SRGBColorSpace;

  return texture;
}

function clampToFloor(value: number): number {
  return Math.min(HALF_FLOOR_SIZE - 0.08, Math.max(-HALF_FLOOR_SIZE + 0.08, value));
}

function clampChairToFloor(value: number): number {
  return Math.min(HALF_FLOOR_SIZE - 0.5, Math.max(-HALF_FLOOR_SIZE + 0.5, value));
}

function snapToBlockCenter(value: number): number {
  return Math.round(value - 0.5) + 0.5;
}

interface FloorStageProps {
  targetPosition: [number, number, number];
  onFloorClick: (event: ThreeEvent<MouseEvent>) => void;
  onFloorPointerMove: (event: ThreeEvent<PointerEvent>) => void;
  onFloorPointerUp: () => void;
  checkerEnabled: boolean;
  floorPrimaryColor: string;
  floorSecondaryColor: string;
  shadowsEnabled: boolean;
}

function FloorStage({
  targetPosition,
  onFloorClick,
  onFloorPointerMove,
  onFloorPointerUp,
  checkerEnabled,
  floorPrimaryColor,
  floorSecondaryColor,
  shadowsEnabled
}: FloorStageProps) {
  const concreteTexture = useMemo(() => createConcreteTexture(), []);
  const tiles = useMemo(() => {
    const nextTiles = [];

    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let column = 0; column < GRID_SIZE; column += 1) {
        const x = (column - (GRID_SIZE - 1) / 2) * TILE_SIZE;
        const z = (row - (GRID_SIZE - 1) / 2) * TILE_SIZE;
        const color = checkerEnabled
          ? (row + column) % 2 === 0
            ? floorPrimaryColor
            : floorSecondaryColor
          : floorPrimaryColor;

        nextTiles.push(
          <mesh
            key={`${row}-${column}`}
            position={[x, -0.5, z]}
            receiveShadow={shadowsEnabled}
            castShadow={shadowsEnabled}
            onClick={onFloorClick}
            onPointerMove={onFloorPointerMove}
            onPointerUp={onFloorPointerUp}
          >
            <boxGeometry args={[TILE_SIZE, 1, TILE_SIZE]} />
            <meshStandardMaterial color={color} map={concreteTexture} />
          </mesh>
        );
      }
    }

    return nextTiles;
  }, [
    checkerEnabled,
    concreteTexture,
    floorPrimaryColor,
    floorSecondaryColor,
    onFloorClick,
    shadowsEnabled
  ]);

  return (
    <group>
      <group>{tiles}</group>
      <mesh position={[targetPosition[0], 0.02, targetPosition[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.14, 0.22, 32]} />
        <meshBasicMaterial color="#5abed0" transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

function RoomShell({
  isDay,
  shadowsEnabled
}: {
  isDay: boolean;
  shadowsEnabled: boolean;
}) {
  const wallColor = isDay ? "#f6efe5" : "#20242f";
  const wallShade = isDay ? "#eadfce" : "#181c25";
  const baseboardColor = isDay ? "#d2b59a" : "#434b5e";
  const trimColor = isDay ? "#fff8f0" : "#2a3040";

  return (
    <group>
      <mesh
        position={[-8.06, 2.2, 0]}
        castShadow={shadowsEnabled}
        receiveShadow={shadowsEnabled}
      >
        <boxGeometry args={[0.22, 4.4, 16.2]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      <mesh
        position={[0, 2.2, -8.06]}
        castShadow={shadowsEnabled}
        receiveShadow={shadowsEnabled}
      >
        <boxGeometry args={[16.2, 4.4, 0.22]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      <mesh position={[-7.93, 0.12, 0]} receiveShadow={shadowsEnabled}>
        <boxGeometry args={[0.12, 0.24, 15.7]} />
        <meshStandardMaterial color={baseboardColor} />
      </mesh>
      <mesh position={[0, 0.12, -7.93]} receiveShadow={shadowsEnabled}>
        <boxGeometry args={[15.7, 0.24, 0.12]} />
        <meshStandardMaterial color={baseboardColor} />
      </mesh>

      <mesh position={[-7.92, 3.55, 0]} receiveShadow={shadowsEnabled}>
        <boxGeometry args={[0.08, 0.18, 15.7]} />
        <meshStandardMaterial color={trimColor} />
      </mesh>
      <mesh position={[0, 3.55, -7.92]} receiveShadow={shadowsEnabled}>
        <boxGeometry args={[15.7, 0.18, 0.08]} />
        <meshStandardMaterial color={trimColor} />
      </mesh>

      <mesh position={[-7.88, 1.2, -4.2]} receiveShadow={shadowsEnabled}>
        <boxGeometry args={[0.08, 1.8, 4.1]} />
        <meshStandardMaterial color={wallShade} />
      </mesh>
      <mesh position={[-4.2, 1.2, -7.88]} receiveShadow={shadowsEnabled}>
        <boxGeometry args={[4.1, 1.8, 0.08]} />
        <meshStandardMaterial color={wallShade} />
      </mesh>
    </group>
  );
}

interface RoomViewProps {
  cameraEditEnabled: boolean;
  buildModeEnabled: boolean;
  gridSnapEnabled: boolean;
  spawnRequest: {
    requestId: number;
    type: "chair" | "table";
  } | null;
  initialCameraPosition: Vector3Tuple;
  initialPlayerPosition: Vector3Tuple;
  skinSrc: string | null;
  timeOfDay: "day" | "night";
  sunEnabled: boolean;
  shadowsEnabled: boolean;
  checkerEnabled: boolean;
  floorPrimaryColor: string;
  floorSecondaryColor: string;
  onCameraPositionChange: (position: Vector3Tuple) => void;
  onPlayerPositionChange: (position: Vector3Tuple) => void;
}

function StarField() {
  const stars = useMemo(
    () =>
      Array.from({ length: 48 }, (_, index) => {
        const angle = index * 0.61;
        const x = Math.cos(angle * 1.7) * (9 + (index % 6));
        const y = 5 + (index % 7) * 0.55;
        const z = Math.sin(angle * 1.2) * (9 + ((index + 3) % 5));
        const scale = 0.04 + (index % 3) * 0.015;

        return { x, y, z, scale };
      }),
    []
  );

  return (
    <group>
      {stars.map((star, index) => (
        <mesh key={index} position={[star.x, star.y, star.z]}>
          <sphereGeometry args={[star.scale, 6, 6]} />
          <meshBasicMaterial color="#f7fbff" />
        </mesh>
      ))}
    </group>
  );
}

function CameraTracker({
  onCameraPositionChange
}: {
  onCameraPositionChange: (position: Vector3Tuple) => void;
}) {
  const lastSentTime = useRef(0);

  useFrame((state) => {
    if (state.clock.elapsedTime - lastSentTime.current < 0.1) {
      return;
    }

    lastSentTime.current = state.clock.elapsedTime;
    onCameraPositionChange([
      state.camera.position.x,
      state.camera.position.y,
      state.camera.position.z
    ]);
  });

  return null;
}

function ChairPlacementActions({
  onCancel,
  onConfirm,
  confirmDisabled
}: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmDisabled: boolean;
}) {
  return (
    <Html position={CHAIR_ACTIONS_OFFSET} center occlude={false}>
      <div className="placement-actions">
        <button
          className="placement-action placement-action--cancel"
          onClick={(event) => {
            event.stopPropagation();
            onCancel();
          }}
          type="button"
        >
          X
        </button>
        <button
          className={`placement-action placement-action--confirm${
            confirmDisabled ? " placement-action--disabled" : ""
          }`}
          onClick={(event) => {
            event.stopPropagation();

            if (confirmDisabled) {
              return;
            }

            onConfirm();
          }}
          type="button"
          disabled={confirmDisabled}
          aria-label="Confirm placement"
        >
          ✓
        </button>
      </div>
    </Html>
  );
}

export function RoomView({
  cameraEditEnabled,
  buildModeEnabled,
  gridSnapEnabled,
  spawnRequest,
  initialCameraPosition,
  initialPlayerPosition,
  skinSrc,
  timeOfDay,
  sunEnabled,
  shadowsEnabled,
  checkerEnabled,
  floorPrimaryColor,
  floorSecondaryColor,
  onCameraPositionChange,
  onPlayerPositionChange
}: RoomViewProps) {
  const initialCameraPositionRef = useRef(initialCameraPosition);
  const lastProcessedSpawnRequestIdRef = useRef<number | null>(null);
  const initialFurnitureLayout = useMemo(
    () => loadPersistedFurniturePlacements(createDefaultRoomState().furniture),
    []
  );
  const [targetPosition, setTargetPosition] = useState<[number, number, number]>(
    initialPlayerPosition
  );
  const [playerWorldPosition, setPlayerWorldPosition] = useState<[number, number, number]>(
    initialPlayerPosition
  );
  const [committedFurniture, setCommittedFurniture] = useState<PersistedFurniturePlacement[]>(
    cloneFurniturePlacements(initialFurnitureLayout)
  );
  const [furniture, setFurniture] = useState<PersistedFurniturePlacement[]>(
    cloneFurniturePlacements(initialFurnitureLayout)
  );
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
  const [isDraggingFurniture, setIsDraggingFurniture] = useState(false);
  const [isTransformingFurniture, setIsTransformingFurniture] = useState(false);
  const isDay = timeOfDay === "day";
  const furnitureEditStartRef = useRef<Record<string, PersistedFurniturePlacement | null>>({});
  const selectedFurniture = useMemo(
    () => findFurniturePlacement(furniture, selectedFurnitureId),
    [furniture, selectedFurnitureId]
  );
  const placementBlockReason = useMemo<CollisionReason | null>(() => {
    if (!selectedFurniture) {
      return null;
    }

    return getFurnitureCollisionReason(
      selectedFurniture,
      furniture.filter((item) => item.id !== selectedFurniture.id),
      playerWorldPosition
    );
  }, [furniture, playerWorldPosition, selectedFurniture]);
  const isPlacementBlocked = placementBlockReason !== null;
  const selectedFurnitureMatrix = useMemo(() => {
    if (!selectedFurniture) {
      return null;
    }

    const nextMatrix = new Matrix4();
    const nextRotation = new Quaternion().setFromEuler(new Euler(0, selectedFurniture.rotationY, 0));

    nextMatrix.compose(
      new Vector3(
        selectedFurniture.position[0],
        selectedFurniture.position[1],
        selectedFurniture.position[2]
      ),
      nextRotation,
      new Vector3(1, 1, 1)
    );

    return nextMatrix;
  }, [selectedFurniture]);

  useEffect(() => {
    if (!buildModeEnabled) {
      setFurniture(committedFurniture);
      setSelectedFurnitureId(null);
      setIsDraggingFurniture(false);
      setIsTransformingFurniture(false);
      furnitureEditStartRef.current = {};
    }
  }, [buildModeEnabled, committedFurniture]);

  useEffect(() => {
    savePersistedFurniturePlacements(committedFurniture);
  }, [committedFurniture]);

  useEffect(() => {
    if (!isDraggingFurniture) {
      return;
    }

    function stopDragging(): void {
      setIsDraggingFurniture(false);
    }

    window.addEventListener("pointerup", stopDragging);

    return () => {
      window.removeEventListener("pointerup", stopDragging);
    };
  }, [isDraggingFurniture]);

  useEffect(() => {
    if (!spawnRequest || lastProcessedSpawnRequestIdRef.current === spawnRequest.requestId) {
      return;
    }

    lastProcessedSpawnRequestIdRef.current = spawnRequest.requestId;

    const basePosition = targetPosition;
    let nextPosition: [number, number, number] = [0, 0, 0];
    let hasValidCandidate = false;

    for (const [offsetX, offsetZ] of spawnCandidateOffsets) {
      const candidate = resolveChairPlacement(basePosition[0] + offsetX, basePosition[2] + offsetZ);
      const candidateFurniture = createFurniturePlacement(spawnRequest.type, candidate);
      const collisionReason = getFurnitureCollisionReason(
        candidateFurniture,
        furniture,
        playerWorldPosition
      );

      if (!collisionReason) {
        nextPosition = candidate;
        hasValidCandidate = true;
        break;
      }
    }

    if (!hasValidCandidate) {
      nextPosition = resolveChairPlacement(basePosition[0], basePosition[2]);
    }

    const nextFurniture = createFurniturePlacement(spawnRequest.type, nextPosition);

    setFurniture((currentFurniture) => [...currentFurniture, nextFurniture]);
    setSelectedFurnitureId(nextFurniture.id);
    setIsDraggingFurniture(false);
    setIsTransformingFurniture(false);
    furnitureEditStartRef.current[nextFurniture.id] = null;
  }, [furniture, playerWorldPosition, spawnRequest, targetPosition]);

  function resolveChairPlacement(x: number, z: number): [number, number, number] {
    const nextX = gridSnapEnabled ? snapToBlockCenter(x) : x;
    const nextZ = gridSnapEnabled ? snapToBlockCenter(z) : z;

    return [clampChairToFloor(nextX), 0, clampChairToFloor(nextZ)];
  }

  function resolveFurnitureRotation(angle: number): number {
    const step = gridSnapEnabled ? Math.PI / 2 : Math.PI / 180;
    const snappedAngle = Math.round(angle / step) * step;

    return Math.atan2(Math.sin(snappedAngle), Math.cos(snappedAngle));
  }

  function updateFurnitureItem(
    furnitureId: string,
    updater: (item: PersistedFurniturePlacement) => PersistedFurniturePlacement
  ): void {
    setFurniture((currentFurniture) => updateFurniturePlacement(currentFurniture, furnitureId, updater));
  }

  function revertFurnitureItemToCommitted(furnitureId: string): void {
    const committedItem = committedFurniture.find((item) => item.id === furnitureId);

    if (!committedItem) {
      setFurniture((currentFurniture) => removeFurniturePlacement(currentFurniture, furnitureId));
      return;
    }

    updateFurnitureItem(furnitureId, () => cloneFurniturePlacement(committedItem));
  }

  function selectFurnitureForEditing(furnitureId: string): void {
    const committedItem =
      committedFurniture.find((item) => item.id === furnitureId) ??
      furniture.find((item) => item.id === furnitureId);

    if (!committedItem) {
      return;
    }

    if (!(furnitureId in furnitureEditStartRef.current)) {
      const existingCommittedItem = committedFurniture.find((item) => item.id === furnitureId);

      furnitureEditStartRef.current[furnitureId] = existingCommittedItem
        ? cloneFurniturePlacement(existingCommittedItem)
        : null;
    }

    setSelectedFurnitureId(furnitureId);
  }

  function resolveFloorRayPoint(ray: Ray): [number, number, number] | null {
    const hitPoint = ray.intersectPlane(floorPlane, floorHitPoint);

    if (!hitPoint) {
      return null;
    }

    return resolveChairPlacement(hitPoint.x, hitPoint.z);
  }

  function handleFloorClick(event: ThreeEvent<MouseEvent>): void {
    if (buildModeEnabled) {
      event.stopPropagation();
      return;
    }

    if (cameraEditEnabled || isTransformingFurniture) {
      return;
    }

    event.stopPropagation();
    setTargetPosition([
      clampToFloor(event.point.x),
      0,
      clampToFloor(event.point.z)
    ]);
  }

  function handleFurniturePointerDown(
    furnitureId: string,
    event: ThreeEvent<PointerEvent>
  ): void {
    if (!buildModeEnabled || cameraEditEnabled) {
      return;
    }

    event.stopPropagation();
    selectFurnitureForEditing(furnitureId);
    setIsDraggingFurniture(true);
  }

  function handleFurniturePointerMove(event: ThreeEvent<PointerEvent>): void {
    if (
      !buildModeEnabled ||
      cameraEditEnabled ||
      isTransformingFurniture ||
      !isDraggingFurniture ||
      !selectedFurnitureId
    ) {
      return;
    }

    const nextPosition = resolveFloorRayPoint(event.ray);

    if (!nextPosition) {
      return;
    }

    event.stopPropagation();
    updateFurnitureItem(selectedFurnitureId, (item) => ({
      ...item,
      position: nextPosition
    }));
  }

  function handleFurniturePointerUp(): void {
    setIsDraggingFurniture(false);
  }

  function handleFurniturePivotDrag(localMatrix: Matrix4): void {
    if (!selectedFurnitureId) {
      return;
    }

    localMatrix.decompose(chairDragPosition, chairDragQuaternion, chairDragScale);
    chairDragEuler.setFromQuaternion(chairDragQuaternion);

    const nextPosition = resolveChairPlacement(chairDragPosition.x, chairDragPosition.z);
    const nextRotation = resolveFurnitureRotation(chairDragEuler.y);

    updateFurnitureItem(selectedFurnitureId, (item) => ({
      ...item,
      position: nextPosition,
      rotationY: nextRotation
    }));
  }

  function handleFloorPointerMove(event: ThreeEvent<PointerEvent>): void {
    if (
      !buildModeEnabled ||
      cameraEditEnabled ||
      isTransformingFurniture ||
      !isDraggingFurniture ||
      !selectedFurnitureId
    ) {
      return;
    }

    const nextPosition = resolveFloorRayPoint(event.ray);

    if (!nextPosition) {
      return;
    }

    event.stopPropagation();
    updateFurnitureItem(selectedFurnitureId, (item) => ({
      ...item,
      position: nextPosition
    }));
  }

  function handleFloorPointerUp(): void {
    setIsDraggingFurniture(false);
  }

  function handleCancelFurniturePlacement(): void {
    if (selectedFurnitureId) {
      const editStart = furnitureEditStartRef.current[selectedFurnitureId];

      if (editStart) {
        updateFurnitureItem(selectedFurnitureId, () => cloneFurniturePlacement(editStart));
      } else {
        revertFurnitureItemToCommitted(selectedFurnitureId);
      }

      delete furnitureEditStartRef.current[selectedFurnitureId];
    }

    setSelectedFurnitureId(null);
    setIsDraggingFurniture(false);
    setIsTransformingFurniture(false);
  }

  function handleConfirmFurniturePlacement(): void {
    if (!selectedFurnitureId || !selectedFurniture || isPlacementBlocked) {
      return;
    }

    setCommittedFurniture((currentFurniture) => {
      const existingCommittedItem = currentFurniture.find((item) => item.id === selectedFurnitureId);

      if (!existingCommittedItem) {
        return [...currentFurniture, cloneFurniturePlacement(selectedFurniture)];
      }

      return updateFurniturePlacement(currentFurniture, selectedFurnitureId, () =>
        cloneFurniturePlacement(selectedFurniture)
      );
    });
    delete furnitureEditStartRef.current[selectedFurnitureId];
    setSelectedFurnitureId(null);
    setIsDraggingFurniture(false);
    setIsTransformingFurniture(false);
  }

  function renderFurnitureModel(item: PersistedFurniturePlacement, selected: boolean) {
    const definition = getFurnitureDefinition(item.type);
    const commonProps = {
      position: [0, 0, 0] as [number, number, number],
      rotationY: 0,
      shadowsEnabled,
      selected,
      blocked: selected && isPlacementBlocked
    };

    if (definition.modelKey === "chair") {
      return <ChairModel {...commonProps} />;
    }

    return <SmallTableModel {...commonProps} />;
  }

  return (
    <div className="canvas-wrap">
      <Canvas shadows dpr={[1, 1.6]}>
        <color attach="background" args={[isDay ? "#dfeaf6" : "#05070d"]} />
        <PerspectiveCamera
          makeDefault
          position={initialCameraPositionRef.current}
          fov={26}
          onUpdate={(camera) => camera.lookAt(0, 0.9, 0)}
        />
        <OrbitControls
          enabled={cameraEditEnabled && !isTransformingFurniture}
          enableRotate={cameraEditEnabled && !isTransformingFurniture}
          enablePan={false}
          enableZoom={cameraEditEnabled && !isTransformingFurniture}
          screenSpacePanning={false}
          minDistance={5}
          maxDistance={48}
          target={[0, 0.9, 0]}
          minPolarAngle={0.5}
          maxPolarAngle={1.2}
          mouseButtons={{
            LEFT: MOUSE.ROTATE,
            MIDDLE: MOUSE.ROTATE,
            RIGHT: MOUSE.ROTATE
          }}
        />
        <ambientLight intensity={isDay ? 1.4 : 0.22} color={isDay ? "#fff8f0" : "#8fa4c9"} />
        <hemisphereLight
          intensity={isDay ? 0.75 : 0.18}
          groundColor={isDay ? "#b8c6d4" : "#0f1420"}
          color={isDay ? "#f7fbff" : "#5e7399"}
        />
        {sunEnabled ? (
          <directionalLight
            castShadow={shadowsEnabled}
            intensity={isDay ? 1.6 : 0.35}
            color={isDay ? "#fff2d8" : "#98b7ff"}
            position={isDay ? [5, 8, 4] : [3, 6, 5]}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
        ) : null}
        {!isDay ? <StarField /> : null}
        <RoomShell isDay={isDay} shadowsEnabled={shadowsEnabled} />
        <FloorStage
          targetPosition={targetPosition}
          onFloorClick={handleFloorClick}
          onFloorPointerMove={handleFloorPointerMove}
          onFloorPointerUp={handleFloorPointerUp}
          checkerEnabled={checkerEnabled}
          floorPrimaryColor={floorPrimaryColor}
          floorSecondaryColor={floorSecondaryColor}
          shadowsEnabled={shadowsEnabled}
        />
        <MinecraftPlayer
          initialPosition={initialPlayerPosition}
          skinSrc={skinSrc}
          targetPosition={targetPosition}
          onPositionChange={(position) => {
            setPlayerWorldPosition(position);
            onPlayerPositionChange(position);
          }}
          shadowsEnabled={shadowsEnabled}
        />
        {furniture
          .filter((item) => item.id !== selectedFurnitureId)
          .map((item) => (
            <group
              key={item.id}
              position={item.position}
              rotation={[0, item.rotationY, 0]}
              onPointerDown={(event) => handleFurniturePointerDown(item.id, event)}
              onPointerMove={handleFurniturePointerMove}
              onPointerUp={handleFurniturePointerUp}
            >
              {renderFurnitureModel(item, false)}
            </group>
          ))}
        {buildModeEnabled && selectedFurniture && selectedFurnitureMatrix ? (
          <PivotControls
            matrix={selectedFurnitureMatrix}
            autoTransform={false}
            offset={CHAIR_GIZMO_OFFSET}
            activeAxes={[true, false, true]}
            disableScaling
            rotationLimits={[[0, 0], undefined, [0, 0]]}
            lineWidth={CHAIR_GIZMO_LINE_WIDTH}
            depthTest={false}
            fixed={true}
            scale={CHAIR_GIZMO_SCREEN_SIZE}
            onDragStart={() => {
              setIsDraggingFurniture(false);
              setIsTransformingFurniture(true);
            }}
            onDrag={handleFurniturePivotDrag}
            onDragEnd={() => setIsTransformingFurniture(false)}
          >
            <group
              onPointerDown={(event) => handleFurniturePointerDown(selectedFurniture.id, event)}
              onPointerMove={handleFurniturePointerMove}
              onPointerUp={handleFurniturePointerUp}
            >
              <ChairPlacementActions
                onCancel={handleCancelFurniturePlacement}
                onConfirm={handleConfirmFurniturePlacement}
                confirmDisabled={isPlacementBlocked}
              />
              {renderFurnitureModel(selectedFurniture, true)}
            </group>
          </PivotControls>
        ) : (
          selectedFurniture ? (
            <group
              position={selectedFurniture.position}
              rotation={[0, selectedFurniture.rotationY, 0]}
              onPointerDown={(event) => handleFurniturePointerDown(selectedFurniture.id, event)}
              onPointerMove={handleFurniturePointerMove}
              onPointerUp={handleFurniturePointerUp}
            >
              {renderFurnitureModel(selectedFurniture, false)}
            </group>
          ) : null
        )}
        <CameraTracker onCameraPositionChange={onCameraPositionChange} />
      </Canvas>
    </div>
  );
}
