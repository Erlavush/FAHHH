import type { ThreeEvent } from "@react-three/fiber";
import { createCozyMaterialProps } from "./furnitureMaterials";

interface SmallTableModelProps {
  position?: [number, number, number];
  rotationY?: number;
  shadowsEnabled: boolean;
  selected?: boolean;
  hovered?: boolean;
  interactionHovered?: boolean;
  blocked?: boolean;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
}

export function SmallTableModel({
  position = [0, 0, 0],
  rotationY = 0,
  shadowsEnabled,
  selected = false,
  hovered = false,
  interactionHovered = false,
  blocked = false,
  onPointerDown
}: SmallTableModelProps) {
  const materialState = { blocked, selected, hovered, interactionHovered };
  const legOffsets: Array<[number, number, number]> = [
    [-0.26, 0.36, -0.26],
    [0.26, 0.36, -0.26],
    [-0.26, 0.36, 0.26],
    [0.26, 0.36, 0.26]
  ];

  return (
    <group position={position} rotation={[0, rotationY, 0]} onPointerDown={onPointerDown}>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.76, 0]}>
        <boxGeometry args={[0.9, 0.1, 0.9]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: "#8d6547",
            roughness: 0.9,
            metalness: 0.03
          })}
        />
      </mesh>

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.68, 0]}>
        <boxGeometry args={[0.62, 0.04, 0.62]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: "#d8c2a6",
            roughness: 0.98,
            metalness: 0.01,
            hoveredOpacity: 0.92
          })}
        />
      </mesh>

      {legOffsets.map((legOffset) => (
        <mesh
          key={legOffset.join(":")}
          castShadow={shadowsEnabled}
          receiveShadow={shadowsEnabled}
          position={legOffset}
        >
          <boxGeometry args={[0.12, 0.72, 0.12]} />
          <meshStandardMaterial
            {...createCozyMaterialProps(materialState, {
              baseColor: "#6a4731",
              activeColor: "#3bad68",
              hoverColor: "#4f92ca",
              blockedColor: "#c94c58",
              roughness: 0.94,
              metalness: 0.02
            })}
          />
        </mesh>
      ))}

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[-0.16, 1.01, -0.02]}>
        <cylinderGeometry args={[0.12, 0.16, 0.34, 10]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: "#e9dfd1",
            activeColor: "#93efb6",
            hoverColor: "#e2f4ff",
            blockedColor: "#d98e98",
            roughness: 0.96,
            metalness: 0.02,
            selectedOpacity: 0.76,
            hoveredOpacity: 0.94
          })}
        />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[-0.16, 1.22, -0.02]}>
        <coneGeometry args={[0.08, 0.28, 8]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: "#667f4c",
            activeColor: "#4dd985",
            hoverColor: "#67bc90",
            blockedColor: "#cb5966",
            roughness: 0.92,
            metalness: 0.01,
            selectedOpacity: 0.78,
            hoveredOpacity: 0.94
          })}
        />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0.18, 0.95, 0.02]} rotation={[0, -0.18, 0]}>
        <boxGeometry args={[0.26, 0.38, 0.06]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: "#f1e5d7",
            activeColor: "#77e5a1",
            hoverColor: "#eef8ff",
            blockedColor: "#d87784",
            roughness: 0.97,
            metalness: 0.01,
            selectedOpacity: 0.8,
            hoveredOpacity: 0.95
          })}
        />
      </mesh>
      <mesh position={[0.18, 0.95, 0.055]} rotation={[0, -0.18, 0]}>
        <boxGeometry args={[0.18, 0.28, 0.01]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: "#c4936f",
            activeColor: "#c3f7d7",
            hoverColor: "#9dcdf4",
            blockedColor: "#f2c2c9",
            roughness: 0.9,
            metalness: 0.02,
            selectedOpacity: 0.84,
            hoveredOpacity: 0.94
          })}
        />
      </mesh>

      {selected || blocked || hovered || interactionHovered ? (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[0.42, 0.52, 32]} />
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
