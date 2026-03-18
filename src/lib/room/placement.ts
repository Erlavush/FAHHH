import type { FurnitureSurface } from "../types";

const FLOOR_SLOTS: Array<[number, number, number]> = [
  [-1.6, 0.2, 1.45],
  [-0.7, 0.2, 1.35],
  [0.25, 0.2, 1.45],
  [1.15, 0.2, 1.1],
  [-1.35, 0.2, 0.35],
  [1.35, 0.2, 0.15]
];

const WALL_SLOTS: Array<[number, number, number]> = [
  [-1.5, 1.55, -1.88],
  [0.05, 1.5, -1.88],
  [1.45, 1.52, -1.88],
  [2.16, 1.42, -0.2]
];

const TABLE_SLOTS: Array<[number, number, number]> = [
  [1.58, 1.02, -0.98],
  [1.72, 1.02, -0.72],
  [-1.36, 0.8, -1.44]
];

export function getNextDecorPosition(
  index: number,
  surface: FurnitureSurface
): [number, number, number] {
  const source =
    surface === "wall" ? WALL_SLOTS : surface === "table" ? TABLE_SLOTS : FLOOR_SLOTS;

  return source[index % source.length];
}
