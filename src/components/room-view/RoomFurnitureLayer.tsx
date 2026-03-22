import { type ThreeEvent } from "@react-three/fiber";
import type { Dispatch, SetStateAction } from "react";
import { RoomFurnitureActor } from "./RoomFurnitureActor";
import type { RoomFurniturePlacement } from "../../lib/roomState";

export type RoomFurnitureLayerProps = {
  buildModeEnabled: boolean;
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
  selectedFurnitureId: string | null;
  setHoveredInteractableFurnitureId: Dispatch<SetStateAction<string | null>>;
  shadowsEnabled: boolean;
  wallVisibility: Record<string, boolean>;
  windowSurfaceLightAmount: number;
};

export function RoomFurnitureLayer({
  buildModeEnabled,
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
  selectedFurnitureId,
  setHoveredInteractableFurnitureId,
  shadowsEnabled,
  wallVisibility,
  windowSurfaceLightAmount
}: RoomFurnitureLayerProps) {
  return (
    <>
      {furniture
        .filter((item) => {
          if (item.id === selectedFurnitureId) {
            return false;
          }

          if (item.surface !== "floor" && item.surface !== "surface") {
            return wallVisibility[item.surface] !== false;
          }

          return true;
        })
        .map((item) => (
          <RoomFurnitureActor
            key={item.id}
            item={item}
            buildModeEnabled={buildModeEnabled}
            blocked={false}
            hovered={
              buildModeEnabled &&
              hoveredFurnitureId === item.id &&
              !isDraggingFurniture
            }
            hoveredInteractableFurnitureId={hoveredInteractableFurnitureId}
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
            setHoveredInteractableFurnitureId={setHoveredInteractableFurnitureId}
            shadowsEnabled={shadowsEnabled}
            windowSurfaceLightAmount={windowSurfaceLightAmount}
          />
        ))}
    </>
  );
}
