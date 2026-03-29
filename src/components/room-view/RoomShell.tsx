import { type ThreeEvent } from "@react-three/fiber";
import { DoubleSide } from "three";
import { useMemo } from "react";
import { getFurnitureDefinition } from "../../lib/furnitureRegistry";
import { getThemeDefinition } from "../../lib/themeRegistry";
import type { RoomFurniturePlacement } from "../../lib/roomState";
import { createWallOpeningLayout } from "../../lib/wallOpenings";
import { mixColor } from "../../lib/worldLighting";
import {
  BASEBOARD_COORD,
  BASEBOARD_SPAN,
  BACK_WALL_SURFACE_Z,
  CEILING_CENTER_Y,
  CEILING_SURFACE_Y,
  CEILING_THICKNESS,
  LEFT_WALL_SURFACE_X,
  FRONT_WALL_SURFACE_Z,
  GRID_SIZE,
  RIGHT_WALL_SURFACE_X,
  TRIM_COORD,
  WALL_AXIS_MAX,
  WALL_AXIS_MIN,
  WALL_BOTTOM_Y,
  WALL_CENTER_COORD,
  FRONT_WALL_CENTER_COORD,
  RIGHT_WALL_CENTER_COORD,
  WALL_HEIGHT,
  WALL_RAIL_Y,
  WALL_SPAN,
  WALL_THICKNESS,
  WALL_TOP_TRIM_Y,
  WALL_TOP_Y
} from "./constants";

export type RoomShellRenderMode = "visible" | "shadow_only";

export function getRoomShellRenderMode(isVisible: boolean): RoomShellRenderMode {
  return isVisible ? "visible" : "shadow_only";
}

export function getRoomShellMaterialProps(renderMode: RoomShellRenderMode) {
  if (renderMode === "shadow_only") {
    return {
      colorWrite: false,
      depthWrite: false
    } as const;
  }

  return {} as const;
}

export function shouldRoomShellCastShadow(
  renderMode: RoomShellRenderMode,
  shadowsEnabled: boolean
) {
  return shadowsEnabled;
}

export function shouldRoomShellReceiveShadow(
  renderMode: RoomShellRenderMode,
  shadowsEnabled: boolean
) {
  return shadowsEnabled && renderMode === "visible";
}
function WallInteractionPlane({
  surface,
  onWallClick,
  onWallPointerMove,
  onWallPointerUp
}: {
  surface: "wall_back" | "wall_left" | "wall_front" | "wall_right";
  onWallClick: (event: ThreeEvent<MouseEvent>) => void;
  onWallPointerMove: (event: ThreeEvent<PointerEvent>) => void;
  onWallPointerUp: () => void;
}) {
  const isLateral = surface === "wall_left" || surface === "wall_right";
  const position: [number, number, number] = [0, WALL_HEIGHT / 2, 0];

  if (surface === "wall_left") position[0] = LEFT_WALL_SURFACE_X;
  if (surface === "wall_right") position[0] = RIGHT_WALL_SURFACE_X;
  if (surface === "wall_back") position[2] = BACK_WALL_SURFACE_Z;
  if (surface === "wall_front") position[2] = FRONT_WALL_SURFACE_Z;

  return (
    <mesh
      position={position}
      onClick={onWallClick}
      onPointerMove={onWallPointerMove}
      onPointerUp={onWallPointerUp}
      renderOrder={-1}
    >
      <boxGeometry args={isLateral ? [0.02, WALL_HEIGHT, WALL_SPAN] : [WALL_SPAN, WALL_HEIGHT, 0.02]} />
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
  shadowsEnabled,
  renderMode
}: {
  surface: "wall_back" | "wall_left" | "wall_front" | "wall_right";
  center: number;
  centerY: number;
  span: number;
  height: number;
  color: string;
  shadowsEnabled: boolean;
  renderMode: RoomShellRenderMode;
}) {
  if (span <= 0.0001 || height <= 0.0001) {
    return null;
  }

  const isLateral = surface === "wall_left" || surface === "wall_right";
  const position: [number, number, number] = [0, centerY, 0];

  if (surface === "wall_left") {
    position[0] = WALL_CENTER_COORD;
    position[2] = center;
  } else if (surface === "wall_right") {
    position[0] = RIGHT_WALL_CENTER_COORD;
    position[2] = center;
  } else if (surface === "wall_back") {
    position[0] = center;
    position[2] = WALL_CENTER_COORD;
  } else if (surface === "wall_front") {
    position[0] = center;
    position[2] = FRONT_WALL_CENTER_COORD;
  }

  return (
    <mesh
      position={position}
      castShadow={shouldRoomShellCastShadow(renderMode, shadowsEnabled)}
      receiveShadow={shouldRoomShellReceiveShadow(renderMode, shadowsEnabled)}
      raycast={() => null}
    >
      <boxGeometry args={isLateral ? [WALL_THICKNESS, height, span] : [span, height, WALL_THICKNESS]} />
      <meshStandardMaterial
        color={color}
        roughness={0.95}
        {...getRoomShellMaterialProps(renderMode)}
      />
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
  surface: "wall_back" | "wall_left" | "wall_front" | "wall_right";
  center: number;
  span: number;
  color: string;
  shadowsEnabled: boolean;
}) {
  if (span <= 0.0001) {
    return null;
  }

  const isLateral = surface === "wall_left" || surface === "wall_right";
  const position: [number, number, number] = [0, WALL_RAIL_Y, 0];

  if (surface === "wall_left") {
    position[0] = BASEBOARD_COORD + 0.04;
    position[2] = center;
  } else if (surface === "wall_right") {
    position[0] = -BASEBOARD_COORD - 0.04;
    position[2] = center;
  } else if (surface === "wall_back") {
    position[0] = center;
    position[2] = BASEBOARD_COORD + 0.04;
  } else if (surface === "wall_front") {
    position[0] = center;
    position[2] = -BASEBOARD_COORD - 0.04;
  }

  return (
    <mesh
      position={position}
      receiveShadow={shadowsEnabled}
      raycast={() => null}
    >
      <boxGeometry args={isLateral ? [0.04, 0.08, span] : [span, 0.08, 0.04]} />
      <meshStandardMaterial color={color} roughness={0.84} />
    </mesh>
  );
}

