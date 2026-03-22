import { getSurfaceDecorSelectionHitboxSize } from "./helpers";
import type { RoomFurniturePlacement } from "../../lib/roomState";

type RoomSurfaceDecorSelectionProxyProps = {
  buildModeEnabled: boolean;
  item: RoomFurniturePlacement;
};

export function RoomSurfaceDecorSelectionProxy({
  buildModeEnabled,
  item
}: RoomSurfaceDecorSelectionProxyProps) {
  if (!buildModeEnabled || item.surface !== "surface") {
    return null;
  }

  const [width, height, depth] = getSurfaceDecorSelectionHitboxSize(item);

  return (
    <mesh position={[0, height / 2, 0]}>
      <boxGeometry args={[width, height, depth]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
