# Architecture

**Analysis Date:** 2026-03-26

## Pattern Overview

**Overall:** Client-side React 3D sandbox with an embedded authoring studio and a domain-heavy utility layer

**Key Characteristics:**
- Hybrid Phase 1 runtime: canonical shared-room documents for the live room plus browser-local persistence for shell settings and authoring data
- App-shell orchestration in one top-level React component: `src/App.tsx`
- Shared-room bootstrap and status orchestration extracted into `src/app/hooks/useSharedRoomRuntime.ts` plus dedicated shared-room shell components
- Live room logic split into focused modules under `src/components/room-view/`
- Authoring-only Preview Studio and Mob Lab split from gameplay and lazy-loaded from `src/components/FurniturePreviewStudio.tsx`
- Registry-driven furniture and room-state domain model under `src/lib/`, now wrapped by a replaceable `SharedRoomStore` boundary for Phase 1

## Layers

**Shell Layer:**
- Purpose: own global UI state, shared-room bootstrap, and wire gameplay surfaces together
- Contains: toolbar, Phase 11 drawer navigation (Inventory, Shop, Pet Care), debug panel, shared-room entry/status/overlay UI, preview-studio toggles, persistence hooks
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
- Key files: `src/lib/roomState.ts`, `src/lib/furnitureRegistry.ts`, `src/lib/devLocalState.ts`, `src/lib/devWorldSettings.ts`, `src/lib/sharedRoomStore.ts`, `src/lib/sharedRoomClient.ts`, `src/lib/sharedRoomSession.ts`, `src/lib/sharedRoomValidation.ts`, `src/lib/furnitureCollision.ts`, `src/lib/furnitureInteractions.ts`
- Depends on: TypeScript + Three math where needed
- Used by: both live room and authoring layers

## Data Flow

**Shared Room Runtime Flow:**
1. Browser mounts `src/main.tsx`
2. `src/App.tsx` loads safe local fallback sandbox state via `src/lib/devLocalState.ts`, world settings via `src/lib/devWorldSettings.ts`, and shared-room bootstrap state through `src/app/hooks/useSharedRoomRuntime.ts`
3. If `VITE_APP_MODE=showcase` is set, the app boots into a special showcase path that seeds the local sandbox from a snapshot and disables hosted/dev shared-room bootstrap.
4. If no shared-room session exists, the app renders `SharedRoomEntryShell`; if a session exists but canonical room state is still loading, the app renders `SharedRoomBlockingOverlay`
5. Create, join, load, and commit requests flow through `src/lib/sharedRoomClient.ts` into the Firebase/Firestore/RTDB backend.
6. Once the canonical room document arrives, `src/App.tsx` adopts the shared `RoomState` and shared coins while keeping transient drag state, camera state, player state, and authoring persistence local
7. `src/components/RoomView.tsx` continues to compose room-view hooks and scene layers, but only committed placement changes route back through the shared-room store

**Minigame Integration:**
1. Desk PC interactions trigger the minigame shell
2. QT-13 replaced the legacy PC Runner with a Pacman integration
3. Legacy `pc_runner` progression is automatically migrated to the new `pacman` schema

**Preview Studio / Mob Lab Flow:**
1. `src/App.tsx` lazy-loads `src/components/FurniturePreviewStudio.tsx`
2. Furniture preview mode renders a dedicated orthographic capture stage
3. Mob Lab mode hydrates preset state from `src/lib/mobLabState.ts`
4. Editor changes mutate the in-memory preset and debounce-save to `localStorage`

**State Management:**
- Primary state management is React local state plus hooks in `src/App.tsx`
- Live room authority is now the canonical shared-room document returned by the shared-room store
- Browser-local persistence still owns world settings, safe fallback sandbox state, Mob Lab state, and lightweight shared profile/session state
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

**Shared Room Runtime:**
- Purpose: bootstrap lightweight shared profiles/sessions, load canonical room documents, expose blocking/status states, and commit authoritative shared-room mutations
- Location: `src/app/hooks/useSharedRoomRuntime.ts`
- Pattern: app-shell runtime hook that wraps the `SharedRoomStore` boundary

**Shared Room Store Boundary:**
- Purpose: isolate create/join/load/commit operations from the live room runtime and keep the dev file store replaceable
- Location: `src/lib/sharedRoomStore.ts`, `src/lib/sharedRoomClient.ts`, `scripts/sharedRoomDevPlugin.mjs`
- Pattern: typed store interface plus dev-only Vite middleware

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
- `src/lib/devLocalState.ts`, `src/lib/devWorldSettings.ts`, `src/lib/mobLabState.ts`, `src/lib/sharedRoomSession.ts`, and the shared-room store/client path

**Lighting and World Time:**
- `src/app/clock.ts`, `src/lib/gameLoop.ts`, `src/lib/worldLighting.ts`, `src/components/room-view/useRoomViewLighting.ts`

**Build Chunking:**
- `vite.config.js` manually isolates `mob-lab` and multiple vendor groups to keep the base runtime lighter

---

*Architecture analysis: 2026-03-26*
*Update when major patterns change*
