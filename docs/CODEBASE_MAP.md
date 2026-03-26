# Codebase Map

This document is the fastest way to orient yourself in the current repo.

For the expanded GSD map, also read [../.planning/codebase](../.planning/codebase).

## Active Runtime Entry Points

- `src/App.tsx`: top-level sandbox orchestrator
- `src/components/RoomView.tsx`: live room composition shell
- `src/components/FurniturePreviewStudio.tsx`: furniture capture and Mob Lab host
- `src/app/hooks/useSandboxWorldClock.ts`: world-clock orchestration and persisted time controls
- `src/app/clock.ts`: clock conversion and formatting helpers
- `src/lib/roomState.ts`: active room schema and starter layout
- `src/lib/furnitureRegistry.ts`: canonical furniture catalog
- `src/lib/devLocalState.ts`: room/runtime persistence and migration
- `src/lib/devWorldSettings.ts`: world-settings persistence
- `src/lib/gameLoop.ts`: Minecraft-time tick loop used by the toolbar clock
- `src/lib/roomPlacementEquality.ts`: placement diff helpers used to suppress redundant room updates
- `src/lib/mobLab.ts`: imported-mob preset schema and defaults
- `src/lib/mobLabState.ts`: Mob Lab persistence
- `src/lib/pets.ts`: live-room pet registry
- `vite.config.js`: build-time manual chunking and Vitest environment config

## Top-Level Folder Rules

### `.planning/codebase`

This folder contains the refreshed brownfield map generated for the GSD workflow.

Use it when you need:

- stack and tooling facts
- integration boundaries
- current architecture ownership
- folder-level navigation
- coding conventions
- testing guidance
- risk and debt inventory

### `src/app`

This folder contains app-shell code extracted from `App.tsx`.

Use it when working on:

- toolbar behavior
- inventory/shop UI
- skin import flow
- world clock / dev panel settings
- app-only view helpers
- shared shell state types

Important files:

- `src/app/components/SceneToolbar.tsx`
- `src/app/components/InventoryPanel.tsx`
- `src/app/components/PerformanceMonitor.tsx`
- `src/app/hooks/useSandboxWorldClock.ts`
- `src/app/hooks/useSandboxInventory.ts`
- `src/app/hooks/useFurnitureInfoPopover.ts`
- `src/app/hooks/useSkinImport.ts`
- `src/app/types.ts`

### `src/components/room-view`

This folder contains the live-room modules extracted from `RoomView.tsx`.

Use it when working on:

- room editing state
- placement math
- builder gestures
- player interactions
- camera and Canvas config
- lighting and post-processing
- furniture render layers
- room shell visibility
- live-room pets

Important files:

- `src/components/room-view/useRoomFurnitureEditor.ts`
- `src/components/room-view/useRoomViewBuilderGestures.ts`
- `src/components/room-view/useRoomViewInteractions.ts`
- `src/components/room-view/useRoomViewCamera.ts`
- `src/components/room-view/useRoomViewLighting.ts`
- `src/components/room-view/useRoomViewSpawn.ts`
- `src/components/room-view/placementResolvers.ts`
- `src/components/room-view/helpers.ts`
- `src/components/room-view/constants.ts`
- `src/components/room-view/canvasSizing.ts`
- `src/components/room-view/RoomFurnitureLayer.tsx`
- `src/components/room-view/RoomSelectedFurnitureLayer.tsx`
- `src/components/room-view/RoomSceneLighting.tsx`
- `src/components/room-view/RoomPostProcessing.tsx`
- `src/components/room-view/RoomShell.tsx`
- `src/components/room-view/RoomPetActor.tsx`

### `src/components/mob-lab`

This folder contains imported-mob authoring UI and preview rendering.

Use it when working on:

- the Mob Lab stage
- imported-mob rendering
- CEM or GLB preview issues
- live rig editing
- collider visualization
- preview locomotion controls

Important files:

