# Architecture

For the refreshed brownfield ownership map and current concern list, also read [../.planning/codebase/ARCHITECTURE.md](../.planning/codebase/ARCHITECTURE.md) and [../.planning/codebase/CONCERNS.md](../.planning/codebase/CONCERNS.md).

## Runtime Ownership Map

### App Shell

[../src/App.tsx](../src/App.tsx) owns the top-level application state and UI shell:

- build-mode toggle
- inventory panel visibility
- grid-snap toggle
- skin import
- Preview Studio visibility, mode, and current selection
- coin balance
- Pet Store adoption flow
- PC minigame progress and reward handling
- persisted room state
- world clock mode and locked-time controls
- Leva dev panel wiring
- reset room / reset camera actions
- performance monitor HUD integration
- save/load bridge to local browser state

The app-shell surface extracted from `App.tsx` lives in [../src/app](../src/app):

- `components`: toolbar, inventory, performance HUD, and info controls
- `hooks`: world clock, inventory, skin import, and info-popover helpers
- `clock.ts`: minute wrapping, time formatting, and control-value conversion helpers for the world clock UI
- `types.ts`: shell types shared with the room and Preview Studio

### World Clock Runtime

- [../src/app/hooks/useSandboxWorldClock.ts](../src/app/hooks/useSandboxWorldClock.ts)
  - owns local-time, Minecraft-time, and locked-time orchestration
  - bridges toolbar controls to persisted world settings

- [../src/app/clock.ts](../src/app/clock.ts)
  - owns clock-minute normalization and display formatting helpers

- [../src/lib/gameLoop.ts](../src/lib/gameLoop.ts)
  - owns the tick-based Minecraft-time loop used by the world-clock hook

### Live Room Runtime

[../src/components/RoomView.tsx](../src/components/RoomView.tsx) now acts as a composition shell for the live scene.

It is responsible for:

- wiring the room-view hooks together
- hosting the `Canvas`
- composing the shell, player, furniture layers, pets, lights, and effects
- rendering the edit dock and interaction hint overlays
- passing authoritative callbacks back to `App.tsx`

The heavy logic has been extracted into [../src/components/room-view](../src/components/room-view).

### Preview Studio

[../src/components/FurniturePreviewStudio.tsx](../src/components/FurniturePreviewStudio.tsx) is a standalone content-creation tool inside the app.

It owns:

- studio mode switching between `furniture` and `mob_lab`
- furniture thumbnail preview staging
- Mob Lab state hydration and persistence wiring
- imported-mob preset export/import
- selected furniture and selected mob coordination

Mob Lab-specific UI and stage modules are lazy-loaded from `src/components/mob-lab` so the base runtime does not eagerly pull in the heavy imported-mob editor path.

## RoomView Module Breakdown

### Editing And Placement

- [../src/components/room-view/useRoomFurnitureEditor.ts](../src/components/room-view/useRoomFurnitureEditor.ts)
  - owns committed-vs-working furniture state
  - owns selection, hover, and placement-blocked state
  - owns confirm, cancel, store, rotate, nudge, and wall-swap actions

- [../src/components/room-view/useRoomViewBuilderGestures.ts](../src/components/room-view/useRoomViewBuilderGestures.ts)
  - owns pointer capture
  - owns drag session state
  - owns direct-drag and pivot handling
  - owns wall-to-wall drag transitions

- [../src/components/room-view/useRoomViewSpawn.ts](../src/components/room-view/useRoomViewSpawn.ts)
  - owns spawn-request handling
  - owns initial search for a collision-safe placement candidate

- [../src/components/room-view/placementResolvers.ts](../src/components/room-view/placementResolvers.ts)
  - owns pure floor/wall/surface placement math
  - owns wall drag-plane resolution
  - owns nearest-wall selection and spawn placement helpers

### Play-Mode Interaction Flow

- [../src/components/room-view/useRoomViewInteractions.ts](../src/components/room-view/useRoomViewInteractions.ts)
  - owns interaction hover and pending/active interaction state
  - owns stand requests
  - owns player-approach behavior for sit/lie/use_pc

- [../src/lib/furnitureInteractions.ts](../src/lib/furnitureInteractions.ts)
  - owns pure interaction target rules
  - owns desk chair-zone detection and bed slot logic

### Camera, Canvas, And Renderer Controls

- [../src/components/room-view/useRoomViewCamera.ts](../src/components/room-view/useRoomViewCamera.ts)
  - owns reset-camera behavior
  - owns scene-jump behavior
  - owns zoom target tracking
  - owns DPR and Canvas config calculation

