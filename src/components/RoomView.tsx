import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, PerspectiveCamera, PivotControls } from "@react-three/drei";
import {
  Bloom,
  EffectComposer,
  Vignette,
  N8AO,
  HueSaturation,
  BrightnessContrast,
  ToneMapping
} from "@react-three/postprocessing";
import { type WheelEvent as ReactWheelEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ACESFilmicToneMapping,
  CanvasTexture,
  Euler,
  Matrix4,
  MOUSE,
  NearestFilter,
  NoToneMapping,
  Plane,
  PerspectiveCamera as ThreePerspectiveCamera,
  Quaternion,
  Ray,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3
} from "three";
import { ToneMappingMode } from "postprocessing";
import { ChairModel } from "./ChairModel";
import { FridgeModel } from "./FridgeModel";
import { MinecraftPlayer } from "./MinecraftPlayer";
import { OfficeChairModel, OfficeDeskModel, OfficeWardrobeModel } from "./OfficePackModels";
import { PosterModel } from "./PosterModel";
import { SmallTableModel } from "./SmallTableModel";
import { BookStackModel, VaseModel } from "./SurfaceDecorModels";
import { WallWindowModel } from "./WallWindowModel";
import {
  BedModel,
  DeskModel,
  RugModel,
  WallFrameModel
} from "./StarterFurnitureModels";
import { FloorLampModel } from "./FloorLampModel";
import {
  getFurnitureCollisionReason,
  type CollisionReason
} from "../lib/furnitureCollision";
import {
  getFurnitureInteractionTarget,
  type FurnitureInteractionTarget
} from "../lib/furnitureInteractions";
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
import {
  canHostSurfaceDecor,
  clampSurfaceOffsetToHost,
  findBestSurfaceHostForWorldPoint,
  findBestSurfaceHostFromRay,
  getSurfaceHosts,
  getSurfaceWorldPosition,
  syncAnchoredSurfaceDecor,
  type SurfaceLocalOffset
} from "../lib/surfaceDecor";
import { createWallOpeningLayout } from "../lib/wallOpenings";
import {
  clamp01,
  getWorldLightingState,
  mixColor,
  mixNumber
} from "../lib/worldLighting";

const TILE_SIZE = 1;
const GRID_SIZE = 10;
const HALF_FLOOR_SIZE = (GRID_SIZE * TILE_SIZE) / 2;
const BACK_WALL_SURFACE_Z = -HALF_FLOOR_SIZE + 0.17;
const LEFT_WALL_SURFACE_X = -HALF_FLOOR_SIZE + 0.17;
const WALL_CENTER_COORD = -HALF_FLOOR_SIZE - 0.06;
const WALL_THICKNESS = 0.22;
const WALL_HEIGHT = 4.4;
const WALL_BOTTOM_Y = 0;
const WALL_TOP_Y = WALL_HEIGHT;
const BASEBOARD_COORD = -HALF_FLOOR_SIZE + 0.07;
const TRIM_COORD = -HALF_FLOOR_SIZE + 0.08;
const WALL_SPAN = GRID_SIZE + 0.2;
const WALL_AXIS_MIN = -WALL_SPAN / 2;
const WALL_AXIS_MAX = WALL_SPAN / 2;
const BASEBOARD_SPAN = GRID_SIZE - 0.3;
const WALL_MIN_Y = 1;
const WALL_MAX_Y = 2.7;
const WALL_RAIL_Y = 1.58;
const WALL_TOP_TRIM_Y = 3.55;
const MIN_CAMERA_DISTANCE = 5;
const MAX_CAMERA_DISTANCE = 48;
const SMOOTH_ZOOM_RESPONSE = 14;
const SMOOTH_ZOOM_SENSITIVITY = 0.0015;
const TOUCH_MAX_DPR = 1;
const DESKTOP_MAX_DPR = 1.5;
const TOUCH_COMPOSER_MULTISAMPLING = 0;
const DESKTOP_COMPOSER_MULTISAMPLING = 4;
const TOUCH_SUN_SHADOW_MAP_SIZE = 1024;
const DESKTOP_SUN_SHADOW_MAP_SIZE = 1536;
const TOUCH_MOON_SHADOW_MAP_SIZE = 0;
const DESKTOP_MOON_SHADOW_MAP_SIZE = 512;
const FLOOR_GIZMO_SCREEN_SIZE = 108;
const WALL_GIZMO_SCREEN_SIZE = 94;
const GIZMO_LINE_WIDTH = 4;
const FREE_MOVE_NUDGE_STEP = 0.1;
const DISABLED_MOUSE_BUTTON = -1 as MOUSE;
const floorDragPlane = new Plane(new Vector3(0, 1, 0), 0);
const backWallDragPlane = new Plane().setFromNormalAndCoplanarPoint(
  new Vector3(0, 0, 1),
  new Vector3(0, 0, BACK_WALL_SURFACE_Z)
);
const leftWallDragPlane = new Plane().setFromNormalAndCoplanarPoint(
  new Vector3(1, 0, 0),
  new Vector3(LEFT_WALL_SURFACE_X, 0, 0)
);
const dragPlaneHitPoint = new Vector3();
const transformDragPosition = new Vector3();
const transformDragQuaternion = new Quaternion();
const transformDragScale = new Vector3();
const transformDragEuler = new Euler(0, 0, 0, "YXZ");

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
const surfaceSpawnCandidateOffsets: Array<SurfaceLocalOffset> = [
  [0, 0],
  [0.5, 0],
  [-0.5, 0],
  [0, 0.5],
  [0, -0.5],
  [1, 0],
  [-1, 0],
  [0.5, 0.5],
  [-0.5, 0.5],
  [0.5, -0.5],
  [-0.5, -0.5]
];

type PlacementTransform = Pick<
  RoomFurniturePlacement,
  "position" | "rotationY" | "surface" | "anchorFurnitureId" | "surfaceLocalOffset"
>;
type PointerCaptureTarget = EventTarget & {
  setPointerCapture?: (pointerId: number) => void;
  releasePointerCapture?: (pointerId: number) => void;
};
type DragState = {
  furnitureId: string;
  type: FurnitureType;
  surface: FurniturePlacementSurface;
  rotationY: number;
  anchorFurnitureId?: string;
};
type PlayerInteractionStatus =
  | {
      phase: "approaching" | "active";
      label: string;
    }
  | null;
type RenderMode = "cinematic" | "basic";

function createWoodFloorTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create the wood floor texture.");
  }

  const plankPalette = ["#8b5e3d", "#6f492f", "#7b5135", "#5f3c28", "#9a6945", "#70482e"];
  const plankWidth = 32;

  context.fillStyle = "#5a3826";
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let column = 0; column < canvas.width; column += plankWidth) {
    const plankColor = plankPalette[(column / plankWidth) % plankPalette.length];
    context.fillStyle = plankColor;
    context.fillRect(column, 0, plankWidth, canvas.height);

    context.fillStyle = "rgba(31, 17, 10, 0.28)";
    context.fillRect(column, 0, 2, canvas.height);
    context.fillRect(column + plankWidth - 2, 0, 2, canvas.height);

    for (let row = 0; row < canvas.height; row += 32) {
      context.fillStyle = "rgba(24, 12, 8, 0.16)";
      context.fillRect(column, row, plankWidth, 2);
    }

    for (let grainIndex = 0; grainIndex < 7; grainIndex += 1) {
      const grainX = column + 5 + grainIndex * 4;
      context.fillStyle = grainIndex % 2 === 0 ? "rgba(255, 224, 187, 0.08)" : "rgba(38, 20, 12, 0.11)";
      context.fillRect(grainX, 0, 1, canvas.height);
    }
  }

  context.fillStyle = "rgba(255, 239, 211, 0.06)";
  for (let knotIndex = 0; knotIndex < 10; knotIndex += 1) {
    const knotX = 18 + knotIndex * 22;
    const knotY = 20 + (knotIndex % 5) * 38;
    context.beginPath();
    context.ellipse(knotX, knotY, 6, 3, 0, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new CanvasTexture(canvas);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(2.5, 2.5);

  return texture;
}

function clampToFloor(value: number): number {
  return Math.min(HALF_FLOOR_SIZE - 0.08, Math.max(-HALF_FLOOR_SIZE + 0.08, value));
}

function clampFurnitureToFloor(value: number, halfSize: number): number {
  return Math.min(HALF_FLOOR_SIZE - halfSize, Math.max(-HALF_FLOOR_SIZE + halfSize, value));
}

function getEffectiveHalfSizes(type: FurnitureType, rotationY: number): [number, number] {
  const definition = getFurnitureDefinition(type);
  const halfWidth = definition.footprintWidth / 2;
  const halfDepth = definition.footprintDepth / 2;
  const cos = Math.abs(Math.cos(rotationY));
  const sin = Math.abs(Math.sin(rotationY));

  return [
    cos * halfWidth + sin * halfDepth,
    sin * halfWidth + cos * halfDepth
  ];
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

function rotateLocalOffset(
  offset: [number, number, number],
  rotationY: number
): [number, number, number] {
  const [localX, localY, localZ] = offset;
  const cos = Math.cos(rotationY);
  const sin = Math.sin(rotationY);

  return [
    localX * cos + localZ * sin,
    localY,
    localZ * cos - localX * sin
  ];
}

function getGizmoOffset(item: RoomFurniturePlacement): [number, number, number] {
  const actionOffset = getPlacementActionOffset(item);

  if (item.surface === "wall_back") {
    return [0, Math.max(0.42, actionOffset[1] - 0.72), 0.16];
  }

  if (item.surface === "wall_left") {
    return [0.16, Math.max(0.42, actionOffset[1] - 0.72), 0];
  }

  if (item.surface === "surface") {
    return [0, Math.max(0.42, actionOffset[1] - 0.34), 0];
  }

  return [0, Math.max(0.82, actionOffset[1] - 0.6), 0];
}

function getPlacementActionOffset(item: RoomFurniturePlacement): [number, number, number] {
  switch (item.type) {
    case "bed":
      return [0, 1.5, 0];
    case "desk":
      return [0, 2.02, 0];
    case "chair":
      return [0, 1.92, 0];
    case "table":
      return [0, 1.82, 0];
    case "fridge":
      return [0, 2.28, 0];
    case "wardrobe":
      return [0, 2.5, 0];
    case "office_desk":
      return [0, 1.68, 0];
    case "office_chair":
      return [0, 1.48, 0];
    case "vase":
      return [0, 1.08, 0];
    case "books":
      return [0, 0.86, 0];
    case "rug":
      return [0, 0.82, 0];
    case "poster":
      return [0, 1.28, 0.14];
    case "wall_frame":
      return [0, 1.18, 0.14];
    default:
      return item.surface === "floor" ? [0, 1.64, 0] : [0, 1.16, 0.14];
  }
}

function getInteractionHitboxSize(
  item: RoomFurniturePlacement
): [number, number, number] {
  const definition = getFurnitureDefinition(item.type);

  switch (item.type) {
    case "desk":
      return [definition.footprintWidth + 0.4, 1.55, definition.footprintDepth + 0.72];
    case "office_desk":
      return [definition.footprintWidth + 0.35, 1.55, definition.footprintDepth + 0.7];
    case "chair":
      return [definition.footprintWidth + 0.52, 1.85, definition.footprintDepth + 0.42];
    case "office_chair":
      return [definition.footprintWidth + 0.52, 1.85, definition.footprintDepth + 0.42];
    case "bed":
      return [definition.footprintWidth + 0.38, 1.2, definition.footprintDepth + 0.3];
    default:
      return [definition.footprintWidth + 0.3, 1.35, definition.footprintDepth + 0.3];
  }
}

function getSurfaceDecorSelectionHitboxSize(
  item: RoomFurniturePlacement
): [number, number, number] {
  const definition = getFurnitureDefinition(item.type);

  return [
    Math.max(0.56, definition.footprintWidth + 0.18),
    0.88,
    Math.max(0.56, definition.footprintDepth + 0.18)
  ];
}

function hasFixedWallVerticalPlacement(type: FurnitureType): boolean {
  return getFurnitureDefinition(type).wallOpening?.fixedVertical === true;
}

function getActiveAxes(item: RoomFurniturePlacement | null): [boolean, boolean, boolean] {
  if (!item) {
    return [true, false, true];
  }

  if (item.surface === "wall_back") {
    if (hasFixedWallVerticalPlacement(item.type)) {
      return [true, false, false];
    }

    return [true, true, false];
  }

  if (item.surface === "wall_left") {
    if (hasFixedWallVerticalPlacement(item.type)) {
      return [false, false, true];
    }

    return [false, true, true];
  }

  return [true, false, true];
}

function placementsMatch(
  first: RoomFurniturePlacement,
  second: RoomFurniturePlacement
): boolean {
  return (
    first.id === second.id &&
    first.type === second.type &&
    first.surface === second.surface &&
    first.ownedFurnitureId === second.ownedFurnitureId &&
    first.anchorFurnitureId === second.anchorFurnitureId &&
    Math.abs(first.position[0] - second.position[0]) < 0.0001 &&
    Math.abs(first.position[1] - second.position[1]) < 0.0001 &&
    Math.abs(first.position[2] - second.position[2]) < 0.0001 &&
    Math.abs((first.surfaceLocalOffset?.[0] ?? 0) - (second.surfaceLocalOffset?.[0] ?? 0)) <
      0.0001 &&
    Math.abs((first.surfaceLocalOffset?.[1] ?? 0) - (second.surfaceLocalOffset?.[1] ?? 0)) <
      0.0001 &&
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
  onFloorMoveCommand: (event: ThreeEvent<MouseEvent>) => void;
  onFloorPointerMove: (event: ThreeEvent<PointerEvent>) => void;
  onFloorPointerUp: () => void;
  surfaceLightAmount: number;
  checkerEnabled: boolean;
  floorPrimaryColor: string;
  floorSecondaryColor: string;
  shadowsEnabled: boolean;
}

function FloorStage({
  targetPosition,
  onFloorMoveCommand,
  onFloorPointerMove,
  onFloorPointerUp,
  surfaceLightAmount,
  checkerEnabled,
  floorPrimaryColor,
  floorSecondaryColor,
  shadowsEnabled
}: FloorStageProps) {
  const woodTexture = useMemo(() => createWoodFloorTexture(), []);
  const platformColor = mixColor("#1f1714", "#34261f", surfaceLightAmount);
  const floorEdgeColor = mixColor("#825f42", "#d6a56d", surfaceLightAmount);
  const floorLipColor = mixColor("#33241a", "#7a4a2d", surfaceLightAmount);
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
          >
            <boxGeometry args={[TILE_SIZE, 1, TILE_SIZE]} />
            <meshStandardMaterial color={color} roughness={0.94} />
          </mesh>
        );
      }
    }

    return nextTiles;
  }, [
    checkerEnabled,
    floorPrimaryColor,
    floorSecondaryColor,
    shadowsEnabled
  ]);

  return (
    <group>
      <mesh position={[0, -0.68, 0]} receiveShadow={shadowsEnabled}>
        <boxGeometry args={[GRID_SIZE + 0.62, 0.24, GRID_SIZE + 0.62]} />
        <meshStandardMaterial color={platformColor} roughness={0.98} />
      </mesh>
      {!checkerEnabled ? (
        <mesh position={[0, -0.5, 0]} receiveShadow={shadowsEnabled} castShadow={shadowsEnabled}>
          <boxGeometry args={[GRID_SIZE, 1, GRID_SIZE]} />
          <meshStandardMaterial
            color={mixColor("#70472f", "#8f5f3f", surfaceLightAmount)}
            map={woodTexture}
            roughness={mixNumber(0.88, 0.72, surfaceLightAmount)}
            metalness={0.03}
          />
        </mesh>
      ) : (
        <group>{tiles}</group>
      )}
      <mesh position={[0, 0.03, -HALF_FLOOR_SIZE + 0.06]} raycast={() => null}>
        <boxGeometry args={[GRID_SIZE + 0.14, 0.06, 0.12]} />
        <meshStandardMaterial color={floorEdgeColor} roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.03, HALF_FLOOR_SIZE - 0.06]} raycast={() => null}>
        <boxGeometry args={[GRID_SIZE + 0.14, 0.06, 0.12]} />
        <meshStandardMaterial color={floorLipColor} roughness={0.86} />
      </mesh>
      <mesh position={[-HALF_FLOOR_SIZE + 0.06, 0.03, 0]} raycast={() => null}>
        <boxGeometry args={[0.12, 0.06, GRID_SIZE + 0.14]} />
        <meshStandardMaterial color={floorEdgeColor} roughness={0.82} />
      </mesh>
      <mesh position={[HALF_FLOOR_SIZE - 0.06, 0.03, 0]} raycast={() => null}>
        <boxGeometry args={[0.12, 0.06, GRID_SIZE + 0.14]} />
        <meshStandardMaterial color={floorLipColor} roughness={0.86} />
      </mesh>
      <mesh
        position={[0, 0.015, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onContextMenu={onFloorMoveCommand}
        onPointerMove={onFloorPointerMove}
        onPointerUp={onFloorPointerUp}
      >
        <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[targetPosition[0], 0.02, targetPosition[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.14, 0.22, 32]} />
        <meshBasicMaterial color="#5abed0" transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

function WallInteractionPlane({
  surface,
  onWallClick,
  onWallPointerMove,
  onWallPointerUp
}: {
  surface: "wall_back" | "wall_left";
  onWallClick: (event: ThreeEvent<MouseEvent>) => void;
  onWallPointerMove: (event: ThreeEvent<PointerEvent>) => void;
  onWallPointerUp: () => void;
}) {
  const isLeftWall = surface === "wall_left";

  return (
    <mesh
      position={
        isLeftWall
          ? [LEFT_WALL_SURFACE_X, WALL_HEIGHT / 2, 0]
          : [0, WALL_HEIGHT / 2, BACK_WALL_SURFACE_Z]
      }
      onClick={onWallClick}
      onPointerMove={onWallPointerMove}
      onPointerUp={onWallPointerUp}
      renderOrder={-1}
    >
      <boxGeometry args={isLeftWall ? [0.02, WALL_HEIGHT, WALL_SPAN] : [WALL_SPAN, WALL_HEIGHT, 0.02]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

function WallBand({
  surface,
  center,
  centerY,
  span,
  height,
  color,
  shadowsEnabled
}: {
  surface: "wall_back" | "wall_left";
  center: number;
  centerY: number;
  span: number;
  height: number;
  color: string;
  shadowsEnabled: boolean;
}) {
  if (span <= 0.0001 || height <= 0.0001) {
    return null;
  }

  const isLeftWall = surface === "wall_left";

  return (
    <mesh
      position={
        isLeftWall
          ? [WALL_CENTER_COORD, centerY, center]
          : [center, centerY, WALL_CENTER_COORD]
      }
      castShadow={shadowsEnabled}
      receiveShadow={shadowsEnabled}
      raycast={() => null}
    >
      <boxGeometry args={isLeftWall ? [WALL_THICKNESS, height, span] : [span, height, WALL_THICKNESS]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  );
}

function WallRail({
  surface,
  center,
  span,
  color,
  shadowsEnabled
}: {
  surface: "wall_back" | "wall_left";
  center: number;
  span: number;
  color: string;
  shadowsEnabled: boolean;
}) {
  if (span <= 0.0001) {
    return null;
  }

  const isLeftWall = surface === "wall_left";

  return (
    <mesh
      position={
        isLeftWall
          ? [BASEBOARD_COORD + 0.04, WALL_RAIL_Y, center]
          : [center, WALL_RAIL_Y, BASEBOARD_COORD + 0.04]
      }
      receiveShadow={shadowsEnabled}
      raycast={() => null}
    >
      <boxGeometry args={isLeftWall ? [0.04, 0.08, span] : [span, 0.08, 0.04]} />
      <meshStandardMaterial color={color} roughness={0.84} />
    </mesh>
  );
}

function CubeLamp({
  position,
  nightFactor
}: {
  position: [number, number, number];
  nightFactor: number;
}) {
  const glowColor = mixColor("#ffd79f", "#ffd394", nightFactor);
  const bulbColor = mixColor("#fff5e3", "#ffe7bc", nightFactor);

  return (
    <group position={position}>
      <mesh raycast={() => null}>
        <boxGeometry args={[0.32, 0.32, 0.32]} />
        <meshStandardMaterial
          color={bulbColor}
          emissive={glowColor}
          emissiveIntensity={mixNumber(0.08, 2.35, nightFactor)}
          roughness={0.18}
          metalness={0.02}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        position={[0, 0, 0]}
        color="#FF9944"
        intensity={mixNumber(0.05, 0.8, nightFactor)}
        distance={5}
        decay={2}
        castShadow={false}
        shadow-mapSize={[512, 512]}
        shadow-radius={6}
      />
    </group>
  );
}

function RoomShell({
  surfaceLightAmount,
  furniture,
  shadowsEnabled,
  nightFactor,
  onWallClick,
  onWallPointerMove,
  onWallPointerUp
}: {
  surfaceLightAmount: number;
  furniture: RoomFurniturePlacement[];
  shadowsEnabled: boolean;
  nightFactor: number;
  onWallClick: (event: ThreeEvent<MouseEvent>) => void;
  onWallPointerMove: (event: ThreeEvent<PointerEvent>) => void;
  onWallPointerUp: () => void;
}) {
  const wallColor = mixColor("#28201c", "#eee6db", surfaceLightAmount);
  const baseboardColor = mixColor("#775b46", "#8b6345", surfaceLightAmount);
  const trimColor = mixColor("#725a48", "#f5eee3", surfaceLightAmount);
  const wallRailColor = mixColor("#856652", "#a17856", surfaceLightAmount);
  const cornerTrimColor = mixColor("#6d5443", "#e8dfd2", surfaceLightAmount);
  const windowPlacements = useMemo(
    () =>
      furniture.filter(
        (item) =>
          item.type === "window" &&
          (item.surface === "wall_back" || item.surface === "wall_left")
      ),
    [furniture]
  );
  const backWallLayout = useMemo(
    () =>
      createWallOpeningLayout(
        windowPlacements
          .filter((item) => item.surface === "wall_back")
          .map((item) => {
            const definition = getFurnitureDefinition(item.type);
            return {
              center: item.position[0],
              width: definition.wallOpening?.width ?? definition.footprintWidth,
              centerY: definition.wallOpening?.centerY ?? item.position[1],
              height: definition.wallOpening?.height ?? definition.footprintDepth
            };
          }),
        {
          wallMin: WALL_AXIS_MIN,
          wallMax: WALL_AXIS_MAX,
          wallBottomY: WALL_BOTTOM_Y,
          wallTopY: WALL_TOP_Y,
          railY: WALL_RAIL_Y
        }
      ),
    [windowPlacements]
  );
  const leftWallLayout = useMemo(
    () =>
      createWallOpeningLayout(
        windowPlacements
          .filter((item) => item.surface === "wall_left")
          .map((item) => {
            const definition = getFurnitureDefinition(item.type);
            return {
              center: item.position[2],
              width: definition.wallOpening?.width ?? definition.footprintWidth,
              centerY: definition.wallOpening?.centerY ?? item.position[1],
              height: definition.wallOpening?.height ?? definition.footprintDepth
            };
          }),
        {
          wallMin: WALL_AXIS_MIN,
          wallMax: WALL_AXIS_MAX,
          wallBottomY: WALL_BOTTOM_Y,
          wallTopY: WALL_TOP_Y,
          railY: WALL_RAIL_Y
        }
      ),
    [windowPlacements]
  );

  return (
    <group>
      <WallInteractionPlane
        surface="wall_left"
        onWallClick={onWallClick}
        onWallPointerMove={onWallPointerMove}
        onWallPointerUp={onWallPointerUp}
      />
      <WallInteractionPlane
        surface="wall_back"
        onWallClick={onWallClick}
        onWallPointerMove={onWallPointerMove}
        onWallPointerUp={onWallPointerUp}
      />

      <WallBand
        surface="wall_left"
        center={0}
        centerY={leftWallLayout.lowerBandCenterY ?? WALL_HEIGHT / 2}
        span={WALL_SPAN}
        height={leftWallLayout.lowerBandHeight}
        color={wallColor}
        shadowsEnabled={shadowsEnabled}
      />
      {leftWallLayout.middleSegments.map((segment) => (
        <WallBand
          key={`left-middle-${segment.center}-${segment.span}`}
          surface="wall_left"
          center={segment.center}
          centerY={leftWallLayout.openingBandCenterY ?? 0}
          span={segment.span}
          height={leftWallLayout.openingBandHeight}
          color={wallColor}
          shadowsEnabled={shadowsEnabled}
        />
      ))}
      <WallBand
        surface="wall_left"
        center={0}
        centerY={leftWallLayout.upperBandCenterY ?? WALL_HEIGHT / 2}
        span={WALL_SPAN}
        height={leftWallLayout.upperBandHeight}
        color={wallColor}
        shadowsEnabled={shadowsEnabled}
      />

      <WallBand
        surface="wall_back"
        center={0}
        centerY={backWallLayout.lowerBandCenterY ?? WALL_HEIGHT / 2}
        span={WALL_SPAN}
        height={backWallLayout.lowerBandHeight}
        color={wallColor}
        shadowsEnabled={shadowsEnabled}
      />
      {backWallLayout.middleSegments.map((segment) => (
        <WallBand
          key={`back-middle-${segment.center}-${segment.span}`}
          surface="wall_back"
          center={segment.center}
          centerY={backWallLayout.openingBandCenterY ?? 0}
          span={segment.span}
          height={backWallLayout.openingBandHeight}
          color={wallColor}
          shadowsEnabled={shadowsEnabled}
        />
      ))}
      <WallBand
        surface="wall_back"
        center={0}
        centerY={backWallLayout.upperBandCenterY ?? WALL_HEIGHT / 2}
        span={WALL_SPAN}
        height={backWallLayout.upperBandHeight}
        color={wallColor}
        shadowsEnabled={shadowsEnabled}
      />

      <mesh position={[WALL_CENTER_COORD + 0.11, WALL_HEIGHT / 2, WALL_CENTER_COORD + 0.11]} raycast={() => null}>
        <boxGeometry args={[0.12, WALL_HEIGHT, 0.12]} />
        <meshStandardMaterial color={cornerTrimColor} roughness={0.88} />
      </mesh>

      <mesh position={[BASEBOARD_COORD, 0.12, 0]} receiveShadow={shadowsEnabled} raycast={() => null}>
        <boxGeometry args={[0.12, 0.24, BASEBOARD_SPAN]} />
        <meshStandardMaterial color={baseboardColor} roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.12, BASEBOARD_COORD]} receiveShadow={shadowsEnabled} raycast={() => null}>
        <boxGeometry args={[BASEBOARD_SPAN, 0.24, 0.12]} />
        <meshStandardMaterial color={baseboardColor} roughness={0.86} />
      </mesh>

      <mesh position={[TRIM_COORD, WALL_TOP_TRIM_Y, 0]} receiveShadow={shadowsEnabled} raycast={() => null}>
        <boxGeometry args={[0.08, 0.18, BASEBOARD_SPAN]} />
        <meshStandardMaterial color={trimColor} roughness={0.88} />
      </mesh>
      <mesh position={[0, WALL_TOP_TRIM_Y, TRIM_COORD]} receiveShadow={shadowsEnabled} raycast={() => null}>
        <boxGeometry args={[BASEBOARD_SPAN, 0.18, 0.08]} />
        <meshStandardMaterial color={trimColor} roughness={0.88} />
      </mesh>

      {leftWallLayout.railSegments.map((segment) => (
        <WallRail
          key={`left-rail-${segment.center}-${segment.span}`}
          surface="wall_left"
          center={segment.center}
          span={segment.span}
          color={wallRailColor}
          shadowsEnabled={shadowsEnabled}
        />
      ))}
      {backWallLayout.railSegments.map((segment) => (
        <WallRail
          key={`back-rail-${segment.center}-${segment.span}`}
          surface="wall_back"
          center={segment.center}
          span={segment.span}
          color={wallRailColor}
          shadowsEnabled={shadowsEnabled}
        />
      ))}

      <CubeLamp position={[WALL_CENTER_COORD + 0.2, 2.42, -1.85]} nightFactor={nightFactor} />
      <CubeLamp position={[-1.55, 2.54, WALL_CENTER_COORD + 0.2]} nightFactor={nightFactor} />
      <CubeLamp position={[2.55, 2.54, WALL_CENTER_COORD + 0.2]} nightFactor={nightFactor} />
    </group>
  );
}

interface RoomViewProps {
  buildModeEnabled: boolean;
  gridSnapEnabled: boolean;
  spawnRequest: {
    requestId: number;
    type: FurnitureType;
    ownedFurnitureId: string;
  } | null;
  cameraResetToken: number;
  standRequestToken: number;
  initialCameraPosition: Vector3Tuple;
  initialPlayerPosition: Vector3Tuple;
  initialFurniturePlacements: RoomFurniturePlacement[];
  skinSrc: string | null;
  worldTimeMinutes: number;
  renderMode: RenderMode;
  sunEnabled: boolean;
  shadowsEnabled: boolean;
  fogEnabled: boolean;
  fogDensity: number;
  ambientMultiplier: number;
  sunIntensityMultiplier: number;
  brightness: number;
  saturation: number;
  contrast: number;
  onCameraPositionChange: (position: Vector3Tuple) => void;
  onPlayerPositionChange: (position: Vector3Tuple) => void;
  onFurnitureSnapshotChange: (placements: RoomFurniturePlacement[]) => void;
  onCommittedFurnitureChange: (placements: RoomFurniturePlacement[]) => void;
  onInteractionStateChange: (status: PlayerInteractionStatus) => void;
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

function SmoothZoomController({
  cameraRef,
  orbitControlsRef,
  zoomTargetDistanceRef
}: {
  cameraRef: React.MutableRefObject<ThreePerspectiveCamera | null>;
  orbitControlsRef: React.MutableRefObject<any>;
  zoomTargetDistanceRef: React.MutableRefObject<number | null>;
}) {
  const cameraOffset = useMemo(() => new Vector3(), []);

  useFrame((_, delta) => {
    const camera = cameraRef.current;
    const controls = orbitControlsRef.current;
    const targetDistance = zoomTargetDistanceRef.current;

    if (!camera || !controls || targetDistance === null) {
      return;
    }

    cameraOffset.copy(camera.position).sub(controls.target);
    const currentDistance = cameraOffset.length();

    if (currentDistance <= 0.0001) {
      return;
    }

    const smoothingFactor = 1 - Math.exp(-delta * SMOOTH_ZOOM_RESPONSE);
    const nextDistance = currentDistance + (targetDistance - currentDistance) * smoothingFactor;

    if (Math.abs(nextDistance - currentDistance) < 0.0001) {
      return;
    }

    cameraOffset.multiplyScalar(nextDistance / currentDistance);
    camera.position.copy(controls.target).add(cameraOffset);
    controls.update();
  });

  return null;
}

function RendererExposureController({
  exposure,
  useRendererToneMapping
}: {
  exposure: number;
  useRendererToneMapping: boolean;
}) {
  const { gl, invalidate } = useThree();

  useLayoutEffect(() => {
    gl.toneMapping = useRendererToneMapping ? ACESFilmicToneMapping : NoToneMapping;
    gl.toneMappingExposure = exposure;
    invalidate();
  }, [exposure, gl, invalidate, useRendererToneMapping]);

  return null;
}

function PlacementActions({
  position,
  onCancel,
  onStore,
  onConfirm,
  confirmDisabled
}: {
  position: [number, number, number];
  onCancel: () => void;
  onStore: () => void;
  onConfirm: () => void;
  confirmDisabled: boolean;
}) {
  const { camera, size } = useThree();
  const screenPositionRef = useRef({ left: -9999, top: -9999, visible: false });
  const [screenPosition, setScreenPosition] = useState(screenPositionRef.current);
  const projectedPosition = useMemo(() => new Vector3(), []);
  const panelHalfWidth = 108;
  const panelTopMargin = 88;
  const panelSideMargin = 20;
  const horizontalScreenOffset = 116;
  const verticalScreenOffset = 54;

  useFrame(() => {
    projectedPosition.set(position[0], position[1], position[2]);
    projectedPosition.project(camera);

    const baseLeft = (projectedPosition.x * 0.5 + 0.5) * size.width;
    const baseTop = (-projectedPosition.y * 0.5 + 0.5) * size.height - 12;
    const prefersLeftSide = baseLeft > size.width * 0.58;
    const left = Math.min(
      size.width - panelHalfWidth - panelSideMargin,
      Math.max(
        panelHalfWidth + panelSideMargin,
        baseLeft + (prefersLeftSide ? -horizontalScreenOffset : horizontalScreenOffset)
      )
    );
    const top = Math.max(panelTopMargin, baseTop - verticalScreenOffset);

    const nextPosition = {
      left,
      top,
      visible: projectedPosition.z > -1 && projectedPosition.z < 1
    };

    const current = screenPositionRef.current;
    if (
      Math.abs(current.left - nextPosition.left) < 0.5 &&
      Math.abs(current.top - nextPosition.top) < 0.5 &&
      current.visible === nextPosition.visible
    ) {
      return;
    }

    screenPositionRef.current = nextPosition;
    setScreenPosition(nextPosition);
  });

  if (!screenPosition.visible) {
    return null;
  }

  return (
    <Html fullscreen style={{ pointerEvents: "none" }}>
      <div
        className="placement-actions placement-actions--floating"
        style={{
          left: `${screenPosition.left}px`,
          top: `${screenPosition.top}px`
        }}
      >
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
          className="placement-action placement-action--store"
          onClick={(event) => {
            event.stopPropagation();
            onStore();
          }}
          type="button"
        >
          Store
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

function EditDock({
  itemLabel,
  surfaceLabel,
  blocked,
  canRotate,
  canSwapWall,
  canNudgeVertical,
  onNudgeNegativeHorizontal,
  onNudgePositiveHorizontal,
  onNudgeNegativeVertical,
  onNudgePositiveVertical,
  onRotateLeft,
  onRotateRight,
  onSwapWall,
  onDeselect
}: {
  itemLabel: string;
  surfaceLabel: string;
  blocked: boolean;
  canRotate: boolean;
  canSwapWall: boolean;
  canNudgeVertical: boolean;
  onNudgeNegativeHorizontal: () => void;
  onNudgePositiveHorizontal: () => void;
  onNudgeNegativeVertical: () => void;
  onNudgePositiveVertical: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onSwapWall: () => void;
  onDeselect: () => void;
}) {
  return (
    <div className="edit-dock">
      <div className="edit-dock__summary">
        <strong>{itemLabel}</strong>
        <span>{blocked ? "Blocked" : surfaceLabel}</span>
      </div>

      <div className="edit-dock__divider" />

      <div className="edit-dock__actions">
        {canRotate && (
          <>
            <button className="edit-dock__icon-btn" onClick={onRotateLeft} title="Rotate Left" type="button">⟲</button>
            <button className="edit-dock__icon-btn" onClick={onRotateRight} title="Rotate Right" type="button">⟳</button>
            <div className="edit-dock__divider" />
          </>
        )}

        <button className="edit-dock__icon-btn" onClick={onNudgeNegativeHorizontal} title="Move Left" type="button">←</button>
        {canNudgeVertical ? (
          <>
            <button className="edit-dock__icon-btn" onClick={onNudgePositiveVertical} title="Move Up" type="button">↑</button>
            <button className="edit-dock__icon-btn" onClick={onNudgeNegativeVertical} title="Move Down" type="button">↓</button>
          </>
        ) : null}
        <button className="edit-dock__icon-btn" onClick={onNudgePositiveHorizontal} title="Move Right" type="button">→</button>

        {canSwapWall && (
          <>
            <div className="edit-dock__divider" />
            <button className="edit-dock__button" onClick={onSwapWall} type="button">Swap Wall</button>
          </>
        )}

        <div className="edit-dock__divider" />
        <button className="edit-dock__button edit-dock__button--secondary" onClick={onDeselect} type="button">
          Deselect
        </button>
      </div>
    </div>
  );
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
  skinSrc,
  worldTimeMinutes,
  renderMode,
  sunEnabled,
  shadowsEnabled,
  fogEnabled,
  fogDensity,
  ambientMultiplier,
  sunIntensityMultiplier,
  brightness,
  saturation,
  contrast,
  onCameraPositionChange,
  onPlayerPositionChange,
  onFurnitureSnapshotChange,
  onCommittedFurnitureChange,
  onInteractionStateChange
}: RoomViewProps) {
  const initialCameraPositionRef = useRef(initialCameraPosition);
  const initialFurnitureRef = useRef(cloneFurniturePlacements(initialFurniturePlacements));
  const cameraRef = useRef<ThreePerspectiveCamera | null>(null);
  const orbitControlsRef = useRef<any>(null);
  const lastProcessedSpawnRequestIdRef = useRef<number | null>(null);
  const lastCameraResetTokenRef = useRef(0);
  const lastStandRequestTokenRef = useRef(0);
  const lastReportedFurnitureRef = useRef<RoomFurniturePlacement[]>(
    cloneFurniturePlacements(initialFurnitureRef.current)
  );
  const lastReportedCommittedFurnitureRef = useRef<RoomFurniturePlacement[]>(
    cloneFurniturePlacements(initialFurnitureRef.current)
  );
  const furnitureEditStartRef = useRef<Record<string, RoomFurniturePlacement | null>>({});
  const capturedPointerIdRef = useRef<number | null>(null);
  const capturedPointerTargetRef = useRef<PointerCaptureTarget | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const zoomTargetDistanceRef = useRef<number | null>(null);
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
  const [pendingInteraction, setPendingInteraction] = useState<FurnitureInteractionTarget | null>(null);
  const [activeInteraction, setActiveInteraction] = useState<FurnitureInteractionTarget | null>(null);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
  const [hoveredFurnitureId, setHoveredFurnitureId] = useState<string | null>(null);
  const [hoveredInteractableFurnitureId, setHoveredInteractableFurnitureId] = useState<string | null>(null);
  const [interactionHint, setInteractionHint] = useState<{
    message: string;
    left: number;
    top: number;
  } | null>(null);
  const [isDraggingFurniture, setIsDraggingFurniture] = useState(false);
  const [isTransformingFurniture, setIsTransformingFurniture] = useState(false);
  const [prefersTouchControls, setPrefersTouchControls] = useState(false);
  const lightingState = useMemo(() => getWorldLightingState(worldTimeMinutes), [worldTimeMinutes]);
  const isBasicRenderMode = renderMode === "basic";
  const floorLampCount = useMemo(
    () => furniture.filter((item) => item.type === "floor_lamp").length,
    [furniture]
  );
  const practicalLampFactor = Math.min(1, floorLampCount / 2) * lightingState.nightFactor;
  const roomSurfaceLightAmount = clamp01(
    lightingState.interiorDaylightAmount + practicalLampFactor * 0.22
  );
  const windowSurfaceLightAmount = clamp01(
    lightingState.windowDaylightAmount + practicalLampFactor * 0.08
  );
  const twilightSafetyAmount = lightingState.twilightAmount;
  const skyGradientTopColor = mixColor(
    mixColor("#071128", "#f2a85f", twilightSafetyAmount * 0.82),
    "#2fa8ff",
    lightingState.daylightAmount
  );
  const skyGradientBottomColor = mixColor(
    mixColor("#132247", "#ffd7ab", twilightSafetyAmount * 0.76),
    "#d6f2ff",
    lightingState.daylightAmount
  );
  const sceneBackdrop = `linear-gradient(180deg, ${skyGradientTopColor} 0%, ${mixColor(
    skyGradientTopColor,
    skyGradientBottomColor,
    0.45
  )} 60%, ${skyGradientBottomColor} 100%)`;
  const sceneFogColor = mixColor(skyGradientTopColor, skyGradientBottomColor, 0.68);
  const sceneToneMappingExposure = isBasicRenderMode
    ? mixNumber(0.28, 0.4, lightingState.daylightAmount) +
      twilightSafetyAmount * 0.03 +
      practicalLampFactor * 0.12
    : lightingState.toneMappingExposure + practicalLampFactor * 0.16;
  const composerAoIntensity = lightingState.aoIntensity * mixNumber(0.08, 1, 1 - twilightSafetyAmount);
  const composerBloomIntensity =
    lightingState.bloomIntensity * mixNumber(0.6, 1, 1 - twilightSafetyAmount);
  const composerVignetteDarkness =
    lightingState.vignetteDarkness * mixNumber(0.18, 1, 1 - twilightSafetyAmount);
  const composerBrightness = brightness - 1 + twilightSafetyAmount * 0.12;
  const composerContrast = contrast - 1;
  const shouldApplyHueSaturation = Math.abs(saturation - 1) > 0.001;
  const shouldApplyBrightnessContrast =
    Math.abs(composerBrightness) > 0.001 || Math.abs(composerContrast) > 0.001;
  const shouldUseBasicColorComposer =
    isBasicRenderMode && (shouldApplyHueSaturation || shouldApplyBrightnessContrast);
  const shouldUseRendererToneMapping = isBasicRenderMode && !shouldUseBasicColorComposer;
  const canvasDpr = prefersTouchControls ? TOUCH_MAX_DPR : DESKTOP_MAX_DPR;
  const composerMultisampling = prefersTouchControls
    ? TOUCH_COMPOSER_MULTISAMPLING
    : DESKTOP_COMPOSER_MULTISAMPLING;
  const sunShadowMapSize = prefersTouchControls
    ? TOUCH_SUN_SHADOW_MAP_SIZE
    : DESKTOP_SUN_SHADOW_MAP_SIZE;
  const moonShadowMapSize = prefersTouchControls
    ? TOUCH_MOON_SHADOW_MAP_SIZE
    : DESKTOP_MOON_SHADOW_MAP_SIZE;
  const shouldUseAmbientOcclusion = !prefersTouchControls && composerAoIntensity > 0.02;
  const shouldUseBloom = composerBloomIntensity > 0.02;
  const hemisphereLightIntensity = (
    isBasicRenderMode
      ? mixNumber(0.18, 0.3, lightingState.daylightAmount) +
        lightingState.twilightFillAmount * 0.12 +
        practicalLampFactor * 0.12
      : mixNumber(0.22, 0.38, lightingState.daylightAmount) +
        lightingState.twilightFillAmount * 0.2 +
        practicalLampFactor * 0.16
  ) * ambientMultiplier;
  const moonFillIntensity = isBasicRenderMode
    ? lightingState.moonIntensity * 0.55 + lightingState.nightFactor * 0.025
    : lightingState.moonIntensity;
  const syncZoomTargetToCamera = useCallback(() => {
    const camera = cameraRef.current;
    const controls = orbitControlsRef.current;

    if (!camera || !controls) {
      return;
    }

    zoomTargetDistanceRef.current = camera.position.distanceTo(controls.target);
  }, []);
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
  const playerInteractionStatus = useMemo<PlayerInteractionStatus>(() => {
    if (activeInteraction) {
      return {
        phase: "active",
        label: activeInteraction.furnitureLabel
      };
    }

    if (pendingInteraction) {
      return {
        phase: "approaching",
        label: pendingInteraction.furnitureLabel
      };
    }

    return null;
  }, [activeInteraction, pendingInteraction]);
  const playerInteractionPose = activeInteraction
    ? {
        type: activeInteraction.type,
        position: activeInteraction.position,
        rotationY: activeInteraction.rotationY,
        poseOffset: activeInteraction.poseOffset
      }
    : null;
  const interactionCursor = useMemo(() => {
    if (isDraggingFurniture || isTransformingFurniture) {
      return "grabbing";
    }

    if (!buildModeEnabled && hoveredInteractableFurnitureId) {
      return "pointer";
    }

    if (buildModeEnabled && (hoveredFurnitureId || selectedFurnitureId)) {
      return "grab";
    }

    return "grab";
  }, [
    buildModeEnabled,
    hoveredFurnitureId,
    hoveredInteractableFurnitureId,
    isDraggingFurniture,
    isTransformingFurniture,
    selectedFurnitureId
  ]);
  const handleCanvasWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    if (prefersTouchControls || isTransformingFurniture) {
      return;
    }

    const camera = cameraRef.current;
    const controls = orbitControlsRef.current;

    if (!camera || !controls) {
      return;
    }

    const currentTargetDistance =
      zoomTargetDistanceRef.current ?? camera.position.distanceTo(controls.target);
    const zoomScale = Math.exp(event.deltaY * SMOOTH_ZOOM_SENSITIVITY);
    zoomTargetDistanceRef.current = Math.min(
      MAX_CAMERA_DISTANCE,
      Math.max(MIN_CAMERA_DISTANCE, currentTargetDistance * zoomScale)
    );
  }, [isTransformingFurniture, prefersTouchControls]);

  useEffect(() => {
    if (placementListsMatch(lastReportedFurnitureRef.current, furniture)) {
      return;
    }

    const nextPlacements = cloneFurniturePlacements(furniture);
    lastReportedFurnitureRef.current = nextPlacements;
    onFurnitureSnapshotChange(nextPlacements);
  }, [furniture, onFurnitureSnapshotChange]);

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
    setHoveredFurnitureId(null);
    setHoveredInteractableFurnitureId(null);
    resetBuilderGestureState(false);
    furnitureEditStartRef.current = {};
    setPendingInteraction(null);
    setActiveInteraction(null);
  }, [initialFurniturePlacements]);

  useEffect(() => {
    if (buildModeEnabled) {
      setPendingInteraction(null);
      setActiveInteraction(null);
      return;
    }

    if (!buildModeEnabled) {
      setFurniture(cloneFurniturePlacements(committedFurniture));
      setSelectedFurnitureId(null);
      setHoveredFurnitureId(null);
      setHoveredInteractableFurnitureId(null);
      resetBuilderGestureState(false);
      furnitureEditStartRef.current = {};
    }
  }, [buildModeEnabled, committedFurniture]);

  useEffect(() => {
    onInteractionStateChange(playerInteractionStatus);
  }, [onInteractionStateChange, playerInteractionStatus]);

  useEffect(() => {
    if (!selectedFurnitureId || selectedFurniture) {
      return;
    }

    delete furnitureEditStartRef.current[selectedFurnitureId];
    setSelectedFurnitureId(null);
    setHoveredFurnitureId((current) => (current === selectedFurnitureId ? null : current));
    resetBuilderGestureState(false);
  }, [selectedFurniture, selectedFurnitureId]);

  useEffect(() => {
    if (!interactionHint) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setInteractionHint((current) => (current === interactionHint ? null : current));
    }, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [interactionHint]);

  useEffect(() => {
    if (!pendingInteraction || activeInteraction) {
      return;
    }

    const distance = Math.hypot(
      playerWorldPosition[0] - pendingInteraction.position[0],
      playerWorldPosition[2] - pendingInteraction.position[2]
    );

    if (distance > 0.05) {
      return;
    }

    setTargetPosition(pendingInteraction.position);
    setActiveInteraction(pendingInteraction);
    setPendingInteraction(null);
  }, [activeInteraction, pendingInteraction, playerWorldPosition]);

  useEffect(() => {
    if (!buildModeEnabled) {
      setHoveredFurnitureId(null);
      return;
    }

    setHoveredInteractableFurnitureId(null);
  }, [buildModeEnabled]);

  useEffect(() => {
    if (!isDraggingFurniture) {
      return;
    }

    function stopDragging() {
      resetBuilderGestureState(isTransformingFurniture);
    }

    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [isDraggingFurniture, isTransformingFurniture]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const query = window.matchMedia("(pointer: coarse)");
    const updateTouchPreference = () => {
      setPrefersTouchControls(query.matches || window.navigator.maxTouchPoints > 0);
    };

    updateTouchPreference();
    query.addEventListener("change", updateTouchPreference);

    return () => {
      query.removeEventListener("change", updateTouchPreference);
    };
  }, []);

  useEffect(() => {
    syncZoomTargetToCamera();
  }, [syncZoomTargetToCamera]);

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
    syncZoomTargetToCamera();
    onCameraPositionChange(initialCameraPosition);
  }, [cameraResetToken, initialCameraPosition, onCameraPositionChange, syncZoomTargetToCamera]);

  useEffect(() => {
    if (!standRequestToken || standRequestToken === lastStandRequestTokenRef.current) {
      return;
    }

    lastStandRequestTokenRef.current = standRequestToken;

    if (activeInteraction) {
      clearPlayerInteraction(resolveInteractionExitPosition(activeInteraction));
      return;
    }

    if (pendingInteraction) {
      clearPlayerInteraction();
    }
  }, [activeInteraction, pendingInteraction, standRequestToken]);

  useEffect(() => {
    if (!spawnRequest || lastProcessedSpawnRequestIdRef.current === spawnRequest.requestId) {
      return;
    }

    lastProcessedSpawnRequestIdRef.current = spawnRequest.requestId;

    const definition = getFurnitureDefinition(spawnRequest.type);
    const spawnSurface =
      definition.surface === "wall"
        ? getPreferredWallSurface()
        : definition.surface === "surface"
          ? "surface"
          : "floor";

    if (spawnSurface === "surface" && getEditableSurfaceHosts().length === 0) {
      return;
    }

    const initialSpawnPlacement = resolveSpawnPosition(spawnRequest.type, spawnSurface, 0, 0);
    let nextPlacement = createFurniturePlacement(
      spawnRequest.type,
      initialSpawnPlacement.position,
      spawnSurface,
      {
        ownedFurnitureId: spawnRequest.ownedFurnitureId,
        anchorFurnitureId: initialSpawnPlacement.anchorFurnitureId,
        surfaceLocalOffset: initialSpawnPlacement.surfaceLocalOffset
      }
    );
    let foundOpenSpot = false;

    const candidateOffsets =
      spawnSurface === "surface" ? surfaceSpawnCandidateOffsets : spawnCandidateOffsets;

    for (const [offsetA, offsetB] of candidateOffsets) {
      const candidate = resolveSpawnPosition(spawnRequest.type, spawnSurface, offsetA, offsetB);
      const candidatePlacement = {
        id: `${spawnRequest.type}-spawn-preview`,
        type: spawnRequest.type,
        ownedFurnitureId: spawnRequest.ownedFurnitureId,
        ...candidate
      };

      if (!getFurnitureCollisionReason(candidatePlacement, furniture, playerWorldPosition)) {
        nextPlacement = createFurniturePlacement(
          spawnRequest.type,
          candidate.position,
          candidate.surface,
          {
            ownedFurnitureId: spawnRequest.ownedFurnitureId,
            anchorFurnitureId: candidate.anchorFurnitureId,
            surfaceLocalOffset: candidate.surfaceLocalOffset
          }
        );
        foundOpenSpot = true;
        break;
      }
    }

    if (!foundOpenSpot) {
      nextPlacement = createFurniturePlacement(
        spawnRequest.type,
        initialSpawnPlacement.position,
        spawnSurface,
        {
          ownedFurnitureId: spawnRequest.ownedFurnitureId,
          anchorFurnitureId: initialSpawnPlacement.anchorFurnitureId,
          surfaceLocalOffset: initialSpawnPlacement.surfaceLocalOffset
        }
      );
    }

    setFurniture((currentFurniture) => [...currentFurniture, nextPlacement]);
    setSelectedFurnitureId(nextPlacement.id);
    setHoveredFurnitureId(nextPlacement.id);
    resetBuilderGestureState(false);
    furnitureEditStartRef.current[nextPlacement.id] = null;
  }, [furniture, playerWorldPosition, spawnRequest, targetPosition]);

  function capturePointer(event: ThreeEvent<PointerEvent>) {
    const pointerTarget = event.target as PointerCaptureTarget;
    releaseCapturedPointer();
    pointerTarget.setPointerCapture?.(event.pointerId);
    capturedPointerIdRef.current = event.pointerId;
    capturedPointerTargetRef.current = pointerTarget;
  }

  function releaseCapturedPointer() {
    if (
      capturedPointerIdRef.current === null ||
      capturedPointerTargetRef.current === null
    ) {
      return;
    }

    try {
      capturedPointerTargetRef.current.releasePointerCapture?.(capturedPointerIdRef.current);
    } catch {
      // Ignore browsers that release capture before we get here.
    }

    capturedPointerIdRef.current = null;
    capturedPointerTargetRef.current = null;
  }

  function resetBuilderGestureState(nextTransforming = false) {
    releaseCapturedPointer();
    setIsDraggingFurniture(false);
    setIsTransformingFurniture(nextTransforming);
    dragStateRef.current = null;

    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = !nextTransforming;
    }
  }

  function finishFurnitureEditingSession(
    furnitureId: string | null,
    cancelDraft: boolean
  ) {
    if (furnitureId) {
      if (cancelDraft && hasDraftChanges(furnitureId)) {
        cancelFurnitureDraft(furnitureId);
      } else {
        delete furnitureEditStartRef.current[furnitureId];
      }
    }

    setSelectedFurnitureId(null);
    setHoveredFurnitureId(null);
    resetBuilderGestureState(false);
  }

  function getEditableSurfaceHosts(excludedFurnitureId?: string): RoomFurniturePlacement[] {
    return getSurfaceHosts(furniture.filter((item) => item.id !== excludedFurnitureId));
  }

  function resolveSurfacePlacementOnHost(
    host: RoomFurniturePlacement,
    furnitureType: FurnitureType,
    localOffset: SurfaceLocalOffset,
    itemRotationY: number
  ): PlacementTransform | null {
    const clampedOffset = clampSurfaceOffsetToHost(
      host,
      furnitureType,
      localOffset,
      itemRotationY,
      gridSnapEnabled
    );

    if (!clampedOffset) {
      return null;
    }

    const worldPosition = getSurfaceWorldPosition(host, clampedOffset);

    if (!worldPosition) {
      return null;
    }

    return {
      position: worldPosition,
      rotationY: getSurfaceRotationY(furnitureType, "surface"),
      surface: "surface",
      anchorFurnitureId: host.id,
      surfaceLocalOffset: clampedOffset
    };
  }

  function resolveSurfacePlacementFromWorldPoint(
    worldX: number,
    worldZ: number,
    furnitureType: FurnitureType,
    itemRotationY: number,
    preferredHostId?: string | null,
    excludedFurnitureId?: string
  ): PlacementTransform | null {
    const hostCandidate = findBestSurfaceHostForWorldPoint(
      getEditableSurfaceHosts(excludedFurnitureId),
      furnitureType,
      itemRotationY,
      worldX,
      worldZ,
      gridSnapEnabled,
      preferredHostId
    );

    if (!hostCandidate) {
      return null;
    }

    return resolveSurfacePlacementOnHost(
      hostCandidate.host,
      furnitureType,
      hostCandidate.localOffset,
      itemRotationY
    );
  }

  function resolvePlacementFromDragRay(ray: Ray, dragState: DragState): PlacementTransform | null {
    if (dragState.surface === "surface") {
      const hostCandidate = findBestSurfaceHostFromRay(
        getEditableSurfaceHosts(dragState.furnitureId),
        dragState.type,
        dragState.rotationY,
        [ray.origin.x, ray.origin.y, ray.origin.z],
        [ray.direction.x, ray.direction.y, ray.direction.z],
        gridSnapEnabled,
        dragState.anchorFurnitureId ?? null
      );

      if (!hostCandidate) {
        return null;
      }

      return resolveSurfacePlacementOnHost(
        hostCandidate.host,
        dragState.type,
        hostCandidate.localOffset,
        dragState.rotationY
      );
    }

    
    const dragPlane =
      dragState.surface === "floor"
        ? floorDragPlane
        : dragState.surface === "wall_back"
          ? backWallDragPlane
          : leftWallDragPlane;

    if (!ray.intersectPlane(dragPlane, dragPlaneHitPoint)) {
      return null;
    }

    if (dragState.surface === "floor") {
      return resolveFloorPlacement(
        dragPlaneHitPoint.x,
        dragPlaneHitPoint.z,
        dragState.type,
        dragState.rotationY
      );
    }

    if (dragState.surface === "wall_back") {
      return resolveWallPlacement(
        "wall_back",
        dragPlaneHitPoint.x,
        dragPlaneHitPoint.y,
        dragState.type
      );
    }

    return resolveWallPlacement(
      "wall_left",
      dragPlaneHitPoint.z,
      dragPlaneHitPoint.y,
      dragState.type
    );
  }

  function getPreferredWallSurface(): FurniturePlacementSurface {
    const leftWallDistance = Math.abs(targetPosition[0] - LEFT_WALL_SURFACE_X);
    const backWallDistance = Math.abs(targetPosition[2] - BACK_WALL_SURFACE_Z);

    return leftWallDistance < backWallDistance ? "wall_left" : "wall_back";
  }

  function resolveInteractionExitPosition(
    interaction: FurnitureInteractionTarget
  ): Vector3Tuple {
    const [offsetX, offsetY, offsetZ] = rotateLocalOffset(
      interaction.type === "use_pc" ? [0, 0, -0.9] : [0, 0, 0.9],
      interaction.rotationY
    );

    return [
      clampToFloor(interaction.position[0] + offsetX),
      interaction.position[1] + offsetY,
      clampToFloor(interaction.position[2] + offsetZ)
    ];
  }

  function clearPlayerInteraction(nextTarget?: Vector3Tuple) {
    setPendingInteraction(null);
    setActiveInteraction(null);

    if (nextTarget) {
      setTargetPosition(nextTarget);
      return;
    }

    setTargetPosition([
      playerWorldPosition[0],
      playerWorldPosition[1],
      playerWorldPosition[2]
    ]);
  }

  function showInteractionHint(message: string, event: ThreeEvent<MouseEvent>) {
    const nativeEvent = event.nativeEvent;

    setInteractionHint({
      message,
      left: nativeEvent.clientX,
      top: nativeEvent.clientY
    });
  }

  function resolveFloorPlacement(
    x: number,
    z: number,
    furnitureType: FurnitureType,
    currentRotationY?: number
  ): PlacementTransform {
    const rotationY = currentRotationY !== undefined ? currentRotationY : getSurfaceRotationY(furnitureType, "floor");
    const [effHalfWidth, effHalfDepth] = getEffectiveHalfSizes(furnitureType, rotationY);
    const nextX = gridSnapEnabled ? snapToBlockCenter(x) : x;
    const nextZ = gridSnapEnabled ? snapToBlockCenter(z) : z;

    return {
      position: [
        clampFurnitureToFloor(nextX, effHalfWidth),
        0,
        clampFurnitureToFloor(nextZ, effHalfDepth)
      ],
      rotationY,
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
    const nextHorizontal = gridSnapEnabled ? snapToBlockCenter(horizontal) : horizontal;
    const nextVertical = definition.wallOpening?.fixedVertical
      ? definition.wallOpening.centerY
      : gridSnapEnabled
        ? snapToBlockCenter(vertical)
        : vertical;

    if (surface === "wall_back") {
      return {
        position: [
          clampWallAxis(nextHorizontal, halfWidth),
          definition.wallOpening?.fixedVertical
            ? nextVertical
            : clampWallHeight(nextVertical, definition.footprintDepth / 2),
          BACK_WALL_SURFACE_Z
        ],
        rotationY: getSurfaceRotationY(furnitureType, surface),
        surface
      };
    }

    return {
      position: [
        LEFT_WALL_SURFACE_X,
        definition.wallOpening?.fixedVertical
          ? nextVertical
          : clampWallHeight(nextVertical, definition.footprintDepth / 2),
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
    if (surface === "surface") {
      return (
        resolveSurfacePlacementFromWorldPoint(
          targetPosition[0] + offsetA,
          targetPosition[2] + offsetB,
          furnitureType,
          getSurfaceRotationY(furnitureType, "surface")
        ) ?? {
          position: [targetPosition[0], 0.9, targetPosition[2]],
          rotationY: getSurfaceRotationY(furnitureType, "surface"),
          surface: "surface",
          anchorFurnitureId: undefined,
          surfaceLocalOffset: undefined
        }
      );
    }

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
    setFurniture((currentFurniture) => {
      const previousItem = findFurniturePlacement(currentFurniture, furnitureId);

      if (!previousItem) {
        return currentFurniture;
      }

      const nextItem = updater(previousItem);
      let nextFurniture = updateFurniturePlacement(currentFurniture, furnitureId, () => nextItem);

      if (canHostSurfaceDecor(previousItem)) {
        nextFurniture = syncAnchoredSurfaceDecor(nextFurniture, previousItem, nextItem);
      }

      return nextFurniture;
    });
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

  function cancelFurnitureDraft(furnitureId: string) {
    const editStart = furnitureEditStartRef.current[furnitureId];

    if (editStart) {
      updateFurnitureItem(furnitureId, () => cloneFurniturePlacement(editStart));
    } else {
      revertFurnitureItemToCommitted(furnitureId);
    }

    delete furnitureEditStartRef.current[furnitureId];
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

  function resolvePlacementFromHit(
    hitPoint: Vector3,
    hitNormal: Vector3 | undefined,
    furnitureType: FurnitureType
  ): PlacementTransform | null {
    const definition = getFurnitureDefinition(furnitureType);

    if (definition.surface === "surface") {
      return resolveSurfacePlacementFromWorldPoint(
        hitPoint.x,
        hitPoint.z,
        furnitureType,
        getSurfaceRotationY(furnitureType, "surface")
      );
    }

    if (definition.surface === "wall") {
      const leftWallDist = Math.abs(hitPoint.x - LEFT_WALL_SURFACE_X);
      const backWallDist = Math.abs(hitPoint.z - BACK_WALL_SURFACE_Z);

      if (leftWallDist < backWallDist) {
        return resolveWallPlacement("wall_left", hitPoint.z, hitPoint.y, furnitureType);
      }

      return resolveWallPlacement("wall_back", hitPoint.x, hitPoint.y, furnitureType);
    }

    const halfWidth = definition.footprintWidth / 2;
    const halfDepth = definition.footprintDepth / 2;
    const nextX = gridSnapEnabled ? snapToBlockCenter(hitPoint.x) : hitPoint.x;
    const nextZ = gridSnapEnabled ? snapToBlockCenter(hitPoint.z) : hitPoint.z;

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

  function applyPlacementToItem(
    item: RoomFurniturePlacement,
    nextPlacement: PlacementTransform
  ): RoomFurniturePlacement {
    if (nextPlacement.surface === "floor" || nextPlacement.surface === "surface") {
      return {
        ...item,
        ...nextPlacement,
        rotationY: item.rotationY
      };
    }

    return {
      ...item,
      ...nextPlacement
    };
  }

  function handleBuildSurfaceClick(event: ThreeEvent<MouseEvent>) {
    if (!buildModeEnabled) {
      return false;
    }

    event.stopPropagation();

    if (isTransformingFurniture || isDraggingFurniture) {
      return true;
    }

    if (selectedFurnitureId) {
      finishFurnitureEditingSession(selectedFurnitureId, true);
    }

    return true;
  }

  function handleFloorMoveCommand(event: ThreeEvent<MouseEvent>) {
    event.nativeEvent.preventDefault();

    if (handleBuildSurfaceClick(event)) {
      return;
    }

    if (isTransformingFurniture) {
      return;
    }

    event.stopPropagation();
    const nextTarget: Vector3Tuple = [clampToFloor(event.point.x), 0, clampToFloor(event.point.z)];

    if (activeInteraction || pendingInteraction) {
      clearPlayerInteraction(nextTarget);
      return;
    }

    setTargetPosition(nextTarget);
  }

  function handleWallClick(event: ThreeEvent<MouseEvent>) {
    handleBuildSurfaceClick(event);
  }

  function handleFurniturePointerDown(
    furnitureId: string,
    event: ThreeEvent<PointerEvent>
  ) {
    if (!buildModeEnabled) {
      return;
    }

    setHoveredFurnitureId(furnitureId);

    if (selectedFurnitureId !== furnitureId || isTransformingFurniture) {
      return;
    }

    const isPrimaryPointer = event.pointerType === "touch" || event.button === 0;

    if (!isPrimaryPointer) {
      return;
    }

    event.stopPropagation();
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = false;
    }
    capturePointer(event);

    const pressedFurniture = findFurniturePlacement(furniture, furnitureId);
    setIsDraggingFurniture(true);
    dragStateRef.current = pressedFurniture
      ? {
          furnitureId,
          type: pressedFurniture.type,
          surface: pressedFurniture.surface,
          rotationY: pressedFurniture.rotationY,
          anchorFurnitureId: pressedFurniture.anchorFurnitureId
        }
      : null;
  }

  function handleFurnitureDoubleClick(
    furnitureId: string,
    event: ThreeEvent<MouseEvent>
  ) {
    if (!buildModeEnabled || isDraggingFurniture || isTransformingFurniture) {
      return;
    }

    event.stopPropagation();

    if (selectedFurnitureId && selectedFurnitureId !== furnitureId) {
      finishFurnitureEditingSession(selectedFurnitureId, true);
    }

    selectFurnitureForEditing(furnitureId);
    setHoveredFurnitureId(furnitureId);
  }

  function handleFurnitureClick(
    furnitureId: string,
    event: ThreeEvent<MouseEvent>
  ) {
    if (!buildModeEnabled || isDraggingFurniture || isTransformingFurniture) {
      return;
    }

    const clickedFurniture = findFurniturePlacement(furniture, furnitureId);

    if (!clickedFurniture || clickedFurniture.surface !== "surface") {
      return;
    }

    event.stopPropagation();

    if (selectedFurnitureId && selectedFurnitureId !== furnitureId) {
      finishFurnitureEditingSession(selectedFurnitureId, true);
    }

    selectFurnitureForEditing(furnitureId);
    setHoveredFurnitureId(furnitureId);
  }

  function handleFurnitureInteractionCommand(
    furnitureId: string,
    event: ThreeEvent<MouseEvent>
  ) {
    if (buildModeEnabled || isDraggingFurniture || isTransformingFurniture) {
      return;
    }

    const clickedFurniture = findFurniturePlacement(furniture, furnitureId);

    if (!clickedFurniture) {
      return;
    }

    event.nativeEvent.preventDefault();
    event.stopPropagation();

    const interactionTarget = getFurnitureInteractionTarget(clickedFurniture, furniture);

    if (!interactionTarget) {
      if (getFurnitureDefinition(clickedFurniture.type).interactionType === "use_pc") {
        showInteractionHint("Need a chair", event);
      }

      return;
    }

    if (activeInteraction?.furnitureId === furnitureId) {
      clearPlayerInteraction(resolveInteractionExitPosition(activeInteraction));
      return;
    }

    setActiveInteraction(null);
    setPendingInteraction(interactionTarget);
    setTargetPosition(interactionTarget.position);
  }

  function handleFurniturePointerMove(
    furnitureId: string,
    event: ThreeEvent<PointerEvent>
  ) {
    if (buildModeEnabled) {
      event.stopPropagation();

      if (
        !isDraggingFurniture &&
        !isTransformingFurniture &&
        hoveredFurnitureId !== furnitureId
      ) {
        setHoveredFurnitureId(furnitureId);
      }
    }

    if (
      !buildModeEnabled ||
      isTransformingFurniture ||
      !isDraggingFurniture ||
      !dragStateRef.current
    ) {
      return;
    }

    const nextPlacement = resolvePlacementFromDragRay(event.ray, dragStateRef.current);

    if (!nextPlacement) {
      return;
    }

    event.stopPropagation();
    updateFurnitureItem(dragStateRef.current.furnitureId, (item) =>
      applyPlacementToItem(item, nextPlacement)
    );
  }

  function handleFurniturePointerUp(event?: ThreeEvent<PointerEvent>) {
    event?.stopPropagation();
    resetBuilderGestureState(isTransformingFurniture);
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

    if (selectedFurniture.surface === "surface") {
      const nextRotation = resolveFurnitureRotation(transformDragEuler.y);
      const nextPlacement = resolveSurfacePlacementFromWorldPoint(
        transformDragPosition.x,
        transformDragPosition.z,
        selectedFurniture.type,
        nextRotation,
        selectedFurniture.anchorFurnitureId,
        selectedFurniture.id
      );

      if (!nextPlacement) {
        return;
      }

      updateFurnitureItem(selectedFurnitureId, (item) => ({
        ...item,
        ...nextPlacement,
        rotationY: nextRotation
      }));
      return;
    }

    const nextRotation = resolveFurnitureRotation(transformDragEuler.y);
    const nextPlacement = resolveFloorPlacement(
      transformDragPosition.x,
      transformDragPosition.z,
      selectedFurniture.type,
      nextRotation
    );

    updateFurnitureItem(selectedFurnitureId, (item) => ({
      ...item,
      ...nextPlacement,
      rotationY: nextRotation
    }));
  }

  function handleSurfacePointerMove(event: ThreeEvent<PointerEvent>) {
    if (buildModeEnabled && !isDraggingFurniture && !isTransformingFurniture && hoveredFurnitureId) {
      setHoveredFurnitureId(null);
    }

    if (
      !buildModeEnabled ||
      isTransformingFurniture ||
      !isDraggingFurniture ||
      !dragStateRef.current
    ) {
      return;
    }

    const nextPlacement = resolvePlacementFromDragRay(event.ray, dragStateRef.current);

    if (!nextPlacement) {
      return;
    }

    event.stopPropagation();
    updateFurnitureItem(dragStateRef.current.furnitureId, (item) =>
      applyPlacementToItem(item, nextPlacement)
    );
  }

  function handleSurfacePointerUp() {
    resetBuilderGestureState(isTransformingFurniture);
  }

  function handleCancelFurniturePlacement() {
    finishFurnitureEditingSession(selectedFurnitureId, true);
  }

  function handleStoreFurniturePlacement() {
    if (!selectedFurnitureId) {
      return;
    }

    const furnitureIdsToRemove = new Set([
      selectedFurnitureId,
      ...furniture
        .filter((item) => item.anchorFurnitureId === selectedFurnitureId)
        .map((item) => item.id)
    ]);

    setFurniture((currentFurniture) =>
      currentFurniture.filter((item) => !furnitureIdsToRemove.has(item.id))
    );
    setCommittedFurniture((currentFurniture) =>
      currentFurniture.filter((item) => !furnitureIdsToRemove.has(item.id))
    );
    furnitureIdsToRemove.forEach((furnitureId) => {
      delete furnitureEditStartRef.current[furnitureId];
    });
    finishFurnitureEditingSession(selectedFurnitureId, false);
  }

  function getNudgeStep() {
    if (selectedFurniture?.surface === "surface") {
      return gridSnapEnabled ? 0.5 : FREE_MOVE_NUDGE_STEP;
    }

    return gridSnapEnabled ? 1 : FREE_MOVE_NUDGE_STEP;
  }

  function handleNudgeSelectedFurniture(horizontalDirection: -1 | 1) {
    if (!selectedFurnitureId || !selectedFurniture) {
      return;
    }

    const step = getNudgeStep() * horizontalDirection;

    if (selectedFurniture.surface === "floor") {
      updateFurnitureItem(selectedFurnitureId, (item) =>
        applyPlacementToItem(
          item,
          resolveFloorPlacement(
            item.position[0] + step,
            item.position[2],
            item.type,
            item.rotationY
          )
        )
      );
      return;
    }

    if (selectedFurniture.surface === "surface") {
      updateFurnitureItem(selectedFurnitureId, (item) => {
        const host = findFurniturePlacement(furniture, item.anchorFurnitureId ?? null);
        const currentOffset = item.surfaceLocalOffset ?? [0, 0];

        if (!host) {
          return item;
        }

        const nextPlacement = resolveSurfacePlacementOnHost(
          host,
          item.type,
          [currentOffset[0] + step, currentOffset[1]],
          item.rotationY
        );

        return nextPlacement ? applyPlacementToItem(item, nextPlacement) : item;
      });
      return;
    }

    if (selectedFurniture.surface === "wall_back") {
      updateFurnitureItem(selectedFurnitureId, (item) => ({
        ...item,
        ...resolveWallPlacement("wall_back", item.position[0] + step, item.position[1], item.type)
      }));
      return;
    }

    updateFurnitureItem(selectedFurnitureId, (item) => ({
      ...item,
      ...resolveWallPlacement("wall_left", item.position[2] + step, item.position[1], item.type)
    }));
  }

  function handleNudgeSelectedFurnitureVertical(verticalDirection: -1 | 1) {
    if (!selectedFurnitureId || !selectedFurniture) {
      return;
    }

    const step = getNudgeStep() * verticalDirection;

    if (selectedFurniture.surface === "floor") {
      updateFurnitureItem(selectedFurnitureId, (item) =>
        applyPlacementToItem(
          item,
          resolveFloorPlacement(
            item.position[0],
            item.position[2] + step,
            item.type,
            item.rotationY
          )
        )
      );
      return;
    }

    if (selectedFurniture.surface === "surface") {
      updateFurnitureItem(selectedFurnitureId, (item) => {
        const host = findFurniturePlacement(furniture, item.anchorFurnitureId ?? null);
        const currentOffset = item.surfaceLocalOffset ?? [0, 0];

        if (!host) {
          return item;
        }

        const nextPlacement = resolveSurfacePlacementOnHost(
          host,
          item.type,
          [currentOffset[0], currentOffset[1] + step],
          item.rotationY
        );

        return nextPlacement ? applyPlacementToItem(item, nextPlacement) : item;
      });
      return;
    }

    if (hasFixedWallVerticalPlacement(selectedFurniture.type)) {
      return;
    }

    updateFurnitureItem(selectedFurnitureId, (item) => ({
      ...item,
      ...resolveWallPlacement(
        item.surface === "wall_back" ? "wall_back" : "wall_left",
        item.surface === "wall_back" ? item.position[0] : item.position[2],
        item.position[1] + step,
        item.type
      )
    }));
  }

  function handleRotateSelectedFurniture(direction: -1 | 1) {
    if (
      !selectedFurnitureId ||
      !selectedFurniture ||
      (selectedFurniture.surface !== "floor" && selectedFurniture.surface !== "surface")
    ) {
      return;
    }

    const step = gridSnapEnabled ? Math.PI / 2 : Math.PI / 180;

    updateFurnitureItem(selectedFurnitureId, (item) => {
      const nextRotation = resolveFurnitureRotation(item.rotationY + step * direction);

      if (item.surface === "surface") {
        const host = findFurniturePlacement(furniture, item.anchorFurnitureId ?? null);
        const currentOffset = item.surfaceLocalOffset ?? [0, 0];

        if (!host) {
          return item;
        }

        const nextPlacement = resolveSurfacePlacementOnHost(
          host,
          item.type,
          currentOffset,
          nextRotation
        );

        return nextPlacement
          ? {
              ...item,
              ...nextPlacement,
              rotationY: nextRotation
            }
          : {
              ...item,
              rotationY: nextRotation
            };
      }

      return {
        ...item,
        ...resolveFloorPlacement(item.position[0], item.position[2], item.type, nextRotation),
        rotationY: nextRotation
      };
    });
  }

  function handleSwapSelectedWall() {
    if (
      !selectedFurnitureId ||
      !selectedFurniture ||
      (selectedFurniture.surface !== "wall_back" && selectedFurniture.surface !== "wall_left")
    ) {
      return;
    }

    const nextSurface = selectedFurniture.surface === "wall_back" ? "wall_left" : "wall_back";
    const horizontalSource =
      selectedFurniture.surface === "wall_back"
        ? selectedFurniture.position[0]
        : selectedFurniture.position[2];
    const nextPlacement = resolveWallPlacement(
      nextSurface,
      horizontalSource,
      selectedFurniture.position[1],
      selectedFurniture.type
    );

    updateFurnitureItem(selectedFurnitureId, (item) => ({
      ...item,
      ...nextPlacement
    }));
  }

  function handleDeselectFurniture() {
    finishFurnitureEditingSession(selectedFurnitureId, true);
  }

  function handleConfirmFurniturePlacement() {
    if (!selectedFurnitureId || !selectedFurniture || isPlacementBlocked) {
      return;
    }

    setCommittedFurniture(cloneFurniturePlacements(furniture));
    finishFurnitureEditingSession(selectedFurnitureId, false);
  }

  function renderFurnitureModel(
    item: RoomFurniturePlacement,
    selected: boolean,
    hovered = false,
    interactionHovered = false
  ) {
    const definition = getFurnitureDefinition(item.type);
    const commonProps = {
      position: [0, 0, 0] as [number, number, number],
      rotationY: 0,
      shadowsEnabled,
      selected,
      hovered,
      interactionHovered,
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
      case "fridge":
        return <FridgeModel {...commonProps} />;
      case "wardrobe":
        return <OfficeWardrobeModel {...commonProps} />;
      case "office_desk":
        return <OfficeDeskModel {...commonProps} />;
      case "office_chair":
        return <OfficeChairModel {...commonProps} />;
      case "window":
        return <WallWindowModel {...commonProps} daylightAmount={windowSurfaceLightAmount} />;
      case "vase":
        return <VaseModel {...commonProps} />;
      case "books":
        return <BookStackModel {...commonProps} />;
      case "poster":
        return <PosterModel {...commonProps} />;
      case "wall_frame":
        return <WallFrameModel {...commonProps} />;
      case "rug":
        return <RugModel {...commonProps} />;
      case "floor_lamp":
        return <FloorLampModel {...commonProps} nightFactor={lightingState.nightFactor} />;
      default:
        return null;
    }
  }

  function renderInteractionProxy(item: RoomFurniturePlacement) {
    const definition = getFurnitureDefinition(item.type);

    if (buildModeEnabled || !definition.interactionType) {
      return null;
    }

    const [width, height, depth] = getInteractionHitboxSize(item);

    return (
      <mesh
        position={[0, height / 2, 0]}
        onContextMenu={(event) => handleFurnitureInteractionCommand(item.id, event)}
        onPointerOver={(event) => {
          event.stopPropagation();
          if (hoveredInteractableFurnitureId !== item.id) {
            setHoveredInteractableFurnitureId(item.id);
          }
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          setHoveredInteractableFurnitureId((current) => (current === item.id ? null : current));
        }}
      >
        <boxGeometry args={[width, height, depth]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    );
  }

  function renderSurfaceDecorSelectionProxy(item: RoomFurniturePlacement) {
    if (!buildModeEnabled || item.surface !== "surface") {
      return null;
    }

    const [width, height, depth] = getSurfaceDecorSelectionHitboxSize(item);

    return (
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    );
  }

  return (
    <div
      className="canvas-wrap"
      style={{
        cursor: interactionCursor,
        background: sceneBackdrop
      }}
      onContextMenu={(event) => event.preventDefault()}
      onWheel={handleCanvasWheel}
      onPointerLeave={() => {
        if (!isDraggingFurniture && !isTransformingFurniture) {
          setHoveredFurnitureId(null);
        }

        setHoveredInteractableFurnitureId(null);
      }}
    >
      <Canvas
        shadows={shadowsEnabled}
        dpr={[1, canvasDpr]}
        gl={{
          alpha: true,
          antialias: !prefersTouchControls,
          powerPreference: "high-performance"
        }}
      >
        <RendererExposureController
          exposure={sceneToneMappingExposure}
          useRendererToneMapping={shouldUseRendererToneMapping}
        />
        <fogExp2 attach="fog" color={sceneFogColor} density={fogEnabled ? fogDensity : 0} />
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          position={initialCameraPositionRef.current}
          fov={24}
          onUpdate={(camera) => camera.lookAt(0, 0.9, 0)}
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
          target={[0, 0.9, 0]}
          minPolarAngle={0.18}
          maxPolarAngle={1.5}
          mouseButtons={{
            LEFT: MOUSE.ROTATE,
            MIDDLE: MOUSE.ROTATE,
            RIGHT: DISABLED_MOUSE_BUTTON
          }}
        />
        <SmoothZoomController
          cameraRef={cameraRef}
          orbitControlsRef={orbitControlsRef}
          zoomTargetDistanceRef={zoomTargetDistanceRef}
        />
        {!isBasicRenderMode ? (
          <ambientLight
            intensity={
              lightingState.nightFactor * 0.08 +
              lightingState.twilightAmount * 0.12 +
              practicalLampFactor * 0.1
            }
            color="#ffd7b0"
          />
        ) : null}
        <hemisphereLight
          intensity={hemisphereLightIntensity}
          groundColor={mixColor(
            lightingState.hemisphereGroundColor,
            "#7b5e49",
            practicalLampFactor * 0.6
          )}
          color={mixColor(
            lightingState.hemisphereSkyColor,
            "#ffd9b5",
            practicalLampFactor * 0.55
          )}
        />
        {practicalLampFactor > 0.001 ? (
          <pointLight
            position={[0, 2.55, -1.45]}
            color="#ffcf9f"
            intensity={practicalLampFactor * 0.82}
            distance={13.5}
            decay={2.2}
          />
        ) : null}
        {sunEnabled ? (
          isBasicRenderMode ? (
            <>
              <directionalLight
                castShadow={
                  shadowsEnabled &&
                  lightingState.sunIntensity > 0.08 &&
                  lightingState.solarAltitude > 0.18
                }
                intensity={lightingState.sunIntensity * sunIntensityMultiplier}
                color={lightingState.sunColor}
                position={lightingState.sunPosition}
                shadow-mapSize-width={sunShadowMapSize}
                shadow-mapSize-height={sunShadowMapSize}
                shadow-bias={-0.00028}
                shadow-normalBias={mixNumber(0.01, 0.03, lightingState.daylightAmount)}
                shadow-radius={mixNumber(4.4, 3.2, lightingState.daylightAmount)}
              >
                <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10, 0.5, 50]} />
              </directionalLight>
              <directionalLight
                castShadow={false}
                intensity={moonFillIntensity}
                color={lightingState.moonColor}
                position={lightingState.moonPosition}
              />
            </>
          ) : (
            <>
              <mesh position={lightingState.moonPosition} raycast={() => null}>
                <sphereGeometry args={[0.48, 10, 10]} />
                <meshBasicMaterial
                  color={lightingState.moonColor}
                  toneMapped={false}
                  transparent
                  opacity={clamp01(lightingState.nightFactor)}
                />
              </mesh>
              <directionalLight
                castShadow={
                  shadowsEnabled &&
                  lightingState.sunIntensity > 0.08 &&
                  lightingState.solarAltitude > 0.18
                }
                intensity={lightingState.sunIntensity * sunIntensityMultiplier}
                color={lightingState.sunColor}
                position={lightingState.sunPosition}
                shadow-mapSize-width={sunShadowMapSize}
                shadow-mapSize-height={sunShadowMapSize}
                shadow-bias={-0.00028}
                shadow-normalBias={mixNumber(0.01, 0.03, lightingState.daylightAmount)}
                shadow-radius={mixNumber(4.4, 3.2, lightingState.daylightAmount)}
              >
                <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10, 0.5, 50]} />
              </directionalLight>
              <directionalLight
                castShadow={false}
                intensity={lightingState.moonIntensity}
                color={lightingState.moonColor}
                position={lightingState.moonPosition}
                shadow-mapSize-width={moonShadowMapSize}
                shadow-mapSize-height={moonShadowMapSize}
                shadow-bias={-0.00018}
                shadow-normalBias={0.012}
                shadow-radius={4.8}
              >
                <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10, 0.5, 50]} />
              </directionalLight>
            </>
          )
        ) : null}
        <RoomShell
          surfaceLightAmount={roomSurfaceLightAmount}
          furniture={furniture}
          shadowsEnabled={shadowsEnabled}
          nightFactor={lightingState.lampNightFactor}
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
        <MinecraftPlayer
          initialPosition={initialPlayerPosition}
          skinSrc={skinSrc}
          targetPosition={targetPosition}
          interaction={playerInteractionPose}
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
            onClick={(event) => handleFurnitureClick(item.id, event)}
            onDoubleClick={(event) => handleFurnitureDoubleClick(item.id, event)}
            onPointerDown={(event) => handleFurniturePointerDown(item.id, event)}
            onPointerMove={(event) => handleFurniturePointerMove(item.id, event)}
            onPointerUp={handleFurniturePointerUp}
            onPointerCancel={handleFurniturePointerUp}
          >
            {renderFurnitureModel(
              item,
              false,
              buildModeEnabled &&
                hoveredFurnitureId === item.id &&
                selectedFurnitureId !== item.id &&
                !isDraggingFurniture,
              !buildModeEnabled && hoveredInteractableFurnitureId === item.id
            )}
            {renderSurfaceDecorSelectionProxy(item)}
            {renderInteractionProxy(item)}
          </group>
        ))}
        {buildModeEnabled && selectedFurniture && selectedFurnitureMatrix && !prefersTouchControls ? (
          <PivotControls
            matrix={selectedFurnitureMatrix}
            autoTransform={false}
            offset={getGizmoOffset(selectedFurniture)}
            activeAxes={getActiveAxes(selectedFurniture)}
            disableRotations={
              selectedSurface !== "floor" && selectedSurface !== "surface"
            }
            disableScaling
            rotationLimits={[[0, 0], undefined, [0, 0]]}
            lineWidth={GIZMO_LINE_WIDTH}
            depthTest={false}
            fixed={true}
            scale={
              selectedSurface === "floor" || selectedSurface === "surface"
                ? FLOOR_GIZMO_SCREEN_SIZE
                : WALL_GIZMO_SCREEN_SIZE
            }
            onDragStart={() => {
              resetBuilderGestureState(true);
            }}
            onDrag={handlePivotDrag}
            onDragEnd={() => resetBuilderGestureState(false)}
          >
            <group
              onClick={(event) => handleFurnitureClick(selectedFurniture.id, event)}
              onDoubleClick={(event) => handleFurnitureDoubleClick(selectedFurniture.id, event)}
              onPointerDown={(event) => handleFurniturePointerDown(selectedFurniture.id, event)}
              onPointerMove={(event) => handleFurniturePointerMove(selectedFurniture.id, event)}
              onPointerUp={handleFurniturePointerUp}
              onPointerCancel={handleFurniturePointerUp}
          >
            {renderFurnitureModel(
              selectedFurniture,
              true,
              false,
              !buildModeEnabled && hoveredInteractableFurnitureId === selectedFurniture.id
            )}
            {renderSurfaceDecorSelectionProxy(selectedFurniture)}
            {renderInteractionProxy(selectedFurniture)}
          </group>
        </PivotControls>
        ) : selectedFurniture ? (
          <group
            position={selectedFurniture.position}
            rotation={[0, selectedFurniture.rotationY, 0]}
            onClick={(event) => handleFurnitureClick(selectedFurniture.id, event)}
            onDoubleClick={(event) => handleFurnitureDoubleClick(selectedFurniture.id, event)}
            onPointerDown={(event) => handleFurniturePointerDown(selectedFurniture.id, event)}
            onPointerMove={(event) => handleFurniturePointerMove(selectedFurniture.id, event)}
            onPointerUp={handleFurniturePointerUp}
            onPointerCancel={handleFurniturePointerUp}
          >
            {renderFurnitureModel(
              selectedFurniture,
              buildModeEnabled,
              false,
              !buildModeEnabled && hoveredInteractableFurnitureId === selectedFurniture.id
            )}
            {renderSurfaceDecorSelectionProxy(selectedFurniture)}
            {renderInteractionProxy(selectedFurniture)}
          </group>
        ) : null}
        {buildModeEnabled && selectedFurniture ? (
          <PlacementActions
            position={[
              selectedFurniture.position[0] + getPlacementActionOffset(selectedFurniture)[0],
              selectedFurniture.position[1] + getPlacementActionOffset(selectedFurniture)[1],
              selectedFurniture.position[2] + getPlacementActionOffset(selectedFurniture)[2]
            ]}
            onCancel={handleCancelFurniturePlacement}
            onStore={handleStoreFurniturePlacement}
            onConfirm={handleConfirmFurniturePlacement}
            confirmDisabled={isPlacementBlocked}
          />
        ) : null}
        {shouldUseBasicColorComposer ? (
          <EffectComposer multisampling={0}>
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            {shouldApplyHueSaturation ? <HueSaturation hue={0} saturation={saturation - 1} /> : <></>}
            {shouldApplyBrightnessContrast ? (
              <BrightnessContrast brightness={composerBrightness} contrast={composerContrast} />
            ) : (
              <></>
            )}
          </EffectComposer>
        ) : !isBasicRenderMode ? (
          <EffectComposer multisampling={composerMultisampling}>
            {shouldUseAmbientOcclusion ? (
              <N8AO
                aoRadius={lightingState.aoRadius}
                intensity={composerAoIntensity}
                color="#000000"
              />
            ) : (
              <></>
            )}
            {shouldUseBloom ? (
              <Bloom
                luminanceThreshold={lightingState.bloomThreshold}
                mipmapBlur
                intensity={composerBloomIntensity}
              />
            ) : (
              <></>
            )}
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            <Vignette
              eskil={false}
              offset={lightingState.vignetteOffset}
              darkness={composerVignetteDarkness}
            />
            {shouldApplyHueSaturation ? <HueSaturation hue={0} saturation={saturation - 1} /> : <></>}
            {shouldApplyBrightnessContrast ? (
              <BrightnessContrast brightness={composerBrightness} contrast={composerContrast} />
            ) : (
              <></>
            )}
          </EffectComposer>
        ) : null}
        <CameraTracker onCameraPositionChange={onCameraPositionChange} />
      </Canvas>
      {buildModeEnabled && selectedFurniture ? (
        <EditDock
          itemLabel={getFurnitureDefinition(selectedFurniture.type).label}
          surfaceLabel={
            selectedFurniture.surface === "floor"
              ? "Floor item"
              : selectedFurniture.surface === "surface"
                ? "Surface decor"
              : selectedFurniture.surface === "wall_back"
                ? "Back wall"
                : "Left wall"
          }
          blocked={isPlacementBlocked}
          canRotate={
            selectedFurniture.surface === "floor" || selectedFurniture.surface === "surface"
          }
          canSwapWall={
            selectedFurniture.surface === "wall_back" ||
            selectedFurniture.surface === "wall_left"
          }
          canNudgeVertical={
            selectedFurniture.surface === "floor" ||
            selectedFurniture.surface === "surface" ||
            !hasFixedWallVerticalPlacement(selectedFurniture.type)
          }
          onNudgeNegativeHorizontal={() => handleNudgeSelectedFurniture(-1)}
          onNudgePositiveHorizontal={() => handleNudgeSelectedFurniture(1)}
          onNudgeNegativeVertical={() => handleNudgeSelectedFurnitureVertical(-1)}
          onNudgePositiveVertical={() => handleNudgeSelectedFurnitureVertical(1)}
          onRotateLeft={() => handleRotateSelectedFurniture(-1)}
          onRotateRight={() => handleRotateSelectedFurniture(1)}
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
