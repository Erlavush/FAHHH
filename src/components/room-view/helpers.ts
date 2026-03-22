import {
  CanvasTexture,
  NearestFilter,
  RepeatWrapping,
  SRGBColorSpace
} from "three";
import {
  getFurnitureDefinition,
  type FurniturePlacementSurface,
  type FurnitureType
} from "../../lib/furnitureRegistry";
import type { RoomFurniturePlacement, Vector3Tuple } from "../../lib/roomState";
import {
  HALF_FLOOR_SIZE,
  WALL_MAX_Y,
  WALL_MIN_Y
} from "./constants";

export function createWoodFloorTexture(): CanvasTexture {
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
      context.fillStyle =
        grainIndex % 2 === 0 ? "rgba(255, 224, 187, 0.08)" : "rgba(38, 20, 12, 0.11)";
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

export function clampToFloor(value: number): number {
  return Math.min(HALF_FLOOR_SIZE - 0.08, Math.max(-HALF_FLOOR_SIZE + 0.08, value));
}

export function clampFurnitureToFloor(value: number, halfSize: number): number {
  return Math.min(HALF_FLOOR_SIZE - halfSize, Math.max(-HALF_FLOOR_SIZE + halfSize, value));
}

export function getEffectiveHalfSizes(type: FurnitureType, rotationY: number): [number, number] {
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

export function clampWallAxis(value: number, halfSize: number): number {
  return Math.min(HALF_FLOOR_SIZE - halfSize - 0.18, Math.max(-HALF_FLOOR_SIZE + halfSize + 0.18, value));
}

export function clampWallHeight(value: number, halfSize: number): number {
  return Math.min(WALL_MAX_Y - halfSize, Math.max(WALL_MIN_Y + halfSize, value));
}

export function snapToBlockCenter(value: number): number {
  return Math.round(value - 0.5) + 0.5;
}

export function rotateLocalOffset(
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

export type WallSurface = Extract<
  FurniturePlacementSurface,
  "wall_back" | "wall_left" | "wall_front" | "wall_right"
>;

const WALL_SURFACE_CYCLE: WallSurface[] = [
  "wall_back",
  "wall_left",
  "wall_front",
  "wall_right"
];

export function isWallSurface(
  surface: FurniturePlacementSurface | RoomFurniturePlacement["surface"]
): surface is WallSurface {
  return (
    surface === "wall_back" ||
    surface === "wall_left" ||
    surface === "wall_front" ||
    surface === "wall_right"
  );
}

export function getWallParallelCoordinate(
  surface: WallSurface,
  position: Vector3Tuple | { x: number; z: number }
): number {
  const worldX = Array.isArray(position) ? position[0] : position.x;
  const worldZ = Array.isArray(position) ? position[2] : position.z;

  return surface === "wall_back" || surface === "wall_front"
    ? worldX
    : worldZ;
}

export function getNextWallSurface(surface: WallSurface): WallSurface {
  const currentIndex = WALL_SURFACE_CYCLE.indexOf(surface);
  return WALL_SURFACE_CYCLE[(currentIndex + 1) % WALL_SURFACE_CYCLE.length];
}

function getWallRoomFacingWorldOffset(
  surface: WallSurface,
  depth: number
): [number, number, number] {
  switch (surface) {
    case "wall_back":
      return [0, 0, depth];
    case "wall_left":
      return [depth, 0, 0];
    case "wall_front":
      return [0, 0, -depth];
    case "wall_right":
      return [-depth, 0, 0];
  }
}

export function getPlacementActionOffset(item: RoomFurniturePlacement): [number, number, number] {
  let offset: [number, number, number];

  switch (item.type) {
    case "bed":
      offset = [0, 1.5, 0];
      break;
    case "desk":
      offset = [0, 2.02, 0];
      break;
    case "chair":
      offset = [0, 1.92, 0];
      break;
    case "table":
      offset = [0, 1.82, 0];
      break;
    case "fridge":
      offset = [0, 2.28, 0];
      break;
    case "wardrobe":
      offset = [0, 2.5, 0];
      break;
    case "office_desk":
      offset = [0, 1.68, 0];
      break;
    case "office_chair":
      offset = [0, 1.48, 0];
      break;
    case "vase":
      offset = [0, 1.08, 0];
      break;
    case "books":
      offset = [0, 0.86, 0];
      break;
    case "rug":
      offset = [0, 0.82, 0];
      break;
    case "poster":
      offset = [0, 1.28, 0.14];
      break;
    case "wall_frame":
      offset = [0, 1.18, 0.14];
      break;
    default:
      offset = item.surface === "floor" ? [0, 1.64, 0] : [0, 1.16, 0.14];
      break;
  }

  if (isWallSurface(item.surface)) {
    const roomFacingOffset = getWallRoomFacingWorldOffset(
      item.surface,
      Math.abs(offset[2]) || 0.14
    );

    return [roomFacingOffset[0], offset[1], roomFacingOffset[2]];
  }

  return offset;
}

export function getGizmoOffset(item: RoomFurniturePlacement): [number, number, number] {
  const actionOffset = getPlacementActionOffset(item);

  if (isWallSurface(item.surface)) {
    return [0, Math.max(0.42, actionOffset[1] - 0.72), 0.16];
  }

  if (item.surface === "surface") {
    return [0, Math.max(0.42, actionOffset[1] - 0.34), 0];
  }

  return [0, Math.max(0.82, actionOffset[1] - 0.6), 0];
}

export function getInteractionHitboxSize(
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

export function getSurfaceDecorSelectionHitboxSize(
  item: RoomFurniturePlacement
): [number, number, number] {
  const definition = getFurnitureDefinition(item.type);

  return [
    Math.max(0.56, definition.footprintWidth + 0.18),
    0.88,
    Math.max(0.56, definition.footprintDepth + 0.18)
  ];
}

export function hasFixedWallVerticalPlacement(type: FurnitureType): boolean {
  return getFurnitureDefinition(type).wallOpening?.fixedVertical === true;
}

export function getActiveAxes(item: RoomFurniturePlacement | null): [boolean, boolean, boolean] {
  if (!item) {
    return [true, false, true];
  }

  if (isWallSurface(item.surface)) {
    if (hasFixedWallVerticalPlacement(item.type)) {
      return [true, false, false];
    }

    return [true, true, false];
  }

  return [true, false, true];
}
