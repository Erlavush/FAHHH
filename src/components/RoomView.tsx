import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, PerspectiveCamera, PivotControls } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  CanvasTexture,
  Euler,
  Matrix4,
  MOUSE,
  NearestFilter,
  PerspectiveCamera as ThreePerspectiveCamera,
  Plane,
  Quaternion,
  Ray,
  SRGBColorSpace,
  Vector3
} from "three";
import { ChairModel } from "./ChairModel";
import { MinecraftPlayer } from "./MinecraftPlayer";
import { PosterModel } from "./PosterModel";
import { SmallTableModel } from "./SmallTableModel";
import {
  BedModel,
  DeskModel,
  RugModel,
  WallFrameModel
} from "./StarterFurnitureModels";
import {
  getFurnitureCollisionReason,
  type CollisionReason
} from "../lib/furnitureCollision";
import {
  getFurnitureDefinition,
  getSurfaceRotationY,
  type FurniturePlacementSurface,
  type FurnitureType
} from "../lib/furnitureRegistry";
import {
  cloneFurniturePlacement,
  cloneFurniturePlacements,
  createFurniturePlacement,
  findFurniturePlacement,
  removeFurniturePlacement,
  updateFurniturePlacement,
  type RoomFurniturePlacement,
  type Vector3Tuple
} from "../lib/roomState";

const TILE_SIZE = 1;
const GRID_SIZE = 16;
const HALF_FLOOR_SIZE = (GRID_SIZE * TILE_SIZE) / 2;
const BACK_WALL_SURFACE_Z = -7.83;
const LEFT_WALL_SURFACE_X = -7.83;
const WALL_MIN_Y = 1;
const WALL_MAX_Y = 2.7;
const FLOOR_GIZMO_SCREEN_SIZE = 90;
const WALL_GIZMO_SCREEN_SIZE = 78;
const GIZMO_LINE_WIDTH = 3;
const transformDragPosition = new Vector3();
const transformDragQuaternion = new Quaternion();
const transformDragScale = new Vector3();
const transformDragEuler = new Euler(0, 0, 0, "YXZ");
const floorPlane = new Plane(new Vector3(0, 1, 0), 0);
const backWallPlane = new Plane(new Vector3(0, 0, 1), -BACK_WALL_SURFACE_Z);
const leftWallPlane = new Plane(new Vector3(1, 0, 0), -LEFT_WALL_SURFACE_X);
const floorHitPoint = new Vector3();
const backWallHitPoint = new Vector3();
const leftWallHitPoint = new Vector3();
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

type PlacementTransform = Pick<RoomFurniturePlacement, "position" | "rotationY" | "surface">;

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

function clampFurnitureToFloor(value: number, halfSize: number): number {
  return Math.min(HALF_FLOOR_SIZE - halfSize, Math.max(-HALF_FLOOR_SIZE + halfSize, value));
}

function clampWallAxis(value: number, halfSize: number): number {
  return Math.min(HALF_FLOOR_SIZE - halfSize - 0.18, Math.max(-HALF_FLOOR_SIZE + halfSize + 0.18, value));
}

function clampWallHeight(value: number, halfSize: number): number {
  return Math.min(WALL_MAX_Y - halfSize, Math.max(WALL_MIN_Y + halfSize, value));
}

function snapToBlockCenter(value: number): number {
  return Math.round(value - 0.5) + 0.5;
}

function getGizmoOffset(surface: FurniturePlacementSurface): [number, number, number] {
  if (surface === "wall_back") {
    return [0, 0, 0.12];
  }

  if (surface === "wall_left") {
    return [0.12, 0, 0];
  }

  return [0, 0.68, 0];
}

function getActionsOffset(surface: FurniturePlacementSurface): [number, number, number] {
  if (surface === "wall_back") {
    return [0, 1.12, 0.16];
  }

  if (surface === "wall_left") {
    return [0.16, 1.12, 0];
  }

  return [0, 1.95, 0];
}

