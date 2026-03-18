import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, PerspectiveCamera, PivotControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CanvasTexture,
  Euler,
  Matrix4,
  MOUSE,
  NearestFilter,
  Plane,
  Quaternion,
  Ray,
  SRGBColorSpace,
  Vector3
} from "three";
import { ChairModel } from "./ChairModel";
import {
  loadPersistedChairPlacement,
  savePersistedChairPlacement,
  type PersistedChairPlacement
} from "../lib/devLocalState";
import { MinecraftPlayer } from "./MinecraftPlayer";

const TILE_SIZE = 1;
const GRID_SIZE = 16;
const HALF_FLOOR_SIZE = (GRID_SIZE * TILE_SIZE) / 2;
type Vector3Tuple = [number, number, number];
const CHAIR_GIZMO_SCREEN_SIZE = 90;
const CHAIR_GIZMO_LINE_WIDTH = 3;
const chairDragPosition = new Vector3();
const chairDragQuaternion = new Quaternion();
const chairDragScale = new Vector3();
const chairDragEuler = new Euler(0, 0, 0, "YXZ");
const floorPlane = new Plane(new Vector3(0, 1, 0), 0);
const floorHitPoint = new Vector3();
const CHAIR_GIZMO_OFFSET: [number, number, number] = [0, 0.68, 0];
const CHAIR_ACTIONS_OFFSET: [number, number, number] = [0, 1.95, 0];
const DEFAULT_CHAIR_PLACEMENT: PersistedChairPlacement = {
  position: [2.5, 0, 0.5],
  rotationY: 0
};

function createConcreteTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create the concrete texture.");
  }

  context.fillStyle = "#e7e7e7";
  context.fillRect(0, 0, 16, 16);

  const accents = [
    { x: 1, y: 2, color: "#d9d9d9" },
    { x: 4, y: 1, color: "#f5f5f5" },
    { x: 7, y: 3, color: "#dbdbdb" },
    { x: 11, y: 2, color: "#f0f0f0" },
    { x: 13, y: 5, color: "#d5d5d5" },
    { x: 3, y: 7, color: "#f4f4f4" },
    { x: 6, y: 8, color: "#d7d7d7" },
    { x: 10, y: 9, color: "#eeeeee" },
    { x: 14, y: 11, color: "#d9d9d9" },
    { x: 2, y: 12, color: "#f2f2f2" },
    { x: 8, y: 13, color: "#dadada" },
    { x: 12, y: 14, color: "#f8f8f8" }
  ];

  accents.forEach((accent) => {
    context.fillStyle = accent.color;
    context.fillRect(accent.x, accent.y, 1, 1);
  });

  const texture = new CanvasTexture(canvas);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = SRGBColorSpace;

  return texture;
}

function clampToFloor(value: number): number {
  return Math.min(HALF_FLOOR_SIZE - 0.08, Math.max(-HALF_FLOOR_SIZE + 0.08, value));
}

function clampChairToFloor(value: number): number {
  return Math.min(HALF_FLOOR_SIZE - 0.5, Math.max(-HALF_FLOOR_SIZE + 0.5, value));
}

function snapToBlockCenter(value: number): number {
  return Math.round(value - 0.5) + 0.5;
}

interface FloorStageProps {
  targetPosition: [number, number, number];
  onFloorClick: (event: ThreeEvent<MouseEvent>) => void;
  onFloorPointerMove: (event: ThreeEvent<PointerEvent>) => void;
  onFloorPointerUp: () => void;
  checkerEnabled: boolean;
  floorPrimaryColor: string;
  floorSecondaryColor: string;
  shadowsEnabled: boolean;
}

