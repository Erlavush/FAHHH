import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { createCozyMaterialProps } from "./furnitureMaterials";

interface CeilingFurnitureModelProps {
  position?: [number, number, number];
  rotationY?: number;
  shadowsEnabled: boolean;
  selected?: boolean;
  hovered?: boolean;
  interactionHovered?: boolean;
  blocked?: boolean;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  nightFactor?: number;
}

function createHighlightColor(
  blocked: boolean,
  selected: boolean,
  hovered: boolean,
  interactionHovered: boolean
): string {
  if (blocked) {
    return "#ff7b88";
  }

  if (selected) {
    return "#5cff98";
  }

  if (hovered || interactionHovered) {
    return "#7cc8ff";
  }

  return "#ffffff";
}

function CeilingMountHighlight({
  blocked = false,
  selected = false,
  hovered = false,
  interactionHovered = false
}: Pick<
  CeilingFurnitureModelProps,
  "blocked" | "selected" | "hovered" | "interactionHovered"
>) {
  if (!selected && !blocked && !hovered && !interactionHovered) {
    return null;
  }

  return (
    <mesh position={[0, -0.01, 0]} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
      <ringGeometry args={[0.28, 0.4, 28]} />
      <meshBasicMaterial
        color={createHighlightColor(blocked, selected, hovered, interactionHovered)}
        transparent
        opacity={selected || blocked ? 0.9 : interactionHovered ? 0.35 : 0.65}
      />
    </mesh>
  );
}

export function CeilingLightModel({
  position = [0, 0, 0],
  rotationY = 0,
  shadowsEnabled,
  selected = false,
  hovered = false,
  interactionHovered = false,
  blocked = false,
  onPointerDown,
  nightFactor = 0.5
}: CeilingFurnitureModelProps) {
  const materialState = { blocked, selected, hovered, interactionHovered };

  const mountMaterial = createCozyMaterialProps(materialState, {
    baseColor: "#4a3529",
    activeColor: "#5f9b75",
    hoverColor: "#75afe3",
    blockedColor: "#d86574",
    roughness: 0.8,
    metalness: 0.18
  });
  const stemMaterial = createCozyMaterialProps(materialState, {
    baseColor: "#241d18",
    activeColor: "#4f8d69",
    hoverColor: "#6aa8dc",
    blockedColor: "#c85f6d",
    roughness: 0.66,
    metalness: 0.22
  });
  const glassMaterial = createCozyMaterialProps(materialState, {
    baseColor: "#f2dfbf",
    activeColor: "#def5e6",
    hoverColor: "#e6f4ff",
    blockedColor: "#f5c8cf",
    roughness: 0.62,
    metalness: 0.04,
    opacity: 0.92,
    selectedOpacity: 0.82,
    hoveredOpacity: 0.88,
    interactionOpacity: 0.84,
    blockedOpacity: 0.74,
    emissiveColor: "#ffbf72",
    activeEmissiveColor: "#b6ffd0",
    hoverEmissiveColor: "#d8eeff",
    blockedEmissiveColor: "#ffbcc4",
    emissiveIntensity: 0.12 + nightFactor * 0.46,
    activeEmissiveIntensity: 0.18 + nightFactor * 0.52,
    hoverEmissiveIntensity: 0.16 + nightFactor * 0.5,
    blockedEmissiveIntensity: 0.06
  });
  const bulbMaterial = createCozyMaterialProps(materialState, {
    baseColor: "#fff5dd",
    activeColor: "#effff4",
    hoverColor: "#f4f9ff",
    blockedColor: "#fff0f2",
    roughness: 0.18,
    metalness: 0,
    emissiveColor: "#ffbe63",
    activeEmissiveColor: "#b3ffd1",
    hoverEmissiveColor: "#d0e8ff",
    blockedEmissiveColor: "#ffb2bc",
    emissiveIntensity: 0.42 + nightFactor * 1.08,
    activeEmissiveIntensity: 0.54 + nightFactor * 1.12,
    hoverEmissiveIntensity: 0.5 + nightFactor * 1.1,
    blockedEmissiveIntensity: 0.14
  });

  const glowAmount = Math.max(0, nightFactor - 0.06) / 0.94;
  const lightIntensity = glowAmount * 2.25;
  const shouldRenderLampLight =
    lightIntensity > 0.02 || selected || hovered || interactionHovered;

  return (
    <group position={position} rotation={[0, rotationY, 0]} onPointerDown={onPointerDown}>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.2, 0.24, 0.1, 16]} />
        <meshStandardMaterial {...mountMaterial} />
      </mesh>

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, -0.24, 0]}>
        <cylinderGeometry args={[0.035, 0.045, 0.28, 10]} />
        <meshStandardMaterial {...stemMaterial} />
      </mesh>

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, -0.49, 0]}>
        <cylinderGeometry args={[0.18, 0.14, 0.18, 12]} />
        <meshStandardMaterial {...mountMaterial} />
      </mesh>

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, -0.67, 0]}>
        <sphereGeometry args={[0.34, 18, 14, 0, Math.PI * 2, 0.25, Math.PI / 1.5]} />
        <meshStandardMaterial {...glassMaterial} side={2} />
      </mesh>

      <mesh position={[0, -0.61, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial {...bulbMaterial} toneMapped={false} />
      </mesh>

      {shouldRenderLampLight ? (
        <pointLight
          position={[0, -0.58, 0]}
          color="#ffd099"
          intensity={lightIntensity}
          distance={7.6}
          decay={2}
          castShadow={false}
        />
      ) : null}

      <CeilingMountHighlight
        blocked={blocked}
        selected={selected}
        hovered={hovered}
        interactionHovered={interactionHovered}
      />
    </group>
  );
}

