import { useEffect, useRef, memo, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { ImportedMobPreset } from "../../lib/mobLab";
import {
  getCatPauseDurationMs,
  selectCatPausePhase,
  type CatPausePhase
} from "../../lib/petBehavior";
import {
  buildPetPathWaypoints,
  pickPetRecoveryTarget,
  pickPetRoomWanderTarget,
  pickPetWanderTarget,
  pointIntersectsPetObstacle,
  type PetNavigationMap,
  type PetObstacle
} from "../../lib/petPathing";
import type { OwnedPet } from "../../lib/pets";
import type { Vector3Tuple } from "../../lib/roomState";
import type { SharedPetLiveState } from "../../lib/sharedPresenceTypes";
import {
  pushBufferedMotionSample,
  sampleBufferedMotion,
  type BufferedMotionSample
} from "../../lib/liveMotionPlayback";
import { ImportedMobActor } from "../mob-lab/ImportedMobActor";
import type { MobExternalMotionState } from "../mob-lab/MobPreviewActor";

const SHARED_PET_BROADCAST_INTERVAL_MS = 100;
const CAT_ROUTE_HISTORY_LIMIT = 6;
const PET_WAYPOINT_REACHED_DISTANCE = 0.16;
const PET_DESTINATION_REACHED_DISTANCE = 0.12;

type CatRouteMode = "wander" | "recovery";

function createSeededRandom(seedText: string): () => number {
  let seed = 2166136261;

  for (const character of seedText) {
    seed ^= character.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }

  return () => {
    seed = Math.imul(seed, 1664525) + 1013904223;
    return (seed >>> 0) / 0x100000000;
  };
}

function lerpAngle(current: number, target: number, factor: number): number {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + difference * factor;
}

function cloneVector3Tuple(position: Vector3Tuple): Vector3Tuple {
  return [position[0], 0, position[2]];
}

function getWaypointPathDistance(startPosition: Vector3Tuple, waypoints: Vector3Tuple[]): number {
  let totalDistance = 0;
  let previousPoint = startPosition;

  for (const waypoint of waypoints) {
    totalDistance += Math.hypot(waypoint[0] - previousPoint[0], waypoint[2] - previousPoint[2]);
    previousPoint = waypoint;
  }

  return totalDistance;
}

function resolveCatRouteSpeed(
  routeMode: CatRouteMode,
  routeDistance: number,
  speedScale: number,
  randomValue: () => number
): number {
  if (routeMode === "recovery") {
    return (1.6 + randomValue() * 0.12) * speedScale;
  }

  const distanceBonus = routeDistance > 5.5 ? 0.14 : routeDistance > 3.8 ? 0.06 : 0;
  return (1.12 + distanceBonus + randomValue() * 0.12) * speedScale;
}

export const RoomPetActor = memo(function RoomPetActor({
  authorityActive = false,
  navigationMap,
  obstacles,
  onSharedLiveStateChange = null,
  pet,
  playerPositionRef,
  preset,
  shadowsEnabled,
  sharedLiveState = null
}: {
  authorityActive?: boolean;
  navigationMap: PetNavigationMap;
  obstacles: PetObstacle[];
  onSharedLiveStateChange?: ((state: SharedPetLiveState) => void) | null;
  pet: OwnedPet;
  playerPositionRef: MutableRefObject<Vector3Tuple>;
  preset: ImportedMobPreset;
  shadowsEnabled: boolean;
  sharedLiveState?: SharedPetLiveState | null;
}) {
  const randomSourceRef = useRef(createSeededRandom(pet.id));
  const catSpeedScaleRef = useRef(0.82 + createSeededRandom(`${pet.id}:pace`)() * 0.12);
  const targetPositionRef = useRef<Vector3Tuple | null>(null);
  const queuedWaypointsRef = useRef<Vector3Tuple[]>([]);
  const routeDestinationRef = useRef<Vector3Tuple | null>(null);
  const routeModeRef = useRef<CatRouteMode | null>(null);
  const recentTargetsRef = useRef<Vector3Tuple[]>([]);
  const travelSpeedRef = useRef(0);
  const catPauseStateRef = useRef<CatPausePhase>("idle");
  const catPauseUntilRef = useRef(0);
  const initialPauseDurationRef = useRef(
    500 + createSeededRandom(`${pet.id}:start-delay`)() * 2200
  );
  const obstacleOverlapStartedAtRef = useRef<number | null>(null);
  const lastBroadcastTimeRef = useRef(0);
  const replicaSamplesRef = useRef<BufferedMotionSample[]>([]);
  const motionStateRef = useRef<MobExternalMotionState>({
    position:
      sharedLiveState?.position
        ? cloneVector3Tuple(sharedLiveState.position)
        : cloneVector3Tuple(pet.spawnPosition),
    rotationY: sharedLiveState?.rotationY ?? 0,
    walkAmount: sharedLiveState?.walkAmount ?? 0,
    stridePhase: sharedLiveState?.stridePhase ?? 0,
    behaviorState:
      sharedLiveState && sharedLiveState.walkAmount > 0.05
        ? "walk"
        : "idle"
  });

  const clearRoute = (): void => {
    targetPositionRef.current = null;
    queuedWaypointsRef.current = [];
    routeDestinationRef.current = null;
    routeModeRef.current = null;
    travelSpeedRef.current = 0;
  };

  const rememberWanderDestination = (destination: Vector3Tuple | null): void => {
    if (!destination) {
      return;
    }

    recentTargetsRef.current = [
      ...recentTargetsRef.current.slice(-(CAT_ROUTE_HISTORY_LIMIT - 1)),
      cloneVector3Tuple(destination)
    ];
  };

  const stopCatPause = (): void => {
    catPauseStateRef.current = "idle";
    catPauseUntilRef.current = 0;
  };

  const startCatPause = (nowMs: number, randomValue: () => number): void => {
    const nextPauseState = selectCatPausePhase(randomValue());
    catPauseStateRef.current = nextPauseState;
    catPauseUntilRef.current = nowMs + getCatPauseDurationMs(nextPauseState, randomValue());
  };

  const setRoute = (
    routeMode: CatRouteMode,
    destination: Vector3Tuple,
    waypoints: Vector3Tuple[],
    speed: number
  ): void => {
    const normalizedWaypoints =
      waypoints.length > 0 ? waypoints.map(cloneVector3Tuple) : [cloneVector3Tuple(destination)];

    routeDestinationRef.current = cloneVector3Tuple(destination);
    routeModeRef.current = routeMode;
    targetPositionRef.current = normalizedWaypoints[0] ?? null;
    queuedWaypointsRef.current = normalizedWaypoints.slice(1);
    travelSpeedRef.current = speed;
  };

  const advanceRoute = (): boolean => {
    if (queuedWaypointsRef.current.length > 0) {
      targetPositionRef.current = queuedWaypointsRef.current.shift() ?? null;
      return false;
    }

    if (routeModeRef.current === "wander") {
      rememberWanderDestination(routeDestinationRef.current);
    }

    clearRoute();
    return true;
  };

  useEffect(() => {
    clearRoute();
    recentTargetsRef.current = [];
    catPauseStateRef.current = "idle";
    catPauseUntilRef.current = performance.now() + initialPauseDurationRef.current;
    obstacleOverlapStartedAtRef.current = null;
    motionStateRef.current = {
      ...motionStateRef.current,
      position: cloneVector3Tuple(sharedLiveState?.position ?? pet.spawnPosition),
      walkAmount: 0,
      behaviorState: "idle"
    };
  }, [pet.id]);

  useEffect(() => {
    if (authorityActive) {
      return;
    }

    if (!sharedLiveState) {
      replicaSamplesRef.current = [];
      clearRoute();
      motionStateRef.current.behaviorState = "idle";
      return;
    }

    const hadReplicaSamples = replicaSamplesRef.current.length > 0;
    replicaSamplesRef.current = pushBufferedMotionSample(replicaSamplesRef.current, {
      position: cloneVector3Tuple(sharedLiveState.position),
      receivedAtMs: performance.now(),
      rotationY: sharedLiveState.rotationY,
      stridePhase: sharedLiveState.stridePhase,
      velocity: cloneVector3Tuple(sharedLiveState.velocity),
      walkAmount: sharedLiveState.walkAmount
    });

    if (!hadReplicaSamples) {
      motionStateRef.current = {
        position: cloneVector3Tuple(sharedLiveState.position),
        rotationY: sharedLiveState.rotationY,
        walkAmount: sharedLiveState.walkAmount,
        stridePhase: sharedLiveState.stridePhase,
        behaviorState: sharedLiveState.walkAmount > 0.05 ? "walk" : "idle"
      };
    }

    targetPositionRef.current = sharedLiveState.targetPosition
      ? cloneVector3Tuple(sharedLiveState.targetPosition)
      : null;
  }, [authorityActive, sharedLiveState]);

  useFrame((_, delta) => {
    const playerPosition = playerPositionRef.current;
    const motion = motionStateRef.current;
    const isReplicatingSharedState = sharedLiveState !== null && !authorityActive;

    if (isReplicatingSharedState) {
      const sampledMotion = sampleBufferedMotion(replicaSamplesRef.current, performance.now());
      const playbackPosition = sampledMotion?.position ?? sharedLiveState.position;
      motion.position = [
        motion.position[0] + (playbackPosition[0] - motion.position[0]) * Math.min(1, delta * 14),
        0,
        motion.position[2] + (playbackPosition[2] - motion.position[2]) * Math.min(1, delta * 14)
      ];
      motion.rotationY = lerpAngle(
        motion.rotationY,
        sampledMotion?.rotationY ?? sharedLiveState.rotationY,
        Math.min(1, delta * 14)
      );
      motion.walkAmount = sampledMotion?.walkAmount ?? sharedLiveState.walkAmount;
      motion.stridePhase = sampledMotion?.stridePhase ?? sharedLiveState.stridePhase;
      motion.behaviorState = motion.walkAmount > 0.05 ? "walk" : "idle";
      targetPositionRef.current = sharedLiveState.targetPosition
        ? cloneVector3Tuple(sharedLiveState.targetPosition)
        : null;
      return;
    }

    const previousPosition = cloneVector3Tuple(motion.position);
    const nextRandom = randomSourceRef.current;
    const isCat = pet.type === "minecraft_cat";
    const baseSpeed = isCat
      ? Math.max(1.05, travelSpeedRef.current || preset.locomotion.speed * 0.72 * catSpeedScaleRef.current)
      : Math.min(0.5, Math.max(0.1, preset.locomotion.speed * 0.22));
    const minWanderRadius = isCat ? 4.0 : 0.8;
    const maxWanderRadius = isCat ? 8.5 : 2.5;
    const nowMs = performance.now();

    const assignCatRoute = (routeMode: CatRouteMode): void => {
      let destination =
        routeMode === "recovery"
          ? pickPetRecoveryTarget(motion.position, playerPosition, obstacles, nextRandom)
          : pickPetRoomWanderTarget(
              motion.position,
              playerPosition,
              navigationMap,
              nextRandom,
              recentTargetsRef.current
            );

      let waypoints = buildPetPathWaypoints(motion.position, destination, navigationMap, obstacles);

      if (routeMode === "wander" && getWaypointPathDistance(motion.position, waypoints) < 1.35) {
        destination = pickPetWanderTarget(
          motion.position,
          playerPosition,
          obstacles,
          nextRandom,
          minWanderRadius,
          maxWanderRadius
        );
        waypoints = buildPetPathWaypoints(motion.position, destination, navigationMap, obstacles);
      }

      setRoute(
        routeMode,
        destination,
        waypoints,
        resolveCatRouteSpeed(
          routeMode,
          getWaypointPathDistance(motion.position, waypoints),
          catSpeedScaleRef.current,
          nextRandom
        )
      );
    };

    const insideObstacle = pointIntersectsPetObstacle(
      motion.position[0],
      motion.position[2],
      obstacles,
      0.06
    );

    if (insideObstacle) {
      if (obstacleOverlapStartedAtRef.current === null) {
        obstacleOverlapStartedAtRef.current = nowMs;
      }

      if (isCat) {
        stopCatPause();
        if (routeModeRef.current !== "recovery" || !targetPositionRef.current) {
          assignCatRoute("recovery");
        }
      } else {
        targetPositionRef.current = pickPetRecoveryTarget(
          motion.position,
          playerPosition,
          obstacles,
          nextRandom
        );
      }

      if (nowMs - obstacleOverlapStartedAtRef.current > 1200) {
        const recoveryTarget = pickPetRecoveryTarget(
          motion.position,
          playerPosition,
          obstacles,
          nextRandom
        );
        motion.position = [recoveryTarget[0], 0, recoveryTarget[2]];
        clearRoute();
        stopCatPause();
        obstacleOverlapStartedAtRef.current = null;
      }
    } else {
      obstacleOverlapStartedAtRef.current = null;
    }

    if (isCat && !targetPositionRef.current && nowMs < catPauseUntilRef.current) {
      motion.walkAmount = 0;
      motion.behaviorState = catPauseStateRef.current === "sitting" ? "sit" : "idle";
      maybeBroadcastSharedState(
        authorityActive,
        onSharedLiveStateChange,
        sharedLiveState,
        pet.id,
        motion,
        null,
        [0, 0, 0],
        lastBroadcastTimeRef
      );
      return;
    }

    if (isCat && catPauseUntilRef.current > 0 && nowMs >= catPauseUntilRef.current) {
      stopCatPause();
    }

    if (!targetPositionRef.current) {
      if (isCat) {
        assignCatRoute("wander");
      } else {
        targetPositionRef.current = pickPetWanderTarget(
          motion.position,
          playerPosition,
          obstacles,
          nextRandom,
          minWanderRadius,
          maxWanderRadius
        );
      }
    }

    const targetPosition = targetPositionRef.current;

    if (!targetPosition) {
      motion.walkAmount = 0;
      motion.behaviorState = "idle";
      return;
    }

    const deltaX = targetPosition[0] - motion.position[0];
    const deltaZ = targetPosition[2] - motion.position[2];
    const distanceToTarget = Math.hypot(deltaX, deltaZ);
    const routeCompletedThreshold =
      queuedWaypointsRef.current.length > 0
        ? PET_WAYPOINT_REACHED_DISTANCE
        : PET_DESTINATION_REACHED_DISTANCE;

    if (distanceToTarget < routeCompletedThreshold) {
      const finishedRoute = isCat ? advanceRoute() : true;

      if (!finishedRoute) {
        maybeBroadcastSharedState(
          authorityActive,
          onSharedLiveStateChange,
          sharedLiveState,
          pet.id,
          motion,
          targetPositionRef.current,
          [0, 0, 0],
          lastBroadcastTimeRef
        );
        return;
      }

      if (!isCat) {
        targetPositionRef.current = null;
      } else {
        startCatPause(nowMs, nextRandom);
        motion.behaviorState = catPauseStateRef.current === "sitting" ? "sit" : "idle";
      }

      motion.walkAmount = 0;
      maybeBroadcastSharedState(
        authorityActive,
        onSharedLiveStateChange,
        sharedLiveState,
        pet.id,
        motion,
        null,
        [0, 0, 0],
        lastBroadcastTimeRef
      );
      return;
    }

    const approachSpeedFactor =
      isCat && queuedWaypointsRef.current.length === 0
        ? Math.max(0.78, Math.min(1, distanceToTarget / 0.7))
        : 1;
    const moveDistance = Math.min(distanceToTarget, baseSpeed * approachSpeedFactor * delta);
    const moveX = (deltaX / distanceToTarget) * moveDistance;
    const moveZ = (deltaZ / distanceToTarget) * moveDistance;
    const nextX = motion.position[0] + moveX;
    const nextZ = motion.position[2] + moveZ;

    const allowRecoveryStep =
      isCat &&
      routeModeRef.current === "recovery" &&
      obstacleOverlapStartedAtRef.current !== null;

    if (!allowRecoveryStep && pointIntersectsPetObstacle(nextX, nextZ, obstacles, 0.05)) {
      if (isCat) {
        stopCatPause();
        assignCatRoute("recovery");
      } else {
        targetPositionRef.current = pickPetRecoveryTarget(
          motion.position,
          playerPosition,
          obstacles,
          nextRandom
        );
      }
      motion.walkAmount = 0;
      maybeBroadcastSharedState(
        authorityActive,
        onSharedLiveStateChange,
        sharedLiveState,
        pet.id,
        motion,
        targetPositionRef.current,
        [0, 0, 0],
        lastBroadcastTimeRef
      );
      return;
    }

    motion.position = [nextX, 0, nextZ];
    const actualSpeed = moveDistance / Math.max(delta, 0.016);
    motion.walkAmount = isCat ? Math.min(1, actualSpeed / 1.9) : Math.min(1, actualSpeed * 2.5);
    motion.stridePhase += actualSpeed * delta * preset.animation.walk.strideRate * (isCat ? 1.12 : 1);
    motion.rotationY = lerpAngle(
      motion.rotationY,
      Math.atan2(deltaX, deltaZ),
      Math.min(1, delta * (isCat ? 10.5 : 5))
    );
    motion.behaviorState = "walk";

    maybeBroadcastSharedState(
      authorityActive,
      onSharedLiveStateChange,
      sharedLiveState,
      pet.id,
      motion,
      targetPositionRef.current,
      [
        (motion.position[0] - previousPosition[0]) / Math.max(delta, 0.016),
        0,
        (motion.position[2] - previousPosition[2]) / Math.max(delta, 0.016)
      ],
      lastBroadcastTimeRef
    );
  });

  return (
    <ImportedMobActor
      preset={preset}
      selectedPartId={null}
      shadowsEnabled={shadowsEnabled}
      showCollider={false}
      externalMotionStateRef={motionStateRef}
    />
  );
});

function maybeBroadcastSharedState(
  authorityActive: boolean,
  onSharedLiveStateChange: ((state: SharedPetLiveState) => void) | null,
  sharedLiveState: SharedPetLiveState | null,
  petId: string,
  motion: MobExternalMotionState,
  targetPosition: Vector3Tuple | null,
  velocity: Vector3Tuple,
  lastBroadcastTimeRef: MutableRefObject<number>
) {
  if (!authorityActive || !sharedLiveState || !onSharedLiveStateChange) {
    return;
  }

  const nowMs = Date.now();

  if (nowMs - lastBroadcastTimeRef.current < SHARED_PET_BROADCAST_INTERVAL_MS) {
    return;
  }

  lastBroadcastTimeRef.current = nowMs;
  onSharedLiveStateChange({
    ownerPlayerId: sharedLiveState.ownerPlayerId,
    petId,
    position: cloneVector3Tuple(motion.position),
    rotationY: motion.rotationY,
    stridePhase: motion.stridePhase,
    targetPosition: targetPosition ? cloneVector3Tuple(targetPosition) : null,
    updatedAt: new Date(nowMs).toISOString(),
    velocity: cloneVector3Tuple(velocity),
    walkAmount: motion.walkAmount
  });
}
