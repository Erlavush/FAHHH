# Current Systems

For file ownership, structure, tests, and risk boundaries, pair this document with [../.planning/codebase](../.planning/codebase).

## Status Summary

### Implemented Now

- local solo sandbox runtime
- build-mode room editing
- inventory ownership
- coin-based shop and sell flow
- window furniture with real wall openings
- four-wall wall decor support
- drag-across-wall editing for wall furniture
- Preview Studio for furniture thumbnails
- Preview Studio `Mob Lab` for imported-model and pet look-dev
- a temporary Pet Store flow plus live in-room raccoon and cat pets
- real-time world clock with sun/moon lighting
- desk PC minigame earn loop
- local persistence for room, skin, camera, position, coins, pets, and PC minigame progress
- separate browser-local persistence for world settings and Mob Lab presets
- a real-time FPS performance monitor HUD

### Still Missing

- shared multiplayer room runtime
- partner presence and sync
- levels
- couple streak
- quests
- additional minigames
- advanced pet gameplay loops such as needs, mood, and richer interactions
- breakup/reset game logic

## Global Controls

### Camera And World

- `Left drag`: orbit camera
- `Mouse wheel`: smooth zoom in and out
- `Reset Camera`: return to the default camera shot
- `Reset Room`: restore the default sandbox state for the current layout version
- `Preview Studio`: open the in-app content studio
- `Performance Monitor`: real-time FPS counter in the lower-left UI

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

Selection and editing rules:

- `Double click` floor items and wall items to edit them
- `Single click` surface decor to edit it
- direct dragging works for placed items
- selected items use confirm / cancel / store actions
- the bottom edit dock supports nudging, rotation, deselect, and wall-swap fallback
- wall decor can be dragged across room corners onto another wall

## Inventory And Shop

### Ownership Model

The project does not treat the catalog as infinite free spawning.

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
- a `Pet Store` section for temporary live-room pet adoption
- a shortcut into `Mob Lab`

## Furniture Placement Families

### Floor Furniture

- clamped to room bounds
- uses rotated footprint collision
- blocked by player overlap unless the item is a rug

### Wall Furniture

- wall furniture supports `wall_back`, `wall_left`, `wall_front`, and `wall_right`
- overlaps are checked only against items on the same wall
- windows are fixed-height wall items in the current implementation
- wall decor can move across walls by drag or by explicit wall swap

### Surface Decor

- must be anchored to a valid support host
- keeps `anchorFurnitureId`
- keeps `surfaceLocalOffset`
- follows host movement and host rotation

Current valid support hosts are any floor items with `supportSurface` metadata, including:

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

The bed supports multiple slots at the interaction-target layer so future partner-side logic has a cleaner path.

### Use PC

Valid on:

- desk
- office desk

Rules:

- a chair must exist in the desk's use zone
- both `chair` and `office_chair` count
- desk and office desk can differ in seat placement/orientation
- an active desk use session opens the `Pixel Gigs` overlay

## PC Minigame

The first real coin earn loop lives on the desk PC interaction.

Current behavior:

- right-click a desk or office desk in play mode
- the player walks into the desk use position and sits
- the `Pixel Gigs` overlay opens only while the `use_pc` interaction is active
- each run lasts `25` seconds
- results reward coins based on score
- finished runs trigger a real-time cooldown before the next run
- best score, last result, total earned coins, and cooldown timestamp persist locally

## Current Furniture Catalog

### Floor Furniture

- Bed
- Desk
- Chair
- Fridge
- Wardrobe
- Office Desk
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

## Pets

The temporary live-room pet set currently includes:

- `Raccoon`
- `Cat`

Important current facts:

- pets are purchased from the `Pet Store`
- both current pets cost `0` coins for testing
- pets persist in the sandbox save
- pets wander around the room using simplified room-safe pathing
- pet authoring still happens through `Mob Lab`, not through the room editor

## Starter Room Snapshot

The current default room lives in [../src/lib/roomState.ts](../src/lib/roomState.ts).

Important current facts:

- layout version: `6`
- theme: `starter-cozy`
- the starter layout includes furniture, decor, and placed windows
- older layout versions are normalized forward or reset to the current fallback

## Window And Wall System

The project no longer uses decorative shell-only windows.

Current behavior:

- `window` is a real furniture type
- windows can be bought, owned, placed, stored, and sold like other items
- window placement works on all four walls
- windows create actual wall openings through segmented wall geometry
- the room shell closes again if the window placement is removed
- glass and frame rendering come from [../src/components/WallWindowModel.tsx](../src/components/WallWindowModel.tsx)

## Preview Studio

The preview studio is an in-app content tool with two modes.

### Furniture Studio

Furniture Studio supports:

- one-item-at-a-time preview
- orthographic isometric camera
- drag-to-orbit
- `Reset View`
- green / black / white backgrounds
- fixed filename guidance for saved captures

Current thumbnail state:

