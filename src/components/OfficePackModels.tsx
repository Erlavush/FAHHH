import type { ThreeEvent } from "@react-three/fiber";
import { PackAssetModel } from "./PackAssetModel";
import { createCozyMaterialProps } from "./furnitureMaterials";

interface OfficePackModelProps {
  position?: [number, number, number];
  rotationY?: number;
  shadowsEnabled: boolean;
  selected?: boolean;
  hovered?: boolean;
  interactionHovered?: boolean;
  blocked?: boolean;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
}

export function OfficeDeskModel(props: OfficePackModelProps) {
  return (
    <PackAssetModel
      {...props}
      nodeNames={["OfficeTable", "Conputer"]}
      targetSize={{
        width: 2.85,
        height: 1.45,
        depth: 0.95
      }}
      overlaySize={[2.96, 1.48, 1.02]}
      ringSize={[0.54, 0.68]}
      fallbackColor="#b88a65"
    />
  );
}

export function OfficeChairModel(props: OfficePackModelProps) {
  return (
    <PackAssetModel
      {...props}
      nodeNames={["OfficeChair"]}
      targetSize={{
        width: 0.92,
        height: 1.18,
        depth: 0.92
      }}
      overlaySize={[0.98, 1.22, 0.98]}
      ringSize={[0.44, 0.58]}
      modelOffset={[0, -0.03, 0]}
      fallbackColor="#4b526f"
    />
  );
}

export function OfficeWardrobeModel(props: OfficePackModelProps) {
  const {
    position = [0, 0, 0],
    rotationY = 0,
    shadowsEnabled,
    selected = false,
    hovered = false,
    interactionHovered = false,
    blocked = false,
    onPointerDown
  } = props;
  const materialState = { blocked, selected, hovered, interactionHovered };

  return (
    <group position={position} rotation={[0, rotationY, 0]} onPointerDown={onPointerDown}>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 1.15, -0.35]}>
        <boxGeometry args={[1.2, 2.18, 0.08]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: "#6f523e",
            activeColor: "#46c779",
            hoverColor: "#64afe8",
            blockedColor: "#d85f6d",
            roughness: 0.93,
            metalness: 0.03
          })}
        />
      </mesh>

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[-0.61, 1.15, 0]}>
        <boxGeometry args={[0.1, 2.3, 0.82]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: "#7c5b44",
            activeColor: "#4bcb7f",
            hoverColor: "#6bb3ea",
            blockedColor: "#dc6472",
            roughness: 0.92,
            metalness: 0.03
          })}
        />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0.61, 1.15, 0]}>
        <boxGeometry args={[0.1, 2.3, 0.82]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: "#7c5b44",
            activeColor: "#4bcb7f",
            hoverColor: "#6bb3ea",
            blockedColor: "#dc6472",
            roughness: 0.92,
            metalness: 0.03
          })}
        />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 2.26, 0]}>
        <boxGeometry args={[1.32, 0.1, 0.86]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: "#8d694e",
            activeColor: "#56d58b",
            hoverColor: "#7fc2f3",
            blockedColor: "#e0717e",
            roughness: 0.88,
            metalness: 0.03
          })}
        />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.06, 0]}>
        <boxGeometry args={[1.32, 0.12, 0.86]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: "#6b4c39",
            activeColor: "#44be73",
            hoverColor: "#61aae4",
            blockedColor: "#d35b69",
            roughness: 0.92,
            metalness: 0.03
          })}
        />
      </mesh>

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[-0.3, 1.14, 0.39]}>
        <boxGeometry args={[0.58, 2.1, 0.05]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: "#c4b19f",
            activeColor: "#8fe9b2",
            hoverColor: "#e0f2ff",
            blockedColor: "#f0a3ac",
            roughness: 0.98,
            metalness: 0.01,
            hoveredOpacity: 0.95
          })}
        />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0.3, 1.14, 0.39]}>
        <boxGeometry args={[0.58, 2.1, 0.05]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: "#d4c2b1",
            activeColor: "#97eeb9",
            hoverColor: "#e7f5ff",
            blockedColor: "#f3adb6",
            roughness: 0.98,
            metalness: 0.01,
            hoveredOpacity: 0.95
          })}
        />
      </mesh>

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[-0.02, 1.14, 0.395]}>
        <boxGeometry args={[0.04, 2.12, 0.04]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: "#8a664b",
            roughness: 0.9,
            metalness: 0.02
          })}
        />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[-0.12, 1.14, 0.43]}>
        <boxGeometry args={[0.04, 0.36, 0.03]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: "#efe6d8",
            activeColor: "#c9f8dc",
            hoverColor: "#f1f9ff",
            blockedColor: "#f4c5cc",
            roughness: 0.85,
            metalness: 0.12
          })}
        />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0.12, 1.14, 0.43]}>
        <boxGeometry args={[0.04, 0.36, 0.03]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: "#efe6d8",
            activeColor: "#c9f8dc",
            hoverColor: "#f1f9ff",
            blockedColor: "#f4c5cc",
            roughness: 0.85,
            metalness: 0.12
          })}
        />
      </mesh>

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 2.34, 0]}>
        <boxGeometry args={[1.42, 0.06, 0.92]} />
        <meshStandardMaterial
          {...createCozyMaterialProps(materialState, {
            baseColor: "#d0bb9f",
            roughness: 0.96,
            metalness: 0.01
          })}
        />
      </mesh>

      {selected || blocked || hovered || interactionHovered ? (
        <>
          <mesh position={[0, 1.2, 0]} raycast={() => null}>
            <boxGeometry args={[1.52, 2.42, 0.9]} />
            <meshBasicMaterial
              color={blocked ? "#ff7b88" : selected ? "#5cff98" : "#7cc8ff"}
              transparent
              opacity={selected || blocked ? 0.14 : interactionHovered ? 0.08 : 0.1}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
            <ringGeometry args={[0.56, 0.72, 32]} />
            <meshBasicMaterial
              color={blocked ? "#ff7b88" : selected ? "#5cff98" : "#7cc8ff"}
              transparent
              opacity={selected || blocked ? 1 : interactionHovered ? 0.35 : 0.7}
            />
          </mesh>
        </>
      ) : null}
    </group>
  );
}
