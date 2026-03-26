# Codebase Structure

**Analysis Date:** 2026-03-26

## Directory Layout

```text
FAHHHH/
|-- .planning/           # GSD project state, roadmap, research, and codebase mapping
|-- docs/                # Human-oriented project and architecture notes
|-- public/              # Static models, textures, and shop preview assets
|-- scripts/             # One-off asset/preset generation tooling
|-- src/                 # Application source
|   |-- app/             # Shell UI, hooks, constants, and app-level types
|   |-- components/      # Scene components, preview studio, and 3D models
|   |   |-- mob-lab/     # Mob Lab authoring UI and imported-model renderers
|   |   `-- room-view/   # Live room runtime slices and scene helpers
|   `-- lib/             # Domain logic, persistence, physics, registry, lighting, pets
|-- tests/               # Separate Vitest suite for domain and room-view logic
|-- package.json         # Dependency and script manifest
|-- vite.config.js       # Build and test config
`-- README.md            # High-level repo overview
```

## Directory Purposes

**`.planning/`**
- Purpose: GSD planning state and generated project artifacts
- Key files: `.planning/PROJECT.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/codebase/*.md`

**`docs/`**
- Purpose: repo-facing documentation for architecture, runtime state, handoff, and product direction
- Key files: `docs/AI_HANDOFF.md`, `docs/ARCHITECTURE.md`, `docs/CODEBASE_MAP.md`, `docs/CURRENT_SYSTEMS.md`

**`public/`**
- Purpose: static assets served by Vite
- Contains: GLB models, preview art, textures
- Key subdirectories: `public/models/`, `public/models/custom/`, `public/shop-previews/`, `public/textures/`

**`scripts/`**
- Purpose: manual content pipeline tooling
- Key files: `scripts/generate_minecraft_vanilla_cat_rig.mjs`, `scripts/sharedRoomDevPlugin.mjs`

**`src/app/`**
- Purpose: app-shell support code extracted from `App.tsx`
- Key files: `src/app/components/SceneToolbar.tsx`, `src/app/components/InventoryPanel.tsx`, `src/app/components/SharedRoomEntryShell.tsx`, `src/app/components/SharedRoomStatusStrip.tsx`, `src/app/hooks/useSandboxWorldClock.ts`, `src/app/hooks/useSharedRoomRuntime.ts`, `src/app/types.ts`

**`src/components/room-view/`**
- Purpose: live room runtime modules
- Key files: `useRoomFurnitureEditor.ts`, `useRoomViewBuilderGestures.ts`, `useRoomViewInteractions.ts`, `useRoomViewLighting.ts`, `placementResolvers.ts`

**`src/components/mob-lab/`**
- Purpose: Mob Lab preview stage, editor panel, and imported-renderer implementations
- Key files: `MobLabStage.tsx`, `MobLabEditorPanel.tsx`, `ImportedMobActor.tsx`, `CemMobPreviewActor.tsx`, `GlbMobPreviewActor.tsx`

**`src/lib/`**
- Purpose: gameplay/domain layer and persistence helpers
- Key files: `roomState.ts`, `furnitureRegistry.ts`, `devLocalState.ts`, `devWorldSettings.ts`, `sharedRoomStore.ts`, `sharedRoomClient.ts`, `sharedRoomSession.ts`, `sharedRoomValidation.ts`, `mobLab.ts`, `mobLabState.ts`, `pets.ts`, `petPathing.ts`

**`tests/`**
- Purpose: focused Vitest coverage for domain rules and room-view helpers
- Contains: separate test files mirroring major modules and features, including shared-room store/runtime regressions

## Key File Locations

**Entry Points:**
- `src/main.tsx` - browser mount
- `src/App.tsx` - top-level application shell
- `src/components/RoomView.tsx` - live room scene shell
- `src/components/FurniturePreviewStudio.tsx` - Preview Studio / Mob Lab shell

**Configuration:**
- `package.json` - scripts and dependencies
- `vite.config.js` - bundling, chunking, and Vitest config
- `tsconfig.json`, `tsconfig.app.json` - TypeScript configuration
- `.env.example` - placeholder Firebase-era env surface

**Core Logic:**
- `src/lib/roomState.ts` - room and ownership schema
- `src/lib/furnitureRegistry.ts` - canonical furniture taxonomy
- `src/lib/sharedRoomStore.ts` / `src/lib/sharedRoomClient.ts` - shared-room persistence boundary and browser client
- `src/lib/furnitureCollision.ts` - placement blocking rules
- `src/lib/furnitureInteractions.ts` - sit/lie/use_pc targeting
- `src/lib/worldLighting.ts` - world lighting math

**Testing:**
- `tests/*.test.ts` - Vitest suite

**Documentation:**
- `README.md` - repo overview
- `docs/` - human-facing architecture and handoff docs
- `.planning/codebase/` - refreshed codebase map for GSD workflows

## Naming Conventions

**Files:**
- `PascalCase.tsx` for React components and 3D model components
- `camelCase.ts` for hooks, domain modules, helpers, and utilities
- `*.test.ts` for tests in the separate `tests/` tree
- `kebab-case` asset filenames under `public/shop-previews/`

**Directories:**
- Lowercase feature directories such as `app/`, `components/`, `room-view/`, `mob-lab/`, `lib/`

**Special Patterns:**
- Hooks use the `use*` prefix
- Typed JSON preset files live in `src/lib/mob-presets/`

## Where to Add New Code

**Shell UI or app-level state:**
- Primary code: `src/app/` or `src/App.tsx`
- Tests: `tests/` with a matching feature name
- Shared-room entry, blocking, and status UI belong under `src/app/components/`
- Shared-room bootstrap/load/commit orchestration belongs under `src/app/hooks/`

**Live room feature or placement behavior:**
- Primary code: `src/components/room-view/` and supporting `src/lib/`
- Tests: `tests/roomView*.test.ts`, `tests/furniture*.test.ts`, or feature-specific module tests

**Imported mob or authoring feature:**
- Primary code: `src/components/mob-lab/` and `src/lib/mobLab*.ts`
- Assets/presets: `public/` and `src/lib/mob-presets/`
- Tests: `tests/mobLabState.test.ts`, `tests/mobTextureLayout.test.ts`, or related helpers

**Shared domain helpers:**
- Primary code: `src/lib/`
- Tests: `tests/<module>.test.ts`

**Dev shared backend work:**
- Primary code: `src/lib/sharedRoom*.ts` and `scripts/sharedRoomDevPlugin.mjs`
- Tests: `tests/sharedRoomStore.test.ts`, `tests/sharedRoomValidation.test.ts`, `tests/sharedRoomRuntime.test.ts`

## Special Directories

**`.planning/`**
- Purpose: generated planning and workflow artifacts
- Source: maintained manually through GSD workflows
- Committed: currently yes, because `.gitignore` does not exclude it

**`public/`**
- Purpose: runtime-served static assets
- Source: hand-authored art, imported GLB files, and generated placeholder textures
- Committed: yes

**`scripts/`**
- Purpose: manual generation helpers, not runtime code
- Source: local utility scripts
- Committed: yes

---

*Structure analysis: 2026-03-26*
*Update when directory structure changes*
