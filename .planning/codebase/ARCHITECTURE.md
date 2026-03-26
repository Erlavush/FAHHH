# Architecture

**Analysis Date:** 2026-03-26

## Pattern Overview

**Overall:** Client-side React 3D sandbox with an embedded authoring studio and a domain-heavy utility layer

**Key Characteristics:**
- Single-browser runtime with `localStorage` persistence
- App-shell orchestration in one top-level React component: `src/App.tsx`
- Live room logic split into focused modules under `src/components/room-view/`
- Authoring-only Preview Studio and Mob Lab split from gameplay and lazy-loaded from `src/components/FurniturePreviewStudio.tsx`
- Registry-driven furniture and room-state domain model under `src/lib/`

## Layers

**Shell Layer:**
- Purpose: own global UI state and wire gameplay surfaces together
- Contains: toolbar, inventory, debug panel, preview-studio toggles, persistence hooks
- Key files: `src/App.tsx`, `src/app/components/*`, `src/app/hooks/*`, `src/app/types.ts`
- Depends on: domain layer and live room / preview surfaces
- Used by: browser entry point `src/main.tsx`

**Live Room Layer:**
- Purpose: render and control the active 3D sandbox room
- Contains: `RoomView`, room shell, furniture layers, interactions, lighting, spawn logic, builder gestures
- Key files: `src/components/RoomView.tsx`, `src/components/room-view/*`
- Depends on: domain utilities in `src/lib/*`
- Used by: `src/App.tsx`

**Authoring Layer:**
- Purpose: preview furniture captures and tune imported mob presets outside live gameplay
- Contains: Preview Studio shell and Mob Lab stage/editor/renderers
- Key files: `src/components/FurniturePreviewStudio.tsx`, `src/components/mob-lab/*`
- Depends on: `src/lib/mobLab.ts`, `src/lib/mobLabState.ts`, static assets under `public/`
- Used by: `src/App.tsx`

**Domain Layer:**
- Purpose: define room schema, furniture registry, persistence, interactions, collisions, economy, pets, and lighting math
- Contains: mostly pure utilities and schema helpers
- Key files: `src/lib/roomState.ts`, `src/lib/furnitureRegistry.ts`, `src/lib/devLocalState.ts`, `src/lib/devWorldSettings.ts`, `src/lib/furnitureCollision.ts`, `src/lib/furnitureInteractions.ts`
- Depends on: TypeScript + Three math where needed
- Used by: both live room and authoring layers

## Data Flow

**Sandbox Runtime Flow:**
1. Browser mounts `src/main.tsx`
2. `src/App.tsx` loads sandbox state via `src/lib/devLocalState.ts` and world settings via `src/lib/devWorldSettings.ts`
3. App-level React state drives toolbar, inventory, PC minigame, preview studio, pets, and room props
4. `src/components/RoomView.tsx` composes room-view hooks and scene layers
5. Room callbacks return committed placements and player/camera changes to `App.tsx`
6. `App.tsx` persists the next browser-local state back through the persistence helpers

**Preview Studio / Mob Lab Flow:**
1. `src/App.tsx` lazy-loads `src/components/FurniturePreviewStudio.tsx`
2. Furniture preview mode renders a dedicated orthographic capture stage
3. Mob Lab mode hydrates preset state from `src/lib/mobLabState.ts`
4. Editor changes mutate the in-memory preset and debounce-save to `localStorage`

**State Management:**
- Primary state management is React local state plus hooks in `src/App.tsx`
- Persistent state is browser-local, not networked
- Equality helpers in `src/lib/roomPlacementEquality.ts` reduce unnecessary updates for placements and vectors

## Key Abstractions

**Furniture Registry:**
- Purpose: canonical definition of furniture types, prices, surfaces, previews, interaction metadata, wall openings, and support surfaces
- Location: `src/lib/furnitureRegistry.ts`
- Pattern: typed record registry with helper functions

**Room State:**
- Purpose: canonical room metadata, placed furniture, and owned inventory split
- Location: `src/lib/roomState.ts`
- Pattern: typed schema + cloning/normalization helpers

**Room View Hooks:**
- Purpose: isolate editing, gestures, camera, lighting, interactions, and spawn behavior
- Examples: `useRoomFurnitureEditor.ts`, `useRoomViewBuilderGestures.ts`, `useRoomViewCamera.ts`, `useRoomViewLighting.ts`, `useRoomViewSpawn.ts`
- Pattern: hook-per-concern orchestration

**Imported Mob Presets:**
- Purpose: define authorable imported mobs for Preview Studio and future pet promotion
- Location: `src/lib/mobLab.ts`, `src/lib/mob-presets/*.json`
- Pattern: JSON-backed preset library with clone and validation helpers

## Entry Points

**Browser Entry:**
- Location: `src/main.tsx`
- Triggers: page load
- Responsibilities: mount the React application

**App Entry:**
- Location: `src/App.tsx`
- Triggers: React mount
- Responsibilities: load persistence, own global state, wire room and preview surfaces

**Scene Entry:**
- Location: `src/components/RoomView.tsx`
- Triggers: lazy-loaded by `App.tsx`
- Responsibilities: compose the live room scene and builder/play-mode interactions

**Authoring Entry:**
- Location: `src/components/FurniturePreviewStudio.tsx`
- Triggers: preview studio open state in `App.tsx`
- Responsibilities: host Furniture Studio and Mob Lab

**Asset Utility Entry:**
- Location: `scripts/generate_minecraft_vanilla_cat_rig.mjs`
- Triggers: manual script execution
- Responsibilities: generate CEM-derived cat rig preset data and placeholder texture assets

## Error Handling

**Strategy:** validate, sanitize, and fall back rather than throw through the UI

**Patterns:**
- Persistence modules guard on `window.localStorage` availability and swallow storage failures
- Loaders validate parsed JSON shapes before accepting persisted state
- UI handlers prefer early returns for invalid state or missing prerequisites
- No app-wide React error boundary is present in the current runtime

## Cross-Cutting Concerns

**Persistence:**
- `src/lib/devLocalState.ts`, `src/lib/devWorldSettings.ts`, and `src/lib/mobLabState.ts`

**Lighting and World Time:**
- `src/app/clock.ts`, `src/lib/gameLoop.ts`, `src/lib/worldLighting.ts`, `src/components/room-view/useRoomViewLighting.ts`

**Build Chunking:**
- `vite.config.js` manually isolates `mob-lab` and multiple vendor groups to keep the base runtime lighter

---

*Architecture analysis: 2026-03-26*
*Update when major patterns change*

