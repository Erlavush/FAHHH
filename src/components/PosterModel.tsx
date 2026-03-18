import type { ThreeEvent } from "@react-three/fiber";

interface PosterModelProps {
  position?: [number, number, number];
  rotationY?: number;
  shadowsEnabled: boolean;
  selected?: boolean;
  blocked?: boolean;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
}

export function PosterModel({
  position = [0, 0, 0],
  rotationY = 0,
  shadowsEnabled,
  selected = false,
  blocked = false,
  onPointerDown
}: PosterModelProps) {
  const frameColor = blocked ? "#d55a68" : selected ? "#57db8d" : "#895f49";
  const printColor = blocked ? "#ef92a0" : selected ? "#9cf3ba" : "#f5d8b3";
  const accentColor = blocked ? "#b24552" : selected ? "#35b56f" : "#c77949";

  return (
    <group position={position} rotation={[0, rotationY, 0]} onPointerDown={onPointerDown}>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0, 0]}>
        <boxGeometry args={[1.94, 1.54, 0.06]} />
        <meshStandardMaterial
          color={frameColor}
          transparent={selected || blocked}
          opacity={selected || blocked ? 0.72 : 1}
        />
      </mesh>

      <mesh position={[0, 0, 0.035]}>
        <boxGeometry args={[1.72, 1.32, 0.02]} />
        <meshStandardMaterial
          color={printColor}
          transparent={selected || blocked}
          opacity={selected || blocked ? 0.78 : 1}
        />
      </mesh>

      <mesh position={[0, 0.25, 0.05]}>
        <boxGeometry args={[1.18, 0.18, 0.02]} />
        <meshStandardMaterial
          color={accentColor}
          transparent={selected || blocked}
          opacity={selected || blocked ? 0.82 : 1}
        />
      </mesh>

      <mesh position={[-0.42, -0.11, 0.05]}>
        <boxGeometry args={[0.34, 0.46, 0.02]} />
        <meshStandardMaterial
          color={blocked ? "#f5b7c1" : selected ? "#bff6d2" : "#f7eee2"}
          transparent={selected || blocked}
          opacity={selected || blocked ? 0.82 : 1}
        />
      </mesh>

      <mesh position={[0.38, -0.17, 0.05]}>
        <boxGeometry args={[0.44, 0.58, 0.02]} />
        <meshStandardMaterial
          color={blocked ? "#c16f7a" : selected ? "#71d99b" : "#d5a37e"}
          transparent={selected || blocked}
          opacity={selected || blocked ? 0.82 : 1}
        />
      </mesh>

      {selected || blocked ? (
        <mesh position={[0, 0, 0.08]}>
          <boxGeometry args={[2.04, 1.64, 0.01]} />
          <meshBasicMaterial
            color={blocked ? "#ff7b88" : "#5cff98"}
            transparent
            opacity={0.3}
          />
        </mesh>
      ) : null}
    </group>
  );
}