- [../src/components/room-view/canvasSizing.ts](../src/components/room-view/canvasSizing.ts)
  - computes safe DPR values and renderer settings to avoid oversized draw buffers

- [../src/components/room-view/CanvasControllers.tsx](../src/components/room-view/CanvasControllers.tsx)
  - houses camera tracking, exposure syncing, and smooth zoom helpers

### Lighting And Visual Composition

- [../src/components/room-view/useRoomViewLighting.ts](../src/components/room-view/useRoomViewLighting.ts)
  - derives lighting state from world time and dev settings
  - builds post-processing config

- [../src/components/room-view/RoomSceneLighting.tsx](../src/components/room-view/RoomSceneLighting.tsx)
  - renders ambient, hemisphere, sun, moon, and practical lamp lighting

- [../src/components/room-view/RoomPostProcessing.tsx](../src/components/room-view/RoomPostProcessing.tsx)
  - hosts the effect composer stack

- [../src/components/room-view/WallOcclusionController.tsx](../src/components/room-view/WallOcclusionController.tsx)
  - toggles room-shell wall visibility based on the active camera angle

### Scene Layers

- [../src/components/room-view/RoomFurnitureLayer.tsx](../src/components/room-view/RoomFurnitureLayer.tsx)
  - renders non-selected furniture and its proxies

- [../src/components/room-view/RoomSelectedFurnitureLayer.tsx](../src/components/room-view/RoomSelectedFurnitureLayer.tsx)
  - renders the selected item, pivot controls, and placement actions

- [../src/components/room-view/RoomInteractionProxy.tsx](../src/components/room-view/RoomInteractionProxy.tsx)
  - provides invisible interaction hit targets for play mode

- [../src/components/room-view/RoomSurfaceDecorSelectionProxy.tsx](../src/components/room-view/RoomSurfaceDecorSelectionProxy.tsx)
  - provides build-mode selection affordances for surface decor

- [../src/components/room-view/RoomPetActor.tsx](../src/components/room-view/RoomPetActor.tsx)
  - renders live-room pets and simple wander behavior

## Core Data Ownership

### Furniture Registry

[../src/lib/furnitureRegistry.ts](../src/lib/furnitureRegistry.ts) is the canonical item taxonomy.

It defines:

- furniture identity, label, category, and price
- placement family
- footprint and default rotation
- model selection
- support-surface metadata
- interaction metadata
- wall-opening metadata
- preview image and short description metadata

All furniture changes should start here.

### Room State

[../src/lib/roomState.ts](../src/lib/roomState.ts) is the active room-builder schema.

It defines:

- `RoomState`
- `RoomFurniturePlacement`
- `OwnedFurnitureItem`
- room metadata and starter layout
- placement cloning and normalization helpers

Important boundary:

- `ownedFurniture` is the ownership/inventory layer
- `furniture` is only the placed-in-room layer

### Placement Equality

[../src/lib/roomPlacementEquality.ts](../src/lib/roomPlacementEquality.ts) provides epsilon-based placement comparisons.

It is used by `App.tsx`, `RoomView.tsx`, and `useRoomFurnitureEditor.ts` to suppress redundant edit reporting and avoid unnecessary state churn while furniture is being edited.

### Sandbox Persistence

[../src/lib/devLocalState.ts](../src/lib/devLocalState.ts) owns local sandbox serialization and migration.

It handles:

- persisted sandbox versioning
- room-state validation
- legacy save migration
- fallback resets when layout versions are outdated

[../src/lib/devWorldSettings.ts](../src/lib/devWorldSettings.ts) owns the separate browser document for:

- world clock settings
- lighting settings
- build mode, inventory, grid snap, and preview studio UI state
- dev-panel visibility and collapsed section state

Important boundary:

- `devLocalState.ts` is `world data`
- `devWorldSettings.ts` is `world settings`
- both are temporary local development persistence, not the final shared-room backend

### Pets

- [../src/lib/pets.ts](../src/lib/pets.ts) defines live-room pet types and owned-pet records
- [../src/lib/petPathing.ts](../src/lib/petPathing.ts) defines simple room-safe spawn and wander helpers

Pet state lives in the sandbox save, not in Mob Lab state.

### Imported Mob Schema

[../src/lib/mobLab.ts](../src/lib/mobLab.ts) owns the imported-mob preset schema.

It defines:

- `ImportedMobPreset`
- box, CEM, and GLB render mode support
- animation, locomotion, physics, and stage settings
- default checked-in preset library

[../src/lib/mobLabState.ts](../src/lib/mobLabState.ts) owns Mob Lab serialization, validation, and migration.

## Placement And Physics Subsystems

### Collision

