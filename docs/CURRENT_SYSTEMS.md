# Current Systems

## Status Summary

### Implemented Now

- local solo sandbox runtime
- build-mode room editing
- inventory ownership
- coin-based shop and sell flow
- window furniture with real wall openings
- preview studio for furniture thumbnails
- preview studio `Mob Lab` for imported model and mob testing
- a temporary pet-store flow for adopting the finalized raccoon or high-fidelity cat into the live room
- a live-room pet runtime with room-safe wandering and procedural physics
- real-time FPS performance monitoring HUD
- real-time sun/moon world clock
- desk PC minigame earn loop
- local persistence for room, skin, camera, position, coins, pets, and PC minigame progress
- separate browser-local persistence for Mob Lab presets and selected parts

### Still Missing

- multiplayer runtime
- pair sync
- levels
- streaks
- quests
- additional minigames
- a generalized pet gameplay loop beyond the current raccoon test pet
- breakup/reset game logic

## Global Controls

### Camera and World

- `Left drag`: orbit camera
- `Mouse wheel`: smooth zoom in and out
- `Reset Camera`: return to the default camera shot
- `Reset Room`: restore the default sandbox state for the current layout version
- **Performance Monitor**: real-time FPS counter in the bottom-left with color-coded status

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
- a `Pet Store` section for temporary test-pet adoption

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

The bed supports multiple slots at the interaction-target layer so future partner-side logic has a cleaner path.

### Use PC

Valid on:

- desk
- office desk

Rules:

- a chair must exist in the desk's use zone
- both `chair` and `office_chair` count
- desk and office desk can differ in seat placement/orientation
- an active desk use session opens the `Pixel Gigs` PC minigame overlay

## PC Minigame

The first real coin earn loop now lives on the desk PC interaction.

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
- the starter layout includes furniture, decor, and real placed windows

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

The preview studio is an in-app content tool.

It currently has two modes.

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
- the rest still use placeholder SVGs

### Mob Lab

Mob Lab is for imported model and mob look-dev.

It currently supports:

- one active imported mob preset at a time
- a `5 x 5` grass-block stage
- live rig/body-part editing
- live idle and walk animation tuning
- preview locomotion modes: `idle`, `walk_in_place`, `loop_path`
- collider size and offset tuning
- high-fidelity GLB support with skeletal cloning (prevents scene theft)
- Smart Mesh-Only variant filtering (hides ghost geometry)
- local auto-save plus JSON export/import

- the renderer supports both legacy cuboid CEM models and high-fidelity GLB skeletons
- imported mobs are not automatically gameplay pets; live-room promotion is still an explicit per-preset step

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

- the scene uses one cinematic lighting path
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
- warm practical night fill comes from floor-lamp furniture plus the shared room lighting rig
- the visual look is still stylized and still being polished

## Persistence

The active sandbox save path is development-only browser storage.

The save is currently split into two browser-local documents:

- `world data` through [devLocalState.ts](/Z:/FAHHHH/src/lib/devLocalState.ts)
- `world settings` through [devWorldSettings.ts](/Z:/FAHHHH/src/lib/devWorldSettings.ts)

Persisted room/runtime fields:

- `skinSrc`
- `cameraPosition`
- `playerPosition`
- `playerCoins`
- `roomState`
- `pcMinigame`
- `pets`

Persisted world-settings/dev-panel fields currently include:

- clock mode and locked-time controls
- sun, shadows, fog, brightness, saturation, and contrast
- build mode, inventory visibility, grid snap, and debug panel visibility
- preview studio state
- custom dev-panel collapsed-section state

Important current facts:

- world-data save schema version is `6`
- world settings are separate from world data on purpose
- the browser-local save path is only for development and local sandbox use
- older saves are normalized forward
- outdated room layouts are reset to the current fallback starter room

Mob Lab authoring state is stored separately through [mobLabState.ts](/Z:/FAHHHH/src/lib/mobLabState.ts).

Mob Lab persisted fields:

- active mob id
- selected part per mob id
- imported-mob preset library

Important current facts:

- Mob Lab save schema version is `2`
- Mob Lab state does not live inside the room sandbox save
- JSON export/import is the intended browser-safe sharing path

## Test Coverage

There are 12 test files in [tests](/Z:/FAHHHH/tests):

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
- [pcMinigame.test.ts](/Z:/FAHHHH/tests/pcMinigame.test.ts)
- [petPathing.test.ts](/Z:/FAHHHH/tests/petPathing.test.ts)

Important interpretation:

- most sandbox/runtime coverage lives in the room-state, collision, interaction, economy, surface, and wall-opening tests
- `starterRoom.test.ts` covers the older/future shared-room helper, not the active sandbox room schema
- there is targeted automated coverage for simple pet pathing, but there is still no dedicated automated coverage for the full Mob Lab editor flow

## Known Rough Edges

- progression systems do not exist yet beyond coins
- many item thumbnails are still placeholders
- art style cohesion is still mixed between hand-built models and imported/hardcoded replacements
- visual lighting polish is still in progress
- auth/pairing code exists but is not mounted by the active app shell
- Mob Lab has been generalized to support GLB skeletons, but still lacks full gameplay AI (needs/moods)
