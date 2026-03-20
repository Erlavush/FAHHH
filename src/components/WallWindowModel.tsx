import type { ThreeEvent } from "@react-three/fiber";
import { DoubleSide } from "three";
import { createCozyMaterialProps } from "./furnitureMaterials";
import { getFurnitureDefinition } from "../lib/furnitureRegistry";

interface WallWindowModelProps {
  position?: [number, number, number];
  rotationY?: number;
  shadowsEnabled: boolean;
  selected?: boolean;
  hovered?: boolean;
  interactionHovered?: boolean;
  blocked?: boolean;
  isDay?: boolean;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
}

const WINDOW_DEFINITION = getFurnitureDefinition("window");
const WINDOW_WIDTH = WINDOW_DEFINITION.footprintWidth;
const WINDOW_HEIGHT = WINDOW_DEFINITION.footprintDepth;
const OPENING_WIDTH = WINDOW_DEFINITION.wallOpening?.width ?? WINDOW_WIDTH - 0.4;
const OPENING_HEIGHT = WINDOW_DEFINITION.wallOpening?.height ?? WINDOW_HEIGHT - 0.4;
const WINDOW_DEPTH = 0.34;
const FRAME_THICKNESS = 0.18;
const INNER_MULLION_WIDTH = 0.08;
const GLASS_THICKNESS = 0.02;

