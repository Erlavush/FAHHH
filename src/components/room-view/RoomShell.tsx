import { type ThreeEvent } from "@react-three/fiber";
import { useMemo } from "react";
import { getFurnitureDefinition } from "../../lib/furnitureRegistry";
import type { RoomFurniturePlacement } from "../../lib/roomState";
import { createWallOpeningLayout } from "../../lib/wallOpenings";
import { mixColor } from "../../lib/worldLighting";
import {
  BASEBOARD_COORD,
  BASEBOARD_SPAN,
  BACK_WALL_SURFACE_Z,
  LEFT_WALL_SURFACE_X,
  TRIM_COORD,
  WALL_AXIS_MAX,
  WALL_AXIS_MIN,
  WALL_BOTTOM_Y,
  WALL_CENTER_COORD,
  WALL_HEIGHT,
  WALL_RAIL_Y,
  WALL_SPAN,
  WALL_THICKNESS,
  WALL_TOP_TRIM_Y,
  WALL_TOP_Y
} from "./constants";

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

export function RoomShell({
  surfaceLightAmount,
  furniture,
  shadowsEnabled,
  onWallClick,
  onWallPointerMove,
  onWallPointerUp
}: {
  surfaceLightAmount: number;
  furniture: RoomFurniturePlacement[];
  shadowsEnabled: boolean;
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
    </group>
  );
}