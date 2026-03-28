import type { ThreeEvent } from "@react-three/fiber";
import { DoubleSide } from "three";
import { createCozyMaterialProps } from "./furnitureMaterials";
import { getFurnitureDefinition } from "../lib/furnitureRegistry";
import { clamp01, mixColor, mixNumber } from "../lib/worldLighting";

interface WallWindowModelProps {
  position?: [number, number, number];
  rotationY?: number;
  shadowsEnabled: boolean;
  selected?: boolean;
  hovered?: boolean;
  interactionHovered?: boolean;
  blocked?: boolean;
  daylightAmount?: number;
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
  daylightAmount = 1,
  onPointerDown
}: WallWindowModelProps) {
  const normalizedDaylightAmount = clamp01(daylightAmount);
  const nightAmount = 1 - normalizedDaylightAmount;
  const materialState = { blocked, selected, hovered, interactionHovered };
  const frameMaterial = createCozyMaterialProps(materialState, {
    baseColor: mixColor("#6d533f", "#8a6548", normalizedDaylightAmount),
    activeColor: "#57db8d",
    hoverColor: "#7bc4f8",
    blockedColor: "#ef6f7c",
    roughness: 0.86,
    metalness: 0.03
  });
  const sillMaterial = createCozyMaterialProps(materialState, {
    baseColor: mixColor("#7d6552", "#c7a27b", normalizedDaylightAmount),
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
        : mixColor("#ffe4af", "#f6fbff", normalizedDaylightAmount);
  const glowColor = blocked
    ? "#db7b88"
    : mixColor("#ffd69c", "#eef7ff", normalizedDaylightAmount);
  const sideJambSize: [number, number, number] = [FRAME_THICKNESS, WINDOW_HEIGHT, WINDOW_DEPTH];
  const topBottomRailSize: [number, number, number] = [OPENING_WIDTH, FRAME_THICKNESS, WINDOW_DEPTH];
  const trimDepth = 0.06;
  const trimWidth = OPENING_WIDTH + 0.12;
  const trimHeight = OPENING_HEIGHT + 0.12;
  const trimSideSize: [number, number, number] = [FRAME_THICKNESS * 0.86, trimHeight, trimDepth];
  const trimTopBottomSize: [number, number, number] = [trimWidth, FRAME_THICKNESS * 0.86, trimDepth];
  const frontTrimZ = WINDOW_DEPTH / 2 - trimDepth / 2;
  const backTrimZ = -WINDOW_DEPTH / 2 + trimDepth / 2;
  const glassGlowOpacity = mixNumber(0.42, 0.08, normalizedDaylightAmount);
  const skyCardOpacity = mixNumber(0.32, 0, normalizedDaylightAmount);

  return (
    <group position={position} rotation={[0, rotationY, 0]} onPointerDown={onPointerDown}>
      {/* --- Main Frame (Beveled/Stepped) --- */}
      {/* Outer Case */}
      <mesh
        castShadow={shadowsEnabled}
        receiveShadow={shadowsEnabled}
        position={[-(WINDOW_WIDTH - FRAME_THICKNESS) / 2, 0, 0]}
      >
        <boxGeometry args={[FRAME_THICKNESS, WINDOW_HEIGHT, WINDOW_DEPTH]} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
      <mesh
        castShadow={shadowsEnabled}
        receiveShadow={shadowsEnabled}
        position={[(WINDOW_WIDTH - FRAME_THICKNESS) / 2, 0, 0]}
      >
        <boxGeometry args={[FRAME_THICKNESS, WINDOW_HEIGHT, WINDOW_DEPTH]} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
      <mesh
        castShadow={shadowsEnabled}
        receiveShadow={shadowsEnabled}
        position={[0, (WINDOW_HEIGHT - FRAME_THICKNESS) / 2, 0]}
      >
        <boxGeometry args={[OPENING_WIDTH, FRAME_THICKNESS, WINDOW_DEPTH]} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
      <mesh
        castShadow={shadowsEnabled}
        receiveShadow={shadowsEnabled}
        position={[0, -(WINDOW_HEIGHT - FRAME_THICKNESS) / 2, 0]}
      >
        <boxGeometry args={[OPENING_WIDTH, FRAME_THICKNESS, WINDOW_DEPTH]} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>

      {/* Inner Bevel (Subtle depth) */}
      <mesh position={[-(OPENING_WIDTH - 0.08) / 2, 0, 0]} raycast={() => null}>
        <boxGeometry args={[0.06, OPENING_HEIGHT, WINDOW_DEPTH - 0.04]} />
        <meshStandardMaterial {...frameMaterial} roughness={0.9} />
      </mesh>
      <mesh position={[(OPENING_WIDTH - 0.08) / 2, 0, 0]} raycast={() => null}>
        <boxGeometry args={[0.06, OPENING_HEIGHT, WINDOW_DEPTH - 0.04]} />
        <meshStandardMaterial {...frameMaterial} roughness={0.9} />
      </mesh>
      <mesh position={[0, (OPENING_HEIGHT - 0.08) / 2, 0]} raycast={() => null}>
        <boxGeometry args={[OPENING_WIDTH - 0.12, 0.06, WINDOW_DEPTH - 0.04]} />
        <meshStandardMaterial {...frameMaterial} roughness={0.9} />
      </mesh>
      <mesh position={[0, -(OPENING_HEIGHT - 0.08) / 2, 0]} raycast={() => null}>
        <boxGeometry args={[OPENING_WIDTH - 0.12, 0.06, WINDOW_DEPTH - 0.04]} />
        <meshStandardMaterial {...frameMaterial} roughness={0.9} />
      </mesh>

      {/* --- Interior Trim (Crown Molding Style) --- */}
      <mesh position={[-(trimWidth - 0.12) / 2, 0, frontTrimZ + 0.01]} raycast={() => null}>
        <boxGeometry args={[0.18, trimHeight + 0.04, 0.04]} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
      <mesh position={[(trimWidth - 0.12) / 2, 0, frontTrimZ + 0.01]} raycast={() => null}>
        <boxGeometry args={[0.18, trimHeight + 0.04, 0.04]} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
      <group position={[0, (trimHeight - 0.02) / 2, frontTrimZ + 0.02]}>
        <mesh position={[0, 0.06, 0]} raycast={() => null}>
          <boxGeometry args={[trimWidth + 0.12, 0.08, 0.06]} />
          <meshStandardMaterial {...frameMaterial} />
        </mesh>
        <mesh position={[0, 0, -0.01]} raycast={() => null}>
          <boxGeometry args={[trimWidth + 0.04, 0.12, 0.04]} />
          <meshStandardMaterial {...frameMaterial} />
        </mesh>
      </group>

      {/* --- Glass Pane --- */}
      <mesh position={[0, 0, 0]} raycast={() => null}>
        <boxGeometry args={[OPENING_WIDTH - 0.04, OPENING_HEIGHT - 0.04, GLASS_THICKNESS]} />
        <meshPhysicalMaterial
          color={glassColor}
          emissive={glowColor}
          emissiveIntensity={mixNumber(0.4, 0, normalizedDaylightAmount)}
          metalness={0.05}
          roughness={mixNumber(0.12, 0.02, normalizedDaylightAmount)}
          clearcoat={1.0}
          clearcoatRoughness={0.02}
          transmission={mixNumber(0.15, 0.95, normalizedDaylightAmount)}
          thickness={0.24}
          ior={1.45}
          transparent
          opacity={mixNumber(0.35, 0.85, normalizedDaylightAmount)}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>

      {/* --- Mullions & Hardware --- */}
      <mesh position={[0, 0, 0.03]} raycast={() => null}>
        <boxGeometry args={[INNER_MULLION_WIDTH, OPENING_HEIGHT + 0.08, 0.04]} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
      {/* Central Latch/Handle */}
      <group position={[0, 0, 0.06]}>
        <mesh castShadow={shadowsEnabled}>
          <boxGeometry args={[0.06, 0.14, 0.03]} />
          <meshStandardMaterial color="#8a8a8a" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.03, 0.02]}>
          <boxGeometry args={[0.02, 0.06, 0.04]} />
          <meshStandardMaterial color="#666666" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* --- Premium Window Sill --- */}
      {/* Main Sill */}
      <mesh
        castShadow={shadowsEnabled}
        receiveShadow={shadowsEnabled}
        position={[0, -WINDOW_HEIGHT / 2 - 0.06, WINDOW_DEPTH * 0.44]}
      >
        <boxGeometry args={[WINDOW_WIDTH + 0.3, 0.12, 0.34]} />
        <meshStandardMaterial {...sillMaterial} />
      </mesh>
      {/* Rounded Edge Shadow (Subtle depth) */}
      <mesh
        position={[0, -WINDOW_HEIGHT / 2 - 0.12, WINDOW_DEPTH * 0.44]}
        raycast={() => null}
      >
        <boxGeometry args={[WINDOW_WIDTH + 0.2, 0.02, 0.3]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.15} />
      </mesh>
      {/* Detailed apron trim */}
      <mesh
        position={[0, -WINDOW_HEIGHT / 2 - 0.18, WINDOW_DEPTH * 0.32]}
        raycast={() => null}
      >
        <boxGeometry args={[WINDOW_WIDTH + 0.1, 0.08, 0.04]} />
        <meshStandardMaterial {...sillMaterial} />
      </mesh>

      {/* --- Ambient Occlusion / Shadow Planes --- */}
      <mesh position={[0, 0, -WINDOW_DEPTH / 2 + 0.01]} raycast={() => null}>
        <planeGeometry args={[OPENING_WIDTH, OPENING_HEIGHT]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.08} side={DoubleSide} />
      </mesh>

      {/* --- Night Sky/Glow --- */}
      {nightAmount > 0.02 ? (
        <>
          <mesh position={[0, 0, -WINDOW_DEPTH / 2 - 0.01]} raycast={() => null}>
            <planeGeometry args={[OPENING_WIDTH - 0.12, OPENING_HEIGHT - 0.12]} />
            <meshBasicMaterial
              color="#ffdfab"
              toneMapped={false}
              transparent
              opacity={skyCardOpacity}
              side={DoubleSide}
            />
          </mesh>
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
        </>
      ) : null}

      {/* --- Selection/Hover Highlight --- */}
      {(selected || hovered || interactionHovered || blocked) && (
        <mesh position={[0, 0, WINDOW_DEPTH / 2 + 0.04]} raycast={() => null}>
          <boxGeometry args={[WINDOW_WIDTH + 0.14, WINDOW_HEIGHT + 0.14, 0.02]} />
          <meshBasicMaterial
            color={blocked ? "#ff7b88" : selected ? "#5cff98" : "#7cc8ff"}
            transparent
            opacity={selected || blocked ? 0.28 : 0.18}
          />
        </mesh>
      )}
    </group>
  );
}
