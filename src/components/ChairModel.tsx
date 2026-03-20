import type { ThreeEvent } from "@react-three/fiber";
import { createCozyMaterialProps } from "./furnitureMaterials";

interface ChairModelProps {
  position?: [number, number, number];
  rotationY?: number;
  shadowsEnabled: boolean;
  selected?: boolean;
  hovered?: boolean;
  interactionHovered?: boolean;
  blocked?: boolean;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
}

export function ChairModel({
  position = [2, 0, 0],
  rotationY = 0,
  shadowsEnabled,
  selected = false,
  hovered = false,
  interactionHovered = false,
  blocked = false,
  onPointerDown
}: ChairModelProps) {
  const materialState = { blocked, selected, hovered, interactionHovered };
  const legOffsets: Array<[number, number, number]> = [
    [-0.24, 0.24, -0.24],
    [0.24, 0.24, -0.24],
    [-0.24, 0.24, 0.24],
    [0.24, 0.24, 0.24]
  ];

  return (
    <group position={position} rotation={[0, rotationY, 0]} onPointerDown={onPointerDown}>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.52, 0]}>
        <boxGeometry args={[0.78, 0.1, 0.78]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: "#9b6b45",
            roughness: 0.9,
            metalness: 0.03
          })}
        />
      </mesh>

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.96, -0.25]}>
        <boxGeometry args={[0.78, 0.8, 0.1]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: "#7c5339",
            activeColor: "#49c87d",
            hoverColor: "#5ca8e6",
            blockedColor: "#dd5a67",
            roughness: 0.92,
            metalness: 0.02
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
          <boxGeometry args={[0.12, 0.48, 0.12]} />
          <meshStandardMaterial
            {...createCozyMaterialProps(materialState, {
              baseColor: "#5f3d2a",
              activeColor: "#3bad68",
              hoverColor: "#4f92ca",
              blockedColor: "#c94c58",
              roughness: 0.94,
              metalness: 0.02
            })}
          />
        </mesh>
      ))}

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.44, 0]}>
        <boxGeometry args={[0.64, 0.04, 0.64]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: "#c7af95",
            activeColor: "#8ef0b0",
            hoverColor: "#d8efff",
            blockedColor: "#f19ba4",
            roughness: 0.98,
            metalness: 0.01,
            hoveredOpacity: 0.92
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
