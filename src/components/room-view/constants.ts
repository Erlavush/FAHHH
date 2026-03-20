import { Euler, MOUSE, Plane, Quaternion, Vector3 } from "three";
import type { SurfaceLocalOffset } from "../../lib/surfaceDecor";

export const TILE_SIZE = 1;
export const GRID_SIZE = 10;
export const HALF_FLOOR_SIZE = (GRID_SIZE * TILE_SIZE) / 2;
export const BACK_WALL_SURFACE_Z = -HALF_FLOOR_SIZE + 0.17;
export const LEFT_WALL_SURFACE_X = -HALF_FLOOR_SIZE + 0.17;
export const WALL_CENTER_COORD = -HALF_FLOOR_SIZE - 0.06;
export const WALL_THICKNESS = 0.22;
export const WALL_HEIGHT = 4.4;
export const WALL_BOTTOM_Y = 0;
export const WALL_TOP_Y = WALL_HEIGHT;
export const BASEBOARD_COORD = -HALF_FLOOR_SIZE + 0.07;
export const TRIM_COORD = -HALF_FLOOR_SIZE + 0.08;
export const WALL_SPAN = GRID_SIZE + 0.2;
export const WALL_AXIS_MIN = -WALL_SPAN / 2;
export const WALL_AXIS_MAX = WALL_SPAN / 2;
export const BASEBOARD_SPAN = GRID_SIZE - 0.3;
export const WALL_MIN_Y = 1;
export const WALL_MAX_Y = 2.7;
export const WALL_RAIL_Y = 1.58;
export const WALL_TOP_TRIM_Y = 3.55;
export const MIN_CAMERA_DISTANCE = 5;
export const MAX_CAMERA_DISTANCE = 48;
export const SMOOTH_ZOOM_RESPONSE = 14;
export const SMOOTH_ZOOM_SENSITIVITY = 0.0015;
export const TOUCH_MAX_DPR = 1;
export const DESKTOP_MAX_DPR = 1.5;
export const TOUCH_COMPOSER_MULTISAMPLING = 0;
export const DESKTOP_COMPOSER_MULTISAMPLING = 4;
export const TOUCH_SUN_SHADOW_MAP_SIZE = 1024;
export const DESKTOP_SUN_SHADOW_MAP_SIZE = 1536;
export const TOUCH_MOON_SHADOW_MAP_SIZE = 0;
export const DESKTOP_MOON_SHADOW_MAP_SIZE = 512;
export const FLOOR_GIZMO_SCREEN_SIZE = 108;
export const WALL_GIZMO_SCREEN_SIZE = 94;
export const GIZMO_LINE_WIDTH = 4;
export const FREE_MOVE_NUDGE_STEP = 0.1;
export const DISABLED_MOUSE_BUTTON = -1 as MOUSE;
export const floorDragPlane = new Plane(new Vector3(0, 1, 0), 0);
export const backWallDragPlane = new Plane().setFromNormalAndCoplanarPoint(
  new Vector3(0, 0, 1),
  new Vector3(0, 0, BACK_WALL_SURFACE_Z)
);
export const leftWallDragPlane = new Plane().setFromNormalAndCoplanarPoint(
  new Vector3(1, 0, 0),
  new Vector3(LEFT_WALL_SURFACE_X, 0, 0)
);
export const dragPlaneHitPoint = new Vector3();
export const transformDragPosition = new Vector3();
export const transformDragQuaternion = new Quaternion();
export const transformDragScale = new Vector3();
export const transformDragEuler = new Euler(0, 0, 0, "YXZ");

export const spawnCandidateOffsets: Array<[number, number]> = [
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

export const surfaceSpawnCandidateOffsets: Array<SurfaceLocalOffset> = [
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