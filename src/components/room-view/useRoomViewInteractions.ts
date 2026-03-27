import { type ThreeEvent } from "@react-three/fiber";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction
} from "react";
import type { PlayerInteractionStatus } from "../../app/types";
import {
  aabbsOverlap,
  getFurnitureAABBs,
  getPlayerAABB
} from "../../lib/furnitureCollision";
import type {
  SharedPresenceActivity,
  SharedPresencePose,
  SharedPresenceSnapshot
} from "../../lib/sharedPresenceTypes";
import {
  getFurnitureInteractionTarget,
  type FurnitureInteractionTarget
} from "../../lib/furnitureInteractions";
import { getFurnitureDefinition } from "../../lib/furnitureRegistry";
import {
  findFurniturePlacement,
  type RoomFurniturePlacement,
  type Vector3Tuple
} from "../../lib/roomState";
import { clampToFloor, rotateLocalOffset } from "./helpers";

type QueuedPostInteractionAction =
  | {
      type: "move";
      position: Vector3Tuple;
    }
  | {
      type: "interact";
      interaction: FurnitureInteractionTarget;
    }
  | null;

type InteractionHint = {
  message: string;
  left: number;
  top: number;
};

type PlayerTeleportRequest = {
  requestId: number;
  position: Vector3Tuple;
} | null;

type PlayerInteractionPose = SharedPresencePose | null;

type UseRoomViewInteractionsOptions = {
  buildModeEnabled: boolean;
  clearHoveredInteractableFurnitureId: () => void;
  furniture: RoomFurniturePlacement[];
  initialPlayerPosition: Vector3Tuple;
  isDraggingFurniture: boolean;
  isTransformingFurniture: boolean;
  onInteractionStateChange: (status: PlayerInteractionStatus) => void;
  onPlayerPositionChange: (position: Vector3Tuple) => void;
  playerWorldPosition: Vector3Tuple;
  remotePresence: SharedPresenceSnapshot | null;
  setPlayerWorldPosition: Dispatch<SetStateAction<Vector3Tuple>>;
  standRequestToken: number;
};

