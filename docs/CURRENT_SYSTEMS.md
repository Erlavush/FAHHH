# Current Systems

## Status Summary

### Implemented Now

- local solo sandbox runtime
- build-mode room editing
- inventory ownership
- coin-based shop and sell flow
- window furniture with real wall openings
- preview studio for shop thumbnails
- real-time sun/moon world clock
- local persistence for room, skin, camera, position, and coins

### Still Missing

- multiplayer runtime
- pair sync
- levels
- streaks
- quests
- minigames
- pets
- breakup/reset game logic

## Global Controls

### Camera and World

- `Left drag`: orbit camera
- `Mouse wheel`: smooth zoom in and out
- `Reset Camera`: return to the default camera shot
- `Reset Room`: restore the default sandbox state for the current layout version

### Play Mode

- `Right click floor`: move player
- `Right click chair / office chair`: sit
- `Right click bed`: lie down
- `Right click desk / office desk`: use the PC if a valid chair is in range
- `Stand Up`: exit the current active or pending interaction

### Build Mode

- `Build Mode`: enables furniture editing
- `Inventory`: opens the shop + stored items panel
- `Grid Snap`: toggles snapped vs freer movement

Selection/editing rules:

- `Double click` floor or wall items to edit them
- `Single click` surface decor to edit it
- direct dragging still works
- gizmo editing works for selected items
- selected items use confirm / cancel / store actions
- bottom edit dock supports nudging, rotation, wall swap, and deselect

## Inventory and Shop

### Ownership Model

The project no longer treats the catalog as infinite free spawning.

Current flow:

1. Buy an item with coins.
2. That creates an `OwnedFurnitureItem`.
3. Placing the item consumes a stored owned copy into the room.
4. Storing it removes the placement but keeps ownership.
5. Selling removes ownership and refunds coins based on source.

### Sell Rules

- starter-owned furniture sells for `0`
- purchased furniture currently refunds full buy price

### Current UI Behavior

The inventory panel shows:

- stored items by category
- per-item stored and in-room counts
- buy button
- place button
- sell/remove button
- preview image
- info popover with short description

## Furniture Placement Families

### Floor Furniture

- clamped to room bounds
- uses rotated footprint collision
- blocked by player overlap unless the item is a rug

### Wall Furniture

- only `wall_back` and `wall_left` exist right now
- overlaps are checked only against items on the same wall
- windows are fixed-height wall items in the current implementation

### Surface Decor

- must be anchored to a valid support host
- keeps `anchorFurnitureId`
- keeps `surfaceLocalOffset`
- follows host movement and host rotation

Valid support hosts are any floor items with `supportSurface` metadata, currently including:

- desk
- office desk
- table
- fridge

## Current Interaction Set

### Sit

Valid on:

- chair
- office chair

### Lie

Valid on:

- bed

The bed now supports multiple slots at the interaction-target layer so future partner-side logic has a cleaner path.

### Use PC

Valid on:

- desk
- office desk

Rules:

- a chair must exist in the desk's use zone
- both `chair` and `office_chair` count
- desk and office desk can differ in seat placement/orientation

## Current Furniture Catalog

### Floor Furniture

- Bed
- Desk + PC
- Chair
- Refrigerator
- Wardrobe Closet
- Office Desk + PC
- Office Chair

### Wall Decor

- Tall Window
- Poster
- Wall Frame

### Surface Decor

- Flower Vase
- Book Stack

### Accents

- Small Table Set
- Floor Rug
- Floor Lamp

## Starter Room Snapshot

The current default room lives in [roomState.ts](/Z:/FAHHHH/src/lib/roomState.ts).

Important current facts:

- layout version: `6`
- theme: `starter-cozy`
- current default room is based on a user-staged arrangement that was baked into the code
- the starter layout includes:
  - rug
  - bed
  - office desk
  - office chair
  - wardrobe
  - side table
  - books
  - vase
  - one left-wall window
  - two back-wall windows
  - poster
  - wall frame

## Window and Wall System

The project no longer uses hardcoded shell-only decorative windows.

Current behavior:

