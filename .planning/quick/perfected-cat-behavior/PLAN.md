# Plan: Perfected Cat AI and Animation Overhaul

## Implementation Details

### 1. Unified Preset Configuration (`src/lib/mob-presets/better_cat_glb.json`)
- **Animation Sync**: Applied user-verified coefficients for `limbSwing` (40), `bodyRoll` (3.5), and `strideRate` (12.0).
- **Grounded Idle**: Set `idle.bodyBob` to `0` to ensure paws stay anchored to the floor at rest.
- **Locomotion**: Increased base `speed` to `1.8` for more energetic movement.

### 2. Species-Specific AI (`src/components/room-view/RoomPetActor.tsx`)
- **Differentiated Speed**: Identified the cat (`better_cat_glb`) to use a faster range (1.0 - 2.5) while letting others (like raccoon) stay at their default slower pace (~0.1 - 0.5).
- **Long-Distance Wanders**: Cat now targets positions 4-8.5 blocks away, while others keep a short 0.8-2.5 range.
- **Cat Pacing**: Implemented 2s-4s idle delay for the cat alone.
- **Improved Rotation**: Increased turn responsiveness (delta * 12) for the cat.

### 3. Pathfinding Improvements (`src/lib/petPathing.ts`)
- **Wander Radius Parameters**: Updated `pickPetWanderTarget` to accept custom min/max search radii.
- **Path Clear Check**: Added a "midpoint obstacle check" (pseudo-raycast) to ensure a straight path is clear before the cat starts its trip.

### 4. Animation Frame Logic (`src/components/mob-lab/GlbMobPreviewActor.tsx`)
- **Balanced Bobbing**: Restored symmetrical sine-based bobbing for walking so the cat doesn't sink into the floor.
- **Grounded Idle**: (Legacy) idle bobbing was biased from 0 to -0.12 so it could only "sink" but never "float", which is now fully disabled by the 0 `bodyBob` in the cat JSON.

## Verification
1. User verified the cat's animation matches the standalone sandbox.
2. Cat wanders significantly further and idles for several seconds between moves.
3. Raccoon continues to move slowly nearby.
4. No more "floating" during idle or "sinking" during walks.
