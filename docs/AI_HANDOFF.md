# AI Handoff

## Project Snapshot
This repo currently contains the `foundation layer` for a larger game jam concept. The active runtime is still a local solo sandbox: the player can move around a single 10x10 room, customize a Minecraft-skin-compatible avatar, decorate the room with floor, wall, and surface items, and use furniture interactions like sitting, sleeping, and using a PC.

The intended final game is `Risk It All`, a shared couple-room game where two partners build one private room together, earn progress together, personalize it with photos and pets, and lose that shared room if they break up.

## What Exists Now
- React + Vite + TypeScript frontend.
- React Three Fiber / Drei 3D scene.
- Free orbit camera with zoom.
- Right-click move.
- Build mode with:
  - catalog spawning
  - selection
  - drag + gizmo editing
  - confirm / cancel / delete
  - grid snap and free placement
- Placement layers:
  - floor
  - wall
  - surface decor
- Interactions:
  - `sit`
  - `lie`
  - `use_pc`
- Local browser persistence for skin, camera, player, and room state.
- Imported 3D asset support through wrapped model components.

## Intended Final Game Features
- Google auth or equivalent sign-in
- invite-code pairing
- one shared room per couple
- live partner presence in the room
- coins and player levels
- shared couple streak
- furniture and decor buying
- desk PC minigames that grant extra coins
- daily quests
- editable picture frames with couple photos
- pets such as cats and dogs
- breakup reset that wipes the shared room after confirmation

## Near-Term Product Goal
The immediate goal is a game jam MVP that proves the full fantasy in one room:

- pair into the same room
- earn coins
- buy furniture
- keep a streak
- play one PC minigame
- complete one daily quest
- upload at least one custom frame image
- have one pet
- support breakup reset

## Source of Truth
Use these files as the real current gameplay truth:
- [App.tsx](Z:/FAHHHH/src/App.tsx)
- [RoomView.tsx](Z:/FAHHHH/src/components/RoomView.tsx)
- [furnitureRegistry.ts](Z:/FAHHHH/src/lib/furnitureRegistry.ts)
- [roomState.ts](Z:/FAHHHH/src/lib/roomState.ts)
- [surfaceDecor.ts](Z:/FAHHHH/src/lib/surfaceDecor.ts)
- [furnitureCollision.ts](Z:/FAHHHH/src/lib/furnitureCollision.ts)
- [furnitureInteractions.ts](Z:/FAHHHH/src/lib/furnitureInteractions.ts)
- [devLocalState.ts](Z:/FAHHHH/src/lib/devLocalState.ts)

## Do Not Treat These as Current Runtime Truth
These are future-track or older-shape modules:
- [types.ts](Z:/FAHHHH/src/lib/types.ts)
- `backend/*`
- [AuthGate.tsx](Z:/FAHHHH/src/components/AuthGate.tsx)
- [PairingScreen.tsx](Z:/FAHHHH/src/components/PairingScreen.tsx)
- [WelcomeOverlay.tsx](Z:/FAHHHH/src/components/WelcomeOverlay.tsx)

## Controls
- `Left drag`: orbit camera
- `Mouse wheel`: zoom
- `Right click floor`: move player
- `Right click chair / bed / desk`: interact in play mode
- `Build Mode On`:
  - double click floor or wall item to edit
  - single click surface decor to edit
  - drag or gizmo to move
  - confirm / cancel / delete / deselect through overlay and bottom dock

## Scale and World Rules
- `1 unit = 1 block`
- Current room size is `10x10`
- `Y` is height
- Floor items should fit cleanly to block-relative footprints
- Surface decor uses sub-block snapping on host tops
- Minecraft skins must stay compatible with `64x64` or `64x32` PNG layout

## Placement Rules
### Floor
- clamped to room bounds
- uses rotated footprint collision

### Wall
- only `wall_back` and `wall_left` currently
- bounded per wall

### Surface Decor
- requires a host furniture with `supportSurface`
- uses `anchorFurnitureId`
- uses `surfaceLocalOffset`
- follows host movement and rotation
- grid snap uses four quadrant centers inside each `1x1` support block

## Interaction Rules
- `sit`: chair, office chair
- `lie`: bed
- `use_pc`: desk, office desk
- Desk PC use requires a valid chair in the desk's chair zone.
- Office desk and regular desk do not use the same chair-zone direction.

## Current Furniture Taxonomy
### Floor Furniture
- bed
- desk
- chair
- fridge
- office_desk
- office_chair

### Wall Decor
- poster
- wall_frame

### Surface Decor
- vase
- books

### Accents
- table
- rug

## Constraints for Future Changes
- Do not bypass the registry when adding or changing furniture.
- Do not invent a separate room schema outside the current room model.
- Do not break world scale or block-relative logic.
- Do not reconnect multiplayer by using `types.ts` as the main current room format.
- Preserve the distinction between committed room state and in-progress draft editing.
- Future progression, economy, quests, pets, and breakup state should be added on top of the current room-builder foundation rather than by replacing it wholesale.
- Shared-room sync must adopt the current registry + room-state model before feature expansion.

## AI-Ready Glossary
- `floor item`: furniture placed directly on the room floor.
- `wall item`: decor placed on `wall_back` or `wall_left`.
- `surface decor`: small item placed on top of another furniture host.
- `supportSurface`: metadata that says a furniture item can host surface decor, including width, depth, and top height.
- `draft`: the currently edited but not yet confirmed furniture state.
- `committed furniture`: the confirmed room layout currently treated as saved state.
- `interaction target`: the resolved position and facing used when the player performs `sit`, `lie`, or `use_pc`.
- `host furniture`: the floor furniture item that owns a piece of surface decor.
- `couple streak`: the shared relationship-progress counter for the paired room.
- `breakup reset`: the explicit flow that wipes the shared room and relationship-bound progress.
