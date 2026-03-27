import { type ThreeEvent } from "@react-three/fiber";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction
} from "react";
import { Matrix4 } from "three";
import type { RoomFurniturePlacement } from "../../lib/roomState";
import { findFurniturePlacement } from "../../lib/roomState";
import {
  applyPlacementToItem,
  resolveCeilingPlacement,
  resolveFloorPlacement,
  resolveFurnitureRotation,
  resolvePlacementFromDragRay,
  resolveSurfacePlacementFromWorldPoint,
  resolveWallPlacement,
  type DragPlacementState
} from "./placementResolvers";
import {
  getWallParallelCoordinate,
  isWallSurface
} from "./helpers";
import {
  transformDragEuler,
  transformDragPosition,
  transformDragQuaternion,
  transformDragScale
} from "./constants";

type PointerCaptureTarget = EventTarget & {
  setPointerCapture?: (pointerId: number) => void;
  releasePointerCapture?: (pointerId: number) => void;
};

type UseRoomViewBuilderGesturesOptions = {
  buildModeEnabled: boolean;
  finishFurnitureEditingSession: (
    furnitureId: string | null,
    cancelDraft: boolean
  ) => void;
  furniture: RoomFurniturePlacement[];
  gridSnapEnabled: boolean;
  hoveredFurnitureId: string | null;
  orbitControlsRef: MutableRefObject<any>;
  selectedFurniture: RoomFurniturePlacement | null;
  selectedFurnitureId: string | null;
  setHoveredFurnitureId: Dispatch<SetStateAction<string | null>>;
  selectFurnitureForEditing: (furnitureId: string) => void;
  updateFurnitureItem: (
    furnitureId: string,
    updater: (item: RoomFurniturePlacement) => RoomFurniturePlacement
  ) => void;
};

