import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { ROOM_CAMERA_TARGET } from "../../lib/sceneTargets";
import {
  CEILING_OCCLUSION_VERTICAL_RATIO,
  OCCLUSION_ANGLE_THRESHOLD
} from "./constants";

type WallOcclusionControllerProps = {
  onVisibilityChange: (visibility: Record<string, boolean>) => void;
};

export function WallOcclusionController({
  onVisibilityChange
}: WallOcclusionControllerProps) {
  const { camera } = useThree();
  const lastVisibilityRef = useRef("");

  useFrame(() => {
    const angle = Math.atan2(camera.position.x, camera.position.z);
    const threshold = OCCLUSION_ANGLE_THRESHOLD;

    const isFrontHidden = angle > -Math.PI / 2 + threshold && angle < Math.PI / 2 - threshold;
    const isRightHidden = angle > threshold && angle < Math.PI - threshold;
    const isBackHidden = angle > Math.PI / 2 + threshold || angle < -Math.PI / 2 - threshold;
    const isLeftHidden = angle > -Math.PI + threshold && angle < -threshold;
    const offsetX = camera.position.x - ROOM_CAMERA_TARGET[0];
    const offsetY = camera.position.y - ROOM_CAMERA_TARGET[1];
    const offsetZ = camera.position.z - ROOM_CAMERA_TARGET[2];
    const orbitDistance = Math.hypot(offsetX, offsetY, offsetZ);
    const verticalRatio = orbitDistance > 0.0001 ? Math.abs(offsetY) / orbitDistance : 1;
    const isCeilingHidden = verticalRatio > CEILING_OCCLUSION_VERTICAL_RATIO;

    const nextVisibility = {
      wall_front: !isFrontHidden,
      wall_right: !isRightHidden,
      wall_back: !isBackHidden,
      wall_left: !isLeftHidden,
      ceiling: !isCeilingHidden
    };

    const visibilityKey = JSON.stringify(nextVisibility);
    if (visibilityKey !== lastVisibilityRef.current) {
      lastVisibilityRef.current = visibilityKey;
      onVisibilityChange(nextVisibility);
    }
  });

  return null;
}
