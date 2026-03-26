import { Text, useTexture } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { SRGBColorSpace } from "three";
import { GlbAssetModel } from "./GlbAssetModel";
import { createCozyMaterialProps } from "./furnitureMaterials";

interface FurnitureModelProps {
  position?: [number, number, number];
  rotationY?: number;
  shadowsEnabled: boolean;
  selected?: boolean;
  hovered?: boolean;
  interactionHovered?: boolean;
  blocked?: boolean;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  memoryImageSrc?: string | null;
  memoryCaption?: string | null;
}

function createMaterialProps(
  blocked: boolean,
  selected: boolean,
  hovered: boolean,
  interactionHovered: boolean,
  baseColor: string,
  activeColor: string,
  hoverColor: string,
  blockedColor: string,
  options?: {
    roughness?: number;
    metalness?: number;
    opacity?: number;
    selectedOpacity?: number;
    hoveredOpacity?: number;
    interactionOpacity?: number;
    blockedOpacity?: number;
    emissiveColor?: string;
    activeEmissiveColor?: string;
    hoverEmissiveColor?: string;
    blockedEmissiveColor?: string;
    emissiveIntensity?: number;
    activeEmissiveIntensity?: number;
    hoverEmissiveIntensity?: number;
    blockedEmissiveIntensity?: number;
  }
) {
  return createCozyMaterialProps(
    { blocked, selected, hovered, interactionHovered },
    {
      baseColor,
      activeColor,
      hoverColor,
      blockedColor,
      ...options
    }
  );
}

export function BedModel({
  position = [0, 0, 0],
  rotationY = 0,
  shadowsEnabled,
  selected = false,
  hovered = false,
  interactionHovered = false,
  blocked = false,
  onPointerDown
}: FurnitureModelProps) {
  return (
    <GlbAssetModel
      blocked={blocked}
      fallbackColor="#ebe6e2"
      flatShading
      hovered={hovered}
      interactionHovered={interactionHovered}
      modelPath="/models/custom/bed.glb"
      modelRotationY={Math.PI}
      onPointerDown={onPointerDown}
      overlaySize={[2.98, 1.46, 3.98]}
      position={position}
      ringSize={[1.15, 1.64]}
      rotationY={rotationY}
      selected={selected}
      shadowsEnabled={shadowsEnabled}
      targetSize={{
        width: 2.84,
        height: 1.4,
        depth: 3.86
      }}
    />
  );
}

export function DeskModel({
  position = [0, 0, 0],
  rotationY = 0,
  shadowsEnabled,
  selected = false,
  hovered = false,
  interactionHovered = false,
  blocked = false,
  onPointerDown
}: FurnitureModelProps) {
  const wood = createMaterialProps(
    blocked,
    selected,
    hovered,
    interactionHovered,
    "#8a5d3d",
    "#57db8d",
    "#7bc4f8",
    "#ef6f7c",
    {
      roughness: 0.88,
      metalness: 0.03
    }
  );
  const darkWood = createMaterialProps(
    blocked,
    selected,
    hovered,
    interactionHovered,
    "#5b3a28",
    "#3fc67c",
    "#5a9edb",
    "#d55a68",
    {
      roughness: 0.9,
      metalness: 0.02
    }
  );
  const screen = createMaterialProps(
    blocked,
    selected,
    hovered,
    interactionHovered,
    "#31414b",
    "#71e2a3",
    "#8bcdf9",
    "#df7c87",
    {
      roughness: 0.26,
      metalness: 0.16
    }
  );
  const glow = createMaterialProps(
    blocked,
    selected,
    hovered,
    interactionHovered,
    "#c9e3eb",
    "#c0ffe0",
    "#ddf3ff",
    "#f7c0c8",
    {
      roughness: 0.18,
      metalness: 0.08,
      emissiveColor: "#8fbac7",
      emissiveIntensity: 0.34,
      activeEmissiveColor: "#baf3d0",
      activeEmissiveIntensity: 0.42,
      hoverEmissiveColor: "#d8f3ff",
      hoverEmissiveIntensity: 0.42,
      blockedEmissiveColor: "#d87f89",
      blockedEmissiveIntensity: 0.14
    }
  );

  const legOffsets: Array<[number, number, number]> = [
    [-1.14, 0.42, -0.32],
    [1.14, 0.42, -0.32],
    [-1.14, 0.42, 0.32],
    [1.14, 0.42, 0.32]
  ];

  return (
    <group position={position} rotation={[0, rotationY, 0]} onPointerDown={onPointerDown}>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.88, 0]}>
        <boxGeometry args={[2.72, 0.12, 0.92]} />
        <meshStandardMaterial {...wood} />
      </mesh>
      {legOffsets.map((legOffset) => (
        <mesh
          key={legOffset.join(":")}
          castShadow={shadowsEnabled}
          receiveShadow={shadowsEnabled}
          position={legOffset}
        >
          <boxGeometry args={[0.12, 0.84, 0.12]} />
          <meshStandardMaterial {...darkWood} />
        </mesh>
      ))}
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0.26, 1.18, -0.18]}>
        <boxGeometry args={[0.78, 0.48, 0.1]} />
        <meshStandardMaterial {...screen} />
      </mesh>
      <mesh position={[0.26, 1.17, -0.12]}>
        <boxGeometry args={[0.62, 0.34, 0.02]} />
        <meshStandardMaterial {...glow} />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0.26, 0.98, -0.22]}>
        <boxGeometry args={[0.18, 0.12, 0.12]} />
        <meshStandardMaterial {...darkWood} />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[-0.48, 0.97, 0.08]}>
        <boxGeometry args={[0.62, 0.04, 0.22]} />
        <meshStandardMaterial {...darkWood} />
      </mesh>
    </group>
  );
}

