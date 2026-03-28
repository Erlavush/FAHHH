import { type ThreeEvent } from "@react-three/fiber";
import { memo, useMemo, type Dispatch, type SetStateAction } from "react";
import type { SharedRoomFrameMemory } from "../../lib/sharedRoomTypes";
import { RoomFurnitureActor } from "./RoomFurnitureActor";
import { isWallSurface } from "./helpers";
import type { RoomFurniturePlacement } from "../../lib/roomState";

export type RoomFurnitureLayerProps = {
  buildModeEnabled: boolean;
  busyFurnitureIds: ReadonlySet<string>;
  frameMemories: Record<string, SharedRoomFrameMemory>;
  furniture: RoomFurniturePlacement[];
  hoveredFurnitureId: string | null;
  hoveredInteractableFurnitureId: string | null;
  isDraggingFurniture: boolean;
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
  selectedFurnitureId: string | null;
  setHoveredInteractableFurnitureId: Dispatch<SetStateAction<string | null>>;
  shadowsEnabled: boolean;
  wallVisibility: Record<string, boolean>;
  windowSurfaceLightAmount: number;
};

export const RoomFurnitureLayer = memo(function RoomFurnitureLayer({
  buildModeEnabled,
  busyFurnitureIds,
  frameMemories,
  furniture,
  hoveredFurnitureId,
  hoveredInteractableFurnitureId,
  isDraggingFurniture,
  nightFactor,
  onFurnitureClick,
  onFurnitureDoubleClick,
  onFurniturePointerDown,
  onFurniturePointerMove,
  onFurniturePointerUp,
  onInteractionCommand,
  onOpenMemoryFrame,
  selectedFurnitureId,
  setHoveredInteractableFurnitureId,
  shadowsEnabled,
  wallVisibility,
  windowSurfaceLightAmount
}: RoomFurnitureLayerProps) {
  const visibleFurniture = useMemo(
    () =>
      furniture.filter((item) => {
        if (item.id === selectedFurnitureId) {
          return false;
        }

        if (item.surface === "ceiling") {
          return wallVisibility.ceiling !== false;
        }

        if (isWallSurface(item.surface)) {
          return wallVisibility[item.surface] !== false;
        }

        return true;
      }),
    [furniture, selectedFurnitureId, wallVisibility]
  );

  return (
    <>
      {visibleFurniture.map((item) => (
        <RoomFurnitureActor
          key={item.id}
          item={item}
          buildModeEnabled={buildModeEnabled}
          blocked={buildModeEnabled && busyFurnitureIds.has(item.id)}
          frameMemory={frameMemories[item.id] ?? null}
          hovered={
            buildModeEnabled &&
            hoveredFurnitureId === item.id &&
            !isDraggingFurniture
          }
          interactionHovered={
            !buildModeEnabled && hoveredInteractableFurnitureId === item.id
          }
          isSelected={false}
          nightFactor={nightFactor}
          onFurnitureClick={onFurnitureClick}
          onFurnitureDoubleClick={onFurnitureDoubleClick}
          onFurniturePointerDown={onFurniturePointerDown}
          onFurniturePointerMove={onFurniturePointerMove}
          onFurniturePointerUp={onFurniturePointerUp}
          onInteractionCommand={onInteractionCommand}
          onOpenMemoryFrame={onOpenMemoryFrame}
          setHoveredInteractableFurnitureId={setHoveredInteractableFurnitureId}
          shadowsEnabled={shadowsEnabled}
          windowSurfaceLightAmount={windowSurfaceLightAmount}
        />
      ))}
    </>
  );
});