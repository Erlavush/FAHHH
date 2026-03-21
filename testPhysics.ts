import { resolvePlayerMovement } from "./src/lib/physics";
import { RoomFurniturePlacement } from "./src/lib/roomState";
import { getFurnitureAABBs, getPlayerAABB } from "./src/lib/furnitureCollision";

const furniture: RoomFurniturePlacement[] = [
  {
    id: "fridge1",
    type: "fridge",
    position: [1, 0, 0],
    rotationY: 0,
    surface: "floor"
  }
];

const startPos: [number, number, number] = [0, 0, 0];
const targetPos: [number, number, number] = [2, 0, 0]; // Walk through the fridge

console.log("Fridge AABB:", getFurnitureAABBs(furniture[0]));
console.log("Player AABB at start:", getPlayerAABB(startPos));

// simulate moving
let currentPos = [...startPos] as [number, number, number];
for (let i = 0; i < 10; i++) {
  const dx = targetPos[0] - currentPos[0];
  const dz = targetPos[2] - currentPos[2];
  const dist = Math.hypot(dx, dz);
  if (dist < 0.02) break;

  const moveStep = 0.5;
  const nextTarget: [number, number, number] = [
    currentPos[0] + (dx / dist) * moveStep,
    currentPos[1],
    currentPos[2] + (dz / dist) * moveStep
  ];

  const result = resolvePlayerMovement(currentPos, nextTarget, furniture);
  console.log(`Step ${i}: current=${currentPos} target=${nextTarget} result=${result.position} collided=${result.collided}`);
  currentPos = result.position;
}