export function RugModel({
  position = [0, 0, 0],
  rotationY = 0,
  selected = false,
  hovered = false,
  interactionHovered = false,
  blocked = false,
  onPointerDown
}: FurnitureModelProps) {
  const topColor = blocked
    ? "#ef6f7c"
    : selected
      ? "#57db8d"
      : hovered
        ? "#88cffd"
        : interactionHovered
          ? "#88cffd"
        : "#d8c5ac";
  const stripeColor = blocked
    ? "#f3a0aa"
    : selected
      ? "#a4f5c2"
      : hovered
        ? "#d9f0ff"
        : interactionHovered
          ? "#d9f0ff"
        : "#f2e8d9";

  return (
    <group position={position} rotation={[0, rotationY, 0]} onPointerDown={onPointerDown}>
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[3.8, 0.04, 2.6]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(
            { blocked, selected, hovered, interactionHovered },
            {
              baseColor: topColor,
              roughness: 0.98,
              metalness: 0,
              selectedOpacity: 0.68,
              hoveredOpacity: 0.88
            }
          )}
        />
      </mesh>
      <mesh position={[0, 0.051, 0]}>
        <boxGeometry args={[3.05, 0.01, 1.84]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(
            { blocked, selected, hovered, interactionHovered },
            {
              baseColor: stripeColor,
              roughness: 0.99,
              metalness: 0,
              selectedOpacity: 0.8,
              hoveredOpacity: 0.92
            }
          )}
        />
      </mesh>
    </group>
  );
}

export function WallFrameModel({
  position = [0, 0, 0],
  rotationY = 0,
  shadowsEnabled,
  selected = false,
  hovered = false,
  interactionHovered = false,
  blocked = false,
  onPointerDown,
  memoryImageSrc = null,
  memoryCaption = null
}: FurnitureModelProps) {
  const frame = createMaterialProps(
    blocked,
    selected,
    hovered,
    interactionHovered,
    "#6b4a34",
    "#57db8d",
    "#7bc4f8",
    "#ef6f7c",
    {
      roughness: 0.88,
      metalness: 0.03
    }
  );
  const mat = createMaterialProps(
    blocked,
    selected,
    hovered,
    interactionHovered,
    "#f2eadf",
    "#bdf6d1",
    "#edf7ff",
    "#f5c0c8",
    {
      roughness: 0.97,
      metalness: 0.01
    }
  );
  const art = createMaterialProps(
    blocked,
    selected,
    hovered,
    interactionHovered,
    "#b28662",
    "#7ee2a4",
    "#a4d7fb",
    "#d86a76",
    {
      roughness: 0.9,
      metalness: 0.02
    }
  );

  return (
    <group position={position} rotation={[0, rotationY, 0]} onPointerDown={onPointerDown}>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled}>
        <boxGeometry args={[1.46, 1.1, 0.06]} />
        <meshStandardMaterial {...frame} />
      </mesh>
      <mesh position={[0, 0, 0.034]}>
        <boxGeometry args={[1.18, 0.82, 0.02]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {memoryImageSrc ? (
        <FrameMemoryArt imageSrc={memoryImageSrc} />
      ) : (
        <mesh position={[0, -0.02, 0.048]}>
          <boxGeometry args={[0.78, 0.44, 0.02]} />
          <meshStandardMaterial {...art} />
        </mesh>
      )}
      <mesh position={[0, 0.16, 0.05]}>
        <boxGeometry args={[0.42, 0.16, 0.02]} />
        <meshStandardMaterial {...frame} />
      </mesh>
      {memoryCaption ? (
        <Text
          anchorX="center"
          anchorY="middle"
          color={blocked ? "#f4c0c7" : "#5a473b"}
          fontSize={0.08}
          maxWidth={0.92}
          position={[0, -0.34, 0.06]}
        >
          {memoryCaption}
        </Text>
      ) : null}
      {selected || blocked || hovered || interactionHovered ? (
        <mesh position={[0, 0, 0.08]} raycast={() => null}>
          <boxGeometry args={[1.56, 1.2, 0.01]} />
          <meshBasicMaterial
            color={blocked ? "#ff7b88" : selected ? "#5cff98" : "#7cc8ff"}
            transparent
            opacity={selected || blocked ? 0.3 : interactionHovered ? 0.12 : 0.18}
          />
        </mesh>
      ) : null}
    </group>
  );
}

function FrameMemoryArt({ imageSrc }: { imageSrc: string }) {
  const texture = useTexture(imageSrc);

  texture.colorSpace = SRGBColorSpace;

  return (
    <mesh position={[0, -0.02, 0.049]}>
      <planeGeometry args={[0.78, 0.44]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
