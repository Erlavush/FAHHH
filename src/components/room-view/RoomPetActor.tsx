import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { ImportedMobPreset } from "../../lib/mobLab";
import {
  buildPetObstacles,
  pickPetWanderTarget,
  pointIntersectsPetObstacle
} from "../../lib/petPathing";
import type { OwnedPet } from "../../lib/pets";
import type { RoomFurniturePlacement, Vector3Tuple } from "../../lib/roomState";
import type { SharedPetLiveState } from "../../lib/sharedPresenceTypes";
import {
  pushBufferedMotionSample,
  sampleBufferedMotion,
  type BufferedMotionSample
} from "../../lib/liveMotionPlayback";
import { ImportedMobActor } from "../mob-lab/ImportedMobActor";
import type { MobExternalMotionState } from "../mob-lab/MobPreviewActor";

const SHARED_PET_BROADCAST_INTERVAL_MS = 100;

function createSeededRandom(seedText: string): () => number {
  let seed = 2166136261;

  for (const character of seedText) {
    seed ^= character.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }

  return () => {
    seed = Math.imul(seed, 1664525) + 1013904223;
    return ((seed >>> 0) & 0xffffffff) / 0x100000000;
  };
}

function lerpAngle(current: number, target: number, factor: number): number {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + difference * factor;
}