export function CeilingFanModel({
  position = [0, 0, 0],
  rotationY = 0,
  shadowsEnabled,
  selected = false,
  hovered = false,
  interactionHovered = false,
  blocked = false,
  onPointerDown
}: CeilingFurnitureModelProps) {
  const bladeGroupRef = useRef<Group | null>(null);
  const materialState = { blocked, selected, hovered, interactionHovered };

  const mountMaterial = createCozyMaterialProps(materialState, {
    baseColor: "#4f392d",
    activeColor: "#63a37b",
    hoverColor: "#7ab4e7",
    blockedColor: "#d96474",
    roughness: 0.78,
    metalness: 0.22
  });
  const bladeMaterial = createCozyMaterialProps(materialState, {
    baseColor: "#876245",
    activeColor: "#78c791",
    hoverColor: "#9ad1ff",
    blockedColor: "#ed9ca7",
    roughness: 0.88,
    metalness: 0.05
  });
  const hubMaterial = createCozyMaterialProps(materialState, {
    baseColor: "#2d241d",
    activeColor: "#4e8d69",
    hoverColor: "#6aa8dc",
    blockedColor: "#c75d6c",
    roughness: 0.6,
    metalness: 0.32
  });

  useFrame((_, delta) => {
    if (!bladeGroupRef.current) {
      return;
    }

    bladeGroupRef.current.rotation.y += delta * 3.2;
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]} onPointerDown={onPointerDown}>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.1, 16]} />
        <meshStandardMaterial {...mountMaterial} />
      </mesh>

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, -0.24, 0]}>
        <cylinderGeometry args={[0.03, 0.038, 0.26, 10]} />
        <meshStandardMaterial {...hubMaterial} />
      </mesh>

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, -0.41, 0]}>
        <sphereGeometry args={[0.17, 12, 12]} />
        <meshStandardMaterial {...mountMaterial} />
      </mesh>

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, -0.56, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.26, 12]} />
        <meshStandardMaterial {...hubMaterial} />
      </mesh>

      <group ref={bladeGroupRef} position={[0, -0.48, 0]}>
        {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((bladeRotation, index) => (
          <group key={index} rotation={[0.12, bladeRotation, 0]}>
            <mesh
              castShadow={shadowsEnabled}
              receiveShadow={shadowsEnabled}
              position={[0, 0, 0.9]}
            >
              <boxGeometry args={[0.18, 0.03, 1.6]} />
              <meshStandardMaterial {...bladeMaterial} />
            </mesh>
          </group>
        ))}
      </group>

      <CeilingMountHighlight
        blocked={blocked}
        selected={selected}
        hovered={hovered}
        interactionHovered={interactionHovered}
      />
    </group>
  );
}

