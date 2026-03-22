import {
  type WheelEvent as ReactWheelEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject
} from "react";
import { MOUSE, PerspectiveCamera as ThreePerspectiveCamera } from "three";
import type { SceneJumpRequest } from "../../app/types";
import type { Vector3Tuple } from "../../lib/roomState";
import {
  isCanvasDprConstrained,
  readViewportMetrics,
  resolveCanvasDpr
} from "./canvasSizing";
import {
  DESKTOP_MAX_DPR,
  DISABLED_MOUSE_BUTTON,
  MAX_CAMERA_DISTANCE,
  MIN_CAMERA_DISTANCE,
  SMOOTH_ZOOM_SENSITIVITY,
  TOUCH_MAX_DPR
} from "./constants";

type UseRoomViewCameraOptions = {
  cameraRef: MutableRefObject<ThreePerspectiveCamera | null>;
  cameraResetToken: number;
  initialCameraPosition: Vector3Tuple;
  initialSceneTarget: Vector3Tuple;
  isTransformingFurniture: boolean;
  jumpPlayerToPosition: (position: Vector3Tuple, requestId: number) => void;
  onCameraPositionChange: (position: Vector3Tuple) => void;
  orbitControlsRef: MutableRefObject<any>;
  sceneJumpRequest: SceneJumpRequest | null;
  zoomTargetDistanceRef: MutableRefObject<number | null>;
};

export function useRoomViewCamera({
  cameraRef,
  cameraResetToken,
  initialCameraPosition,
  initialSceneTarget,
  isTransformingFurniture,
  jumpPlayerToPosition,
  onCameraPositionChange,
  orbitControlsRef,
  sceneJumpRequest,
  zoomTargetDistanceRef
}: UseRoomViewCameraOptions) {
  const lastCameraResetTokenRef = useRef(0);
  const lastProcessedSceneJumpRequestIdRef = useRef<number | null>(null);
  const [prefersTouchControls, setPrefersTouchControls] = useState(false);
  const [viewportMetrics, setViewportMetrics] = useState(readViewportMetrics);

  const baseCanvasDpr = prefersTouchControls ? TOUCH_MAX_DPR : DESKTOP_MAX_DPR;
  const canvasDpr = resolveCanvasDpr(baseCanvasDpr, viewportMetrics);
  const shouldUseReducedRenderQuality =
    prefersTouchControls || isCanvasDprConstrained(canvasDpr, baseCanvasDpr, viewportMetrics);
  const canvasGl = useMemo(
    () => ({
      alpha: true,
      antialias: !prefersTouchControls && canvasDpr >= 1,
      powerPreference: "high-performance" as const
    }),
    [canvasDpr, prefersTouchControls]
  );
  const orbitMouseButtons = useMemo(
    () => ({
      LEFT: MOUSE.ROTATE,
      MIDDLE: MOUSE.ROTATE,
      RIGHT: DISABLED_MOUSE_BUTTON
    }),
    []
  );

  const syncZoomTargetToCamera = useCallback(() => {
    const camera = cameraRef.current;
    const controls = orbitControlsRef.current;

    if (!camera || !controls) {
      return;
    }

    zoomTargetDistanceRef.current = camera.position.distanceTo(controls.target);
  }, []);

  const handleCanvasWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    if (prefersTouchControls || isTransformingFurniture) {
      return;
    }

    const camera = cameraRef.current;
    const controls = orbitControlsRef.current;

    if (!camera || !controls) {
      return;
    }

    const currentTargetDistance =
      zoomTargetDistanceRef.current ?? camera.position.distanceTo(controls.target);
    const zoomScale = Math.exp(event.deltaY * SMOOTH_ZOOM_SENSITIVITY);
    zoomTargetDistanceRef.current = Math.min(
      MAX_CAMERA_DISTANCE,
      Math.max(MIN_CAMERA_DISTANCE, currentTargetDistance * zoomScale)
    );
  }, [isTransformingFurniture, prefersTouchControls]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const query = window.matchMedia("(pointer: coarse)");
    const updateTouchPreference = () => {
      setPrefersTouchControls(query.matches || window.navigator.maxTouchPoints > 0);
    };

    updateTouchPreference();
    query.addEventListener("change", updateTouchPreference);

    return () => {
      query.removeEventListener("change", updateTouchPreference);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateViewportMetrics = () => {
      setViewportMetrics((currentMetrics) => {
        const nextMetrics = readViewportMetrics();

        if (
          currentMetrics.width === nextMetrics.width &&
          currentMetrics.height === nextMetrics.height &&
          Math.abs(currentMetrics.devicePixelRatio - nextMetrics.devicePixelRatio) < 0.001
        ) {
          return currentMetrics;
        }

        return nextMetrics;
      });
    };

    updateViewportMetrics();
    window.addEventListener("resize", updateViewportMetrics);
    window.visualViewport?.addEventListener("resize", updateViewportMetrics);

    return () => {
      window.removeEventListener("resize", updateViewportMetrics);
      window.visualViewport?.removeEventListener("resize", updateViewportMetrics);
    };
  }, []);

  useEffect(() => {
    if (
      !sceneJumpRequest ||
      sceneJumpRequest.requestId === lastProcessedSceneJumpRequestIdRef.current
    ) {
      return;
    }

    lastProcessedSceneJumpRequestIdRef.current = sceneJumpRequest.requestId;
    jumpPlayerToPosition(sceneJumpRequest.playerPosition, sceneJumpRequest.requestId);
    cameraRef.current?.position.set(
      sceneJumpRequest.cameraPosition[0],
      sceneJumpRequest.cameraPosition[1],
      sceneJumpRequest.cameraPosition[2]
    );
    orbitControlsRef.current?.target.set(
      sceneJumpRequest.cameraTarget[0],
      sceneJumpRequest.cameraTarget[1],
      sceneJumpRequest.cameraTarget[2]
    );
    orbitControlsRef.current?.update();
    syncZoomTargetToCamera();
    onCameraPositionChange(sceneJumpRequest.cameraPosition);
  }, [
    jumpPlayerToPosition,
    onCameraPositionChange,
    sceneJumpRequest,
    syncZoomTargetToCamera
  ]);

  useEffect(() => {
    syncZoomTargetToCamera();
  }, [syncZoomTargetToCamera]);

  useEffect(() => {
    if (!cameraResetToken || cameraResetToken === lastCameraResetTokenRef.current) {
      return;
    }

    lastCameraResetTokenRef.current = cameraResetToken;
    cameraRef.current?.position.set(
      initialCameraPosition[0],
      initialCameraPosition[1],
      initialCameraPosition[2]
    );
    orbitControlsRef.current?.target.set(
      initialSceneTarget[0],
      initialSceneTarget[1],
      initialSceneTarget[2]
    );
    orbitControlsRef.current?.update();
    syncZoomTargetToCamera();
    onCameraPositionChange(initialCameraPosition);
  }, [
    cameraResetToken,
    initialCameraPosition,
    initialSceneTarget,
    onCameraPositionChange,
    syncZoomTargetToCamera
  ]);

  return {
    canvasDpr,
    canvasGl,
    handleCanvasWheel,
    orbitMouseButtons,
    prefersTouchControls,
    shouldUseReducedRenderQuality
  };
}
