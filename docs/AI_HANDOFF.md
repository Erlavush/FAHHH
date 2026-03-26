# AI Handoff

## Read This First

The active product in this repo is a `local solo sandbox` plus an in-app authoring studio.

It is already beyond the empty-room prototype, but it is not yet the full shared couple-room game.

The current shipped-in-code systems include:

- registry-driven furniture placement and ownership
- floor, wall, and surface build-mode editing
- four-wall wall decor and window placement
- drag-across-wall editing for wall furniture
- coin-based buying and selling
- a desk PC minigame earn loop
- a real-time world clock with sun/moon lighting
- an in-app Preview Studio for furniture captures
- a Mob Lab for imported-mob look-dev
- a temporary Pet Store plus live in-room raccoon and cat pets
- browser-local persistence for room data, world settings, and Mob Lab state

## Planning And Mapping State

The repo is now running under the GSD workflow. Use these files together:

- [../.planning/PROJECT.md](../.planning/PROJECT.md)
- [../.planning/ROADMAP.md](../.planning/ROADMAP.md)
- [../.planning/STATE.md](../.planning/STATE.md)
- [../.planning/codebase/ARCHITECTURE.md](../.planning/codebase/ARCHITECTURE.md)
- [../.planning/codebase/STRUCTURE.md](../.planning/codebase/STRUCTURE.md)
- [../.planning/codebase/TESTING.md](../.planning/codebase/TESTING.md)
- [../.planning/codebase/CONCERNS.md](../.planning/codebase/CONCERNS.md)

Interpretation:

- `docs/*` explains the product and major brownfield behavior
- `.planning/*` is the active execution state for GSD
- `.planning/codebase/*` is the refreshed implementation map to use before editing

## Current Runtime Truth

These files define the actual running sandbox:

- [../src/App.tsx](../src/App.tsx)
- [../src/components/RoomView.tsx](../src/components/RoomView.tsx)
- [../src/components/FurniturePreviewStudio.tsx](../src/components/FurniturePreviewStudio.tsx)
- [../src/components/room-view](../src/components/room-view)
- [../src/components/mob-lab](../src/components/mob-lab)
- [../src/lib/furnitureRegistry.ts](../src/lib/furnitureRegistry.ts)
- [../src/lib/roomState.ts](../src/lib/roomState.ts)
- [../src/lib/devLocalState.ts](../src/lib/devLocalState.ts)
- [../src/lib/devWorldSettings.ts](../src/lib/devWorldSettings.ts)
- [../src/app/hooks/useSandboxWorldClock.ts](../src/app/hooks/useSandboxWorldClock.ts)
- [../src/app/clock.ts](../src/app/clock.ts)
- [../src/lib/gameLoop.ts](../src/lib/gameLoop.ts)
- [../src/lib/roomPlacementEquality.ts](../src/lib/roomPlacementEquality.ts)
- [../src/lib/economy.ts](../src/lib/economy.ts)
- [../src/lib/pcMinigame.ts](../src/lib/pcMinigame.ts)
- [../src/lib/furnitureCollision.ts](../src/lib/furnitureCollision.ts)
- [../src/lib/furnitureInteractions.ts](../src/lib/furnitureInteractions.ts)
- [../src/lib/surfaceDecor.ts](../src/lib/surfaceDecor.ts)
- [../src/lib/wallOpenings.ts](../src/lib/wallOpenings.ts)
- [../src/lib/worldLighting.ts](../src/lib/worldLighting.ts)
- [../src/lib/mobLab.ts](../src/lib/mobLab.ts)
- [../src/lib/mobLabState.ts](../src/lib/mobLabState.ts)
- [../src/lib/pets.ts](../src/lib/pets.ts)
- [../src/lib/petPathing.ts](../src/lib/petPathing.ts)
- [../vite.config.js](../vite.config.js)

## The Two Active 3D Contexts

### 1. Live Room Runtime

[../src/components/RoomView.tsx](../src/components/RoomView.tsx) hosts the live sandbox room.

This is where the current gameplay exists:

- player movement
- build mode
- furniture editing
- wall/surface/floor placement
- interactions such as `sit`, `lie`, and `use_pc`
- room shell and window openings
- in-room pet rendering
- lighting and post-processing

### 2. Preview Studio

[../src/components/FurniturePreviewStudio.tsx](../src/components/FurniturePreviewStudio.tsx) hosts the in-app content tool.

It has two modes:

