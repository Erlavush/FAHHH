import type { ThreeEvent } from "@react-three/fiber";
import { createCozyMaterialProps } from "./furnitureMaterials";

interface FloorLampModelProps {
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

export function FloorLampModel({
  position = [0, 0, 0],
  rotationY = 0,
  shadowsEnabled,
  selected = false,
  hovered = false,
  interactionHovered = false,
  blocked = false,
  onPointerDown,
  nightFactor = 0.5
}: FloorLampModelProps) {
  const materialState = { blocked, selected, hovered, interactionHovered };

  const baseMaterial = createCozyMaterialProps(materialState, {
    baseColor: "#4b3427",
    activeColor: "#5f9b75",
    hoverColor: "#75afe3",
    blockedColor: "#d86574",
    roughness: 0.82,
    metalness: 0.18
  });

  const accentMaterial = createCozyMaterialProps(materialState, {
    baseColor: "#7d5a3c",
    activeColor: "#7bc98f",
    hoverColor: "#9bcfff",
    blockedColor: "#ef9aa5",
    roughness: 0.62,
    metalness: 0.28
  });

  const stemMaterial = createCozyMaterialProps(materialState, {
    baseColor: "#231c18",
    activeColor: "#4f8d69",
    hoverColor: "#6aa8dc",
    blockedColor: "#c85f6d",
    roughness: 0.68,
    metalness: 0.22
  });

  const shadeMaterial = createCozyMaterialProps(materialState, {
    baseColor: "#efe0c6",
    activeColor: "#def5e6",
    hoverColor: "#e5f4ff",
    blockedColor: "#f4c9cf",
    roughness: 0.94,
    metalness: 0.01,
    emissiveColor: "#ffcb78",
    activeEmissiveColor: "#b8ffd0",
    hoverEmissiveColor: "#d6ecff",
    blockedEmissiveColor: "#ffc2ca",
    emissiveIntensity: 0.08 + nightFactor * 0.38,
    activeEmissiveIntensity: 0.16 + nightFactor * 0.42,
    hoverEmissiveIntensity: 0.12 + nightFactor * 0.4,
    blockedEmissiveIntensity: 0.04
  });

  const linerMaterial = createCozyMaterialProps(materialState, {
    baseColor: "#fff1cf",
    activeColor: "#effff3",
    hoverColor: "#f3faff",
    blockedColor: "#fff0f2",
    roughness: 0.86,
    metalness: 0,
    emissiveColor: "#ffb24f",
    activeEmissiveColor: "#a7ffc8",
    hoverEmissiveColor: "#c5e5ff",
    blockedEmissiveColor: "#ffb8c0",
    emissiveIntensity: 0.18 + nightFactor * 0.72,
    activeEmissiveIntensity: 0.24 + nightFactor * 0.78,
    hoverEmissiveIntensity: 0.22 + nightFactor * 0.76,
    blockedEmissiveIntensity: 0.08
  });

  const bulbMaterial = createCozyMaterialProps(materialState, {
    baseColor: "#fff7df",
    activeColor: "#f0fff5",
    hoverColor: "#f2f8ff",
    blockedColor: "#fff1f3",
    roughness: 0.2,
    metalness: 0,
    emissiveColor: "#ffbf67",
    activeEmissiveColor: "#b0ffd0",
    hoverEmissiveColor: "#cfe7ff",
    blockedEmissiveColor: "#ffb2bb",
    emissiveIntensity: 0.45 + nightFactor * 1.15,
    activeEmissiveIntensity: 0.55 + nightFactor * 1.2,
    hoverEmissiveIntensity: 0.52 + nightFactor * 1.18,
    blockedEmissiveIntensity: 0.16
  });

  const lampGlowAmount = Math.max(0, nightFactor - 0.08) / 0.92;
  const lightIntensity = lampGlowAmount * 1.7;
  const shouldRenderLampLight =
    lightIntensity > 0.02 || selected || hovered || interactionHovered;

  return (
    <group position={position} rotation={[0, rotationY, 0]} onPointerDown={onPointerDown}>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.26, 0.3, 0.06, 14]} />
        <meshStandardMaterial {...baseMaterial} />
      </mesh>

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.075, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.04, 12]} />
        <meshStandardMaterial {...accentMaterial} />
      </mesh>

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.63, 0]}>
        <cylinderGeometry args={[0.04, 0.055, 1.02, 10]} />
        <meshStandardMaterial {...stemMaterial} />
      </mesh>

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 1.28, 0]}>
        <cylinderGeometry args={[0.026, 0.04, 0.28, 10]} />
        <meshStandardMaterial {...stemMaterial} />
      </mesh>

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 1.46, 0]}>
        <cylinderGeometry args={[0.07, 0.05, 0.09, 10]} />
        <meshStandardMaterial {...accentMaterial} />
      </mesh>

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 1.81, 0]}>
        <cylinderGeometry args={[0.22, 0.34, 0.54, 16]} />
        <meshStandardMaterial {...shadeMaterial} />
      </mesh>

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 2.09, 0]}>
        <cylinderGeometry args={[0.11, 0.15, 0.05, 12]} />
        <meshStandardMaterial {...accentMaterial} />
      </mesh>

      <mesh position={[0, 1.76, 0]}>
        <cylinderGeometry args={[0.16, 0.24, 0.34, 12]} />
        <meshStandardMaterial {...linerMaterial} toneMapped={false} />
      </mesh>

      <mesh position={[0, 1.72, 0]}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshStandardMaterial {...bulbMaterial} toneMapped={false} />
      </mesh>

      {shouldRenderLampLight ? (
        <pointLight
          position={[0, 1.74, 0]}
          color="#ffcb86"
          intensity={lightIntensity}
          distance={6.6}
          decay={2}
          castShadow={false}
        />
      ) : null}

      {selected || blocked || hovered || interactionHovered ? (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[0.35, 0.46, 28]} />
          <meshBasicMaterial
            color={blocked ? "#ff7b88" : selected ? "#5cff98" : "#7cc8ff"}
            transparent
            opacity={selected || blocked ? 1 : interactionHovered ? 0.35 : 0.7}
          />
        </mesh>
      ) : null}
    </group>
  );
}