function FloorStage({
  targetPosition,
  onFloorClick,
  onFloorPointerMove,
  onFloorPointerUp,
  checkerEnabled,
  floorPrimaryColor,
  floorSecondaryColor,
  shadowsEnabled
}: FloorStageProps) {
  const concreteTexture = useMemo(() => createConcreteTexture(), []);
  const tiles = useMemo(() => {
    const nextTiles = [];

    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let column = 0; column < GRID_SIZE; column += 1) {
        const x = (column - (GRID_SIZE - 1) / 2) * TILE_SIZE;
        const z = (row - (GRID_SIZE - 1) / 2) * TILE_SIZE;
        const color = checkerEnabled
          ? (row + column) % 2 === 0
            ? floorPrimaryColor
            : floorSecondaryColor
          : floorPrimaryColor;

        nextTiles.push(
          <mesh
            key={`${row}-${column}`}
            position={[x, -0.5, z]}
            receiveShadow={shadowsEnabled}
            castShadow={shadowsEnabled}
            onClick={onFloorClick}
            onPointerMove={onFloorPointerMove}
            onPointerUp={onFloorPointerUp}
          >
            <boxGeometry args={[TILE_SIZE, 1, TILE_SIZE]} />
            <meshStandardMaterial color={color} map={concreteTexture} />
          </mesh>
        );
      }
    }

    return nextTiles;
  }, [
    checkerEnabled,
    concreteTexture,
    floorPrimaryColor,
    floorSecondaryColor,
    onFloorClick,
    shadowsEnabled
  ]);

  return (
    <group>
      <group>{tiles}</group>
      <mesh position={[targetPosition[0], 0.02, targetPosition[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.14, 0.22, 32]} />
        <meshBasicMaterial color="#5abed0" transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

interface RoomViewProps {
  cameraEditEnabled: boolean;
  buildModeEnabled: boolean;
  gridSnapEnabled: boolean;
  initialCameraPosition: Vector3Tuple;
  initialPlayerPosition: Vector3Tuple;
  skinSrc: string | null;
  timeOfDay: "day" | "night";
  sunEnabled: boolean;
  shadowsEnabled: boolean;
  checkerEnabled: boolean;
  floorPrimaryColor: string;
  floorSecondaryColor: string;
  onCameraPositionChange: (position: Vector3Tuple) => void;
  onPlayerPositionChange: (position: Vector3Tuple) => void;
}

function StarField() {
  const stars = useMemo(
    () =>
      Array.from({ length: 48 }, (_, index) => {
        const angle = index * 0.61;
        const x = Math.cos(angle * 1.7) * (9 + (index % 6));
        const y = 5 + (index % 7) * 0.55;
        const z = Math.sin(angle * 1.2) * (9 + ((index + 3) % 5));
        const scale = 0.04 + (index % 3) * 0.015;

        return { x, y, z, scale };
      }),
    []
  );

  return (
    <group>
      {stars.map((star, index) => (
        <mesh key={index} position={[star.x, star.y, star.z]}>
          <sphereGeometry args={[star.scale, 6, 6]} />
          <meshBasicMaterial color="#f7fbff" />
        </mesh>
      ))}
    </group>
  );
}

function CameraTracker({
  onCameraPositionChange
}: {
  onCameraPositionChange: (position: Vector3Tuple) => void;
}) {
  const lastSentTime = useRef(0);

  useFrame((state) => {
    if (state.clock.elapsedTime - lastSentTime.current < 0.1) {
      return;
    }

    lastSentTime.current = state.clock.elapsedTime;
    onCameraPositionChange([
      state.camera.position.x,
      state.camera.position.y,
      state.camera.position.z
    ]);
  });

  return null;
}

function ChairPlacementActions({
  onCancel,
  onConfirm
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Html position={CHAIR_ACTIONS_OFFSET} center occlude={false}>
      <div className="placement-actions">
        <button
          className="placement-action placement-action--cancel"
          onClick={(event) => {
            event.stopPropagation();
            onCancel();
          }}
          type="button"
        >
          X
        </button>
        <button
          className="placement-action placement-action--confirm"
          onClick={(event) => {
            event.stopPropagation();
            onConfirm();
          }}
          type="button"
          aria-label="Confirm placement"
        >
          ✓
        </button>
      </div>
    </Html>
  );
}

export function RoomView({
  cameraEditEnabled,
  buildModeEnabled,
  gridSnapEnabled,
  initialCameraPosition,
  initialPlayerPosition,
  skinSrc,
  timeOfDay,
  sunEnabled,
  shadowsEnabled,
  checkerEnabled,
  floorPrimaryColor,
  floorSecondaryColor,
  onCameraPositionChange,
  onPlayerPositionChange
}: RoomViewProps) {
  const initialCameraPositionRef = useRef(initialCameraPosition);
  const initialChairPlacement = useMemo(
    () => loadPersistedChairPlacement(DEFAULT_CHAIR_PLACEMENT),
    []
  );
  const [targetPosition, setTargetPosition] = useState<[number, number, number]>(
    initialPlayerPosition
  );
  const [chairCommittedPosition, setChairCommittedPosition] = useState<[number, number, number]>(
    initialChairPlacement.position
  );
  const [chairCommittedRotationY, setChairCommittedRotationY] = useState(
    initialChairPlacement.rotationY
  );
  const [chairPosition, setChairPosition] = useState<[number, number, number]>(
    initialChairPlacement.position
  );
  const [chairRotationY, setChairRotationY] = useState(initialChairPlacement.rotationY);
  const [chairSelected, setChairSelected] = useState(false);
  const [isDraggingChair, setIsDraggingChair] = useState(false);
  const [isTransformingChair, setIsTransformingChair] = useState(false);
  const isDay = timeOfDay === "day";
  const chairEditStartRef = useRef<{
    position: [number, number, number];
    rotationY: number;
  } | null>(null);
  const chairMatrix = useMemo(() => {
    const nextMatrix = new Matrix4();
    const nextRotation = new Quaternion().setFromEuler(new Euler(0, chairRotationY, 0));

    nextMatrix.compose(
      new Vector3(chairPosition[0], chairPosition[1], chairPosition[2]),
      nextRotation,
      new Vector3(1, 1, 1)
    );

    return nextMatrix;
  }, [chairPosition, chairRotationY]);

  useEffect(() => {
    if (!buildModeEnabled) {
      setChairPosition(chairCommittedPosition);
      setChairRotationY(chairCommittedRotationY);
      setChairSelected(false);
      setIsDraggingChair(false);
      setIsTransformingChair(false);
      chairEditStartRef.current = null;
    }
  }, [buildModeEnabled, chairCommittedPosition, chairCommittedRotationY]);

  useEffect(() => {
    savePersistedChairPlacement({
      position: chairCommittedPosition,
      rotationY: chairCommittedRotationY
    });
  }, [chairCommittedPosition, chairCommittedRotationY]);

  useEffect(() => {
    if (!isDraggingChair) {
      return;
    }

    function stopDragging(): void {
      setIsDraggingChair(false);
    }

    window.addEventListener("pointerup", stopDragging);

    return () => {
      window.removeEventListener("pointerup", stopDragging);
    };
  }, [isDraggingChair]);

  function resolveChairPlacement(x: number, z: number): [number, number, number] {
    const nextX = gridSnapEnabled ? snapToBlockCenter(x) : x;
    const nextZ = gridSnapEnabled ? snapToBlockCenter(z) : z;

    return [clampChairToFloor(nextX), 0, clampChairToFloor(nextZ)];
  }

  function resolveChairRotation(angle: number): number {
    const step = gridSnapEnabled ? Math.PI / 2 : Math.PI / 180;
    const snappedAngle = Math.round(angle / step) * step;

    return Math.atan2(Math.sin(snappedAngle), Math.cos(snappedAngle));
  }

  function resolveFloorRayPoint(ray: Ray): [number, number, number] | null {
    const hitPoint = ray.intersectPlane(floorPlane, floorHitPoint);

    if (!hitPoint) {
      return null;
    }

    return resolveChairPlacement(hitPoint.x, hitPoint.z);
  }

  function handleFloorClick(event: ThreeEvent<MouseEvent>): void {
    if (buildModeEnabled) {
      event.stopPropagation();
      return;
    }

    if (cameraEditEnabled || isTransformingChair) {
      return;
    }

    event.stopPropagation();
    setTargetPosition([
      clampToFloor(event.point.x),
      0,
      clampToFloor(event.point.z)
    ]);
  }

  function handleChairPointerDown(event: ThreeEvent<PointerEvent>): void {
    if (!buildModeEnabled || cameraEditEnabled) {
      return;
    }

    event.stopPropagation();

    if (!chairSelected) {
      chairEditStartRef.current = {
        position: [...chairCommittedPosition] as [number, number, number],
        rotationY: chairCommittedRotationY
      };
    }

    setChairSelected(true);
    setIsDraggingChair(true);
  }

  function handleChairPointerMove(event: ThreeEvent<PointerEvent>): void {
    if (!buildModeEnabled || cameraEditEnabled || isTransformingChair || !isDraggingChair) {
      return;
    }

    const nextPosition = resolveFloorRayPoint(event.ray);

    if (!nextPosition) {
      return;
    }

    event.stopPropagation();
    setChairPosition(nextPosition);
  }

  function handleChairPointerUp(): void {
    setIsDraggingChair(false);
  }

  function handleChairPivotDrag(localMatrix: Matrix4): void {
    localMatrix.decompose(chairDragPosition, chairDragQuaternion, chairDragScale);
    chairDragEuler.setFromQuaternion(chairDragQuaternion);

    const nextPosition = resolveChairPlacement(chairDragPosition.x, chairDragPosition.z);
    const nextRotation = resolveChairRotation(chairDragEuler.y);

    setChairPosition(nextPosition);
    setChairRotationY(nextRotation);
  }

  function handleFloorPointerMove(event: ThreeEvent<PointerEvent>): void {
    if (!buildModeEnabled || cameraEditEnabled || isTransformingChair || !isDraggingChair) {
      return;
    }

    const nextPosition = resolveFloorRayPoint(event.ray);

    if (!nextPosition) {
      return;
    }

    event.stopPropagation();
    setChairPosition(nextPosition);
  }

  function handleFloorPointerUp(): void {
    setIsDraggingChair(false);
  }

  function handleCancelChairPlacement(): void {
    const editStart = chairEditStartRef.current;

    if (editStart) {
      setChairPosition(editStart.position);
      setChairRotationY(editStart.rotationY);
    } else {
      setChairPosition(chairCommittedPosition);
      setChairRotationY(chairCommittedRotationY);
    }

    chairEditStartRef.current = null;
    setChairSelected(false);
    setIsDraggingChair(false);
    setIsTransformingChair(false);
  }

  function handleConfirmChairPlacement(): void {
    setChairCommittedPosition(chairPosition);
    setChairCommittedRotationY(chairRotationY);
    chairEditStartRef.current = null;
    setChairSelected(false);
    setIsDraggingChair(false);
    setIsTransformingChair(false);
  }

  return (
    <div className="canvas-wrap">
      <Canvas shadows dpr={[1, 1.6]}>
        <color attach="background" args={[isDay ? "#dfeaf6" : "#05070d"]} />
        <PerspectiveCamera
          makeDefault
          position={initialCameraPositionRef.current}
          fov={26}
          onUpdate={(camera) => camera.lookAt(0, 0.9, 0)}
        />
        <OrbitControls
          enabled={cameraEditEnabled && !isTransformingChair}
          enableRotate={cameraEditEnabled && !isTransformingChair}
          enablePan={false}
          enableZoom={cameraEditEnabled && !isTransformingChair}
          screenSpacePanning={false}
          minDistance={5}
          maxDistance={48}
          target={[0, 0.9, 0]}
          minPolarAngle={0.5}
          maxPolarAngle={1.2}
          mouseButtons={{
            LEFT: MOUSE.ROTATE,
            MIDDLE: MOUSE.ROTATE,
            RIGHT: MOUSE.ROTATE
          }}
        />
        <ambientLight intensity={isDay ? 1.4 : 0.22} color={isDay ? "#fff8f0" : "#8fa4c9"} />
        <hemisphereLight
          intensity={isDay ? 0.75 : 0.18}
          groundColor={isDay ? "#b8c6d4" : "#0f1420"}
          color={isDay ? "#f7fbff" : "#5e7399"}
        />
        {sunEnabled ? (
          <directionalLight
            castShadow={shadowsEnabled}
            intensity={isDay ? 1.6 : 0.35}
            color={isDay ? "#fff2d8" : "#98b7ff"}
            position={isDay ? [5, 8, 4] : [3, 6, 5]}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
        ) : null}
        {!isDay ? <StarField /> : null}
        <FloorStage
          targetPosition={targetPosition}
          onFloorClick={handleFloorClick}
          onFloorPointerMove={handleFloorPointerMove}
          onFloorPointerUp={handleFloorPointerUp}
          checkerEnabled={checkerEnabled}
          floorPrimaryColor={floorPrimaryColor}
          floorSecondaryColor={floorSecondaryColor}
          shadowsEnabled={shadowsEnabled}
        />
        <MinecraftPlayer
          initialPosition={initialPlayerPosition}
          skinSrc={skinSrc}
          targetPosition={targetPosition}
          onPositionChange={onPlayerPositionChange}
          shadowsEnabled={shadowsEnabled}
        />
        {buildModeEnabled && chairSelected ? (
          <PivotControls
            matrix={chairMatrix}
            autoTransform={false}
            offset={CHAIR_GIZMO_OFFSET}
            activeAxes={[true, false, true]}
            disableScaling
            rotationLimits={[[0, 0], undefined, [0, 0]]}
            lineWidth={CHAIR_GIZMO_LINE_WIDTH}
            depthTest={false}
            fixed={true}
            scale={CHAIR_GIZMO_SCREEN_SIZE}
            onDragStart={() => {
              setIsDraggingChair(false);
              setIsTransformingChair(true);
            }}
            onDrag={handleChairPivotDrag}
            onDragEnd={() => setIsTransformingChair(false)}
          >
            <group
              onPointerDown={handleChairPointerDown}
              onPointerMove={handleChairPointerMove}
              onPointerUp={handleChairPointerUp}
            >
              <ChairPlacementActions
                onCancel={handleCancelChairPlacement}
                onConfirm={handleConfirmChairPlacement}
              />
              <ChairModel
                position={[0, 0, 0]}
                rotationY={0}
                shadowsEnabled={shadowsEnabled}
                selected
              />
            </group>
          </PivotControls>
        ) : (
          <group
            position={chairPosition}
            rotation={[0, chairRotationY, 0]}
            onPointerDown={handleChairPointerDown}
            onPointerMove={handleChairPointerMove}
            onPointerUp={handleChairPointerUp}
          >
            <ChairModel
              position={[0, 0, 0]}
              rotationY={0}
              shadowsEnabled={shadowsEnabled}
              selected={false}
            />
          </group>
        )}
        <CameraTracker onCameraPositionChange={onCameraPositionChange} />
      </Canvas>
    </div>
  );
}