export function WallWindowModel({
  position = [0, 0, 0],
  rotationY = 0,
  shadowsEnabled,
  selected = false,
  hovered = false,
  interactionHovered = false,
  blocked = false,
  isDay = true,
  onPointerDown
}: WallWindowModelProps) {
  const materialState = { blocked, selected, hovered, interactionHovered };
  const frameMaterial = createCozyMaterialProps(materialState, {
    baseColor: isDay ? "#8d674a" : "#6d533f",
    activeColor: "#57db8d",
    hoverColor: "#7bc4f8",
    blockedColor: "#ef6f7c",
    roughness: 0.86,
    metalness: 0.03
  });
  const sillMaterial = createCozyMaterialProps(materialState, {
    baseColor: isDay ? "#bf9874" : "#7d6552",
    activeColor: "#78e2a3",
    hoverColor: "#b9e6ff",
    blockedColor: "#f1a0aa",
    roughness: 0.88,
    metalness: 0.02
  });
  const glassColor = blocked
    ? "#f3c0c8"
    : selected
      ? "#ddfff0"
      : hovered || interactionHovered
        ? "#eaf7ff"
        : isDay
          ? "#dceefe"
          : "#ffe4af";
  const glowColor = blocked ? "#db7b88" : isDay ? "#c1dfff" : "#ffd69c";
  const sideJambSize: [number, number, number] = [FRAME_THICKNESS, WINDOW_HEIGHT, WINDOW_DEPTH];
  const topBottomRailSize: [number, number, number] = [OPENING_WIDTH, FRAME_THICKNESS, WINDOW_DEPTH];
  const trimDepth = 0.06;
  const trimWidth = OPENING_WIDTH + 0.12;
  const trimHeight = OPENING_HEIGHT + 0.12;
  const trimSideSize: [number, number, number] = [FRAME_THICKNESS * 0.86, trimHeight, trimDepth];
  const trimTopBottomSize: [number, number, number] = [trimWidth, FRAME_THICKNESS * 0.86, trimDepth];
  const frontTrimZ = WINDOW_DEPTH / 2 - trimDepth / 2;
  const backTrimZ = -WINDOW_DEPTH / 2 + trimDepth / 2;
  const glassGlowOpacity = isDay ? 0.16 : 0.42;
  const skyCardOpacity = isDay ? 0.22 : 0.36;

  return (
    <group position={position} rotation={[0, rotationY, 0]} onPointerDown={onPointerDown}>
      <mesh
        castShadow={shadowsEnabled}
        receiveShadow={shadowsEnabled}
        position={[-(WINDOW_WIDTH - FRAME_THICKNESS) / 2, 0, 0]}
      >
        <boxGeometry args={sideJambSize} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
      <mesh
        castShadow={shadowsEnabled}
        receiveShadow={shadowsEnabled}
        position={[(WINDOW_WIDTH - FRAME_THICKNESS) / 2, 0, 0]}
      >
        <boxGeometry args={sideJambSize} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
      <mesh
        castShadow={shadowsEnabled}
        receiveShadow={shadowsEnabled}
        position={[0, (WINDOW_HEIGHT - FRAME_THICKNESS) / 2, 0]}
      >
        <boxGeometry args={topBottomRailSize} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
      <mesh
        castShadow={shadowsEnabled}
        receiveShadow={shadowsEnabled}
        position={[0, -(WINDOW_HEIGHT - FRAME_THICKNESS) / 2, 0]}
      >
        <boxGeometry args={topBottomRailSize} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>

      <mesh position={[-(trimWidth - FRAME_THICKNESS * 0.86) / 2, 0, frontTrimZ]} raycast={() => null}>
        <boxGeometry args={trimSideSize} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
      <mesh position={[(trimWidth - FRAME_THICKNESS * 0.86) / 2, 0, frontTrimZ]} raycast={() => null}>
        <boxGeometry args={trimSideSize} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
      <mesh position={[0, (trimHeight - FRAME_THICKNESS * 0.86) / 2, frontTrimZ]} raycast={() => null}>
        <boxGeometry args={trimTopBottomSize} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
      <mesh position={[0, -(trimHeight - FRAME_THICKNESS * 0.86) / 2, frontTrimZ]} raycast={() => null}>
        <boxGeometry args={trimTopBottomSize} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>

      <mesh position={[-(trimWidth - FRAME_THICKNESS * 0.86) / 2, 0, backTrimZ]} raycast={() => null}>
        <boxGeometry args={trimSideSize} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
      <mesh position={[(trimWidth - FRAME_THICKNESS * 0.86) / 2, 0, backTrimZ]} raycast={() => null}>
        <boxGeometry args={trimSideSize} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
      <mesh position={[0, (trimHeight - FRAME_THICKNESS * 0.86) / 2, backTrimZ]} raycast={() => null}>
        <boxGeometry args={trimTopBottomSize} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
      <mesh position={[0, -(trimHeight - FRAME_THICKNESS * 0.86) / 2, backTrimZ]} raycast={() => null}>
        <boxGeometry args={trimTopBottomSize} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>

      <mesh position={[0, 0, 0]} raycast={() => null}>
        <boxGeometry args={[OPENING_WIDTH - 0.02, OPENING_HEIGHT - 0.02, GLASS_THICKNESS]} />
        <meshStandardMaterial
          color={glassColor}
          emissive={glowColor}
          emissiveIntensity={isDay ? 0.05 : 0.22}
          metalness={0.06}
          roughness={0.08}
          transparent
          opacity={isDay ? 0.14 : 0.2}
          side={DoubleSide}
        />
      </mesh>

      <mesh position={[0, 0, -WINDOW_DEPTH / 2 - 0.01]} raycast={() => null}>
        <planeGeometry args={[OPENING_WIDTH - 0.12, OPENING_HEIGHT - 0.12]} />
        <meshBasicMaterial
          color={isDay ? "#dbeeff" : "#ffdfab"}
          toneMapped={false}
          transparent
          opacity={skyCardOpacity}
          side={DoubleSide}
        />
      </mesh>

      <mesh position={[0, 0, 0.03]} raycast={() => null}>
        <boxGeometry args={[INNER_MULLION_WIDTH, OPENING_HEIGHT + 0.1, 0.03]} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
      <mesh position={[0, 0, 0]} raycast={() => null}>
        <boxGeometry args={[INNER_MULLION_WIDTH * 0.52, OPENING_HEIGHT - 0.08, WINDOW_DEPTH - 0.08]} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>

      <mesh
        castShadow={shadowsEnabled}
        receiveShadow={shadowsEnabled}
        position={[0, -WINDOW_HEIGHT / 2 - 0.08, WINDOW_DEPTH * 0.48]}
      >
        <boxGeometry args={[WINDOW_WIDTH + 0.2, 0.1, 0.3]} />
        <meshStandardMaterial {...sillMaterial} />
      </mesh>
      <mesh
        castShadow={shadowsEnabled}
        receiveShadow={shadowsEnabled}
        position={[0, -WINDOW_HEIGHT / 2 - 0.03, WINDOW_DEPTH * 0.66]}
      >
        <boxGeometry args={[WINDOW_WIDTH + 0.34, 0.04, 0.14]} />
        <meshStandardMaterial {...sillMaterial} />
      </mesh>

      {!isDay ? (
        <mesh position={[0, 0, -WINDOW_DEPTH / 2 + 0.02]} raycast={() => null}>
          <planeGeometry args={[OPENING_WIDTH - 0.16, OPENING_HEIGHT - 0.16]} />
          <meshBasicMaterial
            color="#ffd59a"
            toneMapped={false}
            transparent
            opacity={glassGlowOpacity}
            side={DoubleSide}
          />
        </mesh>
      ) : null}

      {selected || hovered || interactionHovered || blocked ? (
        <mesh position={[0, 0, WINDOW_DEPTH / 2 + 0.04]} raycast={() => null}>
          <boxGeometry args={[WINDOW_WIDTH + 0.14, WINDOW_HEIGHT + 0.14, 0.02]} />
          <meshBasicMaterial
            color={blocked ? "#ff7b88" : selected ? "#5cff98" : "#7cc8ff"}
            transparent
            opacity={selected || blocked ? 0.28 : 0.18}
          />
        </mesh>
      ) : null}
    </group>
  );
}
