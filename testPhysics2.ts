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

let currentPos = [...startPos] as [number, number, number];
for (let i = 0; i < 20; i++) {
  const dx = targetPos[0] - currentPos[0];
  const dz = targetPos[2] - currentPos[2];
  const dist = Math.hypot(dx, dz);

  const moveStep = 0.05;
  const nextTarget: [number, number, number] = [
    currentPos[0] + (dx / dist) * moveStep,
    currentPos[1],
    currentPos[2] + (dz / dist) * moveStep
  ];

  const result = resolvePlayerMovement(currentPos, nextTarget, furniture);
  currentPos = result.position;
  console.log(`Step ${i}: pos=${currentPos.map(n => n.toFixed(3))} AABB=${JSON.stringify(getPlayerAABB(currentPos))}`);
}
