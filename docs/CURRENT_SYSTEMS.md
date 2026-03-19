# Current Systems

## Status Summary
- `Implemented now`: the local solo sandbox room builder and interaction loop.
- `Prototype`: some interaction polish, imported asset tuning, and UX polish are still evolving.
- `Future`: multiplayer, pairing, shared-room sync, progression, and production onboarding.

## Controls and Input Map
### Global Camera
- `Left click + drag`: orbit the camera.
- `Mouse wheel`: zoom in and out.
- Camera is always free and not locked to a fixed isometric angle anymore.

### Play Mode
- `Right click floor`: move the player to that location.
- `Right click chair`: sit.
- `Right click bed`: sleep.
- `Right click desk`: use PC if a valid chair is detected in the desk's chair zone.
- `Right click floor while interacting`: stand up / exit the current interaction.

### Build Mode
- Toggle `Build Mode` from the top toolbar.
- Toggle `Catalog` to open the furniture spawn panel.
- Toggle `Grid Snap` to switch between snapped and free placement.
- `Double click` a floor or wall item to enter edit mode.
- `Single click` a surface decor item to enter edit mode.
- Once selected:
  - drag the object directly
  - use the gizmo
  - use confirm / cancel / delete
  - use the bottom edit dock for nudges and rotation

## Play Mode vs Build Mode
### Play Mode
- Focuses on avatar movement and object interaction.
- Furniture is not edited.
- Interactable items show hover feedback.

### Build Mode
- Focuses on decorating the room.
- Play interactions are disabled.
- Furniture edits use a draft workflow:
  - select
  - move / rotate
  - confirm or cancel

## Placement Layers
### Floor Items
- Exist at room floor level.
- Clamped to the room bounds using the rotated furniture footprint.
- Use collision rules against other floor items.
- Rugs are special:
  - can go under furniture
  - can go under the player
  - cannot overlap other rugs

### Wall Items
- Use `wall_back` or `wall_left`.
- Are bounded per wall surface.
- Collide only with other wall items on the same wall.

### Surface Decor
- Lives on top of host furniture that exposes a `supportSurface`.
- Uses `anchorFurnitureId` plus `surfaceLocalOffset`.
- Follows the host when the host moves or rotates.
- Current valid host style is "flat usable top surface," such as:
  - desk
  - office desk
  - small table
  - refrigerator

## Surface Decor Rules
- Grid snap on:
  - each `1x1` support block is subdivided into four quadrant-centered snap points
  - practical step is `0.5`, but placement snaps to the quadrant centers, not to the dividing lines
- Grid snap off:
  - free placement anywhere on the host surface
- Surface decor collides only with other surface decor on the same host.

## Current Interaction Set
### Sit
- Valid on:
  - chair
  - office chair
- Player walks into place and enters a seated pose.

### Sleep
- Valid on:
  - bed
- Player walks to the bed and enters a lying pose.

### Use PC
- Valid on:
  - desk
  - office desk
- Requires a valid chair in the desk's `1x1` chair zone.
- Valid chairs:
  - chair
  - office chair
- The player sits at the chosen chair and faces the desk.
- If no chair is found, the desk shows a `Need a chair` hint instead of starting the interaction.

## Persistence
- Active mode is a versioned local sandbox save in browser `localStorage`.
- Persisted state includes:
  - avatar skin
  - camera position
  - player position
  - room state
- Current persisted shape is `PersistedSandboxState v1`.
- The saved room resets to the fallback starter room if the local theme or layout version becomes older than the code's current default.

## Current Furniture Catalog
### Floor Furniture
- Bed
- Desk + PC
- Chair
- Refrigerator
- Office Desk + PC
- Office Chair

### Wall Decor
- Poster
- Wall Frame

### Surface Decor
- Flower Vase
- Book Stack

### Accents
- Small Table Set
- Floor Rug

## Current Runtime Source of Truth
- [App.tsx](Z:/FAHHHH/src/App.tsx): UI shell, toolbar, catalog, debug panel, persistence bridge.
- [RoomView.tsx](Z:/FAHHHH/src/components/RoomView.tsx): actual scene runtime and gameplay behavior.
- [furnitureRegistry.ts](Z:/FAHHHH/src/lib/furnitureRegistry.ts): item taxonomy, categories, footprints, support surfaces, interaction metadata.
- [roomState.ts](Z:/FAHHHH/src/lib/roomState.ts): room metadata and default furniture layout.
- [surfaceDecor.ts](Z:/FAHHHH/src/lib/surfaceDecor.ts): hosted tabletop logic.
- [furnitureCollision.ts](Z:/FAHHHH/src/lib/furnitureCollision.ts): blocking rules.
- [furnitureInteractions.ts](Z:/FAHHHH/src/lib/furnitureInteractions.ts): interaction targeting rules.
