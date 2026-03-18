import type { ThreeEvent } from "@react-three/fiber";

interface SmallTableModelProps {
  position?: [number, number, number];
  rotationY?: number;
  shadowsEnabled: boolean;
  selected?: boolean;
  blocked?: boolean;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
}

export function SmallTableModel({
  position = [0, 0, 0],
  rotationY = 0,
  shadowsEnabled,
  selected = false,
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
        <boxGeometry args={[0.92, 0.1, 0.92]} />
        <meshStandardMaterial
          color={blocked ? "#ef6f7c" : selected ? "#57db8d" : "#d4b28c"}
          transparent={selected || blocked}
          opacity={selected || blocked ? 0.72 : 1}
        />
      </mesh>

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.68, 0]}>
        <boxGeometry args={[0.74, 0.04, 0.74]} />
        <meshStandardMaterial
          color={blocked ? "#f19ba4" : selected ? "#8ef0b0" : "#f0dbc0"}
          transparent={selected || blocked}
          opacity={selected || blocked ? 0.72 : 1}
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
            color={blocked ? "#c94c58" : selected ? "#3bad68" : "#b1855f"}
            transparent={selected || blocked}
            opacity={selected || blocked ? 0.72 : 1}
          />
        </mesh>
      ))}

      {selected || blocked ? (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.52, 32]} />
          <meshBasicMaterial color={blocked ? "#ff7b88" : "#5cff98"} />
        </mesh>
      ) : null}
    </group>
  );
}
