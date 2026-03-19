import type { ThreeEvent } from "@react-three/fiber";

interface FurnitureModelProps {
  position?: [number, number, number];
  rotationY?: number;
  shadowsEnabled: boolean;
  selected?: boolean;
  blocked?: boolean;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
}

function createMaterialProps(
  blocked: boolean,
  selected: boolean,
  baseColor: string,
  activeColor: string,
  blockedColor: string
) {
  return {
    color: blocked ? blockedColor : selected ? activeColor : baseColor,
    transparent: selected || blocked,
    opacity: selected || blocked ? 0.72 : 1
  };
}

export function BedModel({
  position = [0, 0, 0],
  rotationY = 0,
  shadowsEnabled,
  selected = false,
  blocked = false,
  onPointerDown
}: FurnitureModelProps) {
  const frame = createMaterialProps(blocked, selected, "#af7b54", "#57db8d", "#ef6f7c");
  const sheet = createMaterialProps(blocked, selected, "#f4e9dc", "#9df2bf", "#f7b0ba");
  const blanket = createMaterialProps(blocked, selected, "#d1b59e", "#79e2a2", "#d65e6c");

  return (
    <group position={position} rotation={[0, rotationY, 0]} onPointerDown={onPointerDown}>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.32, 0]}>
        <boxGeometry args={[2.7, 0.28, 4.1]} />
        <meshStandardMaterial {...frame} />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.54, -0.15]}>
        <boxGeometry args={[2.5, 0.18, 3.2]} />
        <meshStandardMaterial {...sheet} />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.66, 0.95]}>
        <boxGeometry args={[2.42, 0.08, 1.4]} />
        <meshStandardMaterial {...blanket} />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.68, -1.55]}>
        <boxGeometry args={[2.32, 0.26, 0.72]} />
        <meshStandardMaterial {...frame} />
      </mesh>
    </group>
  );
}

export function DeskModel({
  position = [0, 0, 0],
  rotationY = 0,
  shadowsEnabled,
  selected = false,
  blocked = false,
  onPointerDown
}: FurnitureModelProps) {
  const wood = createMaterialProps(blocked, selected, "#ba865d", "#57db8d", "#ef6f7c");
  const darkWood = createMaterialProps(blocked, selected, "#8a5a39", "#3fc67c", "#d55a68");
  const screen = createMaterialProps(blocked, selected, "#3b4e67", "#71e2a3", "#df7c87");
  const glow = createMaterialProps(blocked, selected, "#97d1ee", "#c0ffe0", "#f7c0c8");

  const legOffsets: Array<[number, number, number]> = [
    [-1.06, 0.42, -0.42],
    [1.06, 0.42, -0.42],
    [-1.06, 0.42, 0.42],
    [1.06, 0.42, 0.42]
  ];

  return (
    <group position={position} rotation={[0, rotationY, 0]} onPointerDown={onPointerDown}>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.88, 0]}>
        <boxGeometry args={[2.5, 0.12, 1.12]} />
        <meshStandardMaterial {...wood} />
      </mesh>
      {legOffsets.map((legOffset) => (
        <mesh
          key={legOffset.join(":")}
          castShadow={shadowsEnabled}
          receiveShadow={shadowsEnabled}
          position={legOffset}
        >
          <boxGeometry args={[0.12, 0.84, 0.12]} />
          <meshStandardMaterial {...darkWood} />
        </mesh>
      ))}
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0.26, 1.18, -0.18]}>
        <boxGeometry args={[0.78, 0.48, 0.1]} />
        <meshStandardMaterial {...screen} />
      </mesh>
      <mesh position={[0.26, 1.17, -0.12]}>
        <boxGeometry args={[0.62, 0.34, 0.02]} />
        <meshStandardMaterial {...glow} />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0.26, 0.98, -0.22]}>
        <boxGeometry args={[0.18, 0.12, 0.12]} />
        <meshStandardMaterial {...darkWood} />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[-0.48, 0.97, 0.08]}>
        <boxGeometry args={[0.62, 0.04, 0.22]} />
        <meshStandardMaterial {...darkWood} />
      </mesh>
    </group>
  );
}

export function RugModel({
  position = [0, 0, 0],
  rotationY = 0,
  selected = false,
  blocked = false,
  onPointerDown
}: FurnitureModelProps) {
  const topColor = blocked ? "#ef6f7c" : selected ? "#57db8d" : "#d8c5ac";
  const stripeColor = blocked ? "#f3a0aa" : selected ? "#a4f5c2" : "#f2e8d9";

  return (
    <group position={position} rotation={[0, rotationY, 0]} onPointerDown={onPointerDown}>
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[3.8, 0.04, 2.6]} />
        <meshStandardMaterial
          color={topColor}
          transparent={selected || blocked}
          opacity={selected || blocked ? 0.68 : 1}
        />
      </mesh>
      <mesh position={[0, 0.051, 0]}>
        <boxGeometry args={[3.05, 0.01, 1.84]} />
        <meshStandardMaterial
          color={stripeColor}
          transparent={selected || blocked}
          opacity={selected || blocked ? 0.8 : 1}
        />
      </mesh>
    </group>
  );
}

export function WallFrameModel({
  position = [0, 0, 0],
  rotationY = 0,
  shadowsEnabled,
  selected = false,
  blocked = false,
  onPointerDown
}: FurnitureModelProps) {
  const frame = createMaterialProps(blocked, selected, "#8b6d53", "#57db8d", "#ef6f7c");
  const mat = createMaterialProps(blocked, selected, "#f8f2ea", "#bdf6d1", "#f5c0c8");
  const art = createMaterialProps(blocked, selected, "#c3926b", "#7ee2a4", "#d86a76");

  return (
    <group position={position} rotation={[0, rotationY, 0]} onPointerDown={onPointerDown}>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled}>
        <boxGeometry args={[1.46, 1.1, 0.06]} />
        <meshStandardMaterial {...frame} />
      </mesh>
      <mesh position={[0, 0, 0.034]}>
        <boxGeometry args={[1.18, 0.82, 0.02]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[0, -0.02, 0.048]}>
        <boxGeometry args={[0.78, 0.44, 0.02]} />
        <meshStandardMaterial {...art} />
      </mesh>
      <mesh position={[0, 0.16, 0.05]}>
        <boxGeometry args={[0.42, 0.16, 0.02]} />
        <meshStandardMaterial {...frame} />
      </mesh>
      {selected || blocked ? (
        <mesh position={[0, 0, 0.08]}>
          <boxGeometry args={[1.56, 1.2, 0.01]} />
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