function SingleWall({
  surface,
  layout,
  wallColor,
  wallRailColor,
  baseboardColor,
  trimColor,
  shadowsEnabled,
  onWallClick,
  onWallPointerMove,
  onWallPointerUp,
  isVisible
}: {
  surface: "wall_back" | "wall_left" | "wall_front" | "wall_right";
  layout: any;
  wallColor: string;
  wallRailColor: string;
  baseboardColor: string;
  trimColor: string;
  shadowsEnabled: boolean;
  onWallClick: (event: ThreeEvent<MouseEvent>) => void;
  onWallPointerMove: (event: ThreeEvent<PointerEvent>) => void;
  onWallPointerUp: () => void;
  isVisible: boolean;
}) {
  const isLateral = surface === "wall_left" || surface === "wall_right";
  const renderMode = getRoomShellRenderMode(isVisible);

  return (
    <group>
      {isVisible ? (
        <WallInteractionPlane
          surface={surface}
          onWallClick={onWallClick}
          onWallPointerMove={onWallPointerMove}
          onWallPointerUp={onWallPointerUp}
        />
      ) : null}

      {/* Wall Bands */}
      <WallBand
        surface={surface}
        center={0}
        centerY={layout.lowerBandCenterY ?? WALL_HEIGHT / 2}
        span={WALL_SPAN}
        height={layout.lowerBandHeight}
        color={wallColor}
        shadowsEnabled={shadowsEnabled}
        renderMode={renderMode}
      />
      {layout.middleSegments.map((segment: any) => (
        <WallBand
          key={`${surface}-middle-${segment.center}-${segment.span}`}
          surface={surface}
          center={segment.center}
          centerY={layout.openingBandCenterY ?? 0}
          span={segment.span}
          height={layout.openingBandHeight}
          color={wallColor}
          shadowsEnabled={shadowsEnabled}
          renderMode={renderMode}
        />
      ))}
      <WallBand
        surface={surface}
        center={0}
        centerY={layout.upperBandCenterY ?? WALL_HEIGHT / 2}
        span={WALL_SPAN}
        height={layout.upperBandHeight}
        color={wallColor}
        shadowsEnabled={shadowsEnabled}
        renderMode={renderMode}
      />

      {/* Decorative Trim & Baseboard */}
      {isVisible ? (
        <>
          <mesh
            position={
              surface === "wall_left"
                ? [BASEBOARD_COORD, 0.12, 0]
                : surface === "wall_right"
                ? [-BASEBOARD_COORD, 0.12, 0]
                : surface === "wall_back"
                ? [0, 0.12, BASEBOARD_COORD]
                : [0, 0.12, -BASEBOARD_COORD]
            }
            receiveShadow={shadowsEnabled}
            raycast={() => null}
          >
            <boxGeometry args={isLateral ? [0.12, 0.24, BASEBOARD_SPAN] : [BASEBOARD_SPAN, 0.24, 0.12]} />
            <meshStandardMaterial color={baseboardColor} roughness={0.86} />
          </mesh>

          <mesh
            position={
              surface === "wall_left"
                ? [TRIM_COORD, WALL_TOP_TRIM_Y, 0]
                : surface === "wall_right"
                ? [-TRIM_COORD, WALL_TOP_TRIM_Y, 0]
                : surface === "wall_back"
                ? [0, WALL_TOP_TRIM_Y, TRIM_COORD]
                : [0, WALL_TOP_TRIM_Y, -TRIM_COORD]
            }
            receiveShadow={shadowsEnabled}
            raycast={() => null}
          >
            <boxGeometry args={isLateral ? [0.08, 0.18, BASEBOARD_SPAN] : [BASEBOARD_SPAN, 0.18, 0.08]} />
            <meshStandardMaterial color={trimColor} roughness={0.88} />
          </mesh>

          {/* Rails */}
          {layout.railSegments.map((segment: any) => (
            <WallRail
              key={`${surface}-rail-${segment.center}-${segment.span}`}
              surface={surface}
              center={segment.center}
              span={segment.span}
              color={wallRailColor}
              shadowsEnabled={shadowsEnabled}
            />
          ))}
        </>
      ) : null}
    </group>
  );
}

