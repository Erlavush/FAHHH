import { useMemo } from "react";
import { getFurnitureAABBs, getPlayerAABB, type AABB } from "../../lib/furnitureCollision";
import type { FurnitureInteractionTarget } from "../../lib/furnitureInteractions";
import type { RoomFurniturePlacement, Vector3Tuple } from "../../lib/roomState";

function AABBWireframe({ aabb, color, opacity = 0.9 }: { aabb: AABB; color: string; opacity?: number }) {
  const sizeX = aabb.max[0] - aabb.min[0];
  const sizeY = aabb.max[1] - aabb.min[1];
  const sizeZ = aabb.max[2] - aabb.min[2];
  const centerX = (aabb.min[0] + aabb.max[0]) / 2;
  const centerY = (aabb.min[1] + aabb.max[1]) / 2;
  const centerZ = (aabb.min[2] + aabb.max[2]) / 2;

  return (
    <mesh position={[centerX, centerY, centerZ]} raycast={() => null} renderOrder={1000}>
      <boxGeometry args={[sizeX, sizeY, sizeZ]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

function DebugMarker({
  position,
  color,
  size = 0.08
}: {
  position: Vector3Tuple;
  color: string;
  size?: number;
}) {
  return (
    <mesh position={position} raycast={() => null} renderOrder={1001}>
      <sphereGeometry args={[size, 10, 10]} />
      <meshBasicMaterial color={color} depthWrite={false} />
    </mesh>
  );
}

type CollisionDebugOverlayProps = {
  furniture: RoomFurniturePlacement[];
  playerPosition: Vector3Tuple;
  pendingInteraction: FurnitureInteractionTarget | null;
  activeInteraction: FurnitureInteractionTarget | null;
  showPlayerCollider: boolean;
  showInteractionMarkers: boolean;
};

export function CollisionDebugOverlay({
  furniture,
  playerPosition,
  pendingInteraction,
  activeInteraction,
  showPlayerCollider,
  showInteractionMarkers
}: CollisionDebugOverlayProps) {
  const furnitureAABBs = useMemo(
    () =>
      furniture
        .filter((item) => item.surface === "floor")
        .flatMap((item) =>
          getFurnitureAABBs(item).map((aabb, index) => ({
            key: `${item.id}:${index}`,
            aabb
          }))
        ),
    [furniture]
  );
  const playerAABB = useMemo(() => getPlayerAABB(playerPosition), [playerPosition]);

  return (
    <group>
      {furnitureAABBs.map(({ key, aabb }) => (
        <AABBWireframe key={key} aabb={aabb} color="#ff4d5a" opacity={0.78} />
      ))}
      {showPlayerCollider ? <AABBWireframe aabb={playerAABB} color="#4da3ff" opacity={0.9} /> : null}
      {showInteractionMarkers && pendingInteraction?.approachPosition ? (
        <DebugMarker position={pendingInteraction.approachPosition} color="#ffd54a" size={0.1} />
      ) : null}
      {showInteractionMarkers && pendingInteraction ? (
        <DebugMarker position={pendingInteraction.position} color="#58e28d" size={0.08} />
      ) : null}
      {showInteractionMarkers && activeInteraction ? (
        <DebugMarker position={activeInteraction.position} color="#58e28d" size={0.1} />
      ) : null}
    </group>
  );
}
