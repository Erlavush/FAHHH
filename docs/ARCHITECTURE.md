# Architecture

## Runtime Ownership Map

### App Shell

[App.tsx](/Z:/FAHHHH/src/App.tsx) owns the top-level application state and UI shell:

- build-mode toggle
- inventory panel visibility
- grid-snap toggle
- skin import
- preview studio visibility and selection
- coin balance
- persisted room state
- local vs accelerated world clock selection
- locked time controls
- Leva dev panel wiring
- reset room / reset camera actions
- save/load bridge to local storage

`App.tsx` is the orchestrator. It does not simulate the 3D world itself, but it owns the authoritative app-side state that is passed into the scene.

### Scene Runtime

[RoomView.tsx](/Z:/FAHHHH/src/components/RoomView.tsx) owns the live game scene:

- Three.js / React Three Fiber scene graph
- live furniture draft state
- committed furniture state
- selection and hover state
- gizmo and direct-drag editing
- play-mode interactions
- player approach / active interaction state
- camera target reporting
- world clock to lighting-state conversion
- room shell, walls, and windows
- wrapper-level sky backdrop + fog tint
- single cinematic post-processing stack
- smooth wheel zoom controller

### Preview Studio

[FurniturePreviewStudio.tsx](/Z:/FAHHHH/src/components/FurniturePreviewStudio.tsx) is a standalone content-creation tool inside the app:

- isolated furniture preview stage
- orthographic isometric capture camera
- green / black / white backdrops
- drag-to-orbit inspection
- fixed save-name guidance for shop thumbnails

This file is not gameplay-critical, but it is now part of the asset/content pipeline.

## Core Data Ownership

### Furniture Registry

[furnitureRegistry.ts](/Z:/FAHHHH/src/lib/furnitureRegistry.ts) is the canonical item taxonomy.

It defines:

- furniture type and label
- price
- shop preview image and scale
- short description
- model key
- placement family
- footprint
- default rotation
- interaction metadata
- support-surface metadata
- wall-opening metadata
- sunlight metadata for windows

All new furniture should enter the project through this registry first.

### Room State

[roomState.ts](/Z:/FAHHHH/src/lib/roomState.ts) is the active room-builder schema.

It defines:

- `RoomState`
- `RoomMetadata`
- `RoomFurniturePlacement`
- `OwnedFurnitureItem`
- starter/default room layout
- cloning helpers
- placement creation helpers
- ownership normalization helpers

Key current design decision:

- `ownedFurniture` is the ownership/inventory layer
- `furniture` is only the placed-in-room layer

That separation is central to the current builder and economy design.

### Persistence

[devLocalState.ts](/Z:/FAHHHH/src/lib/devLocalState.ts) owns local sandbox serialization and migration.

It handles:

- persisted sandbox versioning
- runtime validation
- legacy save migration
- room-layout fallback reset when the code version is newer than the save

### Economy

[economy.ts](/Z:/FAHHHH/src/lib/economy.ts) is intentionally small right now.

It currently defines:

- starting coin balance
- sell-price behavior

The economy layer is present, but the earn-loop layer is not yet implemented.

## Placement and Editing Subsystems

### Collision

[furnitureCollision.ts](/Z:/FAHHHH/src/lib/furnitureCollision.ts) owns placement blocking.

It currently supports:

- rotated floor footprint overlap
- player overlap blocking
- rug exceptions
- wall overlap on the same wall
- surface decor overlap on the same host

### Surface Decor

[surfaceDecor.ts](/Z:/FAHHHH/src/lib/surfaceDecor.ts) owns tabletop/surface placement math.

It handles:

- identifying valid hosts
- converting world positions to host-local offsets
- clamping decor within support-surface bounds
- snapping decor to sub-block offsets
- syncing anchored decor when hosts move or rotate

### Interactions

[furnitureInteractions.ts](/Z:/FAHHHH/src/lib/furnitureInteractions.ts) resolves interaction targets.

It currently supports:

