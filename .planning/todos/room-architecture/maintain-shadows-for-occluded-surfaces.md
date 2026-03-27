---
created: 2026-03-27T16:48:21+08:00
title: Maintain Shadows for Occluded Walls and Roofs
area: room-architecture
files:
  - src/components/room-view/RoomShell.tsx:189
---

## Problem

Currently, when a wall or roof surface is hidden by the camera occlusion system (e.g., when the camera angle needs to see inside the room), the shadow-casting geometry is completely removed from the scene (it returns `null` in `SingleWall`). This causes the sun's directional lighting to pass through the vacated space, resulting in missing shadows on the interior floor, walls, and furniture. This breaks the visual consistency of the lighting when rotating the camera.

## Solution

The shadow-casting geometry must remain active in the scene even when it is not visually rendered to the main camera. 

Possible approaches:
1.  **Ghost Mesh**: Instead of returning `null`, render the mesh with a material that has `colorWrite: false` or `visible: false` but keeps `castShadow: true`. 
2.  **Separate Shadow Body**: Create a simplified duplicate of the wall/roof layout that only exists for the shadow pass.
3.  **Refactor Visibility**: Update `SingleWall` to use a property-based visibility (e.g. `mesh.visible`) or layer-based hiding instead of conditional React rendering, ensuring `castShadow` remains `true`.

## Implemented

- `RoomShell` now keeps occluded wall bands and the ceiling slab mounted in the scene using a shadow-only material path instead of unmounting them.
- Hidden wall and ceiling occluders now use `colorWrite: false` and `depthWrite: false`, so they stay out of the main camera pass while still contributing to sun-shadow casting.
- Decorative trims, rails, and interaction planes remain visibility-bound, so only the structural occluders persist during camera peel-away.
- Added focused helper coverage in `tests/roomShell.test.ts` to lock the render-mode contract.
