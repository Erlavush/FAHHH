import type { ThreeEvent } from "@react-three/fiber";

interface SurfaceDecorModelProps {
  position?: [number, number, number];
  rotationY?: number;
  shadowsEnabled: boolean;
  selected?: boolean;
  hovered?: boolean;
  interactionHovered?: boolean;
  blocked?: boolean;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
}

function createDecorMaterial(
  blocked: boolean,
  selected: boolean,
  hovered: boolean,
  interactionHovered: boolean,
  baseColor: string,
  activeColor: string,
  hoverColor: string,
  blockedColor: string
) {
  return {
    color: blocked
      ? blockedColor
      : selected
        ? activeColor
        : hovered || interactionHovered
          ? hoverColor
          : baseColor,
    transparent: selected || blocked || hovered || interactionHovered,
    opacity: selected || blocked ? 0.76 : hovered ? 0.92 : interactionHovered ? 0.84 : 1
  };
}

export function VaseModel({
  position = [0, 0, 0],
  rotationY = 0,
  shadowsEnabled,
  selected = false,
  hovered = false,
  interactionHovered = false,
  blocked = false,
  onPointerDown
}: SurfaceDecorModelProps) {
  const ceramic = createDecorMaterial(
    blocked,
    selected,
    hovered,
    interactionHovered,
    "#f6efe6",
    "#7fe6ab",
    "#dcefff",
    "#f4a4ae"
  );
  const stem = createDecorMaterial(
    blocked,
    selected,
    hovered,
    interactionHovered,
    "#83b46e",
    "#4cd884",
    "#8ccfb0",
    "#d76876"
  );
  const bloom = createDecorMaterial(
    blocked,
    selected,
    hovered,
    interactionHovered,
    "#efb6c9",
    "#8bf0bb",
    "#f5dff1",
    "#f08293"
  );

  return (
    <group position={position} rotation={[0, rotationY, 0]} onPointerDown={onPointerDown}>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 0.32, 10]} />
        <meshStandardMaterial {...ceramic} />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.08, 10]} />
        <meshStandardMaterial {...ceramic} />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.52, 0]}>
        <boxGeometry args={[0.04, 0.24, 0.04]} />
        <meshStandardMaterial {...stem} />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[-0.07, 0.68, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial {...bloom} />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0.07, 0.72, 0.04]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial {...bloom} />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.76, -0.05]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial {...bloom} />
      </mesh>

      {selected || blocked || hovered || interactionHovered ? (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[0.22, 0.3, 24]} />
          <meshBasicMaterial
            color={blocked ? "#ff7b88" : selected ? "#5cff98" : "#7cc8ff"}
            transparent
            opacity={selected || blocked ? 0.95 : interactionHovered ? 0.35 : 0.65}
          />
        </mesh>
      ) : null}
    </group>
  );
}

export function BookStackModel({
  position = [0, 0, 0],
  rotationY = 0,
  shadowsEnabled,
  selected = false,
  hovered = false,
  interactionHovered = false,
  blocked = false,
  onPointerDown
}: SurfaceDecorModelProps) {
  const coverA = createDecorMaterial(
    blocked,
    selected,
    hovered,
    interactionHovered,
    "#6f8cab",
    "#6fe19d",
    "#a6d6fb",
    "#eb818d"
  );
  const coverB = createDecorMaterial(
    blocked,
    selected,
    hovered,
    interactionHovered,
    "#c4a56d",
    "#82ebb1",
    "#d5ebff",
    "#f1959f"
  );
  const pages = createDecorMaterial(
    blocked,
    selected,
    hovered,
    interactionHovered,
    "#efe5d4",
    "#b6f7d0",
    "#f4fbff",
    "#f5bec6"
  );

  return (
    <group position={position} rotation={[0, rotationY, 0]} onPointerDown={onPointerDown}>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0, 0.06, 0]}>
        <boxGeometry args={[0.58, 0.12, 0.38]} />
        <meshStandardMaterial {...coverA} />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0.02, 0.075, 0]}>
        <boxGeometry args={[0.48, 0.06, 0.28]} />
        <meshStandardMaterial {...pages} />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0.04, 0.16, -0.02]} rotation={[0, 0.08, 0]}>
        <boxGeometry args={[0.52, 0.1, 0.34]} />
        <meshStandardMaterial {...coverB} />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[0.05, 0.175, -0.02]} rotation={[0, 0.08, 0]}>
        <boxGeometry args={[0.42, 0.05, 0.24]} />
        <meshStandardMaterial {...pages} />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[-0.04, 0.25, 0.03]} rotation={[0, -0.14, 0]}>
        <boxGeometry args={[0.5, 0.08, 0.3]} />
        <meshStandardMaterial {...coverA} />
      </mesh>
      <mesh castShadow={shadowsEnabled} receiveShadow={shadowsEnabled} position={[-0.04, 0.262, 0.03]} rotation={[0, -0.14, 0]}>
        <boxGeometry args={[0.4, 0.04, 0.21]} />
        <meshStandardMaterial {...pages} />
      </mesh>

      {selected || blocked || hovered || interactionHovered ? (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[0.24, 0.32, 24]} />
          <meshBasicMaterial
            color={blocked ? "#ff7b88" : selected ? "#5cff98" : "#7cc8ff"}
            transparent
            opacity={selected || blocked ? 0.95 : interactionHovered ? 0.35 : 0.65}
          />
        </mesh>
      ) : null}
    </group>
  );
}
