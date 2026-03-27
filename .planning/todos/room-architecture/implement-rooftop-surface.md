# TODO: Implement Rooftop and Ceiling Support

## Area: `room-architecture`
## Priority: `medium`

### Problem
The current room system only supports 4 walls and 1 floor. There is no "ceiling" or "rooftop" surface, which prevents the placement of lights, fans, or other overhead decorations.

### Proposed Solution
1. **Extend RoomShell**: Add a `wall_top` or `ceiling` surface to `RoomShell.tsx`.
2. **Placement Resolvers**: Update `placementResolvers.ts` to handle snapping and positioning for the top surface.
3. **Raycasting**: Update building gestures to recognize the ceiling during placement.
4. **Occlusion**: Implement transparency for the ceiling when the camera looks down, similar to wall occlusion.

### Progress Tracking
- [x] Define `ceiling` placement surface support in the room schema and validators.
- [x] Render `ceiling` mesh in `RoomShell.tsx`.
- [x] Implement `ceiling` placement snapping in `placementResolvers.ts`.
- [x] Add ceiling occlusion logic for camera clarity.

### Implemented Notes
- Ceiling is now a valid persisted and shared-room placement surface.
- RoomShell renders a ceiling slab plus an interaction plane when the camera angle allows it.
- Drag, spawn, pivot, rotate, and nudge paths now understand `ceiling` placements.
- Actual ceiling-specific furniture definitions still belong to the separate ceiling furniture todo.