- `src/components/mob-lab/ImportedMobActor.tsx`
- `src/components/mob-lab/MobLabStage.tsx`
- `src/components/mob-lab/MobLabEditorPanel.tsx`
- `src/components/mob-lab/MobPreviewActor.tsx`
- `src/components/mob-lab/CemMobPreviewActor.tsx`
- `src/components/mob-lab/GlbMobPreviewActor.tsx`

### `src/lib`

This folder owns the gameplay/domain layer plus authoring schemas.

Use it when working on:

- room data structures
- placement rules
- collisions
- furniture interactions
- lighting math
- economy rules
- persistence
- imported-mob presets
- pets and pet pathing

Important files:

- `src/lib/roomState.ts`
- `src/lib/furnitureRegistry.ts`
- `src/lib/furnitureCollision.ts`
- `src/lib/furnitureInteractions.ts`
- `src/lib/surfaceDecor.ts`
- `src/lib/wallOpenings.ts`
- `src/lib/worldLighting.ts`
- `src/lib/devLocalState.ts`
- `src/lib/devWorldSettings.ts`
- `src/lib/roomPlacementEquality.ts`
- `src/lib/economy.ts`
- `src/lib/pcMinigame.ts`
- `src/lib/mobLab.ts`
- `src/lib/mobLabState.ts`
- `src/lib/mobTextureLayout.ts`
- `src/lib/cemTransforms.ts`
- `src/lib/pets.ts`
- `src/lib/petPathing.ts`
- `src/lib/physics.ts`

### `public`

This folder contains static assets:

- furniture preview images
- GLB models
- textures
- skins and imported mob assets

Useful subpaths:

- `public/models`
- `public/models/custom`
- `public/textures`
- `public/previews`

### `tests`

This folder contains focused unit coverage for the current sandbox and authoring systems.

The most important clusters are:

- room-view extraction coverage
- room schema and persistence helpers
- collision and interaction rules
- world lighting
- Mob Lab helpers and persistence
- pets and pathing

## Fast Navigation Heuristics

- If the change is UI-shell only, start in `src/app`.
- If the change affects time-of-day behavior or world-clock controls, inspect `src/app/hooks/useSandboxWorldClock.ts`, `src/app/clock.ts`, and `src/lib/gameLoop.ts`.
- If the change affects the live room, start in `src/components/RoomView.tsx`, then inspect `src/components/room-view`.
- If the change affects Preview Studio furniture capture, start in `src/components/FurniturePreviewStudio.tsx`.
- If the change affects imported mobs, inspect `src/components/FurniturePreviewStudio.tsx`, `src/components/mob-lab`, `src/lib/mobLab.ts`, and `src/lib/mobLabState.ts`.
- If the change affects room save behavior, inspect `src/lib/roomState.ts`, `src/lib/devLocalState.ts`, and `src/lib/devWorldSettings.ts`.
- If the change affects repeated edit commits or room-state diffing, inspect `src/lib/roomPlacementEquality.ts`.
- If the change affects wall placement, inspect `src/components/room-view/placementResolvers.ts`, `src/components/room-view/helpers.ts`, `src/components/room-view/useRoomViewBuilderGestures.ts`, and `src/lib/furnitureCollision.ts`.
- If the change affects pets, inspect `src/lib/pets.ts`, `src/lib/petPathing.ts`, and `src/components/room-view/RoomPetActor.tsx`.
- If you are adding furniture, begin with `src/lib/furnitureRegistry.ts` before touching rendering.

## Current Boundary To Respect

The active runtime is built around:

- `App.tsx`
- `RoomView.tsx`
- `FurniturePreviewStudio.tsx`
- `furnitureRegistry.ts`
- `roomState.ts`
- `devLocalState.ts`
- `devWorldSettings.ts`
- `mobLab.ts`
- `mobLabState.ts`
- `pets.ts`

The older backend/auth/pairing path is not a parallel runtime in the current repo anymore. Future shared-room work should extend the current sandbox schema instead of replacing it.

Current known concern:

- `src/lib/devLocalState.ts` still omits `wall_front` and `wall_right` from persisted placement-surface validation. See [../.planning/codebase/CONCERNS.md](../.planning/codebase/CONCERNS.md).
