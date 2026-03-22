import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { Vector3 } from "three";

type PlacementActionsProps = {
  position: [number, number, number];
  onCancel: () => void;
  onStore: () => void;
  onConfirm: () => void;
  confirmDisabled: boolean;
};

export function PlacementActions({
  position,
  onCancel,
  onStore,
  onConfirm,
  confirmDisabled
}: PlacementActionsProps) {
  const { camera, size } = useThree();
  const screenPositionRef = useRef({ left: -9999, top: -9999, visible: false });
  const [screenPosition, setScreenPosition] = useState(screenPositionRef.current);
  const projectedPosition = useMemo(() => new Vector3(), []);
  const panelHalfWidth = 108;
  const panelTopMargin = 88;
  const panelSideMargin = 20;
  const horizontalScreenOffset = 116;
  const verticalScreenOffset = 54;

  useFrame(() => {
    projectedPosition.set(position[0], position[1], position[2]);
    projectedPosition.project(camera);

    const baseLeft = (projectedPosition.x * 0.5 + 0.5) * size.width;
    const baseTop = (-projectedPosition.y * 0.5 + 0.5) * size.height - 12;
    const prefersLeftSide = baseLeft > size.width * 0.58;
    const left = Math.min(
      size.width - panelHalfWidth - panelSideMargin,
      Math.max(
        panelHalfWidth + panelSideMargin,
        baseLeft + (prefersLeftSide ? -horizontalScreenOffset : horizontalScreenOffset)
      )
    );
    const top = Math.max(panelTopMargin, baseTop - verticalScreenOffset);

    const nextPosition = {
      left,
      top,
      visible: projectedPosition.z > -1 && projectedPosition.z < 1
    };

    const current = screenPositionRef.current;
    if (
      Math.abs(current.left - nextPosition.left) < 0.5 &&
      Math.abs(current.top - nextPosition.top) < 0.5 &&
      current.visible === nextPosition.visible
    ) {
      return;
    }

    screenPositionRef.current = nextPosition;
    setScreenPosition(nextPosition);
  });

  if (!screenPosition.visible) {
    return null;
  }

  return (
    <Html fullscreen style={{ pointerEvents: "none" }}>
      <div
        className="placement-actions placement-actions--floating"
        style={{
          left: `${screenPosition.left}px`,
          top: `${screenPosition.top}px`
        }}
      >
        <button
          className="placement-action placement-action--cancel"
          onClick={(event) => {
            event.stopPropagation();
            onCancel();
          }}
          type="button"
        >
          X
        </button>
        <button
          className="placement-action placement-action--store"
          onClick={(event) => {
            event.stopPropagation();
            onStore();
          }}
          type="button"
        >
          Store
        </button>
        <button
          className={`placement-action placement-action--confirm${
            confirmDisabled ? " placement-action--disabled" : ""
          }`}
          onClick={(event) => {
            event.stopPropagation();

            if (!confirmDisabled) {
              onConfirm();
            }
          }}
          type="button"
          disabled={confirmDisabled}
          aria-label="Confirm placement"
        >
          Confirm
        </button>
      </div>
    </Html>
  );
}
