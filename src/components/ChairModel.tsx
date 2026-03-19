import type { ThreeEvent } from "@react-three/fiber";

interface ChairModelProps {
  position?: [number, number, number];
  rotationY?: number;
  shadowsEnabled: boolean;
  selected?: boolean;
  hovered?: boolean;
  blocked?: boolean;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
}

export function ChairModel({
  position = [2, 0, 0],
  rotationY = 0,
  shadowsEnabled,
  selected = false,
  hovered = false,
  blocked = false,
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
          color={blocked ? "#ef6f7c" : selected ? "#57db8d" : hovered ? "#7bc4f8" : "#c68857"}
          transparent={selected || blocked || hovered}
          opacity={selected || blocked ? 0.72 : hovered ? 0.9 : 1}
        />
      </mesh>

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.96, -0.31]}>
        <boxGeometry args={[0.86, 0.8, 0.12]} />
        <meshStandardMaterial
          color={blocked ? "#dd5a67" : selected ? "#49c87d" : hovered ? "#5ca8e6" : "#b47548"}
          transparent={selected || blocked || hovered}
          opacity={selected || blocked ? 0.72 : hovered ? 0.9 : 1}
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
            color={blocked ? "#c94c58" : selected ? "#3bad68" : hovered ? "#4f92ca" : "#99643f"}
            transparent={selected || blocked || hovered}
            opacity={selected || blocked ? 0.72 : hovered ? 0.9 : 1}
          />
        </mesh>
      ))}

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.44, 0]}>
        <boxGeometry args={[0.72, 0.04, 0.72]} />
        <meshStandardMaterial
          color={blocked ? "#f19ba4" : selected ? "#8ef0b0" : hovered ? "#d8efff" : "#d9b38a"}
          transparent={selected || blocked || hovered}
          opacity={selected || blocked ? 0.72 : hovered ? 0.92 : 1}
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