function getActiveAxes(surface: FurniturePlacementSurface): [boolean, boolean, boolean] {
  if (surface === "wall_back") {
    return [true, true, false];
  }

  if (surface === "wall_left") {
    return [false, true, true];
  }

  return [true, false, true];
}

function placementsMatch(
  first: RoomFurniturePlacement,
  second: RoomFurniturePlacement
): boolean {
  return (
    first.surface === second.surface &&
    Math.abs(first.position[0] - second.position[0]) < 0.0001 &&
    Math.abs(first.position[1] - second.position[1]) < 0.0001 &&
    Math.abs(first.position[2] - second.position[2]) < 0.0001 &&
    Math.abs(first.rotationY - second.rotationY) < 0.0001
  );
}

function placementListsMatch(
  first: RoomFurniturePlacement[],
  second: RoomFurniturePlacement[]
): boolean {
  return (
    first.length === second.length &&
    first.every((placement, index) => placementsMatch(placement, second[index]))
  );
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
    onFloorPointerMove,
    onFloorPointerUp,
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
  shadowsEnabled,
  onWallClick,
  onWallPointerMove,
  onWallPointerUp
}: {
  isDay: boolean;
  shadowsEnabled: boolean;
  onWallClick: (event: ThreeEvent<MouseEvent>) => void;
  onWallPointerMove: (event: ThreeEvent<PointerEvent>) => void;
  onWallPointerUp: () => void;
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
        onClick={onWallClick}
        onPointerMove={onWallPointerMove}
        onPointerUp={onWallPointerUp}
      >
        <boxGeometry args={[0.22, 4.4, 16.2]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      <mesh
        position={[0, 2.2, -8.06]}
        castShadow={shadowsEnabled}
        receiveShadow={shadowsEnabled}
        onClick={onWallClick}
        onPointerMove={onWallPointerMove}
        onPointerUp={onWallPointerUp}
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
    type: FurnitureType;
  } | null;
  cameraResetToken: number;
  initialCameraPosition: Vector3Tuple;
  initialPlayerPosition: Vector3Tuple;
  initialFurniturePlacements: RoomFurniturePlacement[];
  skinSrc: string | null;
  timeOfDay: "day" | "night";
  sunEnabled: boolean;
  shadowsEnabled: boolean;
  checkerEnabled: boolean;
  floorPrimaryColor: string;
  floorSecondaryColor: string;
  onCameraPositionChange: (position: Vector3Tuple) => void;
  onPlayerPositionChange: (position: Vector3Tuple) => void;
  onCommittedFurnitureChange: (placements: RoomFurniturePlacement[]) => void;
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

function PlacementActions({
  position,
  onCancel,
  onDelete,
  onConfirm,
  confirmDisabled
}: {
  position: [number, number, number];
  onCancel: () => void;
  onDelete: () => void;
  onConfirm: () => void;
  confirmDisabled: boolean;
}) {
  return (
    <Html position={position} center occlude={false}>
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
          className="placement-action placement-action--delete"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          type="button"
        >
          Del
        </button>
        <button
          className={`placement-action placement-action--confirm${
            confirmDisabled ? " placement-action--disabled" : ""
          }`}
          onClick={(event) => {
            event.stopPropagation();

            if (!confirmDisabled) {
              onConfirm();
            }
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
  cameraResetToken,
  initialCameraPosition,
  initialPlayerPosition,
  initialFurniturePlacements,
  skinSrc,
  timeOfDay,
  sunEnabled,
  shadowsEnabled,
  checkerEnabled,
  floorPrimaryColor,
  floorSecondaryColor,
  onCameraPositionChange,
  onPlayerPositionChange,
  onCommittedFurnitureChange
}: RoomViewProps) {
  const initialCameraPositionRef = useRef(initialCameraPosition);
  const initialFurnitureRef = useRef(cloneFurniturePlacements(initialFurniturePlacements));
  const cameraRef = useRef<ThreePerspectiveCamera | null>(null);
  const orbitControlsRef = useRef<any>(null);
  const lastProcessedSpawnRequestIdRef = useRef<number | null>(null);
  const lastCameraResetTokenRef = useRef(0);
  const lastReportedCommittedFurnitureRef = useRef<RoomFurniturePlacement[]>(
    cloneFurniturePlacements(initialFurnitureRef.current)
  );
  const furnitureEditStartRef = useRef<Record<string, RoomFurniturePlacement | null>>({});
  const [targetPosition, setTargetPosition] = useState<[number, number, number]>(initialPlayerPosition);
  const [playerWorldPosition, setPlayerWorldPosition] = useState<[number, number, number]>(
    initialPlayerPosition
  );
  const [committedFurniture, setCommittedFurniture] = useState<RoomFurniturePlacement[]>(
    cloneFurniturePlacements(initialFurnitureRef.current)
  );
  const [furniture, setFurniture] = useState<RoomFurniturePlacement[]>(
    cloneFurniturePlacements(initialFurnitureRef.current)
  );
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
  const [isDraggingFurniture, setIsDraggingFurniture] = useState(false);
  const [isTransformingFurniture, setIsTransformingFurniture] = useState(false);
  const isDay = timeOfDay === "day";
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
  const selectedSurface = selectedFurniture?.surface ?? "floor";
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
    if (placementListsMatch(lastReportedCommittedFurnitureRef.current, committedFurniture)) {
      return;
    }

    const nextPlacements = cloneFurniturePlacements(committedFurniture);
    lastReportedCommittedFurnitureRef.current = nextPlacements;
    onCommittedFurnitureChange(nextPlacements);
  }, [committedFurniture, onCommittedFurnitureChange]);

  useLayoutEffect(() => {
    if (placementListsMatch(committedFurniture, initialFurniturePlacements)) {
      return;
    }

    const nextPlacements = cloneFurniturePlacements(initialFurniturePlacements);
    lastReportedCommittedFurnitureRef.current = nextPlacements;
    setCommittedFurniture(nextPlacements);
    setFurniture(nextPlacements);
    setSelectedFurnitureId(null);
    setIsDraggingFurniture(false);
    setIsTransformingFurniture(false);
    furnitureEditStartRef.current = {};
  }, [initialFurniturePlacements]);

  useEffect(() => {
    if (!buildModeEnabled) {
      setFurniture(cloneFurniturePlacements(committedFurniture));
      setSelectedFurnitureId(null);
      setIsDraggingFurniture(false);
      setIsTransformingFurniture(false);
      furnitureEditStartRef.current = {};
    }
  }, [buildModeEnabled, committedFurniture]);

  useEffect(() => {
    if (!isDraggingFurniture) {
      return;
    }

    function stopDragging() {
      setIsDraggingFurniture(false);
    }

    window.addEventListener("pointerup", stopDragging);

    return () => {
      window.removeEventListener("pointerup", stopDragging);
    };
  }, [isDraggingFurniture]);

  useEffect(() => {
    if (!cameraResetToken || cameraResetToken === lastCameraResetTokenRef.current) {
      return;
    }

    lastCameraResetTokenRef.current = cameraResetToken;
    cameraRef.current?.position.set(
      initialCameraPosition[0],
      initialCameraPosition[1],
      initialCameraPosition[2]
    );
    orbitControlsRef.current?.target.set(0, 0.9, 0);
    orbitControlsRef.current?.update();
    onCameraPositionChange(initialCameraPosition);
  }, [cameraResetToken, initialCameraPosition, onCameraPositionChange]);

  useEffect(() => {
    if (!spawnRequest || lastProcessedSpawnRequestIdRef.current === spawnRequest.requestId) {
      return;
    }

    lastProcessedSpawnRequestIdRef.current = spawnRequest.requestId;

    const definition = getFurnitureDefinition(spawnRequest.type);
    const spawnSurface = definition.surface === "wall" ? getPreferredWallSurface() : "floor";
    let nextPlacement = createFurniturePlacement(
      spawnRequest.type,
      resolveSpawnPosition(spawnRequest.type, spawnSurface, 0, 0).position,
      spawnSurface
    );
    let foundOpenSpot = false;

    for (const [offsetA, offsetB] of spawnCandidateOffsets) {
      const candidate = resolveSpawnPosition(spawnRequest.type, spawnSurface, offsetA, offsetB);
      const candidatePlacement = {
        id: `${spawnRequest.type}-spawn-preview`,
        type: spawnRequest.type,
        ...candidate
      };

      if (!getFurnitureCollisionReason(candidatePlacement, furniture, playerWorldPosition)) {
        nextPlacement = createFurniturePlacement(
          spawnRequest.type,
          candidate.position,
          candidate.surface
        );
        foundOpenSpot = true;
        break;
      }
    }

    if (!foundOpenSpot) {
      nextPlacement = createFurniturePlacement(
        spawnRequest.type,
        resolveSpawnPosition(spawnRequest.type, spawnSurface, 0, 0).position,
        spawnSurface
      );
    }

    setFurniture((currentFurniture) => [...currentFurniture, nextPlacement]);
    setSelectedFurnitureId(nextPlacement.id);
    setIsDraggingFurniture(false);
    setIsTransformingFurniture(false);
    furnitureEditStartRef.current[nextPlacement.id] = null;
  }, [furniture, playerWorldPosition, spawnRequest, targetPosition]);

  function getPreferredWallSurface(): FurniturePlacementSurface {
    const leftWallDistance = Math.abs(targetPosition[0] - LEFT_WALL_SURFACE_X);
    const backWallDistance = Math.abs(targetPosition[2] - BACK_WALL_SURFACE_Z);

    return leftWallDistance < backWallDistance ? "wall_left" : "wall_back";
  }

  function resolveFloorPlacement(
    x: number,
    z: number,
    furnitureType: FurnitureType
  ): PlacementTransform {
    const definition = getFurnitureDefinition(furnitureType);
    const halfWidth = definition.footprintWidth / 2;
    const halfDepth = definition.footprintDepth / 2;
    const nextX = gridSnapEnabled ? snapToBlockCenter(x) : x;
    const nextZ = gridSnapEnabled ? snapToBlockCenter(z) : z;

    return {
      position: [
        clampFurnitureToFloor(nextX, halfWidth),
        0,
        clampFurnitureToFloor(nextZ, halfDepth)
      ],
      rotationY: getSurfaceRotationY(furnitureType, "floor"),
      surface: "floor"
    };
  }

  function resolveWallPlacement(
    surface: "wall_back" | "wall_left",
    horizontal: number,
    vertical: number,
    furnitureType: FurnitureType
  ): PlacementTransform {
    const definition = getFurnitureDefinition(furnitureType);
    const halfWidth = definition.footprintWidth / 2;
    const halfHeight = definition.footprintDepth / 2;
    const nextHorizontal = gridSnapEnabled ? snapToBlockCenter(horizontal) : horizontal;
    const nextVertical = gridSnapEnabled ? snapToBlockCenter(vertical) : vertical;

    if (surface === "wall_back") {
      return {
        position: [
          clampWallAxis(nextHorizontal, halfWidth),
          clampWallHeight(nextVertical, halfHeight),
          BACK_WALL_SURFACE_Z
        ],
        rotationY: getSurfaceRotationY(furnitureType, surface),
        surface
      };
    }

    return {
      position: [
        LEFT_WALL_SURFACE_X,
        clampWallHeight(nextVertical, halfHeight),
        clampWallAxis(nextHorizontal, halfWidth)
      ],
      rotationY: getSurfaceRotationY(furnitureType, surface),
      surface
    };
  }

  function resolveSpawnPosition(
    furnitureType: FurnitureType,
    surface: FurniturePlacementSurface,
    offsetA: number,
    offsetB: number
  ): PlacementTransform {
    if (surface === "floor") {
      return resolveFloorPlacement(targetPosition[0] + offsetA, targetPosition[2] + offsetB, furnitureType);
    }

    if (surface === "wall_back") {
      return resolveWallPlacement(
        "wall_back",
        targetPosition[0] + offsetA,
        1.85 + offsetB * 0.35,
        furnitureType
      );
    }

    return resolveWallPlacement(
      "wall_left",
      targetPosition[2] + offsetA,
      1.85 + offsetB * 0.35,
      furnitureType
    );
  }

  function resolveFurnitureRotation(angle: number): number {
    const step = gridSnapEnabled ? Math.PI / 2 : Math.PI / 180;
    const snappedAngle = Math.round(angle / step) * step;

    return Math.atan2(Math.sin(snappedAngle), Math.cos(snappedAngle));
  }

  function updateFurnitureItem(
    furnitureId: string,
    updater: (item: RoomFurniturePlacement) => RoomFurniturePlacement
  ) {
    setFurniture((currentFurniture) => updateFurniturePlacement(currentFurniture, furnitureId, updater));
  }

  function hasDraftChanges(furnitureId: string | null): boolean {
    if (!furnitureId) {
      return false;
    }

    const editStart = furnitureEditStartRef.current[furnitureId];
    const currentPlacement = findFurniturePlacement(furniture, furnitureId);

    if (!currentPlacement) {
      return false;
    }

    if (editStart === null) {
      return true;
    }

    if (!editStart) {
      return false;
    }

    return !placementsMatch(editStart, currentPlacement);
  }

  function revertFurnitureItemToCommitted(furnitureId: string) {
    const committedItem = committedFurniture.find((item) => item.id === furnitureId);

    if (!committedItem) {
      setFurniture((currentFurniture) => removeFurniturePlacement(currentFurniture, furnitureId));
      return;
    }

    updateFurnitureItem(furnitureId, () => cloneFurniturePlacement(committedItem));
  }

  function selectFurnitureForEditing(furnitureId: string) {
    const baseItem =
      committedFurniture.find((item) => item.id === furnitureId) ??
      furniture.find((item) => item.id === furnitureId);

    if (!baseItem) {
      return;
    }

    if (!(furnitureId in furnitureEditStartRef.current)) {
      const committedItem = committedFurniture.find((item) => item.id === furnitureId);
      furnitureEditStartRef.current[furnitureId] = committedItem
        ? cloneFurniturePlacement(committedItem)
        : null;
    }

    setSelectedFurnitureId(furnitureId);
  }

  function resolveFloorRayPlacement(
    ray: Ray,
    furnitureType: FurnitureType
  ): PlacementTransform | null {
    const hitPoint = ray.intersectPlane(floorPlane, floorHitPoint);

    if (!hitPoint) {
      return null;
    }

    return resolveFloorPlacement(hitPoint.x, hitPoint.z, furnitureType);
  }

  function resolveWallRayPlacement(
    ray: Ray,
    furnitureType: FurnitureType
  ): PlacementTransform | null {
    const backHit = ray.intersectPlane(backWallPlane, backWallHitPoint.clone());
    const leftHit = ray.intersectPlane(leftWallPlane, leftWallHitPoint.clone());
    const candidates: Array<PlacementTransform & { distance: number }> = [];

    if (backHit) {
      candidates.push({
        ...resolveWallPlacement("wall_back", backHit.x, backHit.y, furnitureType),
        distance: backHit.distanceTo(ray.origin)
      });
    }

    if (leftHit) {
      candidates.push({
        ...resolveWallPlacement("wall_left", leftHit.z, leftHit.y, furnitureType),
        distance: leftHit.distanceTo(ray.origin)
      });
    }

    if (candidates.length === 0) {
      return null;
    }

    candidates.sort((first, second) => first.distance - second.distance);

    return candidates[0];
  }

  function resolvePointerPlacement(
    ray: Ray,
    furnitureType: FurnitureType
  ): PlacementTransform | null {
    const definition = getFurnitureDefinition(furnitureType);

    if (definition.surface === "wall") {
      return resolveWallRayPlacement(ray, furnitureType);
    }

    return resolveFloorRayPlacement(ray, furnitureType);
  }

  function handleBuildSurfaceClick(event: ThreeEvent<MouseEvent>) {
    if (!buildModeEnabled) {
      return false;
    }

    event.stopPropagation();

    if (cameraEditEnabled || isTransformingFurniture || isDraggingFurniture) {
      return true;
    }

    if (selectedFurnitureId && !hasDraftChanges(selectedFurnitureId)) {
      setSelectedFurnitureId(null);
    }

    return true;
  }

  function handleFloorClick(event: ThreeEvent<MouseEvent>) {
    if (handleBuildSurfaceClick(event)) {
      return;
    }

    if (cameraEditEnabled || isTransformingFurniture) {
      return;
    }

    event.stopPropagation();
    setTargetPosition([clampToFloor(event.point.x), 0, clampToFloor(event.point.z)]);
  }

  function handleWallClick(event: ThreeEvent<MouseEvent>) {
    handleBuildSurfaceClick(event);
  }

  function handleFurniturePointerDown(
    furnitureId: string,
    event: ThreeEvent<PointerEvent>
  ) {
    if (!buildModeEnabled || cameraEditEnabled) {
      return;
    }

    event.stopPropagation();
    selectFurnitureForEditing(furnitureId);
    setIsDraggingFurniture(true);
  }

  function handleFurniturePointerMove(event: ThreeEvent<PointerEvent>) {
    if (
      !buildModeEnabled ||
      cameraEditEnabled ||
      isTransformingFurniture ||
      !isDraggingFurniture ||
      !selectedFurnitureId ||
      !selectedFurniture
    ) {
      return;
    }

    const nextPlacement = resolvePointerPlacement(event.ray, selectedFurniture.type);

    if (!nextPlacement) {
      return;
    }

    event.stopPropagation();
    updateFurnitureItem(selectedFurnitureId, (item) => ({
      ...item,
      ...nextPlacement
    }));
  }

  function handleFurniturePointerUp() {
    setIsDraggingFurniture(false);
  }

  function handlePivotDrag(localMatrix: Matrix4) {
    if (!selectedFurnitureId || !selectedFurniture) {
      return;
    }

    localMatrix.decompose(transformDragPosition, transformDragQuaternion, transformDragScale);
    transformDragEuler.setFromQuaternion(transformDragQuaternion);

    if (selectedFurniture.surface === "wall_back") {
      const nextPlacement = resolveWallPlacement(
        "wall_back",
        transformDragPosition.x,
        transformDragPosition.y,
        selectedFurniture.type
      );

      updateFurnitureItem(selectedFurnitureId, (item) => ({
        ...item,
        ...nextPlacement
      }));
      return;
    }

    if (selectedFurniture.surface === "wall_left") {
      const nextPlacement = resolveWallPlacement(
        "wall_left",
        transformDragPosition.z,
        transformDragPosition.y,
        selectedFurniture.type
      );

      updateFurnitureItem(selectedFurnitureId, (item) => ({
        ...item,
        ...nextPlacement
      }));
      return;
    }

    const nextPlacement = resolveFloorPlacement(
      transformDragPosition.x,
      transformDragPosition.z,
      selectedFurniture.type
    );
    const nextRotation = resolveFurnitureRotation(transformDragEuler.y);

    updateFurnitureItem(selectedFurnitureId, (item) => ({
      ...item,
      ...nextPlacement,
      rotationY: nextRotation
    }));
  }

  function handleSurfacePointerMove(event: ThreeEvent<PointerEvent>) {
    if (
      !buildModeEnabled ||
      cameraEditEnabled ||
      isTransformingFurniture ||
      !isDraggingFurniture ||
      !selectedFurnitureId ||
      !selectedFurniture
    ) {
      return;
    }

    const nextPlacement = resolvePointerPlacement(event.ray, selectedFurniture.type);

    if (!nextPlacement) {
      return;
    }

    event.stopPropagation();
    updateFurnitureItem(selectedFurnitureId, (item) => ({
      ...item,
      ...nextPlacement
    }));
  }

  function handleSurfacePointerUp() {
    setIsDraggingFurniture(false);
  }

  function handleCancelFurniturePlacement() {
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

  function handleDeleteFurniturePlacement() {
    if (!selectedFurnitureId) {
      return;
    }

    setFurniture((currentFurniture) => removeFurniturePlacement(currentFurniture, selectedFurnitureId));
    setCommittedFurniture((currentFurniture) =>
      removeFurniturePlacement(currentFurniture, selectedFurnitureId)
    );
    delete furnitureEditStartRef.current[selectedFurnitureId];
    setSelectedFurnitureId(null);
    setIsDraggingFurniture(false);
    setIsTransformingFurniture(false);
  }

  function handleConfirmFurniturePlacement() {
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

  function renderFurnitureModel(item: RoomFurniturePlacement, selected: boolean) {
    const definition = getFurnitureDefinition(item.type);
    const commonProps = {
      position: [0, 0, 0] as [number, number, number],
      rotationY: 0,
      shadowsEnabled,
      selected,
      blocked: selected && isPlacementBlocked
    };

    switch (definition.modelKey) {
      case "bed":
        return <BedModel {...commonProps} />;
      case "desk":
        return <DeskModel {...commonProps} />;
      case "chair":
        return <ChairModel {...commonProps} />;
      case "small_table":
        return <SmallTableModel {...commonProps} />;
      case "poster":
        return <PosterModel {...commonProps} />;
      case "wall_frame":
        return <WallFrameModel {...commonProps} />;
      case "rug":
        return <RugModel {...commonProps} />;
      default:
        return null;
    }
  }

  return (
    <div className="canvas-wrap">
      <Canvas shadows dpr={[1, 1.6]}>
        <color attach="background" args={[isDay ? "#dfeaf6" : "#05070d"]} />
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          position={initialCameraPositionRef.current}
          fov={26}
          onUpdate={(camera) => camera.lookAt(0, 0.9, 0)}
        />
        <OrbitControls
          ref={orbitControlsRef}
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
        <RoomShell
          isDay={isDay}
          shadowsEnabled={shadowsEnabled}
          onWallClick={handleWallClick}
          onWallPointerMove={handleSurfacePointerMove}
          onWallPointerUp={handleSurfacePointerUp}
        />
        <FloorStage
          targetPosition={targetPosition}
          onFloorClick={handleFloorClick}
          onFloorPointerMove={handleSurfacePointerMove}
          onFloorPointerUp={handleSurfacePointerUp}
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
            offset={getGizmoOffset(selectedSurface)}
            activeAxes={getActiveAxes(selectedSurface)}
            disableRotations={selectedSurface !== "floor"}
            disableScaling
            rotationLimits={[[0, 0], undefined, [0, 0]]}
            lineWidth={GIZMO_LINE_WIDTH}
            depthTest={false}
            fixed={true}
            scale={selectedSurface === "floor" ? FLOOR_GIZMO_SCREEN_SIZE : WALL_GIZMO_SCREEN_SIZE}
            onDragStart={() => {
              setIsDraggingFurniture(false);
              setIsTransformingFurniture(true);
            }}
            onDrag={handlePivotDrag}
            onDragEnd={() => setIsTransformingFurniture(false)}
          >
            <group
              onPointerDown={(event) => handleFurniturePointerDown(selectedFurniture.id, event)}
              onPointerMove={handleFurniturePointerMove}
              onPointerUp={handleFurniturePointerUp}
            >
              <PlacementActions
                position={getActionsOffset(selectedSurface)}
                onCancel={handleCancelFurniturePlacement}
                onDelete={handleDeleteFurniturePlacement}
                onConfirm={handleConfirmFurniturePlacement}
                confirmDisabled={isPlacementBlocked}
              />
              {renderFurnitureModel(selectedFurniture, true)}
            </group>
          </PivotControls>
        ) : selectedFurniture ? (
          <group
            position={selectedFurniture.position}
            rotation={[0, selectedFurniture.rotationY, 0]}
            onPointerDown={(event) => handleFurniturePointerDown(selectedFurniture.id, event)}
            onPointerMove={handleFurniturePointerMove}
            onPointerUp={handleFurniturePointerUp}
          >
            {renderFurnitureModel(selectedFurniture, false)}
          </group>
        ) : null}
        <CameraTracker onCameraPositionChange={onCameraPositionChange} />
      </Canvas>
    </div>
  );
}
