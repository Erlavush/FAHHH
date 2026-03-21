# Codebase Map

This document is the fastest way to orient yourself in the current runtime.

## Active Runtime Entry Points

- `src/App.tsx`: top-level sandbox orchestrator.
- `src/components/RoomView.tsx`: live scene/runtime controller.
- `src/components/FurniturePreviewStudio.tsx`: in-app content studio host.
- `src/lib/roomState.ts`: active room schema and starter layout.
- `src/lib/furnitureRegistry.ts`: canonical furniture catalog.
- `src/lib/devLocalState.ts`: local sandbox persistence and migration.
- `src/lib/mobLab.ts`: imported-mob preset schema and defaults.
- `src/lib/mobLabState.ts`: Mob Lab persistence.

## Top-Level Folder Rules

### `src/app`

This folder contains app-shell code that used to live inside `App.tsx`.

Use it when working on:

- toolbar behavior
- inventory/shop UI
- skin import flow
- world clock / Leva world settings
- app-only view helpers
- cross-scene shell state types

Important files:

- `src/app/components/SceneToolbar.tsx`
- `src/app/components/PerformanceMonitor.tsx`
- `src/app/components/InventoryPanel.tsx`
- `src/app/hooks/useSandboxWorldClock.ts`
- `src/app/hooks/useSandboxInventory.ts`
- `src/app/hooks/useFurnitureInfoPopover.ts`
- `src/app/hooks/useSkinImport.ts`
- `src/app/constants.ts`
- `src/app/types.ts`

### `src/components/room-view`

This folder contains scene-support code extracted from `RoomView.tsx`.

Use it when working on:

- room shell geometry
- floor stage rendering
- camera/exposure helpers
- furniture visual mapping
- room-view constants and math helpers

Important files:

- `src/components/room-view/constants.ts`
- `src/components/room-view/helpers.ts`
- `src/components/room-view/RoomShell.tsx`
- `src/components/room-view/FloorStage.tsx`
- `src/components/room-view/CanvasControllers.tsx`
- `src/components/room-view/FurnitureVisual.tsx`

### `src/components/mob-lab`

This folder contains imported-mob authoring UI and preview rendering.

Use it when working on:

- the Mob Lab stage
- imported-mob rendering and live animation preview
- part selection and live rig editing
- collider visualization
- locomotion preview controls

Important files:

- `src/components/mob-lab/MobLabStage.tsx`
- `src/components/mob-lab/MobPreviewActor.tsx`
- `src/components/mob-lab/GlbMobPreviewActor.tsx`
- `src/app/components/PerformanceMonitor.tsx`
- `src/components/mob-lab/MobLabEditorPanel.tsx`

### `src/lib`

This folder owns the gameplay/domain layer plus preview-studio authoring schemas.

Use it when working on:

- room data structures
- placement rules
- collisions
- furniture interactions
- lighting math
- persistence
- economy rules
- imported-mob presets
- backend contracts

Important files:

- `src/lib/roomState.ts`
- `src/lib/furnitureRegistry.ts`
- `src/lib/furnitureCollision.ts`
- `src/lib/furnitureInteractions.ts`
- `src/lib/surfaceDecor.ts`
- `src/lib/worldLighting.ts`
- `src/lib/devLocalState.ts`
- `src/lib/roomPlacementEquality.ts`
- `src/lib/mobLab.ts`
- `src/lib/mobLabState.ts`
- `src/lib/sceneTargets.ts`

## Fast Navigation Heuristics

- If the change is UI-shell only, start in `src/app`.
- If the change affects the live room, start in `src/components/RoomView.tsx` and then move into `src/components/room-view`.
- If the change affects Preview Studio furniture captures, start in `src/components/FurniturePreviewStudio.tsx`.
- If the change affects imported mobs, start in `src/components/FurniturePreviewStudio.tsx` and then inspect `src/components/mob-lab` plus `src/lib/mobLab.ts`.
- If the change affects rules, data, or persistence, start in `src/lib`.
- If you are adding furniture, begin with `src/lib/furnitureRegistry.ts` before touching rendering.
- If you are changing placement/edit behavior, check both `src/components/RoomView.tsx` and the helper modules in `src/components/room-view`.

## Current Boundary To Respect

There are still older multiplayer/couple-room files in the repo, but the active sandbox runtime is built around:

- `App.tsx`
- `RoomView.tsx`
- `FurniturePreviewStudio.tsx`
- `furnitureRegistry.ts`
- `roomState.ts`
- `devLocalState.ts`
- `mobLab.ts`
- `mobLabState.ts`

Imported mobs are now promoted to the live room as pets (Raccoon, Cat baseline).

Do not treat the older backend/couple-room schema as the active runtime unless you are intentionally reviving that path.