- `Furniture Studio`: thumbnail capture for furniture/shop assets
- `Mob Lab`: imported-mob preview and tuning

Mob Lab is an authoring environment first. Promotion into the live room is explicit, not automatic.

## RoomView After The Refactor

`RoomView.tsx` is no longer the giant all-in-one file it used to be. It is now a composition shell that wires together focused room-view modules.

Current ownership inside `src/components/room-view`:

- `useRoomFurnitureEditor.ts`: selected item, working placements, confirm/cancel/store flow, nudge/rotate/swap behavior
- `useRoomViewBuilderGestures.ts`: pointer capture, direct drag, pivot interaction, surface selection, wall-drag transition behavior
- `useRoomViewInteractions.ts`: play-mode movement and interaction state machine
- `useRoomViewCamera.ts`: camera reset, zoom state, scene jump, DPR and Canvas config
- `useRoomViewLighting.ts`: derived lighting state and post-processing config
- `useRoomViewSpawn.ts`: spawn request handling and initial placement search
- `placementResolvers.ts`: pure placement, spawn, and drag-ray math
- `helpers.ts`: shared wall helpers, gizmo helpers, offsets, and axis rules
- `RoomFurnitureLayer.tsx` and `RoomSelectedFurnitureLayer.tsx`: furniture rendering layers
- `RoomSceneLighting.tsx`, `RoomPostProcessing.tsx`, `WallOcclusionController.tsx`: scene lighting and visibility helpers

If a task mentions wall editing, placement bugs, gizmo behavior, or spawn logic, inspect `src/components/room-view` before assuming the logic still lives inline in `RoomView.tsx`.

## What Is Implemented Now

### Core Room Sandbox

- single `10 x 10` room with block-relative world scale
- Minecraft-skin-compatible avatar import and rendering
- right-click floor movement in play mode
- build-mode editing with draft-vs-committed placement flow
- room reset and camera reset actions

### Builder And Placement

- floor, wall, and surface placement families
- all wall items support `wall_back`, `wall_left`, `wall_front`, and `wall_right`
- wall decor can move across walls by dragging through room corners
- surface decor stays anchored through `anchorFurnitureId` and `surfaceLocalOffset`
- selection supports confirm, cancel, store, deselect, rotate, nudge, and wall swap
- smooth wheel zoom and stable pivot controls

### Inventory And Economy

- ownership is separate from placement
- stored furniture and placed furniture are tracked independently
- buying furniture costs coins
- purchased furniture currently refunds full price
- starter furniture can be removed but does not mint sell profit
- the inventory panel also contains a temporary `Pet Store`
- the current Pet Store exposes a `0`-coin raccoon and a `0`-coin cat for live-room testing
- the first earn loop comes from the desk PC minigame

### PC Minigame

- desks and office desks can trigger `use_pc`
- the player approaches the desk and uses the correct chair slot
- the `Pixel Gigs` overlay opens only while the interaction is active
- runs last `25` seconds
- rewards depend on score
- cooldowns and best-score history persist locally

### Windows And Room Shell

- `window` is a real wall furniture type
- windows can be bought, owned, placed, stored, and sold
- windows work on all four walls
- placed windows create real segmented wall openings
- removing or storing the window closes the wall again
- `wallOpenings.ts` stays the geometry source of truth for openings

### Pets

- live-room pets are defined in `pets.ts`
- `alexs_mobs_raccoon` and `minecraft_cat` are the current temporary gameplay pets
- pets are stored in the sandbox save, not in Mob Lab state
- `RoomPetActor.tsx` drives simple wander behavior using `petPathing.ts`
- live-room pet motion is deliberately simpler than Mob Lab preview motion

### Preview Studio And Mob Lab

- Furniture Studio supports furniture capture with controlled backgrounds and camera framing
- Mob Lab supports imported-mob editing with box, CEM, and GLB render modes
- the current default checked-in imported presets are `alexs_mobs_raccoon` and `better_cat_glb`
- presets auto-save in browser storage and can be exported/imported as JSON
- `ImportedMobActor.tsx` lazy-loads the CEM and GLB renderers to keep the base bundle lighter

### Lighting And World Time

- the old simple `day/night` mode is no longer the main path
- the scene follows a world clock that can use local time, accelerated Minecraft time, or a locked inspection time
- the lighting stack includes sun, moon, ambient/hemi fill, fog tint, backdrop gradient, and post-processing
- floor lamps contribute practical warm lighting to the shared lighting rig

## Current Data Model

### Furniture Registry

