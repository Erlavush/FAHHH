import type { ThreeEvent } from "@react-three/fiber";

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
          color={
            blocked
              ? "#ef6f7c"
              : selected
                ? "#57db8d"
                : hovered
                  ? "#7bc4f8"
                  : interactionHovered
                    ? "#7bc4f8"
                    : "#c68857"
          }
          transparent={selected || blocked || hovered || interactionHovered}
          opacity={selected || blocked ? 0.72 : hovered ? 0.9 : interactionHovered ? 0.8 : 1}
        />
      </mesh>

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.96, -0.25]}>
        <boxGeometry args={[0.78, 0.8, 0.1]} />
        <meshStandardMaterial
          color={
            blocked
              ? "#dd5a67"
              : selected
                ? "#49c87d"
                : hovered
                  ? "#5ca8e6"
                  : interactionHovered
                    ? "#5ca8e6"
                    : "#b47548"
          }
          transparent={selected || blocked || hovered || interactionHovered}
          opacity={selected || blocked ? 0.72 : hovered ? 0.9 : interactionHovered ? 0.8 : 1}
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
            color={
              blocked
                ? "#c94c58"
                : selected
                  ? "#3bad68"
                  : hovered
                    ? "#4f92ca"
                    : interactionHovered
                      ? "#4f92ca"
                      : "#99643f"
            }
            transparent={selected || blocked || hovered || interactionHovered}
            opacity={selected || blocked ? 0.72 : hovered ? 0.9 : interactionHovered ? 0.8 : 1}
          />
        </mesh>
      ))}

      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.44, 0]}>
        <boxGeometry args={[0.64, 0.04, 0.64]} />
        <meshStandardMaterial
          color={
            blocked
              ? "#f19ba4"
              : selected
                ? "#8ef0b0"
                : hovered
                  ? "#d8efff"
                  : interactionHovered
                    ? "#d8efff"
                    : "#d9b38a"
          }
          transparent={selected || blocked || hovered || interactionHovered}
          opacity={selected || blocked ? 0.72 : hovered ? 0.92 : interactionHovered ? 0.8 : 1}
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
