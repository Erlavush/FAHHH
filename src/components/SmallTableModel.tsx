import type { ThreeEvent } from "@react-three/fiber";

interface SmallTableModelProps {
  position?: [number, number, number];
  rotationY?: number;
  shadowsEnabled: boolean;
  selected?: boolean;
  hovered?: boolean;
  blocked?: boolean;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
}

export function SmallTableModel({
  position = [0, 0, 0],
  rotationY = 0,
  shadowsEnabled,
  selected = false,
  hovered = false,
  blocked = false,
  onPointerDown
}: SmallTableModelProps) {
  const legOffsets: Array<[number, number, number]> = [
    [-0.3, 0.36, -0.3],
    [0.3, 0.36, -0.3],
    [-0.3, 0.36, 0.3],
    [0.3, 0.36, 0.3]
  ];

  return (
    <group position={position} rotation={[0, rotationY, 0]} onPointerDown={onPointerDown}>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.76, 0]}>
        <boxGeometry args={[1.02, 0.1, 0.92]} />
        <meshStandardMaterial
          color={blocked ? "#ef6f7c" : selected ? "#57db8d" : hovered ? "#7bc4f8" : "#d4b28c"}
          transparent={selected || blocked || hovered}
          opacity={selected || blocked ? 0.72 : hovered ? 0.9 : 1}
        />
      </mesh>

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.68, 0]}>
        <boxGeometry args={[0.74, 0.04, 0.74]} />
        <meshStandardMaterial
          color={blocked ? "#f19ba4" : selected ? "#8ef0b0" : hovered ? "#d8efff" : "#f0dbc0"}
          transparent={selected || blocked || hovered}
          opacity={selected || blocked ? 0.72 : hovered ? 0.92 : 1}
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
            color={blocked ? "#c94c58" : selected ? "#3bad68" : hovered ? "#4f92ca" : "#b1855f"}
            transparent={selected || blocked || hovered}
            opacity={selected || blocked ? 0.72 : hovered ? 0.9 : 1}
          />
        </mesh>
      ))}

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[-0.16, 1.01, -0.02]}>
        <cylinderGeometry args={[0.12, 0.16, 0.34, 10]} />
        <meshStandardMaterial
          color={blocked ? "#d98e98" : selected ? "#93efb6" : hovered ? "#e2f4ff" : "#f0e4d4"}
          transparent={selected || blocked || hovered}
          opacity={selected || blocked ? 0.76 : hovered ? 0.94 : 1}
        />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[-0.16, 1.22, -0.02]}>
        <coneGeometry args={[0.08, 0.28, 8]} />
        <meshStandardMaterial
          color={blocked ? "#cb5966" : selected ? "#4dd985" : hovered ? "#67bc90" : "#7fb26d"}
          transparent={selected || blocked || hovered}
          opacity={selected || blocked ? 0.78 : hovered ? 0.94 : 1}
        />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0.18, 0.95, 0.02]} rotation={[0, -0.18, 0]}>
        <boxGeometry args={[0.26, 0.38, 0.06]} />
        <meshStandardMaterial
          color={blocked ? "#d87784" : selected ? "#77e5a1" : hovered ? "#eef8ff" : "#f6efe4"}
          transparent={selected || blocked || hovered}
          opacity={selected || blocked ? 0.8 : hovered ? 0.95 : 1}
        />
      </mesh>
      <mesh position={[0.18, 0.95, 0.055]} rotation={[0, -0.18, 0]}>
        <boxGeometry args={[0.18, 0.28, 0.01]} />
        <meshStandardMaterial
          color={blocked ? "#f2c2c9" : selected ? "#c3f7d7" : hovered ? "#9dcdf4" : "#d2a97f"}
          transparent={selected || blocked || hovered}
          opacity={selected || blocked ? 0.84 : hovered ? 0.94 : 1}
        />
      </mesh>

      {selected || blocked || hovered ? (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.52, 32]} />
          <meshBasicMaterial
            color={blocked ? "#ff7b88" : selected ? "#5cff98" : "#7cc8ff"}
            transparent
            opacity={selected || blocked ? 1 : 0.7}
          />
        </mesh>
      ) : null}
    </group>
  );
}