export function RoomShell({
  roomTheme,
  surfaceLightAmount,
  furniture,
  wallVisibility,
  shadowsEnabled,
  onWallClick,
  onWallPointerMove,
  onWallPointerUp,
  onCeilingClick,
  onCeilingPointerMove,
  onCeilingPointerUp
}: {
  roomTheme: string;
  surfaceLightAmount: number;
  furniture: RoomFurniturePlacement[];
  wallVisibility: Record<string, boolean>;
  shadowsEnabled: boolean;
  onWallClick: (event: ThreeEvent<MouseEvent>) => void;
  onWallPointerMove: (event: ThreeEvent<PointerEvent>) => void;
  onWallPointerUp: () => void;
  onCeilingClick: (event: ThreeEvent<MouseEvent>) => void;
  onCeilingPointerMove: (event: ThreeEvent<PointerEvent>) => void;
  onCeilingPointerUp: () => void;
}) {
  const theme = getThemeDefinition(roomTheme);
  const { colors } = theme;

  const wallColor = mixColor(colors.wall[0], colors.wall[1], surfaceLightAmount);
  const baseboardColor = mixColor(colors.baseboard[0], colors.baseboard[1], surfaceLightAmount);
  const trimColor = mixColor(colors.trim[0], colors.trim[1], surfaceLightAmount);
  const wallRailColor = mixColor(colors.wallRail[0], colors.wallRail[1], surfaceLightAmount);
  const cornerTrimColor = mixColor(colors.cornerTrim[0], colors.cornerTrim[1], surfaceLightAmount);
  const ceilingColor = mixColor(colors.ceiling[0], colors.ceiling[1], surfaceLightAmount);
  const ceilingTrimColor = mixColor(colors.ceilingTrim[0], colors.ceilingTrim[1], surfaceLightAmount);

  const walls: ("wall_back" | "wall_left" | "wall_front" | "wall_right")[] = [
    "wall_back",
    "wall_left",
    "wall_front",
    "wall_right"
  ];

  const layouts = useMemo(() => {
    return walls.map((surface) => {
      const wallWindows = furniture.filter(
        (item) => item.type === "window" && item.surface === surface
      );
      return createWallOpeningLayout(
        wallWindows.map((item) => {
          const definition = getFurnitureDefinition(item.type);
          const axisIndex = surface === "wall_left" || surface === "wall_right" ? 2 : 0;
          return {
            center: item.position[axisIndex],
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
      );
    });
  }, [furniture]);

  return (
    <group>
      {walls.map((surface, index) => (
        <SingleWall
          key={surface}
          surface={surface}
          layout={layouts[index]}
          wallColor={wallColor}
          wallRailColor={wallRailColor}
          baseboardColor={baseboardColor}
          trimColor={trimColor}
          shadowsEnabled={shadowsEnabled}
          onWallClick={onWallClick}
          onWallPointerMove={onWallPointerMove}
          onWallPointerUp={onWallPointerUp}
          isVisible={wallVisibility[surface] ?? true}
        />
      ))}

      <group>
        <mesh
          position={[0, CEILING_CENTER_Y, 0]}
          receiveShadow={shouldRoomShellReceiveShadow(getRoomShellRenderMode(wallVisibility.ceiling ?? false), shadowsEnabled)}
          castShadow={shouldRoomShellCastShadow(getRoomShellRenderMode(wallVisibility.ceiling ?? false), shadowsEnabled)}
          raycast={() => null}
        >
          <boxGeometry args={[GRID_SIZE + 0.18, CEILING_THICKNESS, GRID_SIZE + 0.18]} />
          <meshStandardMaterial
            color={ceilingColor}
            roughness={0.92}
            {...getRoomShellMaterialProps(getRoomShellRenderMode(wallVisibility.ceiling ?? false))}
          />
        </mesh>
        {(wallVisibility.ceiling ?? false) ? (
          <>
            <mesh position={[0, CEILING_SURFACE_Y + 0.02, 0]} raycast={() => null}>
              <boxGeometry args={[GRID_SIZE - 0.2, 0.04, GRID_SIZE - 0.2]} />
              <meshStandardMaterial color={ceilingTrimColor} roughness={0.84} />
            </mesh>
            <mesh
              position={[0, CEILING_SURFACE_Y + 0.001, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              onClick={onCeilingClick}
              onPointerMove={onCeilingPointerMove}
              onPointerUp={onCeilingPointerUp}
            >
              <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
              <meshBasicMaterial
                transparent
                opacity={0}
                depthWrite={false}
                side={DoubleSide}
              />
            </mesh>
          </>
        ) : null}
      </group>

      {/* Corner Trims */}
      {(wallVisibility.wall_back && wallVisibility.wall_left) && (
        <mesh position={[WALL_CENTER_COORD + 0.11, WALL_HEIGHT / 2, WALL_CENTER_COORD + 0.11]} raycast={() => null}>
          <boxGeometry args={[0.12, WALL_HEIGHT, 0.12]} />
          <meshStandardMaterial color={cornerTrimColor} roughness={0.88} />
        </mesh>
      )}
      {(wallVisibility.wall_back && wallVisibility.wall_right) && (
        <mesh position={[RIGHT_WALL_CENTER_COORD - 0.11, WALL_HEIGHT / 2, WALL_CENTER_COORD + 0.11]} raycast={() => null}>
          <boxGeometry args={[0.12, WALL_HEIGHT, 0.12]} />
          <meshStandardMaterial color={cornerTrimColor} roughness={0.88} />
        </mesh>
      )}
      {(wallVisibility.wall_front && wallVisibility.wall_left) && (
        <mesh position={[WALL_CENTER_COORD + 0.11, WALL_HEIGHT / 2, FRONT_WALL_CENTER_COORD - 0.11]} raycast={() => null}>
          <boxGeometry args={[0.12, WALL_HEIGHT, 0.12]} />
          <meshStandardMaterial color={cornerTrimColor} roughness={0.88} />
        </mesh>
      )}
      {(wallVisibility.wall_front && wallVisibility.wall_right) && (
        <mesh position={[RIGHT_WALL_CENTER_COORD - 0.11, WALL_HEIGHT / 2, FRONT_WALL_CENTER_COORD - 0.11]} raycast={() => null}>
          <boxGeometry args={[0.12, WALL_HEIGHT, 0.12]} />
          <meshStandardMaterial color={cornerTrimColor} roughness={0.88} />
        </mesh>
      )}
    </group>
  );
}
