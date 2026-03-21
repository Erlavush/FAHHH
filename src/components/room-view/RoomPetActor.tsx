import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { ImportedMobPreset } from "../../lib/mobLab";
import {
  buildPetObstacles,
  pickPetWanderTarget,
  pointIntersectsPetObstacle
} from "../../lib/petPathing";
import type { OwnedPet } from "../../lib/pets";
import type { RoomFurniturePlacement, Vector3Tuple } from "../../lib/roomState";
import { ImportedMobActor } from "../mob-lab/ImportedMobActor";
import type { MobExternalMotionState } from "../mob-lab/MobPreviewActor";

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
  pet,
  preset,
  playerPosition,
  furniture,
  shadowsEnabled
}: {
  pet: OwnedPet;
  preset: ImportedMobPreset;
  playerPosition: Vector3Tuple;
  furniture: RoomFurniturePlacement[];
  shadowsEnabled: boolean;
}) {
  const obstacles = useMemo(() => buildPetObstacles(furniture), [furniture]);
  const randomSourceRef = useRef(createSeededRandom(pet.id));
  const targetPositionRef = useRef<Vector3Tuple | null>(null);
  const idleTimerRef = useRef(0.8);
  const motionStateRef = useRef<MobExternalMotionState>({
    position: [...pet.spawnPosition] as Vector3Tuple,
    rotationY: 0,
    walkAmount: 0,
    stridePhase: 0
  });

  useFrame((_, delta) => {
    const motion = motionStateRef.current;
    const nextRandom = randomSourceRef.current;
    const baseSpeed = Math.min(0.82, Math.max(0.38, preset.locomotion.speed * 0.28));

    if (pointIntersectsPetObstacle(motion.position[0], motion.position[2], obstacles, 0.06)) {
      const safeTarget = pickPetWanderTarget(motion.position, playerPosition, obstacles, nextRandom);
      motion.position = [safeTarget[0], 0, safeTarget[2]];
      targetPositionRef.current = null;
      idleTimerRef.current = 0.6;
    }

    if (idleTimerRef.current > 0) {
      idleTimerRef.current = Math.max(0, idleTimerRef.current - delta);
      motion.walkAmount = 0;

      if (idleTimerRef.current > 0) {
        return;
      }
    }

    if (!targetPositionRef.current) {
      targetPositionRef.current = pickPetWanderTarget(
        motion.position,
        playerPosition,
        obstacles,
        nextRandom
      );
    }

    const targetPosition = targetPositionRef.current;
    const deltaX = targetPosition[0] - motion.position[0];
    const deltaZ = targetPosition[2] - motion.position[2];
    const distanceToTarget = Math.hypot(deltaX, deltaZ);

    if (distanceToTarget < 0.12) {
      targetPositionRef.current = null;
      idleTimerRef.current = 0.75 + nextRandom() * 1.35;
      motion.walkAmount = 0;
      return;
    }

    const moveDistance = Math.min(distanceToTarget, baseSpeed * delta);
    const moveX = (deltaX / distanceToTarget) * moveDistance;
    const moveZ = (deltaZ / distanceToTarget) * moveDistance;
    const nextX = motion.position[0] + moveX;
    const nextZ = motion.position[2] + moveZ;

    if (pointIntersectsPetObstacle(nextX, nextZ, obstacles, 0.05)) {
      targetPositionRef.current = pickPetWanderTarget(motion.position, playerPosition, obstacles, nextRandom);
      idleTimerRef.current = 0.18;
      motion.walkAmount = 0;
      return;
    }

    motion.position = [nextX, 0, nextZ];
    motion.walkAmount = Math.min(1, baseSpeed / 0.62);
    motion.stridePhase += baseSpeed * delta * preset.animation.walk.strideRate;
    motion.rotationY = lerpAngle(
      motion.rotationY,
      Math.atan2(deltaX, deltaZ),
      Math.min(1, delta * 8)
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
