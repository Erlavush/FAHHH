import { type ThreeEvent } from "@react-three/fiber";
import { useMemo } from "react";
import { mixColor, mixNumber } from "../../lib/worldLighting";
import {
  GRID_SIZE,
  HALF_FLOOR_SIZE,
  TILE_SIZE
} from "./constants";
import { createWoodFloorTexture } from "./helpers";

interface FloorStageProps {
  targetPosition: [number, number, number];
  onFloorMoveCommand: (event: ThreeEvent<MouseEvent>) => void;
  onFloorPointerMove: (event: ThreeEvent<PointerEvent>) => void;
  onFloorPointerUp: () => void;
  surfaceLightAmount: number;
  checkerEnabled: boolean;
  floorPrimaryColor: string;
  floorSecondaryColor: string;
  shadowsEnabled: boolean;
}

export function FloorStage({
  targetPosition,
  onFloorMoveCommand,
  onFloorPointerMove,
  onFloorPointerUp,
  surfaceLightAmount,
  checkerEnabled,
  floorPrimaryColor,
  floorSecondaryColor,
  shadowsEnabled
}: FloorStageProps) {
  const woodTexture = useMemo(() => createWoodFloorTexture(), []);
  const platformColor = mixColor("#1f1714", "#34261f", surfaceLightAmount);
  const floorEdgeColor = mixColor("#825f42", "#d6a56d", surfaceLightAmount);
  const floorLipColor = mixColor("#33241a", "#7a4a2d", surfaceLightAmount);
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
          >
            <boxGeometry args={[TILE_SIZE, 1, TILE_SIZE]} />
            <meshStandardMaterial color={color} roughness={0.94} />
          </mesh>
        );
      }
    }

    return nextTiles;
  }, [checkerEnabled, floorPrimaryColor, floorSecondaryColor, shadowsEnabled]);

  return (
    <group>
      <mesh position={[0, -0.68, 0]} receiveShadow={shadowsEnabled}>
        <boxGeometry args={[GRID_SIZE + 0.62, 0.24, GRID_SIZE + 0.62]} />
        <meshStandardMaterial color={platformColor} roughness={0.98} />
      </mesh>
      {!checkerEnabled ? (
        <mesh position={[0, -0.5, 0]} receiveShadow={shadowsEnabled} castShadow={shadowsEnabled}>
          <boxGeometry args={[GRID_SIZE, 1, GRID_SIZE]} />
          <meshStandardMaterial
            color={mixColor("#70472f", "#8f5f3f", surfaceLightAmount)}
            map={woodTexture}
            roughness={mixNumber(0.88, 0.72, surfaceLightAmount)}
            metalness={0.03}
          />
        </mesh>
      ) : (
        <group>{tiles}</group>
      )}
      <mesh position={[0, 0.03, -HALF_FLOOR_SIZE + 0.06]} raycast={() => null}>
        <boxGeometry args={[GRID_SIZE + 0.14, 0.06, 0.12]} />
        <meshStandardMaterial color={floorEdgeColor} roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.03, HALF_FLOOR_SIZE - 0.06]} raycast={() => null}>
        <boxGeometry args={[GRID_SIZE + 0.14, 0.06, 0.12]} />
        <meshStandardMaterial color={floorLipColor} roughness={0.86} />
      </mesh>
      <mesh position={[-HALF_FLOOR_SIZE + 0.06, 0.03, 0]} raycast={() => null}>
        <boxGeometry args={[0.12, 0.06, GRID_SIZE + 0.14]} />
        <meshStandardMaterial color={floorEdgeColor} roughness={0.82} />
      </mesh>
      <mesh position={[HALF_FLOOR_SIZE - 0.06, 0.03, 0]} raycast={() => null}>
        <boxGeometry args={[0.12, 0.06, GRID_SIZE + 0.14]} />
        <meshStandardMaterial color={floorLipColor} roughness={0.86} />
      </mesh>
      <mesh
        position={[0, 0.015, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onContextMenu={onFloorMoveCommand}
        onPointerMove={onFloorPointerMove}
        onPointerUp={onFloorPointerUp}
      >
        <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[targetPosition[0], 0.02, targetPosition[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.14, 0.22, 32]} />
        <meshBasicMaterial color="#5abed0" transparent opacity={0.9} />
      </mesh>
    </group>
  );
}