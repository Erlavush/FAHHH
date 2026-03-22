import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { OCCLUSION_ANGLE_THRESHOLD } from "./constants";

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

    const nextVisibility = {
      wall_front: !isFrontHidden,
      wall_right: !isRightHidden,
      wall_back: !isBackHidden,
      wall_left: !isLeftHidden
    };

    const visibilityKey = JSON.stringify(nextVisibility);
    if (visibilityKey !== lastVisibilityRef.current) {
      lastVisibilityRef.current = visibilityKey;
      onVisibilityChange(nextVisibility);
    }
  });

  return null;
}