- all registry items have a preview path
- some items use real PNG captures
- others still use placeholder SVGs

### Mob Lab

Mob Lab is for imported model and mob look-dev.

It currently supports:

- one active imported mob preset at a time
- a `5 x 5` grass-block stage
- live rig/body-part editing
- live idle and walk animation tuning
- preview locomotion modes: `idle`, `walk_in_place`, `loop_path`
- collider size and offset tuning
- box, CEM, and high-fidelity GLB render modes
- local auto-save plus JSON export/import

Important boundary:

- imported mobs are not automatically gameplay pets
- promotion into the live room is an explicit runtime step

## World Clock And Lighting

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

### Lighting Stack

The scene currently uses:

- moving sun directional light
- moving moon directional light
- visible moon body
- warm ambient fill light
- hemisphere fill light
- transparent canvas over a time-of-day backdrop gradient
- fog tinted from the same sky blend
- ACES tone mapping
- N8AO
- bloom
- vignette
- hue/saturation correction
- brightness/contrast correction

Important note:

- floor lamps add practical warm lighting into the shared lighting rig
- there is one active cinematic room-lighting path, not a set of separate render modes

## Persistence

The active sandbox save path is browser-local.

The save is split into:

- `world data` through [../src/lib/devLocalState.ts](../src/lib/devLocalState.ts)
- `world settings` through [../src/lib/devWorldSettings.ts](../src/lib/devWorldSettings.ts)

Persisted room/runtime fields include:

- `skinSrc`
- `cameraPosition`
- `playerPosition`
- `playerCoins`
- `roomState`
- `pcMinigame`
- `pets`

Important current facts:

- world-data save schema version is `6`
- world settings are separate from world data on purpose
- the browser-local save path is intended for development and local sandbox use
- Firebase-shaped `.env` placeholders and rules files still exist in the repo, but the active runtime in `src/` is browser-local only
- `devLocalState.ts` currently validates persisted placement surfaces against `floor`, `wall_back`, `wall_left`, and `surface` only, so `wall_front` and `wall_right` placements are at risk during load until that validator is fixed

Mob Lab authoring state is stored separately through [../src/lib/mobLabState.ts](../src/lib/mobLabState.ts).

Mob Lab persisted fields:

- active mob id
- selected part per mob id
- imported-mob preset library

Important current facts:

- Mob Lab save schema version is `2`
- Mob Lab state does not live inside the room sandbox save
- JSON export/import is the intended browser-safe sharing path

## Test Coverage

There are currently 21 test files in [../tests](../tests):

- [../tests/canvasSizing.test.ts](../tests/canvasSizing.test.ts)
- [../tests/cemTransforms.test.ts](../tests/cemTransforms.test.ts)
- [../tests/economy.test.ts](../tests/economy.test.ts)
- [../tests/furnitureCollision.test.ts](../tests/furnitureCollision.test.ts)
- [../tests/furnitureInteractions.test.ts](../tests/furnitureInteractions.test.ts)
- [../tests/furnitureRegistry.test.ts](../tests/furnitureRegistry.test.ts)
- [../tests/mobLabState.test.ts](../tests/mobLabState.test.ts)
- [../tests/mobTextureLayout.test.ts](../tests/mobTextureLayout.test.ts)
- [../tests/pcMinigame.test.ts](../tests/pcMinigame.test.ts)
- [../tests/petPathing.test.ts](../tests/petPathing.test.ts)
- [../tests/pets.test.ts](../tests/pets.test.ts)
- [../tests/physics.test.ts](../tests/physics.test.ts)
- [../tests/roomState.test.ts](../tests/roomState.test.ts)
- [../tests/roomViewLighting.test.ts](../tests/roomViewLighting.test.ts)
- [../tests/roomViewPlacementResolvers.test.ts](../tests/roomViewPlacementResolvers.test.ts)
- [../tests/roomViewSpawn.test.ts](../tests/roomViewSpawn.test.ts)
- [../tests/roomViewWallHelpers.test.ts](../tests/roomViewWallHelpers.test.ts)
- [../tests/surfaceDecor.test.ts](../tests/surfaceDecor.test.ts)
- [../tests/useRoomFurnitureEditor.test.ts](../tests/useRoomFurnitureEditor.test.ts)
- [../tests/wallOpenings.test.ts](../tests/wallOpenings.test.ts)
- [../tests/worldLighting.test.ts](../tests/worldLighting.test.ts)

Important interpretation:

- room-view refactor slices now have focused automated coverage
- collision, interaction, room-state, surface, and wall-opening tests still cover core sandbox behavior
- there is still no browser-driven end-to-end UI suite for the full editor flow

## Known Rough Edges

- progression systems do not exist yet beyond coins
- many item thumbnails are still placeholders
- art-set cohesion is still mixed across assets
- advanced pet behavior does not exist yet
- shared-room backend and pairing are not implemented
- persisted `wall_front` and `wall_right` placements are not fully protected by the current local save validator
