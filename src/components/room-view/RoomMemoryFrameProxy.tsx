import { Html } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import type { Dispatch, SetStateAction } from "react";
import type { RoomFurniturePlacement } from "../../lib/roomState";

type RoomMemoryFrameProxyProps = {
  buildModeEnabled: boolean;
  hoveredInteractableFurnitureId: string | null;
  item: RoomFurniturePlacement;
  onOpenMemoryFrame: ((furnitureId: string) => void) | null;
  setHoveredInteractableFurnitureId: Dispatch<SetStateAction<string | null>>;
};

export function RoomMemoryFrameProxy({
  buildModeEnabled,
  hoveredInteractableFurnitureId,
  item,
  onOpenMemoryFrame,
  setHoveredInteractableFurnitureId
}: RoomMemoryFrameProxyProps) {
  if (buildModeEnabled || item.type !== "wall_frame" || !onOpenMemoryFrame) {
    return null;
  }

  const hovered = hoveredInteractableFurnitureId === item.id;

  return (
    <group position={[0, 0.02, 0.07]}>
      <mesh
        onClick={(event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation();
          onOpenMemoryFrame(item.id);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          if (hoveredInteractableFurnitureId !== item.id) {
            setHoveredInteractableFurnitureId(item.id);
          }
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          setHoveredInteractableFurnitureId((current) =>
            current === item.id ? null : current
          );
        }}
      >
        <boxGeometry args={[1.16, 0.92, 0.08]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {hovered ? (
        <Html
          center
          className="room-memory-frame-proxy__hint"
          distanceFactor={7}
          position={[0, 0.78, 0.02]}
          transform
        >
          Open shared memory
        </Html>
      ) : null}
    </group>
  );
}
