import { AABB, aabbsOverlap, getFurnitureAABBs, getPlayerAABB } from "./furnitureCollision";
import { RoomFurniturePlacement } from "./roomState";

export interface MovementResult {
  position: [number, number, number];
  collided: boolean;
}

const STEP_HEIGHT = 0.6; // Allows walking up slabs (0.5)

export function resolvePlayerMovement(
  currentPos: [number, number, number],
  targetPos: [number, number, number],
  furniture: RoomFurniturePlacement[]
): MovementResult {
  const nextPos: [number, number, number] = [...currentPos];
  let collided = false;

  const obstacles = furniture.filter(f => f.surface === "floor" && f.type !== "rug");
  const obstacleAABBs = obstacles.flatMap(f => getFurnitureAABBs(f));

  // Try moving X
  const posX: [number, number, number] = [targetPos[0], currentPos[1], currentPos[2]];
  if (!checkSweepCollision(currentPos, posX, obstacleAABBs)) {
    nextPos[0] = targetPos[0];
  } else {
    // Try stepping up
    const stepUpStart: [number, number, number] = [currentPos[0], currentPos[1] + STEP_HEIGHT, currentPos[2]];
    const stepUpPos: [number, number, number] = [targetPos[0], currentPos[1] + STEP_HEIGHT, currentPos[2]];
    
    // Check if we can safely exist at step height, AND safely move forward at step height
    if (!checkCollision(stepUpStart, obstacleAABBs) && !checkSweepCollision(stepUpStart, stepUpPos, obstacleAABBs)) {
      const finalY = findGroundY(stepUpPos, obstacleAABBs);
      nextPos[0] = targetPos[0];
      nextPos[1] = finalY;
    } else {
      collided = true;
    }
  }

  // Try moving Z
  const posZ: [number, number, number] = [nextPos[0], nextPos[1], targetPos[2]];
  if (!checkSweepCollision([nextPos[0], nextPos[1], currentPos[2]], posZ, obstacleAABBs)) {
    nextPos[2] = targetPos[2];
  } else {
    // Try stepping up
    const stepUpStart: [number, number, number] = [nextPos[0], nextPos[1] + STEP_HEIGHT, currentPos[2]];
    const stepUpPos: [number, number, number] = [nextPos[0], nextPos[1] + STEP_HEIGHT, targetPos[2]];
    
    if (!checkCollision(stepUpStart, obstacleAABBs) && !checkSweepCollision(stepUpStart, stepUpPos, obstacleAABBs)) {
      const finalY = findGroundY(stepUpPos, obstacleAABBs);
      nextPos[2] = targetPos[2];
      nextPos[1] = finalY;
    } else {
      collided = true;
    }
  }

  // Gravity/Falling
  const fallCheckTarget: [number, number, number] = [nextPos[0], nextPos[1] - 0.5, nextPos[2]];
  if (!checkSweepCollision(nextPos, fallCheckTarget, obstacleAABBs)) {
    const groundY = findGroundY(nextPos, obstacleAABBs);
    nextPos[1] = Math.max(0, groundY);
  } else {
    // We are colliding with something below us, so we snap to it
    const groundY = findGroundY(nextPos, obstacleAABBs);
    nextPos[1] = Math.max(0, groundY);
  }

  return { position: nextPos, collided };
}

function checkCollision(pos: [number, number, number], obstacles: AABB[]): boolean {
  const playerAABB = getPlayerAABB(pos);
  return obstacles.some(obstacle => aabbsOverlap(playerAABB, obstacle));
}

function checkSweepCollision(
  startPos: [number, number, number],
  endPos: [number, number, number],
  obstacles: AABB[]
): boolean {
  const startAABB = getPlayerAABB(startPos);
  const endAABB = getPlayerAABB(endPos);
  
  const sweepAABB: AABB = {
    min: [
      Math.min(startAABB.min[0], endAABB.min[0]),
      Math.min(startAABB.min[1], endAABB.min[1]),
      Math.min(startAABB.min[2], endAABB.min[2])
    ],
    max: [
      Math.max(startAABB.max[0], endAABB.max[0]),
      Math.max(startAABB.max[1], endAABB.max[1]),
      Math.max(startAABB.max[2], endAABB.max[2])
    ]
  };

  return obstacles.some(obstacle => aabbsOverlap(sweepAABB, obstacle));
}

function findGroundY(pos: [number, number, number], obstacles: AABB[]): number {
  let highestY = 0;
  const playerAABB = getPlayerAABB(pos);
  
  for (const obstacle of obstacles) {
    // Check if player is above this obstacle in XZ (using a slightly shrunken AABB to avoid edge catching)
    const epsilon = 0.01;
    const xOverlap = playerAABB.min[0] + epsilon <= obstacle.max[0] && playerAABB.max[0] - epsilon >= obstacle.min[0];
    const zOverlap = playerAABB.min[2] + epsilon <= obstacle.max[2] && playerAABB.max[2] - epsilon >= obstacle.min[2];
    
    if (xOverlap && zOverlap) {
      if (obstacle.max[1] <= pos[1] + 0.1) { // Give a little buffer to detect floor just below feet
        highestY = Math.max(highestY, obstacle.max[1]);
      }
    }
  }
  
  return highestY;
}
