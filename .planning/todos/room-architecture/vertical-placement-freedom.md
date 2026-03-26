# TODO: Implement Unrestricted Vertical Placement for Wall Decor

## Area: `room-architecture`
## Priority: `medium`

### Problem
Currently, wall decorations like windows and paintings have restricted Y-axis placement. Users cannot "free-place" these items very low (near the floor) or very high (near the ceiling).

### Proposed Solution
1. **Remove Clamping**: Modify `placementResolvers.ts` (wall path) to allow a much broader vertical range.
2. **Surface Snapping**: Ensure the window correctly snaps to the wall surface regardless of height.
3. **Collision Checks**: Only restrict placement if the item overlaps with the floor or ceiling boundary.

### Use Cases
- [ ] Windows positioned very low to the ground for a "pavement view".
- [ ] Wall frames positioned high near the ceiling for gallery-style displays.
- [ ] Hanging decorations stacked vertically on the same wall segment.

### Progress Tracking
- [ ] Identify and loosen Y-axis clamping in `placementResolvers.ts`.
- [ ] Ensure `RoomShell.tsx` can correctly render windows at all vertical positions.
- [ ] Test shared-room persistence of these high/low placements.
