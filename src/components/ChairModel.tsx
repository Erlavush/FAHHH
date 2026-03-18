import type { ThreeEvent } from "@react-three/fiber";

interface ChairModelProps {
  position?: [number, number, number];
  rotationY?: number;
  shadowsEnabled: boolean;
  selected?: boolean;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
}

export function ChairModel({
  position = [2, 0, 0],
  rotationY = 0,
  shadowsEnabled,
  selected = false,
  onPointerDown
}: ChairModelProps) {
  const legOffsets: Array<[number, number, number]> = [
    [-0.28, 0.24, -0.28],
    [0.28, 0.24, -0.28],
    [-0.28, 0.24, 0.28],
    [0.28, 0.24, 0.28]
  ];

  return (
    <group position={position} rotation={[0, rotationY, 0]} onPointerDown={onPointerDown}>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.52, 0]}>
        <boxGeometry args={[0.86, 0.1, 0.86]} />
        <meshStandardMaterial
          color={selected ? "#57db8d" : "#c68857"}
          transparent={selected}
          opacity={selected ? 0.72 : 1}
        />
      </mesh>

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.96, -0.31]}>
        <boxGeometry args={[0.86, 0.8, 0.12]} />
        <meshStandardMaterial
          color={selected ? "#49c87d" : "#b47548"}
          transparent={selected}
          opacity={selected ? 0.72 : 1}
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
            color={selected ? "#3bad68" : "#99643f"}
            transparent={selected}
            opacity={selected ? 0.72 : 1}
          />
        </mesh>
      ))}

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.44, 0]}>
        <boxGeometry args={[0.72, 0.04, 0.72]} />
        <meshStandardMaterial
          color={selected ? "#8ef0b0" : "#d9b38a"}
          transparent={selected}
          opacity={selected ? 0.72 : 1}
        />
      </mesh>

      {selected ? (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.52, 32]} />
          <meshBasicMaterial color="#5cff98" />
        </mesh>
      ) : null}
    </group>
  );
}