export function HangingPlantModel({
  position = [0, 0, 0],
  rotationY = 0,
  shadowsEnabled,
  selected = false,
  hovered = false,
  interactionHovered = false,
  blocked = false,
  onPointerDown
}: CeilingFurnitureModelProps) {
  const materialState = { blocked, selected, hovered, interactionHovered };

  const mountMaterial = createCozyMaterialProps(materialState, {
    baseColor: "#4b3427",
    activeColor: "#5f9b75",
    hoverColor: "#75afe3",
    blockedColor: "#d86574",
    roughness: 0.82,
    metalness: 0.16
  });
  const ropeMaterial = createCozyMaterialProps(materialState, {
    baseColor: "#8c6a4d",
    activeColor: "#7bc98f",
    hoverColor: "#9bcfff",
    blockedColor: "#ef9aa5",
    roughness: 0.92,
    metalness: 0.02
  });
  const basketMaterial = createCozyMaterialProps(materialState, {
    baseColor: "#795233",
    activeColor: "#70c688",
    hoverColor: "#90cbff",
    blockedColor: "#eb95a0",
    roughness: 0.86,
    metalness: 0.06
  });
  const leafMaterial = createCozyMaterialProps(materialState, {
    baseColor: "#537c43",
    activeColor: "#72d287",
    hoverColor: "#8fd0ff",
    blockedColor: "#ef93a0",
    roughness: 0.94,
    metalness: 0.02
  });

  const ropeOffsets: Array<[number, number]> = [
    [-0.17, -0.17],
    [0.17, -0.17],
    [-0.17, 0.17],
    [0.17, 0.17]
  ];
  const leafOffsets: Array<[number, number, number, number]> = [
    [-0.18, -0.9, 0.1, 0.22],
    [0.16, -0.84, 0.08, -0.12],
    [-0.08, -1.02, -0.14, 0.08],
    [0.09, -0.98, -0.18, -0.18],
    [0, -0.76, 0.2, 0]
  ];

  return (
    <group position={position} rotation={[0, rotationY, 0]} onPointerDown={onPointerDown}>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 0.1, 14]} />
        <meshStandardMaterial {...mountMaterial} />
      </mesh>

      {ropeOffsets.map(([offsetX, offsetZ]) => (
        <mesh
          key={`${offsetX}:${offsetZ}`}
          castShadow={shadowsEnabled}
          receiveShadow={shadowsEnabled}
          position={[offsetX, -0.33, offsetZ]}
        >
          <cylinderGeometry args={[0.014, 0.014, 0.56, 8]} />
          <meshStandardMaterial {...ropeMaterial} />
        </mesh>
      ))}

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, -0.68, 0]}>
        <cylinderGeometry args={[0.24, 0.3, 0.3, 18]} />
        <meshStandardMaterial {...basketMaterial} />
      </mesh>

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, -0.56, 0]}>
        <sphereGeometry args={[0.24, 14, 14]} />
        <meshStandardMaterial {...leafMaterial} />
      </mesh>

      {leafOffsets.map(([offsetX, offsetY, offsetZ, rotationOffset], index) => (
        <mesh
          key={index}
          castShadow={shadowsEnabled}
          receiveShadow={shadowsEnabled}
          position={[offsetX, offsetY, offsetZ]}
          rotation={[0.18, rotationOffset, 0]}
        >
          <sphereGeometry args={[0.12, 10, 10]} />
          <meshStandardMaterial {...leafMaterial} />
        </mesh>
      ))}

      <CeilingMountHighlight
        blocked={blocked}
        selected={selected}
        hovered={hovered}
        interactionHovered={interactionHovered}
      />
    </group>
  );
}
