import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  getFurnitureCollisionReason,
  type CollisionReason
} from "../../lib/furnitureCollision";
import {
  placementListsMatch,
  placementsMatch
} from "../../lib/roomPlacementEquality";
import {
  cloneFurniturePlacement,
  cloneFurniturePlacements,
  findFurniturePlacement,
  removeFurniturePlacement,
  updateFurniturePlacement,
  type RoomFurniturePlacement,
  type Vector3Tuple
} from "../../lib/roomState";
import {
  canHostSurfaceDecor,
  syncAnchoredSurfaceDecor
} from "../../lib/surfaceDecor";
import { FREE_MOVE_NUDGE_STEP } from "./constants";
import {
  getNextWallSurface,
  getWallParallelCoordinate,
  hasFixedWallVerticalPlacement,
  isWallSurface
} from "./helpers";
import {
  applyPlacementToItem,
  resolveFloorPlacement,
  resolveFurnitureRotation,
  resolveSurfacePlacementOnHost,
  resolveWallPlacement
} from "./placementResolvers";

type UseRoomFurnitureEditorOptions = {
  acquireEditLock?: (furnitureId: string) => Promise<boolean>;
  buildModeEnabled: boolean;
  gridSnapEnabled: boolean;
  initialFurniturePlacements: RoomFurniturePlacement[];
  localLockedFurnitureIds?: ReadonlySet<string>;
  onSharedEditConflict?: () => void;
  playerWorldPosition: Vector3Tuple;
  onFurnitureSnapshotChange: (placements: RoomFurniturePlacement[]) => void;
  onCommittedFurnitureChange: (placements: RoomFurniturePlacement[]) => void;
  partnerLockedFurnitureIds?: ReadonlySet<string>;
  releaseEditLock?: (furnitureId: string) => Promise<void>;
  renewEditLock?: (furnitureId: string) => Promise<boolean>;
};

const LOCK_RENEW_INTERVAL_MS = 2500;