export function useRoomViewBuilderGestures({
  buildModeEnabled,
  finishFurnitureEditingSession,
  furniture,
  gridSnapEnabled,
  hoveredFurnitureId,
  orbitControlsRef,
  selectedFurniture,
  selectedFurnitureId,
  setHoveredFurnitureId,
  selectFurnitureForEditing,
  updateFurnitureItem
}: UseRoomViewBuilderGesturesOptions) {
  const capturedPointerIdRef = useRef<number | null>(null);
  const capturedPointerTargetRef = useRef<PointerCaptureTarget | null>(null);
  const dragStateRef = useRef<DragPlacementState | null>(null);
  const previousSelectedFurnitureIdRef = useRef<string | null>(selectedFurnitureId);
  const [hoveredInteractableFurnitureId, setHoveredInteractableFurnitureId] =
    useState<string | null>(null);
  const [isDraggingFurniture, setIsDraggingFurniture] = useState(false);
  const [isTransformingFurniture, setIsTransformingFurniture] = useState(false);

  const releaseCapturedPointer = useCallback(() => {
    if (
      capturedPointerIdRef.current === null ||
      capturedPointerTargetRef.current === null
    ) {
      return;
    }

    try {
      capturedPointerTargetRef.current.releasePointerCapture?.(
        capturedPointerIdRef.current
      );
    } catch {
      // Ignore browsers that release capture before we get here.
    }

    capturedPointerIdRef.current = null;
    capturedPointerTargetRef.current = null;
  }, []);

  const resetBuilderGestureState = useCallback(
    (nextTransforming = false) => {
      releaseCapturedPointer();
      setIsDraggingFurniture(false);
      setIsTransformingFurniture(nextTransforming);
      dragStateRef.current = null;

      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = !nextTransforming;
      }
    },
    [orbitControlsRef, releaseCapturedPointer]
  );

  const interactionCursor = useMemo(() => {
    if (isDraggingFurniture || isTransformingFurniture) {
      return "grabbing";
    }

    if (!buildModeEnabled && hoveredInteractableFurnitureId) {
      return "pointer";
    }

    if (buildModeEnabled && (hoveredFurnitureId || selectedFurnitureId)) {
      return "grab";
    }

    return "grab";
  }, [
    buildModeEnabled,
    hoveredFurnitureId,
    hoveredInteractableFurnitureId,
    isDraggingFurniture,
    isTransformingFurniture,
    selectedFurnitureId
  ]);

  useEffect(() => {
    if (!isDraggingFurniture) {
      return;
    }

    function stopDragging() {
      resetBuilderGestureState(isTransformingFurniture);
    }

    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [isDraggingFurniture, isTransformingFurniture, resetBuilderGestureState]);

  useEffect(() => {
    if (buildModeEnabled) {
      setHoveredInteractableFurnitureId(null);
      return;
    }

    resetBuilderGestureState(false);
  }, [buildModeEnabled, resetBuilderGestureState]);

  useEffect(() => {
    const previousSelectedFurnitureId = previousSelectedFurnitureIdRef.current;

    if (
      previousSelectedFurnitureId !== selectedFurnitureId ||
      (!selectedFurniture && selectedFurnitureId === null)
    ) {
      resetBuilderGestureState(false);
    }

    previousSelectedFurnitureIdRef.current = selectedFurnitureId;
  }, [resetBuilderGestureState, selectedFurniture, selectedFurnitureId]);

  const capturePointer = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      const pointerTarget = event.target as PointerCaptureTarget;
      releaseCapturedPointer();
      pointerTarget.setPointerCapture?.(event.pointerId);
      capturedPointerIdRef.current = event.pointerId;
      capturedPointerTargetRef.current = pointerTarget;
    },
    [releaseCapturedPointer]
  );

  const handleCanvasPointerLeave = useCallback(() => {
    if (!isDraggingFurniture && !isTransformingFurniture) {
      setHoveredFurnitureId(null);
    }

    setHoveredInteractableFurnitureId(null);
  }, [
    isDraggingFurniture,
    isTransformingFurniture,
    setHoveredFurnitureId
  ]);

  const handleBuildSurfaceClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (!buildModeEnabled) {
        return false;
      }

      event.stopPropagation();

      if (isTransformingFurniture || isDraggingFurniture) {
        return true;
      }

      if (selectedFurnitureId) {
        finishFurnitureEditingSession(selectedFurnitureId, true);
      }

      return true;
    },
    [
      buildModeEnabled,
      finishFurnitureEditingSession,
      isDraggingFurniture,
      isTransformingFurniture,
      selectedFurnitureId
    ]
  );

  const handleFurniturePointerDown = useCallback(
    (furnitureId: string, event: ThreeEvent<PointerEvent>) => {
      if (!buildModeEnabled) {
        return;
      }

      setHoveredFurnitureId(furnitureId);

      if (selectedFurnitureId !== furnitureId || isTransformingFurniture) {
        return;
      }

      const isPrimaryPointer = event.pointerType === "touch" || event.button === 0;

      if (!isPrimaryPointer) {
        return;
      }

      event.stopPropagation();
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = false;
      }
      capturePointer(event);

      const pressedFurniture = findFurniturePlacement(furniture, furnitureId);
      setIsDraggingFurniture(true);
      dragStateRef.current = pressedFurniture
        ? {
            furnitureId,
            type: pressedFurniture.type,
            surface: pressedFurniture.surface,
            rotationY: pressedFurniture.rotationY,
            anchorFurnitureId: pressedFurniture.anchorFurnitureId
          }
        : null;
    },
    [
      buildModeEnabled,
      capturePointer,
      furniture,
      isTransformingFurniture,
      orbitControlsRef,
      selectedFurnitureId,
      setHoveredFurnitureId
    ]
  );

  const handleFurnitureDoubleClick = useCallback(
    (furnitureId: string, event: ThreeEvent<MouseEvent>) => {
      if (!buildModeEnabled || isDraggingFurniture || isTransformingFurniture) {
        return;
      }

      event.stopPropagation();

      if (selectedFurnitureId && selectedFurnitureId !== furnitureId) {
        finishFurnitureEditingSession(selectedFurnitureId, true);
      }

      selectFurnitureForEditing(furnitureId);
      setHoveredFurnitureId(furnitureId);
    },
    [
      buildModeEnabled,
      finishFurnitureEditingSession,
      isDraggingFurniture,
      isTransformingFurniture,
      selectFurnitureForEditing,
      selectedFurnitureId,
      setHoveredFurnitureId
    ]
  );

  const handleFurnitureClick = useCallback(
    (furnitureId: string, event: ThreeEvent<MouseEvent>) => {
      if (!buildModeEnabled || isDraggingFurniture || isTransformingFurniture) {
        return;
      }

      const clickedFurniture = findFurniturePlacement(furniture, furnitureId);

      if (!clickedFurniture || clickedFurniture.surface !== "surface") {
        return;
      }

      event.stopPropagation();

      if (selectedFurnitureId && selectedFurnitureId !== furnitureId) {
        finishFurnitureEditingSession(selectedFurnitureId, true);
      }

      selectFurnitureForEditing(furnitureId);
      setHoveredFurnitureId(furnitureId);
    },
    [
      buildModeEnabled,
      finishFurnitureEditingSession,
      furniture,
      isDraggingFurniture,
      isTransformingFurniture,
      selectFurnitureForEditing,
      selectedFurnitureId,
      setHoveredFurnitureId
    ]
  );

  const handleFurniturePointerMove = useCallback(
    (furnitureId: string, event: ThreeEvent<PointerEvent>) => {
      if (buildModeEnabled) {
        event.stopPropagation();

        if (
          !isDraggingFurniture &&
          !isTransformingFurniture &&
          hoveredFurnitureId !== furnitureId
        ) {
          setHoveredFurnitureId(furnitureId);
        }
      }

      if (
        !buildModeEnabled ||
        isTransformingFurniture ||
        !isDraggingFurniture ||
        !dragStateRef.current
      ) {
        return;
      }

      const nextPlacement = resolvePlacementFromDragRay(
        event.ray,
        dragStateRef.current,
        furniture,
        gridSnapEnabled
      );

      if (!nextPlacement) {
        return;
      }

      event.stopPropagation();
      dragStateRef.current = {
        ...dragStateRef.current,
        surface: nextPlacement.surface,
        rotationY: nextPlacement.rotationY,
        anchorFurnitureId: nextPlacement.anchorFurnitureId
      };
      updateFurnitureItem(dragStateRef.current.furnitureId, (item) =>
        applyPlacementToItem(item, nextPlacement)
      );
    },
    [
      buildModeEnabled,
      furniture,
      gridSnapEnabled,
      hoveredFurnitureId,
      isDraggingFurniture,
      isTransformingFurniture,
      setHoveredFurnitureId,
      updateFurnitureItem
    ]
  );

  const handleFurniturePointerUp = useCallback(
    (event?: ThreeEvent<PointerEvent>) => {
      event?.stopPropagation();
      resetBuilderGestureState(isTransformingFurniture);
    },
    [isTransformingFurniture, resetBuilderGestureState]
  );

  const handlePivotDrag = useCallback(
    (localMatrix: Matrix4) => {
      if (!selectedFurnitureId || !selectedFurniture) {
        return;
      }

      localMatrix.decompose(
        transformDragPosition,
        transformDragQuaternion,
        transformDragScale
      );
      transformDragEuler.setFromQuaternion(transformDragQuaternion);

      if (isWallSurface(selectedFurniture.surface)) {
        const nextPlacement = resolveWallPlacement(
          selectedFurniture.surface,
          getWallParallelCoordinate(selectedFurniture.surface, transformDragPosition),
          transformDragPosition.y,
          selectedFurniture.type,
          gridSnapEnabled
        );

        updateFurnitureItem(selectedFurnitureId, (item) => ({
          ...item,
          ...nextPlacement
        }));
        return;
      }

      if (selectedFurniture.surface === "surface") {
        const nextRotation = resolveFurnitureRotation(
          transformDragEuler.y,
          gridSnapEnabled
        );
        const nextPlacement = resolveSurfacePlacementFromWorldPoint(
          transformDragPosition.x,
          transformDragPosition.z,
          selectedFurniture.type,
          nextRotation,
          furniture,
          gridSnapEnabled,
          selectedFurniture.anchorFurnitureId,
          selectedFurniture.id
        );

        if (!nextPlacement) {
          return;
        }

        updateFurnitureItem(selectedFurnitureId, (item) => ({
          ...item,
          ...nextPlacement,
          rotationY: nextRotation
        }));
        return;
      }

      if (selectedFurniture.surface === "ceiling") {
        const nextRotation = resolveFurnitureRotation(
          transformDragEuler.y,
          gridSnapEnabled
        );
        const nextPlacement = resolveCeilingPlacement(
          transformDragPosition.x,
          transformDragPosition.z,
          selectedFurniture.type,
          gridSnapEnabled,
          nextRotation
        );

        updateFurnitureItem(selectedFurnitureId, (item) => ({
          ...item,
          ...nextPlacement,
          rotationY: nextRotation
        }));
        return;
      }

      const nextRotation = resolveFurnitureRotation(
        transformDragEuler.y,
        gridSnapEnabled
      );
      const nextPlacement = resolveFloorPlacement(
        transformDragPosition.x,
        transformDragPosition.z,
        selectedFurniture.type,
        gridSnapEnabled,
        nextRotation
      );

      updateFurnitureItem(selectedFurnitureId, (item) => ({
        ...item,
        ...nextPlacement,
        rotationY: nextRotation
      }));
    },
    [
      furniture,
      gridSnapEnabled,
      selectedFurniture,
      selectedFurnitureId,
      updateFurnitureItem
    ]
  );

  const handleSurfacePointerMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (
        buildModeEnabled &&
        !isDraggingFurniture &&
        !isTransformingFurniture &&
        hoveredFurnitureId
      ) {
        setHoveredFurnitureId(null);
      }

      if (
        !buildModeEnabled ||
        isTransformingFurniture ||
        !isDraggingFurniture ||
        !dragStateRef.current
      ) {
        return;
      }

      const nextPlacement = resolvePlacementFromDragRay(
        event.ray,
        dragStateRef.current,
        furniture,
        gridSnapEnabled
      );

      if (!nextPlacement) {
        return;
      }

      event.stopPropagation();
      dragStateRef.current = {
        ...dragStateRef.current,
        surface: nextPlacement.surface,
        rotationY: nextPlacement.rotationY,
        anchorFurnitureId: nextPlacement.anchorFurnitureId
      };
      updateFurnitureItem(dragStateRef.current.furnitureId, (item) =>
        applyPlacementToItem(item, nextPlacement)
      );
    },
    [
      buildModeEnabled,
      furniture,
      gridSnapEnabled,
      hoveredFurnitureId,
      isDraggingFurniture,
      isTransformingFurniture,
      setHoveredFurnitureId,
      updateFurnitureItem
    ]
  );

  const handleSurfacePointerUp = useCallback(() => {
    resetBuilderGestureState(isTransformingFurniture);
  }, [isTransformingFurniture, resetBuilderGestureState]);

  return {
    hoveredInteractableFurnitureId,
    interactionCursor,
    isDraggingFurniture,
    isTransformingFurniture,
    handleBuildSurfaceClick,
    handleCanvasPointerLeave,
    handleFurnitureClick,
    handleFurnitureDoubleClick,
    handleFurniturePointerDown,
    handleFurniturePointerMove,
    handleFurniturePointerUp,
    handlePivotDrag,
    handleSurfacePointerMove,
    handleSurfacePointerUp,
    resetBuilderGestureState,
    setHoveredInteractableFurnitureId
  };
}
