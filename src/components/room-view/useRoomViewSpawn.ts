import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { FurnitureSpawnRequest } from "../../app/types";
import { getFurnitureCollisionReason } from "../../lib/furnitureCollision";
import { getFurnitureDefinition } from "../../lib/furnitureRegistry";
import {
  createFurniturePlacement,
  type RoomFurniturePlacement,
  type Vector3Tuple
} from "../../lib/roomState";
import {
  spawnCandidateOffsets,
  surfaceSpawnCandidateOffsets
} from "./constants";
import {
  getEditableSurfaceHosts,
  getPreferredWallSurface,
  resolveSpawnPosition,
  type PlacementTransform
} from "./placementResolvers";

type FindSpawnPlacementOptions = {
  furniture: RoomFurniturePlacement[];
  gridSnapEnabled: boolean;
  playerWorldPosition: Vector3Tuple;
  spawnRequest: FurnitureSpawnRequest;
  targetPosition: Vector3Tuple;
};

type UseRoomViewSpawnOptions = Omit<FindSpawnPlacementOptions, "spawnRequest"> & {
  beginNewFurnitureEditing: (furnitureId: string) => void;
  setFurniture: Dispatch<SetStateAction<RoomFurniturePlacement[]>>;
  spawnRequest: FurnitureSpawnRequest | null;
};

export function findSpawnPlacement({
  furniture,
  gridSnapEnabled,
  playerWorldPosition,
  spawnRequest,
  targetPosition
}: FindSpawnPlacementOptions): PlacementTransform | null {
  const definition = getFurnitureDefinition(spawnRequest.type);
  const editableSurfaceHosts = getEditableSurfaceHosts(furniture);
  const spawnSurface =
    definition.surface === "wall"
      ? getPreferredWallSurface(targetPosition)
      : definition.surface === "surface"
        ? "surface"
        : definition.surface === "ceiling"
          ? "ceiling"
        : "floor";

  if (spawnSurface === "surface" && editableSurfaceHosts.length === 0) {
    return null;
  }

  const initialSpawnPlacement = resolveSpawnPosition(
    spawnRequest.type,
    spawnSurface,
    targetPosition,
    0,
    0,
    furniture,
    gridSnapEnabled
  );

  const candidateOffsets =
    spawnSurface === "surface"
      ? surfaceSpawnCandidateOffsets
      : spawnCandidateOffsets;

  for (const [offsetA, offsetB] of candidateOffsets) {
    const candidate = resolveSpawnPosition(
      spawnRequest.type,
      spawnSurface,
      targetPosition,
      offsetA,
      offsetB,
      furniture,
      gridSnapEnabled
    );
    const candidatePlacement: RoomFurniturePlacement = {
      id: `${spawnRequest.type}-spawn-preview`,
      type: spawnRequest.type,
      ownedFurnitureId: spawnRequest.ownedFurnitureId,
      position: candidate.position,
      rotationY: candidate.rotationY,
      surface: candidate.surface,
      anchorFurnitureId: candidate.anchorFurnitureId,
      surfaceLocalOffset: candidate.surfaceLocalOffset
    };

    if (!getFurnitureCollisionReason(candidatePlacement, furniture, playerWorldPosition)) {
      return candidate;
    }
  }

  return initialSpawnPlacement;
}

export function useRoomViewSpawn({
  beginNewFurnitureEditing,
  furniture,
  gridSnapEnabled,
  playerWorldPosition,
  setFurniture,
  spawnRequest,
  targetPosition
}: UseRoomViewSpawnOptions) {
  const lastProcessedSpawnRequestIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      !spawnRequest ||
      lastProcessedSpawnRequestIdRef.current === spawnRequest.requestId
    ) {
      return;
    }

    lastProcessedSpawnRequestIdRef.current = spawnRequest.requestId;

    const nextPlacement = findSpawnPlacement({
      furniture,
      gridSnapEnabled,
      playerWorldPosition,
      spawnRequest,
      targetPosition
    });

    if (!nextPlacement) {
      return;
    }

    const nextFurniturePlacement = createFurniturePlacement(
      spawnRequest.type,
      nextPlacement.position,
      nextPlacement.surface,
      {
        ownedFurnitureId: spawnRequest.ownedFurnitureId,
        anchorFurnitureId: nextPlacement.anchorFurnitureId,
        surfaceLocalOffset: nextPlacement.surfaceLocalOffset
      }
    );

    setFurniture((currentFurniture) => [...currentFurniture, nextFurniturePlacement]);
    beginNewFurnitureEditing(nextFurniturePlacement.id);
  }, [
    beginNewFurnitureEditing,
    furniture,
    gridSnapEnabled,
    playerWorldPosition,
    setFurniture,
    spawnRequest,
    targetPosition
  ]);
}
