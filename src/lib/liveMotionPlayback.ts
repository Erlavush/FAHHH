import type { Vector3Tuple } from "./roomState";

export interface BufferedMotionSample {
  position: Vector3Tuple;
  receivedAtMs: number;
  rotationY: number;
  stridePhase: number;
  velocity: Vector3Tuple;
  walkAmount: number;
}

export interface SampleBufferedMotionOptions {
  maxExtrapolationMs?: number;
  playbackDelayMs?: number;
}

const DEFAULT_PLAYBACK_DELAY_MS = 100;
const DEFAULT_MAX_EXTRAPOLATION_MS = 140;
const MAX_BUFFER_SIZE = 8;

function lerpNumber(from: number, to: number, alpha: number): number {
  return from + (to - from) * alpha;
}

function lerpAngle(from: number, to: number, alpha: number): number {
  const difference = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + difference * alpha;
}

function lerpVector(
  from: Vector3Tuple,
  to: Vector3Tuple,
  alpha: number
): Vector3Tuple {
  return [
    lerpNumber(from[0], to[0], alpha),
    lerpNumber(from[1], to[1], alpha),
    lerpNumber(from[2], to[2], alpha)
  ];
}

function extrapolateSample(
  sample: BufferedMotionSample,
  deltaMs: number
): BufferedMotionSample {
  const deltaSeconds = Math.max(0, deltaMs) / 1000;
  const horizontalSpeed = Math.hypot(sample.velocity[0], sample.velocity[2]);

  return {
    ...sample,
    position: [
      sample.position[0] + sample.velocity[0] * deltaSeconds,
      sample.position[1] + sample.velocity[1] * deltaSeconds,
      sample.position[2] + sample.velocity[2] * deltaSeconds
    ],
    rotationY:
      horizontalSpeed > 0.001
        ? Math.atan2(sample.velocity[0], sample.velocity[2])
        : sample.rotationY,
    stridePhase: sample.stridePhase + horizontalSpeed * deltaSeconds * 4
  };
}

export function pushBufferedMotionSample(
  samples: readonly BufferedMotionSample[],
  nextSample: BufferedMotionSample
): BufferedMotionSample[] {
  const latestSample =
    samples.length > 0 ? samples[samples.length - 1] : undefined;

  if (
    latestSample &&
    latestSample.position[0] === nextSample.position[0] &&
    latestSample.position[1] === nextSample.position[1] &&
    latestSample.position[2] === nextSample.position[2] &&
    latestSample.rotationY === nextSample.rotationY &&
    latestSample.walkAmount === nextSample.walkAmount &&
    latestSample.stridePhase === nextSample.stridePhase &&
    latestSample.velocity[0] === nextSample.velocity[0] &&
    latestSample.velocity[1] === nextSample.velocity[1] &&
    latestSample.velocity[2] === nextSample.velocity[2]
  ) {
    return samples as BufferedMotionSample[];
  }

  return [...samples, nextSample].slice(-MAX_BUFFER_SIZE);
}

export function sampleBufferedMotion(
  samples: readonly BufferedMotionSample[],
  nowMs: number,
  options: SampleBufferedMotionOptions = {}
): BufferedMotionSample | null {
  if (samples.length === 0) {
    return null;
  }

  const playbackDelayMs = options.playbackDelayMs ?? DEFAULT_PLAYBACK_DELAY_MS;
  const maxExtrapolationMs =
    options.maxExtrapolationMs ?? DEFAULT_MAX_EXTRAPOLATION_MS;
  const renderTimeMs = nowMs - playbackDelayMs;

  if (samples.length === 1) {
    const onlySample = samples[0];
    return extrapolateSample(
      onlySample,
      Math.min(maxExtrapolationMs, Math.max(0, renderTimeMs - onlySample.receivedAtMs))
    );
  }

  if (renderTimeMs <= samples[0].receivedAtMs) {
    return samples[0];
  }

  for (let index = 1; index < samples.length; index += 1) {
    const previousSample = samples[index - 1];
    const nextSample = samples[index];

    if (renderTimeMs <= nextSample.receivedAtMs) {
      const intervalMs = Math.max(
        1,
        nextSample.receivedAtMs - previousSample.receivedAtMs
      );
      const alpha = Math.min(
        1,
        Math.max(0, (renderTimeMs - previousSample.receivedAtMs) / intervalMs)
      );

      return {
        position: lerpVector(previousSample.position, nextSample.position, alpha),
        receivedAtMs: renderTimeMs,
        rotationY: lerpAngle(previousSample.rotationY, nextSample.rotationY, alpha),
        stridePhase: lerpNumber(
          previousSample.stridePhase,
          nextSample.stridePhase,
          alpha
        ),
        velocity: lerpVector(previousSample.velocity, nextSample.velocity, alpha),
        walkAmount: lerpNumber(
          previousSample.walkAmount,
          nextSample.walkAmount,
          alpha
        )
      };
    }
  }

  const latestSample = samples[samples.length - 1]!;
  return extrapolateSample(
    latestSample,
    Math.min(maxExtrapolationMs, Math.max(0, renderTimeMs - latestSample.receivedAtMs))
  );
}
