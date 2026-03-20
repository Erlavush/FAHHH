import type { ThreeEvent } from "@react-three/fiber";
import { createCozyMaterialProps } from "./furnitureMaterials";

interface PosterModelProps {
  position?: [number, number, number];
  rotationY?: number;
  shadowsEnabled: boolean;
  selected?: boolean;
  hovered?: boolean;
  interactionHovered?: boolean;
  blocked?: boolean;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
}

export function PosterModel({
  position = [0, 0, 0],
  rotationY = 0,
  shadowsEnabled,
  selected = false,
  hovered = false,
  interactionHovered = false,
  blocked = false,
  onPointerDown
}: PosterModelProps) {
  const materialState = { blocked, selected, hovered, interactionHovered };
  const frameColor = blocked
    ? "#d55a68"
    : selected
      ? "#57db8d"
      : hovered || interactionHovered
        ? "#76c0f5"
        : "#684735";
  const printColor = blocked
    ? "#ef92a0"
    : selected
      ? "#9cf3ba"
      : hovered || interactionHovered
        ? "#e7f5ff"
        : "#ebd7b8";
  const accentColor = blocked
    ? "#b24552"
    : selected
      ? "#35b56f"
      : hovered || interactionHovered
        ? "#8bc9f2"
        : "#986048";

  return (
    <group position={position} rotation={[0, rotationY, 0]} onPointerDown={onPointerDown}>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0, 0]}>
        <boxGeometry args={[1.94, 1.54, 0.06]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: frameColor,
            roughness: 0.88,
            metalness: 0.03
          })}
        />
      </mesh>

      <mesh position={[0, 0, 0.035]}>
        <boxGeometry args={[1.72, 1.32, 0.02]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: printColor,
            roughness: 0.96,
            metalness: 0.01,
            selectedOpacity: 0.78,
            hoveredOpacity: 0.94
          })}
        />
      </mesh>

      <mesh position={[0, 0.25, 0.05]}>
        <boxGeometry args={[1.18, 0.18, 0.02]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: accentColor,
            roughness: 0.88,
            metalness: 0.02,
            selectedOpacity: 0.82,
            hoveredOpacity: 0.94
          })}
        />
      </mesh>

      <mesh position={[-0.42, -0.11, 0.05]}>
        <boxGeometry args={[0.34, 0.46, 0.02]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: "#f1e8dc",
            activeColor: "#bff6d2",
            hoverColor: "#f8fdff",
            blockedColor: "#f5b7c1",
            roughness: 0.97,
            metalness: 0.01,
            selectedOpacity: 0.82,
            hoveredOpacity: 0.96
          })}
        />
      </mesh>

      <mesh position={[0.38, -0.17, 0.05]}>
        <boxGeometry args={[0.44, 0.58, 0.02]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: "#c39a76",
            activeColor: "#71d99b",
            hoverColor: "#a7d7f8",
            blockedColor: "#c16f7a",
            roughness: 0.9,
            metalness: 0.02,
            selectedOpacity: 0.82,
            hoveredOpacity: 0.94
          })}
        />
      </mesh>

      {selected || blocked || hovered || interactionHovered ? (
        <mesh position={[0, 0, 0.08]} raycast={() => null}>
          <boxGeometry args={[2.04, 1.64, 0.01]} />
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