export function RoomPetActor({
  authorityActive = false,
  onSharedLiveStateChange = null,
  pet,
  preset,
  playerPosition,
  furniture,
  shadowsEnabled,
  sharedLiveState = null
}: {
  authorityActive?: boolean;
  onSharedLiveStateChange?: ((state: SharedPetLiveState) => void) | null;
  pet: OwnedPet;
  preset: ImportedMobPreset;
  playerPosition: Vector3Tuple;
  furniture: RoomFurniturePlacement[];
  shadowsEnabled: boolean;
  sharedLiveState?: SharedPetLiveState | null;
}) {
  const obstacles = useMemo(() => buildPetObstacles(furniture), [furniture]);
  const randomSourceRef = useRef(createSeededRandom(pet.id));
  const targetPositionRef = useRef<Vector3Tuple | null>(null);
  const idleTimerRef = useRef(0.8);
  const lastBroadcastTimeRef = useRef(0);
  const replicaSamplesRef = useRef<BufferedMotionSample[]>([]);
  const motionStateRef = useRef<MobExternalMotionState>({
    position:
      sharedLiveState?.position
        ? ([...sharedLiveState.position] as Vector3Tuple)
        : ([...pet.spawnPosition] as Vector3Tuple),
    rotationY: sharedLiveState?.rotationY ?? 0,
    walkAmount: sharedLiveState?.walkAmount ?? 0,
    stridePhase: sharedLiveState?.stridePhase ?? 0
  });

  useEffect(() => {
    if (!sharedLiveState) {
      replicaSamplesRef.current = [];
      targetPositionRef.current = null;
      return;
    }

    const hadReplicaSamples = replicaSamplesRef.current.length > 0;
    replicaSamplesRef.current = pushBufferedMotionSample(replicaSamplesRef.current, {
      position: [...sharedLiveState.position] as Vector3Tuple,
      receivedAtMs: performance.now(),
      rotationY: sharedLiveState.rotationY,
      stridePhase: sharedLiveState.stridePhase,
      velocity: [...sharedLiveState.velocity] as Vector3Tuple,
      walkAmount: sharedLiveState.walkAmount
    });

    if (!hadReplicaSamples) {
      motionStateRef.current = {
        position: [...sharedLiveState.position] as Vector3Tuple,
        rotationY: sharedLiveState.rotationY,
        walkAmount: sharedLiveState.walkAmount,
        stridePhase: sharedLiveState.stridePhase
      };
    }

    targetPositionRef.current = sharedLiveState.targetPosition
      ? ([...sharedLiveState.targetPosition] as Vector3Tuple)
      : null;
  }, [sharedLiveState]);

  useFrame((_, delta) => {
    const motion = motionStateRef.current;
    const isReplicatingSharedState = sharedLiveState !== null && !authorityActive;

    if (isReplicatingSharedState) {
      const sampledMotion = sampleBufferedMotion(
        replicaSamplesRef.current,
        performance.now()
      );
      const playbackPosition =
        sampledMotion?.position ?? sharedLiveState.position;
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
      targetPositionRef.current = sharedLiveState.targetPosition
        ? ([...sharedLiveState.targetPosition] as Vector3Tuple)
        : null;
      return;
    }

    const previousPosition = [...motion.position] as Vector3Tuple;

    const nextRandom = randomSourceRef.current;
    const isCat = preset.id === "better_cat_glb";
    const baseSpeed = isCat
      ? Math.min(2.5, Math.max(1.0, preset.locomotion.speed * 0.85))
      : Math.min(0.5, Math.max(0.1, preset.locomotion.speed * 0.22));
    const minWanderRadius = isCat ? 4.0 : 0.8;
    const maxWanderRadius = isCat ? 8.5 : 2.5;

    if (pointIntersectsPetObstacle(motion.position[0], motion.position[2], obstacles, 0.06)) {
      const safeTarget = pickPetWanderTarget(
        motion.position,
        playerPosition,
        obstacles,
        nextRandom,
        minWanderRadius,
        maxWanderRadius
      );
      motion.position = [safeTarget[0], 0, safeTarget[2]];
      targetPositionRef.current = null;
      idleTimerRef.current = 0.3;
    }

    if (idleTimerRef.current > 0) {
      idleTimerRef.current = Math.max(0, idleTimerRef.current - delta);
      motion.walkAmount = 0;

      if (idleTimerRef.current > 0) {
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
        return;
      }
    }

    if (!targetPositionRef.current) {
      targetPositionRef.current = pickPetWanderTarget(
        motion.position,
        playerPosition,
        obstacles,
        nextRandom,
        minWanderRadius,
        maxWanderRadius
      );
    }

    const targetPosition = targetPositionRef.current;
    const deltaX = targetPosition[0] - motion.position[0];
    const deltaZ = targetPosition[2] - motion.position[2];
    const distanceToTarget = Math.hypot(deltaX, deltaZ);

    if (distanceToTarget < 0.12) {
      targetPositionRef.current = null;
      idleTimerRef.current = isCat
        ? 2.0 + nextRandom() * 2.0
        : 1.0 + nextRandom() * 3.0;
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

    const moveDistance = Math.min(distanceToTarget, baseSpeed * delta);
    const moveX = (deltaX / distanceToTarget) * moveDistance;
    const moveZ = (deltaZ / distanceToTarget) * moveDistance;
    const nextX = motion.position[0] + moveX;
    const nextZ = motion.position[2] + moveZ;

    if (pointIntersectsPetObstacle(nextX, nextZ, obstacles, 0.05)) {
      targetPositionRef.current = pickPetWanderTarget(
        motion.position,
        playerPosition,
        obstacles,
        nextRandom,
        minWanderRadius,
        maxWanderRadius
      );
      idleTimerRef.current = 0.1;
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
    motion.walkAmount = isCat ? Math.min(1, baseSpeed / 1.5) : Math.min(1, baseSpeed * 2.5);
    motion.stridePhase += baseSpeed * delta * preset.animation.walk.strideRate;
    motion.rotationY = lerpAngle(
      motion.rotationY,
      Math.atan2(deltaX, deltaZ),
      Math.min(1, delta * (isCat ? 12 : 5))
    );

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
}

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

  if (
    nowMs - lastBroadcastTimeRef.current <
    SHARED_PET_BROADCAST_INTERVAL_MS
  ) {
    return;
  }

  lastBroadcastTimeRef.current = nowMs;
  onSharedLiveStateChange({
    ownerPlayerId: sharedLiveState.ownerPlayerId,
    petId,
    position: [...motion.position] as Vector3Tuple,
    rotationY: motion.rotationY,
    stridePhase: motion.stridePhase,
    targetPosition: targetPosition ? ([...targetPosition] as Vector3Tuple) : null,
    updatedAt: new Date(nowMs).toISOString(),
    velocity: [...velocity] as Vector3Tuple,
    walkAmount: motion.walkAmount
  });
}