- `sit`
- `lie`
- `use_pc`

It also contains:

- chair-zone detection for desks
- multi-slot support for the bed
- per-furniture pose offsets

### Wall Openings

[wallOpenings.ts](/Z:/FAHHHH/src/lib/wallOpenings.ts) is a pure geometry helper for segmented walls.

It converts placed window metadata into:

- lower wall band
- opening band
- upper wall band
- remaining middle wall segments
- remaining rail segments

This lets `RoomView` open the back and left walls around placed windows without hardcoding each opening in the shell.

## Rendering and Visual Stack

### Room Shell and Assets

[RoomView.tsx](/Z:/FAHHHH/src/components/RoomView.tsx) composes the visual world from:

- procedural floor and room shell
- wall segmentation
- registry-driven furniture models
- imported GLB/pack wrappers
- window models
- avatar model

Key asset files:

- [StarterFurnitureModels.tsx](/Z:/FAHHHH/src/components/StarterFurnitureModels.tsx)
- [OfficePackModels.tsx](/Z:/FAHHHH/src/components/OfficePackModels.tsx)
- [WallWindowModel.tsx](/Z:/FAHHHH/src/components/WallWindowModel.tsx)
- [MinecraftPlayer.tsx](/Z:/FAHHHH/src/components/MinecraftPlayer.tsx)

### Time-of-Day Lighting

The scene no longer uses a simple mode enum like `day` or `night`.

Instead:

- `App.tsx` computes the active `worldTimeMinutes`
- `RoomView.tsx` converts that into `lightingState`
- `lightingState` drives:
  - sun position
  - moon position
  - directional-light intensities
  - wrapper-level backdrop gradient
  - fog tint
  - hemisphere colors
  - exposure
  - AO
  - bloom
  - vignette
  - window day/night rendering cues

This is the active world-lighting architecture and should be extended, not bypassed.

### Post-Processing

The current post stack in [RoomView.tsx](/Z:/FAHHHH/src/components/RoomView.tsx) uses:

- N8AO
- Bloom
- Vignette
- Hue/Saturation
- Brightness/Contrast

Tone mapping is ACES Filmic.

Important current note:

- this is the only active render path right now
- the visible blue sky background lives on the room wrapper behind a transparent canvas so post-processing cannot wash it out to white

## UI and Flow Architecture

The gameplay/editor flow is:

1. Buy or select an owned item in `App.tsx`.
2. Create a spawn request tied to an owned furniture id.
3. Hand the request to `RoomView.tsx`.
4. `RoomView.tsx` creates a draft placement and lets the player edit it.
5. Snapshot updates are sent back during editing.
6. Confirmed placements are committed back to `roomState`.

Important separation:

- `liveFurniturePlacements` tracks in-progress scene state
- `roomState.furniture` is the committed persisted layout

This split is what keeps builder editing reversible and stable.

## Legacy / Future Boundary

There is a second older/future-oriented data shape in the repo:

- [types.ts](/Z:/FAHHHH/src/lib/types.ts)
- [starterRoom.ts](/Z:/FAHHHH/src/lib/room/starterRoom.ts)
- [firebase.ts](/Z:/FAHHHH/src/firebase.ts)
- auth/pairing UI components

These are useful groundwork for the eventual shared-room game, but they are not the active schema for the current sandbox runtime.

Do not restore multiplayer by forcing the current sandbox back into those older shapes. The safer path is the opposite:

- keep the current registry/room-state/builder model
- map future shared-room persistence and syncing onto it

## Important Constraints

- Do not add furniture outside the registry.
- Do not collapse `ownedFurniture` into placed furniture.
- Do not break `anchorFurnitureId` + `surfaceLocalOffset` rules for surface decor.
- Do not reintroduce hardcoded shell-only windows as the main system.
- Do not replace the current world-clock lighting with ad hoc per-item lighting hacks.
- Do not reintroduce floating cube wall lights as the default room-lighting solution.
- Do not treat the legacy backend types as the active room-builder model.
