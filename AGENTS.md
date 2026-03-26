# AGENTS

## Mission

Work on this repo as a brownfield cozy couple-room game. The current runtime is a local solo sandbox plus authoring tools; the active roadmap turns that foundation into a jam-ready shared-room experience without regressing existing room-builder behavior.

## Read First

- `.planning/STATE.md`
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/TESTING.md`
- `.planning/codebase/CONCERNS.md`
- `docs/AI_HANDOFF.md`
- `docs/CODEBASE_MAP.md`
- `docs/ARCHITECTURE.md`

## Runtime Truth

- `src/App.tsx` owns the app shell and top-level gameplay UI.
- `src/components/RoomView.tsx` and `src/components/room-view/*` own the live room runtime.
- `src/components/FurniturePreviewStudio.tsx` and `src/components/mob-lab/*` are authoring tools, not the live shared-room path.
- `src/lib/roomState.ts` and `src/lib/furnitureRegistry.ts` are core domain boundaries.
- `src/lib/devLocalState.ts` and `src/lib/devWorldSettings.ts` are the active persistence boundary.
- `src/app/clock.ts` plus `src/lib/gameLoop.ts` own world-clock conversions and Minecraft-time ticking.

## Guardrails

- Preserve `ownedFurniture` versus placed `furniture`.
- Preserve `anchorFurnitureId` plus `surfaceLocalOffset` behavior for surface decor.
- Preserve four-wall wall support, window openings, and current placement rules.
- Extend the current room schema instead of restoring the removed legacy backend as a parallel runtime.
- Keep Preview Studio and Mob Lab persistence separate from live-room shared state.
- Prefer syncing committed room edits over transient drag or pointer state.
- Treat `.planning/codebase/*` as the refreshed brownfield map for architecture, structure, tests, and concerns.
- Do not assume persisted wall placements are fully safe until `src/lib/devLocalState.ts` accepts `wall_front` and `wall_right`.

## Verification

- Run `cmd /c npm test` when behavior changes touch room rules, schema, progression logic, or shared-state adapters.
- Run `cmd /c npm run build` before closing work that changes TypeScript or bundle boundaries.

## GSD Workflow

- Current next step: `$gsd-discuss-phase 1`
- Fast path if discussion is already clear: `$gsd-plan-phase 1`
- Update `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, and `.planning/STATE.md` whenever scope or progress changes.
- Refresh `.planning/codebase/*` when structure, ownership, or risk boundaries shift materially.
- If a phase is UI-heavy, consider `$gsd-ui-phase <phase>` before implementation.
