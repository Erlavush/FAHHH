import { type ThreeEvent } from "@react-three/fiber";
import type { Dispatch, SetStateAction } from "react";
import type { SharedRoomFrameMemory } from "../../lib/sharedRoomTypes";
import { FurnitureVisual } from "./FurnitureVisual";
import { RoomInteractionProxy } from "./RoomInteractionProxy";
import { RoomMemoryFrameProxy } from "./RoomMemoryFrameProxy";
import { RoomSurfaceDecorSelectionProxy } from "./RoomSurfaceDecorSelectionProxy";
import type { RoomFurniturePlacement } from "../../lib/roomState";

type RoomFurnitureActorProps = {
  applyTransform?: boolean;
  blocked: boolean;
  buildModeEnabled: boolean;
  frameMemory?: SharedRoomFrameMemory | null;
  hovered: boolean;
  hoveredInteractableFurnitureId: string | null;
  interactionHovered: boolean;
  isSelected: boolean;
  item: RoomFurniturePlacement;
  nightFactor: number;
  onFurnitureClick: (furnitureId: string, event: ThreeEvent<MouseEvent>) => void;
  onFurnitureDoubleClick: (furnitureId: string, event: ThreeEvent<MouseEvent>) => void;
  onFurniturePointerDown: (
    furnitureId: string,
    event: ThreeEvent<PointerEvent>
  ) => void;
  onFurniturePointerMove: (
    furnitureId: string,
    event: ThreeEvent<PointerEvent>
  ) => void;
  onFurniturePointerUp: (event?: ThreeEvent<PointerEvent>) => void;
  onInteractionCommand: (
    furnitureId: string,
    event: ThreeEvent<MouseEvent>
  ) => void;
  onOpenMemoryFrame: ((furnitureId: string) => void) | null;
  setHoveredInteractableFurnitureId: Dispatch<SetStateAction<string | null>>;
  shadowsEnabled: boolean;
  windowSurfaceLightAmount: number;
};

export function RoomFurnitureActor({
  applyTransform = true,
  blocked,
  buildModeEnabled,
  frameMemory = null,
  hovered,
  hoveredInteractableFurnitureId,
  interactionHovered,
  isSelected,
  item,
  nightFactor,
  onFurnitureClick,
  onFurnitureDoubleClick,
  onFurniturePointerDown,
  onFurniturePointerMove,
  onFurniturePointerUp,
  onInteractionCommand,
  onOpenMemoryFrame,
  setHoveredInteractableFurnitureId,
  shadowsEnabled,
  windowSurfaceLightAmount
}: RoomFurnitureActorProps) {
  const transformProps = applyTransform
    ? {
        position: item.position,
        rotation: [0, item.rotationY, 0] as [number, number, number]
      }
    : {};

  return (
    <group
      {...transformProps}
      onClick={(event) => onFurnitureClick(item.id, event)}
      onDoubleClick={(event) => onFurnitureDoubleClick(item.id, event)}
      onPointerDown={(event) => onFurniturePointerDown(item.id, event)}
      onPointerMove={(event) => onFurniturePointerMove(item.id, event)}
      onPointerUp={handlePointerUp(onFurniturePointerUp)}
      onPointerCancel={handlePointerUp(onFurniturePointerUp)}
    >
      <FurnitureVisual
        item={item}
        shadowsEnabled={shadowsEnabled}
        selected={isSelected}
        hovered={hovered}
        interactionHovered={interactionHovered}
        blocked={blocked}
        frameMemory={frameMemory}
        windowSurfaceLightAmount={windowSurfaceLightAmount}
        nightFactor={nightFactor}
      />
      <RoomSurfaceDecorSelectionProxy buildModeEnabled={buildModeEnabled} item={item} />
      <RoomInteractionProxy
        buildModeEnabled={buildModeEnabled}
        hoveredInteractableFurnitureId={hoveredInteractableFurnitureId}
        item={item}
        onInteractionCommand={onInteractionCommand}
        setHoveredInteractableFurnitureId={setHoveredInteractableFurnitureId}
      />
      <RoomMemoryFrameProxy
        buildModeEnabled={buildModeEnabled}
        hoveredInteractableFurnitureId={hoveredInteractableFurnitureId}
        item={item}
        onOpenMemoryFrame={onOpenMemoryFrame}
        setHoveredInteractableFurnitureId={setHoveredInteractableFurnitureId}
      />
    </group>
  );
}

function handlePointerUp(
  callback: (event?: ThreeEvent<PointerEvent>) => void
) {
  return (event: ThreeEvent<PointerEvent>) => {
    callback(event);
  };
}
