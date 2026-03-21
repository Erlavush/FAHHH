import { AABB, aabbsOverlap } from "./src/lib/furnitureCollision";

const playerAABB: AABB = { min: [-0.3, 0, -0.3], max: [0.3, 1.8, 0.3] };
const fridgeAABB: AABB = { min: [0.5, 0, -0.5], max: [1.5, 2.1, 0.5] };

console.log(aabbsOverlap(playerAABB, fridgeAABB));

const playerInside: AABB = { min: [0.6, 0, -0.3], max: [1.2, 1.8, 0.3] };
console.log(aabbsOverlap(playerInside, fridgeAABB));
