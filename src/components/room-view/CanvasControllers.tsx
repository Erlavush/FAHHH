import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from "react";
import { NoToneMapping, PerspectiveCamera as ThreePerspectiveCamera, Vector3 } from "three";
import type { Vector3Tuple } from "../../lib/roomState";
import { SMOOTH_ZOOM_RESPONSE } from "./constants";

export function CameraTracker({
  onCameraPositionChange
}: {
  onCameraPositionChange: (position: Vector3Tuple) => void;
}) {
  const lastSentTime = useRef(0);

  useFrame((state) => {
    if (state.clock.elapsedTime - lastSentTime.current < 0.1) {
      return;
    }

    lastSentTime.current = state.clock.elapsedTime;
    onCameraPositionChange([
      state.camera.position.x,
      state.camera.position.y,
      state.camera.position.z
    ]);
  });

  return null;
}

export function SmoothZoomController({
  cameraRef,
  orbitControlsRef,
  zoomTargetDistanceRef
}: {
  cameraRef: MutableRefObject<ThreePerspectiveCamera | null>;
  orbitControlsRef: MutableRefObject<any>;
  zoomTargetDistanceRef: MutableRefObject<number | null>;
}) {
  const cameraOffset = useMemo(() => new Vector3(), []);

  useFrame((_, delta) => {
    const camera = cameraRef.current;
    const controls = orbitControlsRef.current;
    const targetDistance = zoomTargetDistanceRef.current;

    if (!camera || !controls || targetDistance === null) {
      return;
    }

    cameraOffset.copy(camera.position).sub(controls.target);
    const currentDistance = cameraOffset.length();

    if (currentDistance <= 0.0001) {
      return;
    }

    const smoothingFactor = 1 - Math.exp(-delta * SMOOTH_ZOOM_RESPONSE);
    const nextDistance = currentDistance + (targetDistance - currentDistance) * smoothingFactor;

    if (Math.abs(nextDistance - currentDistance) < 0.0001) {
      return;
    }

    cameraOffset.multiplyScalar(nextDistance / currentDistance);
    camera.position.copy(controls.target).add(cameraOffset);
    controls.update();
  });

  return null;
}

export function RendererExposureController({ exposure }: { exposure: number }) {
  const { gl, invalidate } = useThree();

  useLayoutEffect(() => {
    gl.toneMapping = NoToneMapping;
    gl.toneMappingExposure = exposure;
    invalidate();
  }, [exposure, gl, invalidate]);

  return null;
}