[../src/lib/furnitureCollision.ts](../src/lib/furnitureCollision.ts) owns placement blocking.

It supports:

- rotated floor-footprint overlap
- player overlap blocking
- rug exceptions
- same-wall wall overlap
- same-host surface overlap

### Surface Decor

[../src/lib/surfaceDecor.ts](../src/lib/surfaceDecor.ts) owns surface decor placement math.

It handles:

- identifying valid hosts
- converting world positions to host-local offsets
- clamping decor within support-surface bounds
- syncing anchored decor when hosts move or rotate

### Physics Helpers

[../src/lib/physics.ts](../src/lib/physics.ts) contains shared physics math helpers used by pets and scene logic.

### Wall Openings

[../src/lib/wallOpenings.ts](../src/lib/wallOpenings.ts) converts placed windows into segmented wall geometry data for all four walls.

## Rendering And Asset Stack

### Room Assets

The room is built from:

- [../src/components/room-view/RoomShell.tsx](../src/components/room-view/RoomShell.tsx)
- [../src/components/room-view/FloorStage.tsx](../src/components/room-view/FloorStage.tsx)
- [../src/components/room-view/FurnitureVisual.tsx](../src/components/room-view/FurnitureVisual.tsx)
- [../src/components/MinecraftPlayer.tsx](../src/components/MinecraftPlayer.tsx)
- model components such as `StarterFurnitureModels.tsx`, `OfficePackModels.tsx`, and `WallWindowModel.tsx`

### Imported Mob Rendering

Imported-mob rendering is split across:

- [../src/components/mob-lab/ImportedMobActor.tsx](../src/components/mob-lab/ImportedMobActor.tsx)
- [../src/components/mob-lab/MobPreviewActor.tsx](../src/components/mob-lab/MobPreviewActor.tsx)
- [../src/components/mob-lab/CemMobPreviewActor.tsx](../src/components/mob-lab/CemMobPreviewActor.tsx)
- [../src/components/mob-lab/GlbMobPreviewActor.tsx](../src/components/mob-lab/GlbMobPreviewActor.tsx)

Current model:

- `box` mode for simple cuboid rigs
- `cem` mode for OptiFine/CEM-style trees
- `glb` mode for skeletal imported models
- GLB instances must be cloned for multi-instance safety
- mesh filtering is required for hiding variant ghost geometry

### Build-Time Chunking

[../vite.config.js](../vite.config.js) manually separates:

- `mob-lab`
- `react-vendor`
- `react-three-vendor`
- `postprocessing-vendor`
- `three-vendor`
- `leva-vendor`
- fallback `vendor`

This is now part of the architecture, not just incidental build config.

## UI And Data Flow

### Furniture Edit Flow

1. `App.tsx` creates a spawn request or passes the current room placements into `RoomView.tsx`.
2. `useRoomViewSpawn.ts` resolves an initial candidate placement.
3. `useRoomFurnitureEditor.ts` owns the working placement state.
4. `useRoomViewBuilderGestures.ts` updates the working placement during drag or pivot movement.
5. `useRoomFurnitureEditor.ts` confirms, cancels, stores, or deselects the current edit session.
6. `RoomView.tsx` reports committed placements back to `App.tsx`.
7. `App.tsx` persists the next room state through `devLocalState.ts`.

### Imported-Mob Authoring Flow

1. Open Preview Studio in `mob_lab` mode.
2. `FurniturePreviewStudio.tsx` hydrates `mobLabState.ts`.
3. Stage and editor modules render the selected preset.
4. Editing changes update browser-local Mob Lab state.
5. Export JSON or promote a finished preset into runtime code intentionally.

## Future Boundary

The repo now carries an active Firebase/auth/pairing implementation as the primary runtime path.

The shared-room runtime is bootstrapped through `src/app/hooks/useSharedRoomRuntime.ts`, which orchestrates:
- Firebase Auth for player identity
- Firestore for canonical room and memory persistence
- Realtime Database (RTDB) for ephemeral partner presence and edit locks

Future shared-room work should:
- extend the current registry-driven room model
- preserve `ownedFurniture`, pets, and sandbox progression concepts
- add backend sync around confirmed room edits rather than replacing the local schema wholesale

## Important Constraints

- Do not add furniture outside the registry.
- Do not collapse `ownedFurniture` into placed furniture.
- Do not break `anchorFurnitureId` plus `surfaceLocalOffset`.
- Do not regress four-wall wall support or wall-drag transitions.
- Do not replace the world-clock lighting pipeline with ad hoc item-specific hacks.
- Do not merge Mob Lab state into the room sandbox save.
- Do not bypass GLB cloning or mesh filtering in imported-mob rendering.