[../src/lib/furnitureRegistry.ts](../src/lib/furnitureRegistry.ts) is the canonical item taxonomy.

It defines:

- furniture type, label, category, and price
- placement family
- footprint and default rotation
- model key
- support-surface metadata
- interaction metadata
- wall-opening metadata
- preview image metadata and short description

### Room State

[../src/lib/roomState.ts](../src/lib/roomState.ts) is the active room schema.

Important current facts:

- `DEFAULT_ROOM_LAYOUT_VERSION = 6`
- `ownedFurniture` is the ownership layer
- `furniture` is the placed-in-room layer
- surface decor uses `anchorFurnitureId` plus `surfaceLocalOffset`
- starter room state is defined directly here

### Local Persistence

[../src/lib/devLocalState.ts](../src/lib/devLocalState.ts) persists:

- skin source
- camera position
- player position
- player coins
- room state
- PC minigame progress
- owned pets

Important current facts:

- persisted sandbox schema is `version: 6`
- old `version: 5` saves are normalized forward
- outdated layout versions reset to the current fallback starter room
- `isValidPlacementSurface` in `devLocalState.ts` currently accepts `floor`, `wall_back`, `wall_left`, and `surface`, but not `wall_front` or `wall_right`; persisted placements on those walls are therefore at risk until that validator is fixed

[../src/lib/devWorldSettings.ts](../src/lib/devWorldSettings.ts) separately persists:

- world clock controls
- lighting/dev panel settings
- build mode, inventory visibility, grid snap, and preview studio UI state

### Mob Lab State

[../src/lib/mobLabState.ts](../src/lib/mobLabState.ts) persists:

- active mob id
- selected part per mob id
- imported-mob preset library

Important current facts:

- Mob Lab persistence is separate from the room sandbox save
- Mob Lab save schema is `version: 2`
- several older cat baseline preset ids are intentionally migrated away during load

## Tests And Verification

Current automated coverage exists for:

- room placement math
- room lighting math
- room spawn logic
- wall helper behavior
- canvas sizing logic
- editor state synchronization
- economy
- collisions
- furniture interactions
- furniture registry completeness
- room state helpers
- surface decor
- wall-opening segmentation
- world lighting
- Mob Lab persistence and helpers
- pets and pet pathing
- physics helpers

Most relevant files live in [../tests](../tests).

Standard verification commands are:

- `cmd /c npm test`
- `cmd /c npm run build`

## Known Codebase Risks

- [../src/lib/devLocalState.ts](../src/lib/devLocalState.ts) has a real persistence-validation gap for `wall_front` and `wall_right`.
- [../src/App.tsx](../src/App.tsx) and [../src/components/FurniturePreviewStudio.tsx](../src/components/FurniturePreviewStudio.tsx) still act as large orchestrators even after recent extractions.
- Firebase-shaped env vars and rules files remain in the repo, but the active runtime inside `src/` is browser-local and does not currently import a live backend path.
- The expanded risk inventory now lives in [../.planning/codebase/CONCERNS.md](../.planning/codebase/CONCERNS.md).

## Legacy Boundary

The older Firebase/auth/pairing skeleton that used to live in this repo is no longer the active runtime path and has been removed from the current source tree cleanup.

That does not change the product direction. It means future shared-room work should be layered onto the current `roomState.ts` and registry-driven sandbox model rather than by restoring deleted legacy files as the app's main architecture.

## Things Another AI Should Not Regress

- Do not remove the distinction between `ownedFurniture` and placed `furniture`.
- Do not bypass `furnitureRegistry.ts` when adding or changing furniture behavior.
- Do not break `anchorFurnitureId` plus `surfaceLocalOffset` rules for surface decor.
- Do not regress four-wall wall decor and window support.
- Do not regress drag-across-wall editing for wall furniture.
- Do not reintroduce decorative fake windows as the main system.
- Do not replace the current room schema with a new incompatible shape casually.
- Do not mix Mob Lab persistence into the room sandbox save.
- Do not treat Mob Lab preview motion as gameplay pet AI.
- Do not remove GLB cloning or mesh filtering from the imported-mob render pipeline.

## Best Next Steps

If continuing gameplay work:

1. add progression beyond coins
2. add another repeatable earn loop
3. add level, streak, and shared goals

If continuing pet/imported-mob work:

1. keep tuning presets in Mob Lab first
2. expand live-room pet behaviors after authoring is stable
3. add more pet/gameplay loops only after the room-economy loop is solid
