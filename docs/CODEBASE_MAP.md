# Codebase Map

This document is the fastest way to orient yourself in the current runtime.

## Active Runtime Entry Points

- `src/App.tsx`: top-level sandbox orchestrator.
- `src/components/RoomView.tsx`: live scene/runtime controller.
- `src/lib/roomState.ts`: active room schema and starter layout.
- `src/lib/furnitureRegistry.ts`: canonical furniture catalog.
- `src/lib/devLocalState.ts`: local persistence and migration.

## Top-Level Folder Rules

### `src/app`

This folder contains app-shell code that used to live inside `App.tsx`.

Use it when working on:

- toolbar behavior
- inventory/shop UI
- skin import flow
- world clock / Leva world settings
- app-only view helpers

Important files:

- `src/app/components/SceneToolbar.tsx`
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

### `src/lib`

This folder still owns the gameplay/domain layer.

Use it when working on:

- room data structures
- placement rules
- collisions
- furniture interactions
- lighting math
- persistence
- economy rules
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

## Fast Navigation Heuristics

- If the change is UI-shell only, start in `src/app`.
- If the change affects 3D scene behavior, start in `src/components/RoomView.tsx` and then move into `src/components/room-view`.
- If the change affects rules, data, or persistence, start in `src/lib`.
- If you are adding furniture, begin with `src/lib/furnitureRegistry.ts` before touching rendering.
- If you are changing placement/edit behavior, check both `src/components/RoomView.tsx` and the helper modules in `src/components/room-view`.

## Current Boundary To Respect

There are still older multiplayer/couple-room files in the repo, but the active sandbox runtime is built around:

- `furnitureRegistry.ts`
- `roomState.ts`
- `devLocalState.ts`
- `App.tsx`
- `RoomView.tsx`

Do not treat the older backend/couple-room schema as the active runtime unless you are intentionally reviving that path.