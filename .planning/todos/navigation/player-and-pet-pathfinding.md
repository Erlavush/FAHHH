# TODO: Implement Player and Pet Pathfinding

## Area: `navigation`
## Priority: `medium`

### Background
Currently, both the player and the pet move towards target coordinates in a straight line. If there is an obstacle (like a couch or table) in the direct path, they either get stuck (player) or give up and pick another target (pet). To achieve a "Roblox-style" click-to-navigate experience and smarter pet behavior, we need actual pathfinding.

### The "Hard" Parts to Remember
1. **Dynamic Grid Generation**: The navigation grid must update ("bake") whenever furniture is placed or moved in the room.
2. **A* Algorithm**: Efficient implementation of the A* search algorithm for a 5x5m (20x20 cell) room.
3. **Path Smoothing**: Use "string-pulling" to ensure paths look natural and diagonal rather than robotic stair-stepping.
4. **Player Integration**: The `MinecraftPlayer` component needs to be updated to follow a list of waypoints instead of a single `targetPosition`.

### Goals
- [ ] Create a `src/lib/navGrid.ts` utility that generates a walkable grid based on `furniture` footprints.
- [ ] Implement a lightweight A* pathfinder.
- [ ] Update `pickPetWanderTarget` in `petPathing.ts` to return a path instead of just a final coordinate.
- [ ] Update `useRoomViewInteractions` to compute a path when clicking the floor and store it in the interaction state.
- [ ] Refactor `MinecraftPlayer.tsx` to iterate through a path of points.
- [ ] Add a visual "target" marker at the click destination (Roblox style).

### Progress Tracking
- [ ] NavGrid baking from `furniture` data.
- [ ] A* path search logic.
- [ ] Path smoothing/string-pulling pass.
- [ ] Functional Pet pathfinding.
- [ ] Functional Click-to-nav for Player.