export function useRoomViewInteractions({
  buildModeEnabled,
  clearHoveredInteractableFurnitureId,
  furniture,
  initialPlayerPosition,
  isDraggingFurniture,
  isTransformingFurniture,
  onInteractionStateChange,
  onPlayerPositionChange,
  playerWorldPosition,
  remotePresence,
  setPlayerWorldPosition,
  standRequestToken
}: UseRoomViewInteractionsOptions) {
  const lastStandRequestTokenRef = useRef(0);
  const nextTeleportRequestIdRef = useRef(1);
  const [targetPosition, setTargetPosition] = useState<Vector3Tuple>(
    initialPlayerPosition
  );
  const [playerTeleportRequest, setPlayerTeleportRequest] =
    useState<PlayerTeleportRequest>(null);
  const [pendingInteraction, setPendingInteraction] =
    useState<FurnitureInteractionTarget | null>(null);
  const [activeInteraction, setActiveInteraction] =
    useState<FurnitureInteractionTarget | null>(null);
  const [queuedPostInteractionAction, setQueuedPostInteractionAction] =
    useState<QueuedPostInteractionAction>(null);
  const [interactionHint, setInteractionHint] = useState<InteractionHint | null>(
    null
  );

  const playerInteractionStatus = useMemo<PlayerInteractionStatus>(() => {
    if (activeInteraction) {
      return {
        phase: "active",
        label: activeInteraction.furnitureLabel,
        interactionType: activeInteraction.type,
        furnitureId: activeInteraction.furnitureId
      };
    }

    if (pendingInteraction) {
      return {
        phase: "approaching",
        label: pendingInteraction.furnitureLabel,
        interactionType: pendingInteraction.type,
        furnitureId: pendingInteraction.furnitureId
      };
    }

    return null;
  }, [activeInteraction, pendingInteraction]);

  const playerInteractionPose = useMemo<PlayerInteractionPose>(() => {
    if (!activeInteraction) {
      return null;
    }

    return {
      type: activeInteraction.type,
      furnitureId: activeInteraction.furnitureId,
      position: activeInteraction.position,
      rotationY: activeInteraction.rotationY,
      poseOffset: activeInteraction.poseOffset,
      slotId: activeInteraction.slotId
    };
  }, [activeInteraction]);

  const getOccupiedLieSlots = useCallback(
    (furnitureId: string): Set<string> => {
      const occupiedSlotIds = new Set<string>();

      if (
        remotePresence?.pose?.type === "lie" &&
        remotePresence.pose.furnitureId === furnitureId &&
        remotePresence.pose.slotId
      ) {
        occupiedSlotIds.add(remotePresence.pose.slotId);
      }

      return occupiedSlotIds;
    },
    [remotePresence]
  );

  const playerPresenceActivity = useMemo<SharedPresenceActivity>(() => {
    if (activeInteraction) {
      return activeInteraction.type;
    }

    if (pendingInteraction) {
      return "walking";
    }

    const distanceToTarget = Math.hypot(
      targetPosition[0] - playerWorldPosition[0],
      targetPosition[2] - playerWorldPosition[2]
    );

    return distanceToTarget > 0.02 ? "walking" : "idle";
  }, [activeInteraction, pendingInteraction, playerWorldPosition, targetPosition]);

  const resetPlayerInteractions = useCallback(() => {
    setPendingInteraction(null);
    setActiveInteraction(null);
    setQueuedPostInteractionAction(null);
    clearHoveredInteractableFurnitureId();
  }, [clearHoveredInteractableFurnitureId]);

  const handlePlayerActorPositionChange = useCallback(
    (position: Vector3Tuple) => {
      setPlayerWorldPosition(position);
      onPlayerPositionChange(position);
    },
    [onPlayerPositionChange, setPlayerWorldPosition]
  );

  const jumpPlayerToPosition = useCallback(
    (position: Vector3Tuple, requestId: number) => {
      resetPlayerInteractions();
      setTargetPosition(position);
      setPlayerWorldPosition(position);
      setPlayerTeleportRequest({
        requestId,
        position
      });
      onPlayerPositionChange(position);
    },
    [onPlayerPositionChange, resetPlayerInteractions, setPlayerWorldPosition]
  );

  const canPlayerStandAt = useCallback(
    (position: Vector3Tuple): boolean => {
      const playerAABB = getPlayerAABB(position);

      return !furniture.some(
        (item) =>
          item.surface === "floor" &&
          item.type !== "rug" &&
          getFurnitureAABBs(item).some((aabb) => aabbsOverlap(playerAABB, aabb))
      );
    },
    [furniture]
  );

  function createStandCandidate(x: number, z: number): Vector3Tuple {
    return [clampToFloor(x), 0, clampToFloor(z)];
  }

  const getRankedStandCandidates = useCallback(
    (candidates: Vector3Tuple[]): Vector3Tuple[] => {
      const uniqueCandidates = candidates.filter(
        (candidate, index) =>
          candidates.findIndex(
            (other) =>
              Math.abs(other[0] - candidate[0]) < 0.01 &&
              Math.abs(other[1] - candidate[1]) < 0.01 &&
              Math.abs(other[2] - candidate[2]) < 0.01
          ) === index
      );

      return uniqueCandidates.sort(
        (first, second) =>
          Math.hypot(
            first[0] - playerWorldPosition[0],
            first[2] - playerWorldPosition[2]
          ) -
          Math.hypot(
            second[0] - playerWorldPosition[0],
            second[2] - playerWorldPosition[2]
          )
      );
    },
    [playerWorldPosition]
  );

  const findNearestFreeStandPosition = useCallback(
    (
      origin: Vector3Tuple,
      preferredRotationY: number,
      minDistance: number
    ): Vector3Tuple | null => {
      const searchCandidates: Vector3Tuple[] = [];
      const angleOffsets = [
        0,
        Math.PI,
        Math.PI / 2,
        -Math.PI / 2,
        Math.PI / 4,
        -Math.PI / 4,
        (3 * Math.PI) / 4,
        (-3 * Math.PI) / 4
      ];

      for (let radiusStep = 0; radiusStep < 6; radiusStep += 1) {
        const radius = minDistance + radiusStep * 0.45;

        angleOffsets.forEach((angleOffset) => {
          const angle = preferredRotationY + angleOffset;
          searchCandidates.push(
            createStandCandidate(
              origin[0] + Math.sin(angle) * radius,
              origin[2] + Math.cos(angle) * radius
            )
          );
        });
      }

      return getRankedStandCandidates(searchCandidates).find(canPlayerStandAt) ?? null;
    },
    [canPlayerStandAt, getRankedStandCandidates]
  );

  const resolveInteractionStandPosition = useCallback(
    (interaction: FurnitureInteractionTarget): Vector3Tuple => {
      const host =
        findFurniturePlacement(
          furniture,
          interaction.chairFurnitureId ?? interaction.furnitureId
        ) ?? findFurniturePlacement(furniture, interaction.furnitureId);
      const hostDefinition = host ? getFurnitureDefinition(host.type) : null;
      const hostPosition = host?.position ?? interaction.position;
      const hostRotation = host?.rotationY ?? interaction.rotationY;
      const sideDistance = (hostDefinition?.footprintWidth ?? 1) / 2 + 0.55;
      const forwardDistance = (hostDefinition?.footprintDepth ?? 1) / 2 + 0.55;
      const candidates: Vector3Tuple[] = [];

      function pushCandidate(
        basePosition: Vector3Tuple,
        localOffset: Vector3Tuple,
        rotationY: number
      ) {
        const [offsetX, , offsetZ] = rotateLocalOffset(localOffset, rotationY);
        candidates.push(
          createStandCandidate(basePosition[0] + offsetX, basePosition[2] + offsetZ)
        );
      }

      if (interaction.approachPosition) {
        candidates.push(
          createStandCandidate(
            interaction.approachPosition[0],
            interaction.approachPosition[2]
          )
        );
      }

      if (interaction.type === "use_pc") {
        pushCandidate(
          interaction.position,
          [0, 0, -forwardDistance],
          interaction.rotationY
        );
        pushCandidate(hostPosition, [sideDistance, 0, 0], hostRotation);
        pushCandidate(hostPosition, [-sideDistance, 0, 0], hostRotation);
      } else if (interaction.type === "sit") {
        pushCandidate(
          interaction.position,
          [0, 0, forwardDistance],
          interaction.rotationY
        );
        pushCandidate(hostPosition, [sideDistance, 0, 0], hostRotation);
        pushCandidate(hostPosition, [-sideDistance, 0, 0], hostRotation);
      } else {
        pushCandidate(hostPosition, [sideDistance, 0, 0], hostRotation);
        pushCandidate(hostPosition, [-sideDistance, 0, 0], hostRotation);
        pushCandidate(
          hostPosition,
          [0, 0, forwardDistance + 0.3],
          hostRotation
        );
        pushCandidate(
          hostPosition,
          [0, 0, -(forwardDistance + 0.3)],
          hostRotation
        );
      }

      const rankedCandidates = getRankedStandCandidates(candidates);
      const validCandidate = rankedCandidates.find(canPlayerStandAt);

      if (validCandidate) {
        return validCandidate;
      }

      const fallbackCandidate = findNearestFreeStandPosition(
        hostPosition,
        hostRotation,
        Math.max(sideDistance, forwardDistance)
      );

      if (fallbackCandidate) {
        return fallbackCandidate;
      }

      return rankedCandidates[0] ?? createStandCandidate(hostPosition[0], hostPosition[2]);
    },
    [
      canPlayerStandAt,
      findNearestFreeStandPosition,
      furniture,
      getRankedStandCandidates
    ]
  );

  const resolveInteractionExitPosition = useCallback(
    (interaction: FurnitureInteractionTarget): Vector3Tuple =>
      resolveInteractionStandPosition(interaction),
    [resolveInteractionStandPosition]
  );

  const clearPlayerInteraction = useCallback(
    (
      nextTarget?: Vector3Tuple,
      postExitAction: QueuedPostInteractionAction = null
    ) => {
      const exitingActiveInteraction = activeInteraction;

      setPendingInteraction(null);
      setActiveInteraction(null);
      setQueuedPostInteractionAction(postExitAction);

      if (nextTarget) {
        setTargetPosition(nextTarget);

        if (exitingActiveInteraction) {
          nextTeleportRequestIdRef.current += 1;
          setPlayerWorldPosition(nextTarget);
          setPlayerTeleportRequest({
            requestId: nextTeleportRequestIdRef.current,
            position: nextTarget
          });
          onPlayerPositionChange(nextTarget);
        }

        return;
      }

      setTargetPosition([
        playerWorldPosition[0],
        playerWorldPosition[1],
        playerWorldPosition[2]
      ]);
    },
    [
      activeInteraction,
      onPlayerPositionChange,
      playerWorldPosition,
      setPlayerWorldPosition
    ]
  );

  const showInteractionHint = useCallback(
    (message: string, event: ThreeEvent<MouseEvent>) => {
      const nativeEvent = event.nativeEvent;

      setInteractionHint({
        message,
        left: nativeEvent.clientX,
        top: nativeEvent.clientY
      });
    },
    []
  );

  const handleFloorMoveCommand = useCallback(
    (
      event: ThreeEvent<MouseEvent>,
      handleBuildSurfaceClick: (event: ThreeEvent<MouseEvent>) => boolean
    ) => {
      event.nativeEvent.preventDefault();

      if (handleBuildSurfaceClick(event)) {
        return;
      }

      if (isTransformingFurniture) {
        return;
      }

      event.stopPropagation();
      const nextTarget: Vector3Tuple = [
        clampToFloor(event.point.x),
        0,
        clampToFloor(event.point.z)
      ];

      if (activeInteraction) {
        clearPlayerInteraction(resolveInteractionExitPosition(activeInteraction));
        return;
      }

      if (pendingInteraction) {
        clearPlayerInteraction();
        setTargetPosition(nextTarget);
        return;
      }

      setTargetPosition(nextTarget);
    },
    [
      activeInteraction,
      clearPlayerInteraction,
      isTransformingFurniture,
      pendingInteraction,
      resolveInteractionExitPosition
    ]
  );

  const handleFurnitureInteractionCommand = useCallback(
    (furnitureId: string, event: ThreeEvent<MouseEvent>) => {
      if (buildModeEnabled || isDraggingFurniture || isTransformingFurniture) {
        return;
      }

      const clickedFurniture = findFurniturePlacement(furniture, furnitureId);

      if (!clickedFurniture) {
        return;
      }

      event.nativeEvent.preventDefault();
      event.stopPropagation();

      const interactionTarget = getFurnitureInteractionTarget(
        clickedFurniture,
        furniture,
        {
          occupiedSlotIds: getOccupiedLieSlots(furnitureId)
        }
      );

      if (!interactionTarget) {
        if (
          getFurnitureDefinition(clickedFurniture.type).interactionType ===
          "use_pc"
        ) {
          showInteractionHint("Need a chair", event);
        }

        return;
      }

      const nextInteractionTarget: FurnitureInteractionTarget = {
        ...interactionTarget,
        approachPosition: resolveInteractionStandPosition(interactionTarget)
      };

      if (activeInteraction?.furnitureId === furnitureId) {
        clearPlayerInteraction(
          resolveInteractionExitPosition(activeInteraction)
        );
        return;
      }

      if (
        activeInteraction?.type === "sit" &&
        nextInteractionTarget.type === "use_pc" &&
        activeInteraction.furnitureId ===
          nextInteractionTarget.chairFurnitureId
      ) {
        setQueuedPostInteractionAction(null);
        setPendingInteraction(null);
        setActiveInteraction(nextInteractionTarget);
        setTargetPosition(nextInteractionTarget.position);
        return;
      }

      if (activeInteraction) {
        clearPlayerInteraction(
          resolveInteractionExitPosition(activeInteraction)
        );
        return;
      }

      setQueuedPostInteractionAction(null);
      setActiveInteraction(null);
      setPendingInteraction(nextInteractionTarget);
      setTargetPosition(
        nextInteractionTarget.approachPosition ??
          nextInteractionTarget.position
      );
    },
    [
      activeInteraction,
      buildModeEnabled,
      clearPlayerInteraction,
      furniture,
      getOccupiedLieSlots,
      isDraggingFurniture,
      isTransformingFurniture,
      resolveInteractionExitPosition,
      resolveInteractionStandPosition,
      showInteractionHint
    ]
  );

  useEffect(() => {
    if (!buildModeEnabled) {
      return;
    }

    resetPlayerInteractions();
  }, [buildModeEnabled, resetPlayerInteractions]);

  useEffect(() => {
    onInteractionStateChange(playerInteractionStatus);
  }, [onInteractionStateChange, playerInteractionStatus]);

  useEffect(() => {
    if (!interactionHint) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setInteractionHint((current) =>
        current === interactionHint ? null : current
      );
    }, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [interactionHint]);

  useEffect(() => {
    if (!pendingInteraction || activeInteraction) {
      return;
    }

    const interactionApproachPosition =
      pendingInteraction.approachPosition ?? pendingInteraction.position;
    const distance = Math.hypot(
      playerWorldPosition[0] - interactionApproachPosition[0],
      playerWorldPosition[2] - interactionApproachPosition[2]
    );

    if (distance > 0.05) {
      return;
    }

    setTargetPosition(pendingInteraction.position);
    setActiveInteraction(pendingInteraction);
    setPendingInteraction(null);
  }, [activeInteraction, pendingInteraction, playerWorldPosition]);

  useEffect(() => {
    if (!queuedPostInteractionAction || activeInteraction || pendingInteraction) {
      return;
    }

    if (queuedPostInteractionAction.type === "move") {
      setTargetPosition(queuedPostInteractionAction.position);
    } else {
      setPendingInteraction(queuedPostInteractionAction.interaction);
      setTargetPosition(
        queuedPostInteractionAction.interaction.approachPosition ??
          queuedPostInteractionAction.interaction.position
      );
    }

    setQueuedPostInteractionAction(null);
  }, [activeInteraction, pendingInteraction, queuedPostInteractionAction]);

  useEffect(() => {
    if (
      !standRequestToken ||
      standRequestToken === lastStandRequestTokenRef.current
    ) {
      return;
    }

    lastStandRequestTokenRef.current = standRequestToken;

    if (activeInteraction) {
      clearPlayerInteraction(resolveInteractionExitPosition(activeInteraction));
      return;
    }

    if (pendingInteraction) {
      clearPlayerInteraction();
    }
  }, [
    activeInteraction,
    clearPlayerInteraction,
    pendingInteraction,
    resolveInteractionExitPosition,
    standRequestToken
  ]);

  return {
    activeInteraction,
    handleFloorMoveCommand,
    handleFurnitureInteractionCommand,
    handlePlayerActorPositionChange,
    interactionHint,
    jumpPlayerToPosition,
    pendingInteraction,
    playerPresenceActivity,
    playerInteractionPose,
    playerTeleportRequest,
    resetPlayerInteractions,
    targetPosition
  };
}
