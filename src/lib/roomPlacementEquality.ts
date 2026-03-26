import type { RoomFurniturePlacement, Vector3Tuple } from "./roomState";

export function vectorsMatch(first: Vector3Tuple, second: Vector3Tuple): boolean {
  return (
    Math.abs(first[0] - second[0]) < 0.0001 &&
    Math.abs(first[1] - second[1]) < 0.0001 &&
    Math.abs(first[2] - second[2]) < 0.0001
  );
}

export function placementsMatch(
  first: RoomFurniturePlacement,
  second: RoomFurniturePlacement
): boolean {
  return (
    first.id === second.id &&
    first.type === second.type &&
    first.surface === second.surface &&
    first.ownedFurnitureId === second.ownedFurnitureId &&
    first.anchorFurnitureId === second.anchorFurnitureId &&
    Math.abs(first.position[0] - second.position[0]) < 0.0001 &&
    Math.abs(first.position[1] - second.position[1]) < 0.0001 &&
    Math.abs(first.position[2] - second.position[2]) < 0.0001 &&
    Math.abs((first.surfaceLocalOffset?.[0] ?? 0) - (second.surfaceLocalOffset?.[0] ?? 0)) <
      0.0001 &&
    Math.abs((first.surfaceLocalOffset?.[1] ?? 0) - (second.surfaceLocalOffset?.[1] ?? 0)) <
      0.0001 &&
    Math.abs(first.rotationY - second.rotationY) < 0.0001
  );
}

export function placementListsMatch(
  first: RoomFurniturePlacement[],
  second: RoomFurniturePlacement[]
): boolean {
  if (first.length !== second.length) {
    return false;
  }

  // Use a copy to avoid mutating the original arrays if we were to sort
  // But searching is safer and order-independent without sorting
  return first.every((p1) => {
    const p2 = second.find((p) => p.id === p1.id);
    if (!p2) return false;
    return placementsMatch(p1, p2);
  });
}