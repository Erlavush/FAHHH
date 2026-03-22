import { PivotControls } from "@react-three/drei";
import { type ThreeEvent } from "@react-three/fiber";
import { useMemo, type Dispatch, type SetStateAction } from "react";
import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import {
  FLOOR_GIZMO_SCREEN_SIZE,
  GIZMO_LINE_WIDTH,
  WALL_GIZMO_SCREEN_SIZE
} from "./constants";
import {
  getActiveAxes,
  getGizmoOffset,
  getPlacementActionOffset
} from "./helpers";
import { PlacementActions } from "./PlacementActions";
import { RoomFurnitureActor } from "./RoomFurnitureActor";
import type { RoomFurniturePlacement } from "../../lib/roomState";

export type RoomSelectedFurnitureLayerProps = {
  buildModeEnabled: boolean;
  hoveredInteractableFurnitureId: string | null;
  isPlacementBlocked: boolean;
  nightFactor: number;
  onCancelPlacement: () => void;
  onConfirmPlacement: () => void;
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
  onPivotDrag: (localMatrix: Matrix4) => void;
  onStorePlacement: () => void;
  prefersTouchControls: boolean;
  resetBuilderGestureState: (nextTransforming?: boolean) => void;
  selectedFurniture: RoomFurniturePlacement | null;
  setHoveredInteractableFurnitureId: Dispatch<SetStateAction<string | null>>;
  shadowsEnabled: boolean;
  wallVisibility: Record<string, boolean>;
  windowSurfaceLightAmount: number;
};

export function RoomSelectedFurnitureLayer({
  buildModeEnabled,
  hoveredInteractableFurnitureId,
  isPlacementBlocked,
  nightFactor,
  onCancelPlacement,
  onConfirmPlacement,
  onFurnitureClick,
  onFurnitureDoubleClick,
  onFurniturePointerDown,
  onFurniturePointerMove,
  onFurniturePointerUp,
  onInteractionCommand,
  onPivotDrag,
  onStorePlacement,
  prefersTouchControls,
  resetBuilderGestureState,
  selectedFurniture,
  setHoveredInteractableFurnitureId,
  shadowsEnabled,
  wallVisibility,
  windowSurfaceLightAmount
}: RoomSelectedFurnitureLayerProps) {
  const selectedFurnitureMatrix = useMemo(() => {
    if (!selectedFurniture) {
      return null;
    }

    const nextMatrix = new Matrix4();
    const nextRotation = new Quaternion().setFromEuler(
      new Euler(0, selectedFurniture.rotationY, 0)
    );

    nextMatrix.compose(
      new Vector3(
        selectedFurniture.position[0],
        selectedFurniture.position[1],
        selectedFurniture.position[2]
      ),
      nextRotation,
      new Vector3(1, 1, 1)
    );

    return nextMatrix;
  }, [selectedFurniture]);

  if (!selectedFurniture) {
    return null;
  }

  const isVisible =
    selectedFurniture.surface === "floor" ||
    selectedFurniture.surface === "surface" ||
    wallVisibility[selectedFurniture.surface] !== false;
  const shouldUsePivotControls =
    buildModeEnabled && isVisible && selectedFurnitureMatrix && !prefersTouchControls;
  const shouldRenderFallbackActor = isVisible && !shouldUsePivotControls;
  const actionOffset = getPlacementActionOffset(selectedFurniture);

  return (
    <>
      {shouldUsePivotControls ? (
        <PivotControls
          matrix={selectedFurnitureMatrix}
          autoTransform={false}
          offset={getGizmoOffset(selectedFurniture)}
          activeAxes={getActiveAxes(selectedFurniture)}
          disableRotations={
            selectedFurniture.surface !== "floor" &&
            selectedFurniture.surface !== "surface"
          }
          disableScaling
          rotationLimits={[[0, 0], undefined, [0, 0]]}
          lineWidth={GIZMO_LINE_WIDTH}
          depthTest={false}
          fixed
          scale={
            selectedFurniture.surface === "floor" ||
            selectedFurniture.surface === "surface"
              ? FLOOR_GIZMO_SCREEN_SIZE
              : WALL_GIZMO_SCREEN_SIZE
          }
          onDragStart={() => {
            resetBuilderGestureState(true);
          }}
          onDrag={onPivotDrag}
          onDragEnd={() => {
            resetBuilderGestureState(false);
          }}
        >
          <RoomFurnitureActor
            applyTransform={false}
            item={selectedFurniture}
            buildModeEnabled={buildModeEnabled}
            blocked={isPlacementBlocked}
            hovered={false}
            hoveredInteractableFurnitureId={hoveredInteractableFurnitureId}
            interactionHovered={
              !buildModeEnabled &&
              hoveredInteractableFurnitureId === selectedFurniture.id
            }
            isSelected
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
        </PivotControls>
      ) : null}
      {shouldRenderFallbackActor ? (
        <RoomFurnitureActor
          item={selectedFurniture}
          buildModeEnabled={buildModeEnabled}
          blocked={buildModeEnabled && isPlacementBlocked}
          hovered={false}
          hoveredInteractableFurnitureId={hoveredInteractableFurnitureId}
          interactionHovered={
            !buildModeEnabled &&
            hoveredInteractableFurnitureId === selectedFurniture.id
          }
          isSelected={buildModeEnabled}
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
      ) : null}
      {buildModeEnabled ? (
        <PlacementActions
          position={[
            selectedFurniture.position[0] + actionOffset[0],
            selectedFurniture.position[1] + actionOffset[1],
            selectedFurniture.position[2] + actionOffset[2]
          ]}
          onCancel={onCancelPlacement}
          onStore={onStorePlacement}
          onConfirm={onConfirmPlacement}
          confirmDisabled={isPlacementBlocked}
        />
      ) : null}
    </>
  );
}