export function useRoomFurnitureEditor({
  acquireEditLock,
  buildModeEnabled,
  gridSnapEnabled,
  initialFurniturePlacements,
  localLockedFurnitureIds = new Set<string>(),
  onSharedEditConflict,
  playerWorldPosition,
  onFurnitureSnapshotChange,
  onCommittedFurnitureChange,
  partnerLockedFurnitureIds = new Set<string>(),
  releaseEditLock,
  renewEditLock
}: UseRoomFurnitureEditorOptions) {
  const initialFurnitureRef = useRef(
    cloneFurniturePlacements(initialFurniturePlacements)
  );
  const lastSyncedInitialFurnitureRef = useRef<RoomFurniturePlacement[]>(
    cloneFurniturePlacements(initialFurnitureRef.current)
  );
  const lastReportedFurnitureRef = useRef<RoomFurniturePlacement[]>(
    cloneFurniturePlacements(initialFurnitureRef.current)
  );
  const lastReportedCommittedFurnitureRef = useRef<RoomFurniturePlacement[]>(
    cloneFurniturePlacements(initialFurnitureRef.current)
  );
  const furnitureEditStartRef = useRef<
    Record<string, RoomFurniturePlacement | null>
  >({});
  const [committedFurniture, setCommittedFurniture] = useState<
    RoomFurniturePlacement[]
  >(cloneFurniturePlacements(initialFurnitureRef.current));
  const [furniture, setFurniture] = useState<RoomFurniturePlacement[]>(
    cloneFurniturePlacements(initialFurnitureRef.current)
  );
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(
    null
  );
  const [hoveredFurnitureId, setHoveredFurnitureId] = useState<string | null>(
    null
  );
  const [busyFurnitureId, setBusyFurnitureId] = useState<string | null>(null);
  const selectedFurnitureIdRef = useRef<string | null>(selectedFurnitureId);

  const selectedFurniture = useMemo(
    () => findFurniturePlacement(furniture, selectedFurnitureId),
    [furniture, selectedFurnitureId]
  );
  const busyFurniture = useMemo(
    () => findFurniturePlacement(furniture, busyFurnitureId),
    [busyFurnitureId, furniture]
  );
  const placementBlockReason = useMemo<CollisionReason | null>(() => {
    if (!selectedFurniture) {
      return null;
    }

    return getFurnitureCollisionReason(
      selectedFurniture,
      furniture.filter((item) => item.id !== selectedFurniture.id),
      playerWorldPosition
    );
  }, [furniture, playerWorldPosition, selectedFurniture]);
  const isPlacementBlocked = placementBlockReason !== null;
  const isSelectedFurnitureBusyByPartner =
    selectedFurnitureId !== null &&
    partnerLockedFurnitureIds.has(selectedFurnitureId) &&
    !localLockedFurnitureIds.has(selectedFurnitureId);
  const selectedSurface = selectedFurniture?.surface ?? "floor";
  const sharedLockingEnabled =
    acquireEditLock !== undefined ||
    renewEditLock !== undefined ||
    releaseEditLock !== undefined ||
    partnerLockedFurnitureIds.size > 0 ||
    localLockedFurnitureIds.size > 0;

  useEffect(() => {
    selectedFurnitureIdRef.current = selectedFurnitureId;
  }, [selectedFurnitureId]);

  const itemRequiresEditLock = useCallback(
    (furnitureId: string | null) =>
      Boolean(
        furnitureId && committedFurniture.some((item) => item.id === furnitureId)
      ),
    [committedFurniture]
  );

  const releaseExistingEditLock = useCallback(
    (furnitureId: string | null) => {
      if (!furnitureId || !itemRequiresEditLock(furnitureId) || !releaseEditLock) {
        return;
      }

      void releaseEditLock(furnitureId);
    },
    [itemRequiresEditLock, releaseEditLock]
  );

  const handleStaleSharedEdit = useCallback(
    (furnitureId: string | null) => {
      if (!furnitureId) {
        return;
      }

      releaseExistingEditLock(furnitureId);
      delete furnitureEditStartRef.current[furnitureId];
      setBusyFurnitureId(furnitureId);
      setFurniture(cloneFurniturePlacements(committedFurniture));
      setSelectedFurnitureId(null);
      setHoveredFurnitureId(furnitureId);
      onSharedEditConflict?.();
    },
    [committedFurniture, onSharedEditConflict, releaseExistingEditLock]
  );

  useEffect(() => {
    if (placementListsMatch(lastReportedFurnitureRef.current, furniture)) {
      return;
    }

    const nextPlacements = cloneFurniturePlacements(furniture);
    lastReportedFurnitureRef.current = nextPlacements;
    onFurnitureSnapshotChange(nextPlacements);
  }, [furniture, onFurnitureSnapshotChange]);

  useEffect(() => {
    if (
      placementListsMatch(
        lastReportedCommittedFurnitureRef.current,
        committedFurniture
      )
    ) {
      return;
    }

    const nextPlacements = cloneFurniturePlacements(committedFurniture);
    lastReportedCommittedFurnitureRef.current = nextPlacements;
    onCommittedFurnitureChange(nextPlacements);
  }, [committedFurniture, onCommittedFurnitureChange]);

  useLayoutEffect(() => {
    if (
      placementListsMatch(
        lastSyncedInitialFurnitureRef.current,
        initialFurniturePlacements
      )
    ) {
      return;
    }

    const nextPlacements = cloneFurniturePlacements(initialFurniturePlacements);
    releaseExistingEditLock(selectedFurnitureIdRef.current);
    lastSyncedInitialFurnitureRef.current = nextPlacements;
    lastReportedCommittedFurnitureRef.current = nextPlacements;
    setCommittedFurniture(nextPlacements);
    setFurniture(nextPlacements);
    setBusyFurnitureId(null);
    setSelectedFurnitureId(null);
    setHoveredFurnitureId(null);
    furnitureEditStartRef.current = {};
  }, [initialFurniturePlacements, releaseExistingEditLock]);

  useEffect(() => {
    if (buildModeEnabled) {
      return;
    }

    releaseExistingEditLock(selectedFurnitureIdRef.current);
    setFurniture(cloneFurniturePlacements(committedFurniture));
    setBusyFurnitureId(null);
    setSelectedFurnitureId(null);
    setHoveredFurnitureId(null);
    furnitureEditStartRef.current = {};
  }, [buildModeEnabled, committedFurniture, releaseExistingEditLock]);

  useEffect(() => {
    if (busyFurnitureId && !partnerLockedFurnitureIds.has(busyFurnitureId)) {
      setBusyFurnitureId(null);
    }
  }, [busyFurnitureId, partnerLockedFurnitureIds]);

  useEffect(() => {
    if (!selectedFurnitureId || selectedFurniture) {
      return;
    }

    delete furnitureEditStartRef.current[selectedFurnitureId];
    setSelectedFurnitureId(null);
    setHoveredFurnitureId((current) =>
      current === selectedFurnitureId ? null : current
    );
  }, [selectedFurniture, selectedFurnitureId]);

  useEffect(() => {
    if (
      !selectedFurnitureId ||
      !sharedLockingEnabled ||
      !itemRequiresEditLock(selectedFurnitureId) ||
      localLockedFurnitureIds.has(selectedFurnitureId)
    ) {
      return;
    }

    handleStaleSharedEdit(selectedFurnitureId);
  }, [
    handleStaleSharedEdit,
    itemRequiresEditLock,
    localLockedFurnitureIds,
    selectedFurnitureId,
    sharedLockingEnabled
  ]);

  useEffect(() => {
    if (
      !selectedFurnitureId ||
      !sharedLockingEnabled ||
      !itemRequiresEditLock(selectedFurnitureId) ||
      !renewEditLock
    ) {
      return;
    }

    let cancelled = false;
    const activeFurnitureId = selectedFurnitureId;
    const renewId = window.setInterval(() => {
      void renewEditLock(activeFurnitureId).then((isStillHeld) => {
        if (!cancelled && !isStillHeld) {
          handleStaleSharedEdit(activeFurnitureId);
        }
      });
    }, LOCK_RENEW_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(renewId);
    };
  }, [
    handleStaleSharedEdit,
    itemRequiresEditLock,
    renewEditLock,
    selectedFurnitureId,
    sharedLockingEnabled
  ]);

  useEffect(
    () => () => {
      releaseExistingEditLock(selectedFurnitureIdRef.current);
    },
    [releaseExistingEditLock]
  );

  function updateFurnitureItem(
    furnitureId: string,
    updater: (item: RoomFurniturePlacement) => RoomFurniturePlacement
  ) {
    setFurniture((currentFurniture) => {
      const previousItem = findFurniturePlacement(currentFurniture, furnitureId);

      if (!previousItem) {
        return currentFurniture;
      }

      const nextItem = updater(previousItem);
      let nextFurniture = updateFurniturePlacement(
        currentFurniture,
        furnitureId,
        () => nextItem
      );

      if (canHostSurfaceDecor(previousItem)) {
        nextFurniture = syncAnchoredSurfaceDecor(
          nextFurniture,
          previousItem,
          nextItem
        );
      }

      return nextFurniture;
    });
  }

  function hasDraftChanges(furnitureId: string | null): boolean {
    if (!furnitureId) {
      return false;
    }

    const editStart = furnitureEditStartRef.current[furnitureId];
    const currentPlacement = findFurniturePlacement(furniture, furnitureId);

    if (!currentPlacement) {
      return false;
    }

    if (editStart === null) {
      return true;
    }

    if (!editStart) {
      return false;
    }

    return !placementsMatch(editStart, currentPlacement);
  }

  function revertFurnitureItemToCommitted(furnitureId: string) {
    const committedItem = committedFurniture.find((item) => item.id === furnitureId);

    if (!committedItem) {
      setFurniture((currentFurniture) =>
        removeFurniturePlacement(currentFurniture, furnitureId)
      );
      return;
    }

    updateFurnitureItem(furnitureId, () => cloneFurniturePlacement(committedItem));
  }

  function cancelFurnitureDraft(furnitureId: string) {
    const editStart = furnitureEditStartRef.current[furnitureId];

    if (editStart) {
      updateFurnitureItem(furnitureId, () => cloneFurniturePlacement(editStart));
    } else {
      revertFurnitureItemToCommitted(furnitureId);
    }

    delete furnitureEditStartRef.current[furnitureId];
  }

  function finishFurnitureEditingSession(
    furnitureId: string | null,
    cancelDraft: boolean
  ) {
    if (furnitureId) {
      releaseExistingEditLock(furnitureId);
      if (cancelDraft && hasDraftChanges(furnitureId)) {
        cancelFurnitureDraft(furnitureId);
      } else {
        delete furnitureEditStartRef.current[furnitureId];
      }
    }

    setBusyFurnitureId(null);
    setSelectedFurnitureId(null);
    setHoveredFurnitureId(null);
  }

  async function selectFurnitureForEditing(furnitureId: string) {
    if (selectedFurnitureId && selectedFurnitureId !== furnitureId) {
      finishFurnitureEditingSession(selectedFurnitureId, true);
    }

    const baseItem =
      committedFurniture.find((item) => item.id === furnitureId) ??
      furniture.find((item) => item.id === furnitureId);

    if (!baseItem) {
      return;
    }

    if (partnerLockedFurnitureIds.has(furnitureId)) {
      setBusyFurnitureId(furnitureId);
      setSelectedFurnitureId(null);
      setHoveredFurnitureId(furnitureId);
      return;
    }

    if (sharedLockingEnabled && itemRequiresEditLock(furnitureId) && acquireEditLock) {
      const lockAcquired = await acquireEditLock(furnitureId);

      if (!lockAcquired) {
        setBusyFurnitureId(furnitureId);
        setSelectedFurnitureId(null);
        setHoveredFurnitureId(furnitureId);
        return;
      }
    }

    if (!(furnitureId in furnitureEditStartRef.current)) {
      const committedItem = committedFurniture.find((item) => item.id === furnitureId);
      furnitureEditStartRef.current[furnitureId] = committedItem
        ? cloneFurniturePlacement(committedItem)
        : null;
    }

    setBusyFurnitureId(null);
    setSelectedFurnitureId(furnitureId);
  }

  function beginNewFurnitureEditing(furnitureId: string) {
    setBusyFurnitureId(null);
    setSelectedFurnitureId(furnitureId);
    setHoveredFurnitureId(furnitureId);
    furnitureEditStartRef.current[furnitureId] = null;
  }

  function getNudgeStep() {
    if (selectedFurniture?.surface === "surface") {
      return gridSnapEnabled ? 0.5 : FREE_MOVE_NUDGE_STEP;
    }

    return gridSnapEnabled ? 1 : FREE_MOVE_NUDGE_STEP;
  }

  function handleCancelFurniturePlacement() {
    finishFurnitureEditingSession(selectedFurnitureId, true);
  }

  function handleStoreFurniturePlacement() {
    if (!selectedFurnitureId) {
      return;
    }

    const furnitureIdsToRemove = new Set([
      selectedFurnitureId,
      ...furniture
        .filter((item) => item.anchorFurnitureId === selectedFurnitureId)
        .map((item) => item.id)
    ]);

    setFurniture((currentFurniture) =>
      currentFurniture.filter((item) => !furnitureIdsToRemove.has(item.id))
    );
    setCommittedFurniture((currentFurniture) =>
      currentFurniture.filter((item) => !furnitureIdsToRemove.has(item.id))
    );
    furnitureIdsToRemove.forEach((furnitureId) => {
      delete furnitureEditStartRef.current[furnitureId];
    });
    finishFurnitureEditingSession(selectedFurnitureId, false);
  }

  function handleNudgeSelectedFurniture(horizontalDirection: -1 | 1) {
    if (!selectedFurnitureId || !selectedFurniture) {
      return;
    }

    const step = getNudgeStep() * horizontalDirection;

    if (selectedFurniture.surface === "floor") {
      updateFurnitureItem(selectedFurnitureId, (item) =>
        applyPlacementToItem(
          item,
          resolveFloorPlacement(
            item.position[0] + step,
            item.position[2],
            item.type,
            gridSnapEnabled,
            item.rotationY
          )
        )
      );
      return;
    }

    if (selectedFurniture.surface === "surface") {
      updateFurnitureItem(selectedFurnitureId, (item) => {
        const host = findFurniturePlacement(furniture, item.anchorFurnitureId ?? null);
        const currentOffset = item.surfaceLocalOffset ?? [0, 0];

        if (!host) {
          return item;
        }

        const nextPlacement = resolveSurfacePlacementOnHost(
          host,
          item.type,
          [currentOffset[0] + step, currentOffset[1]],
          item.rotationY,
          gridSnapEnabled
        );

        return nextPlacement ? applyPlacementToItem(item, nextPlacement) : item;
      });
      return;
    }

    if (!isWallSurface(selectedFurniture.surface)) {
      return;
    }

    updateFurnitureItem(selectedFurnitureId, (item) => {
      if (!isWallSurface(item.surface)) {
        return item;
      }

      return {
        ...item,
        ...resolveWallPlacement(
          item.surface,
          getWallParallelCoordinate(item.surface, item.position) + step,
          item.position[1],
          item.type,
          gridSnapEnabled
        )
      };
    });
  }

  function handleNudgeSelectedFurnitureVertical(verticalDirection: -1 | 1) {
    if (!selectedFurnitureId || !selectedFurniture) {
      return;
    }

    const step = getNudgeStep() * verticalDirection;

    if (selectedFurniture.surface === "floor") {
      updateFurnitureItem(selectedFurnitureId, (item) =>
        applyPlacementToItem(
          item,
          resolveFloorPlacement(
            item.position[0],
            item.position[2] + step,
            item.type,
            gridSnapEnabled,
            item.rotationY
          )
        )
      );
      return;
    }

    if (selectedFurniture.surface === "surface") {
      updateFurnitureItem(selectedFurnitureId, (item) => {
        const host = findFurniturePlacement(furniture, item.anchorFurnitureId ?? null);
        const currentOffset = item.surfaceLocalOffset ?? [0, 0];

        if (!host) {
          return item;
        }

        const nextPlacement = resolveSurfacePlacementOnHost(
          host,
          item.type,
          [currentOffset[0], currentOffset[1] + step],
          item.rotationY,
          gridSnapEnabled
        );

        return nextPlacement ? applyPlacementToItem(item, nextPlacement) : item;
      });
      return;
    }

    if (hasFixedWallVerticalPlacement(selectedFurniture.type)) {
      return;
    }

    updateFurnitureItem(selectedFurnitureId, (item) => {
      if (!isWallSurface(item.surface)) {
        return item;
      }

      return {
        ...item,
        ...resolveWallPlacement(
          item.surface,
          getWallParallelCoordinate(item.surface, item.position),
          item.position[1] + step,
          item.type,
          gridSnapEnabled
        )
      };
    });
  }

  function handleRotateSelectedFurniture(direction: -1 | 1) {
    if (
      !selectedFurnitureId ||
      !selectedFurniture ||
      (selectedFurniture.surface !== "floor" &&
        selectedFurniture.surface !== "surface")
    ) {
      return;
    }

    const step = gridSnapEnabled ? Math.PI / 2 : Math.PI / 180;

    updateFurnitureItem(selectedFurnitureId, (item) => {
      const nextRotation = resolveFurnitureRotation(
        item.rotationY + step * direction,
        gridSnapEnabled
      );

      if (item.surface === "surface") {
        const host = findFurniturePlacement(furniture, item.anchorFurnitureId ?? null);
        const currentOffset = item.surfaceLocalOffset ?? [0, 0];

        if (!host) {
          return item;
        }

        const nextPlacement = resolveSurfacePlacementOnHost(
          host,
          item.type,
          currentOffset,
          nextRotation,
          gridSnapEnabled
        );

        return nextPlacement
          ? {
              ...item,
              ...nextPlacement,
              rotationY: nextRotation
            }
          : {
              ...item,
              rotationY: nextRotation
            };
      }

      return {
        ...item,
        ...resolveFloorPlacement(
          item.position[0],
          item.position[2],
          item.type,
          gridSnapEnabled,
          nextRotation
        ),
        rotationY: nextRotation
      };
    });
  }

  function handleSwapSelectedWall() {
    if (
      !selectedFurnitureId ||
      !selectedFurniture ||
      !isWallSurface(selectedFurniture.surface)
    ) {
      return;
    }

    const nextSurface = getNextWallSurface(selectedFurniture.surface);
    const horizontalSource = getWallParallelCoordinate(
      selectedFurniture.surface,
      selectedFurniture.position
    );
    const nextPlacement = resolveWallPlacement(
      nextSurface,
      horizontalSource,
      selectedFurniture.position[1],
      selectedFurniture.type,
      gridSnapEnabled
    );

    updateFurnitureItem(selectedFurnitureId, (item) => ({
      ...item,
      ...nextPlacement
    }));
  }

  function handleDeselectFurniture() {
    if (!selectedFurnitureId && busyFurnitureId) {
      setBusyFurnitureId(null);
      setHoveredFurnitureId(null);
      return;
    }

    finishFurnitureEditingSession(selectedFurnitureId, true);
  }

  function handleConfirmFurniturePlacement() {
    if (!selectedFurnitureId || !selectedFurniture || isPlacementBlocked) {
      return;
    }

    if (
      sharedLockingEnabled &&
      itemRequiresEditLock(selectedFurnitureId) &&
      !localLockedFurnitureIds.has(selectedFurnitureId)
    ) {
    handleStaleSharedEdit(selectedFurnitureId);
    return;
  }

    setCommittedFurniture(cloneFurniturePlacements(furniture));
    finishFurnitureEditingSession(selectedFurnitureId, false);
  }

  return {
    busyFurniture,
    busyFurnitureId,
    committedFurniture,
    furniture,
    hoveredFurnitureId,
    isPlacementBlocked,
    isSelectedFurnitureBusyByPartner,
    placementBlockReason,
    selectedFurniture,
    selectedFurnitureId,
    selectedSurface,
    beginNewFurnitureEditing,
    finishFurnitureEditingSession,
    handleCancelFurniturePlacement,
    handleConfirmFurniturePlacement,
    handleDeselectFurniture,
    handleNudgeSelectedFurniture,
    handleNudgeSelectedFurnitureVertical,
    handleRotateSelectedFurniture,
    handleStoreFurniturePlacement,
    handleSwapSelectedWall,
    selectFurnitureForEditing,
    setFurniture,
    setHoveredFurnitureId,
    setSelectedFurnitureId,
    updateFurnitureItem
  };
}
