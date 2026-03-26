# Task: Perfected Cat Animation and Behavior

## Problem
1. **Sluggish Movement**: The initial cat AI was very slow (0.38 - 0.82 units/sec) and idle for long periods (0.75s to 2.1s).
2. **"Floating" Idle**: The cat's breathing animation was pushing its feet off the ground during idle cycles.
3. **Erratic Stuttering**: Short-distance wanders and no obstacle checking meant the cat would stutter or bump into objects frequently.
4. **Incorrect Coefficients**: Animation parameters for the GLB cat were not tuned to match the user's verified standalone sandbox.

## Goals
1. [x] **Apply Perfected Animation**: Use the user's verified GLB coefficients for limb swing, body roll, and stride.
2. [x] **Differentiate Species**: Boost the cat's speed and distance while keeping other pets (like the raccoon) at their default, slower pace.
3. [x] **Realistic Cat Pacing**: Increase max wander distance (4-9 blocks) and set a realistic cat-like idle delay (2-4 seconds).
4. [x] **Grounded Idle**: Remove body bobbing (`bodyBob = 0`) during idle to keep feet perfectly stationary on the floor.
5. [x] **Smarter Pathfinding**: Implement basic path-clear "raycast" checks to prevent moves that collide with obstacles mid-journey.
