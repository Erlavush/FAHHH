# Risk It All: Cozy Couple Room

## What This Is

Risk It All is a browser-based cozy couple-room game built around shared intimacy, earned decoration, and emotional stakes. The current repo already ships a local solo 3D sandbox plus authoring tools; the active milestone is to turn that foundation into a jam-ready shared room where two partners can pair, progress together, personalize the room, and risk losing that shared progress on breakup.

## Core Value

Two partners can build and maintain a room that feels shared, earned, and emotionally meaningful.

## Requirements

### Validated

- [x] User can build and decorate a local solo room with floor, wall, and surface placement.
- [x] User can buy, store, place, and sell registry-driven furniture without collapsing ownership into placement.
- [x] User can earn coins through the desk PC minigame and persist sandbox progress locally.
- [x] User can preview furniture and author imported mobs and pets through Preview Studio and Mob Lab.
- [x] User can run the room with four-wall windows, world-clock lighting, and local pet prototypes.

### Active

- [ ] Couple can pair into one shared room and load the same committed room state.
- [ ] Both partners can see each other live in the room while shared state stays consistent.
- [ ] Individual progression and shared couple streak exist on top of the current sandbox model.
- [ ] At least one daily ritual drives repeated return play together.
- [ ] Shared memories such as editable photo frames make the room personal.
- [ ] Shared-room pet presence and breakup-reset stakes work without regressing the current sandbox foundation.

### Out of Scope

- Open-world or multi-room social spaces - the project is centered on one intimate couple room.
- Deep RPG or economy-sim systems - progression should stay lightweight and room-centric for jam scope.
- Native mobile clients - browser-first delivery keeps scope aligned with the current stack.
- Restoring the removed legacy backend or auth path wholesale - future sync must extend the current room schema instead.

## Context

- Brownfield React, Vite, TypeScript, and React Three Fiber codebase with a working local sandbox and extensive repo docs.
- Refreshed brownfield implementation mapping now lives in `.planning/codebase/*` and should be treated as the canonical navigation layer for architecture, structure, testing, and concerns.
- Current runtime truth lives in README and docs/AI_HANDOFF.md, docs/CURRENT_SYSTEMS.md, docs/ARCHITECTURE.md, docs/CODEBASE_MAP.md, and docs/GAME_OVERVIEW.md.
- Current save boundary is browser-local via `devLocalState.ts`, `devWorldSettings.ts`, and `mobLabState.ts`.
- Firebase-shaped env vars and rules files remain in the repo, but the active runtime inside `src/` does not currently import a live backend path.
- The existing room schema, furniture registry, placement math, and preview tooling are stable assets that future phases should reuse rather than rewrite.
- The missing product slice is not "make a room builder"; it is "turn this room builder into a shared couple experience."

## Constraints

- **Architecture**: Extend `roomState.ts`, `furnitureRegistry.ts`, and the current sandbox data model - replacing them would throw away proven brownfield behavior.
- **Scope**: Favor a jam-MVP slice over broad feature expansion - shared room, progression, memory, and breakup stakes matter more than extra content breadth.
- **Compatibility**: Preserve `ownedFurniture` vs `furniture`, anchor-based surface decor, four-wall support, and current placement rules - these are existing invariants.
- **Performance**: Keep the browser-first 3D runtime responsive on typical desktop and laptop hardware - new shared-state work cannot require a renderer rewrite.
- **Authoring boundary**: Keep Mob Lab and Preview Studio as explicit authoring tools - do not merge their persistence into shared room runtime state.
- **Delivery**: Plan around the current repo and docs as source of truth - the helper CLI is sandbox-blocked in this environment, so initialization artifacts must remain human-readable and directly editable.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Treat initialization as brownfield, not greenfield | The repo already contains working systems and detailed architecture docs | Good |
| Use the solo sandbox as validated foundation and scope the roadmap around missing jam-MVP systems | Prevents re-planning features that already exist | Good |
| Extend the current room schema for shared-room sync instead of reviving deleted legacy architecture | Repo docs explicitly warn against restoring obsolete backend paths | Pending |
| Sync only committed room edits first, then layer live presence and shared progression | Matches current edit flow and reduces conflict complexity | Pending |
| Keep Mob Lab as the pet and imported-model authoring path while shared-room pet behavior stays runtime-specific | Preserves the existing separation between tooling and gameplay state | Good |
| Treat `.planning/codebase/*` as the canonical brownfield map during GSD execution | The repo is moving into GSD flow and needs one implementation navigation source | Good |
| Document inactive backend placeholders separately from active runtime architecture | Prevents planning against stale Firebase-shaped artifacts | Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-26 after codebase mapping refresh*