- `window` is a real furniture type
- windows can be bought, owned, placed, stored, and sold like other items
- window placement works on `wall_back` and `wall_left`
- windows create actual wall openings through segmented wall geometry
- the room shell closes again if the window placement is removed
- glass and frame rendering come from [WallWindowModel.tsx](/Z:/FAHHHH/src/components/WallWindowModel.tsx)

## Preview Studio

The preview studio is an in-app content tool for making shop thumbnails.

It currently supports:

- one-item-at-a-time preview
- orthographic isometric camera
- drag-to-orbit
- `Reset View`
- green / black / white backgrounds
- fixed filename guidance for saved captures

Current thumbnail state:

- all registry items have a preview path
- some items use real PNG captures
- the rest still use placeholder SVGs

## World Clock and Lighting

### Clock Model

The old simple `day/night` toggle is no longer the main lighting model.

Current world time options:

- real local clock
- accelerated `Minecraft Time`
- manually locked time of day

The active world time is shown in the toolbar.

### Dev Panel Controls

World settings currently include:

- local clock readout
- world clock readout
- use Minecraft time toggle
- Minecraft time slider
- lock time toggle
- locked time slider
- sync lock to current time
- sun on/off
- shadows on/off
- fog on/off
- fog density
- ambient multiplier
- sun intensity multiplier
- brightness
- saturation
- contrast

Current note:

- the scene now uses one cinematic lighting path
- there is no render-mode toggle in the dev panel right now

### Lighting Stack

The scene currently uses:

- moving sun directional light
- moving moon directional light
- visible moon body
- warm ambient fill light
- hemisphere fill light
- transparent canvas over a blue time-of-day backdrop gradient
- fog tinted from the same time-of-day sky blend
- ACES tone mapping
- N8AO
- bloom
- vignette
- hue/saturation correction
- brightness/contrast correction

Current note:

- fake per-window ray-light decals have been removed
- lighting now comes from the global world clock rig
- floating cube wall lights have been removed
- warm practical night fill now comes from floor-lamp furniture plus the shared room lighting rig
- the visual look is still stylized and still being polished

## Persistence

The active save path is local browser storage through [devLocalState.ts](/Z:/FAHHHH/src/lib/devLocalState.ts).

Persisted fields:

- `skinSrc`
- `cameraPosition`
- `playerPosition`
- `playerCoins`
- `roomState`

Important current facts:

- save schema version is `3`
- older saves are normalized forward
- outdated room layouts are reset to the current fallback starter room

## Test Coverage

There are 10 test files in [tests](/Z:/FAHHHH/tests):

- [economy.test.ts](/Z:/FAHHHH/tests/economy.test.ts)
- [furnitureCollision.test.ts](/Z:/FAHHHH/tests/furnitureCollision.test.ts)
- [furnitureInteractions.test.ts](/Z:/FAHHHH/tests/furnitureInteractions.test.ts)
- [furnitureRegistry.test.ts](/Z:/FAHHHH/tests/furnitureRegistry.test.ts)
- [inviteCode.test.ts](/Z:/FAHHHH/tests/inviteCode.test.ts)
- [roomState.test.ts](/Z:/FAHHHH/tests/roomState.test.ts)
- [starterRoom.test.ts](/Z:/FAHHHH/tests/starterRoom.test.ts)
- [surfaceDecor.test.ts](/Z:/FAHHHH/tests/surfaceDecor.test.ts)
- [wallOpenings.test.ts](/Z:/FAHHHH/tests/wallOpenings.test.ts)
- [worldLighting.test.ts](/Z:/FAHHHH/tests/worldLighting.test.ts)

Important interpretation:

- most sandbox/runtime coverage lives in the room-state, collision, interaction, economy, surface, and wall-opening tests
- `starterRoom.test.ts` covers the older/future shared-room helper, not the active sandbox room schema

## Known Rough Edges

- progression systems do not exist yet beyond coins
- many item thumbnails are still placeholders
- art style cohesion is still mixed between hand-built models and imported/hardcoded replacements
- visual lighting polish is still in progress
- auth/pairing code exists but is not currently mounted by the active app shell
