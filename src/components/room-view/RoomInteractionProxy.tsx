import { type ThreeEvent } from "@react-three/fiber";
import type { Dispatch, SetStateAction } from "react";
import { getInteractionHitboxSize } from "./helpers";
import { getFurnitureDefinition } from "../../lib/furnitureRegistry";
import type { RoomFurniturePlacement } from "../../lib/roomState";

type RoomInteractionProxyProps = {
  buildModeEnabled: boolean;
  hoveredInteractableFurnitureId: string | null;
  item: RoomFurniturePlacement;
  onInteractionCommand: (
    furnitureId: string,
    event: ThreeEvent<MouseEvent>
  ) => void;
  setHoveredInteractableFurnitureId: Dispatch<SetStateAction<string | null>>;
};

export function RoomInteractionProxy({
  buildModeEnabled,
  hoveredInteractableFurnitureId,
  item,
  onInteractionCommand,
  setHoveredInteractableFurnitureId
}: RoomInteractionProxyProps) {
  const definition = getFurnitureDefinition(item.type);

  if (buildModeEnabled || !definition.interactionType) {
    return null;
  }

  const [width, height, depth] = getInteractionHitboxSize(item);

  return (
    <mesh
      position={[0, height / 2, 0]}
      onContextMenu={(event) => onInteractionCommand(item.id, event)}
      onPointerOver={(event) => {
        event.stopPropagation();
        if (hoveredInteractableFurnitureId !== item.id) {
          setHoveredInteractableFurnitureId(item.id);
        }
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        setHoveredInteractableFurnitureId((current) => (current === item.id ? null : current));
      }}
    >
      <boxGeometry args={[width, height, depth]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
