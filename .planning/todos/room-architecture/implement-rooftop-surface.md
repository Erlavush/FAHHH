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
- [ ] Define `ceiling` surface in `roomState.ts`.
- [ ] Render `ceiling` mesh in `RoomShell.tsx`.
- [ ] Implement `ceiling` placement snapping in `placementResolvers.ts`.
- [ ] Add ceiling occlusion logic for camera clarity.
