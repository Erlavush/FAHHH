# Risk It All: Cozy Couple Room

## What This Is

Risk It All is a browser-based cozy couple-room game built around shared intimacy, earned decoration, and emotional stakes. v1.0 now ships the jam-ready shared-room MVP on the current local/dev runtime: two partners can pair into one room, decorate it together, progress together, personalize the space, and explicitly risk resetting that shared history.

## Core Value

Two partners can build and maintain a room that feels shared, earned, and emotionally meaningful.

## Requirements

### Validated

- [x] User can build and decorate a local solo room with floor, wall, and surface placement.
- [x] User can buy, store, place, and sell registry-driven furniture without collapsing ownership into placement.
- [x] User can earn coins through the desk PC minigame and persist sandbox progress locally.
- [x] User can preview furniture and author imported mobs and pets through Preview Studio and Mob Lab.
- [x] User can run the room with four-wall windows, world-clock lighting, and local pet prototypes.
- [x] Couple can create or join one canonical shared room and persist shared-room buy, place, store, sell, and remove flows without inventory drift.
- [x] Shared-room state survives refresh, reconnect, and migration from the solo sandbox model while preserving existing room invariants.
- [x] Live partner presence now covers avatar visibility, join/reconnect status UX, and predictable same-item edit convergence.
- [x] Each partner keeps a persistent wallet, XP, and level while the couple shares a visible streak and one daily ritual loop.
- [x] The shipped room runtime now separates a player-facing shell from a developer workspace and keeps Preview Studio and Mob Lab as explicit authoring tools.
- [x] Couple can place one shared memory object, own one canonical shared cat, and trigger an explicit breakup-reset flow with confirmation.

### Active

- [ ] Select and integrate a production backend/auth path for one-couple room ownership instead of the dev file-backed shared-room store.
- [ ] **RITL-02**: Couple can rotate through multiple daily ritual variants.
- [ ] **ACTV-01**: Couple can access another repeatable earn loop beyond the desk PC path.
- [ ] **MEMR-02**: Couple can maintain a richer memory collection beyond a single frame or object.
- [ ] **PETS-02**: Shared-room pets have deeper behavior such as needs, moods, or interactions.
- [ ] **CONT-01**: Room themes, decor sets, and cosmetic variants expand after the first shared loop is stable.
- [ ] Close the v1.0 verification/process debt carried by missing phase `VERIFICATION.md` artifacts for Phases `2`, `3.1`, and `4`.

### Out of Scope

- Open-world or multi-room social spaces - the project is centered on one intimate couple room.
- Deep RPG or economy-sim systems - progression should stay lightweight and room-centric for jam scope.
- Native mobile clients - browser-first delivery keeps scope aligned with the current stack.
- Restoring the removed legacy backend or auth path wholesale - future sync must extend the current room schema instead.

## Context

- Brownfield React, Vite, TypeScript, and React Three Fiber codebase with a working solo sandbox and a shipped local/dev shared-room MVP.
- The repo currently contains 157 `.ts` / `.tsx` files and about 25,959 TypeScript lines across `src/` and `tests/`.
- Refreshed brownfield implementation mapping in `.planning/codebase/*` remains the canonical navigation layer for architecture, structure, testing, and concerns.
- Current runtime truth lives in README plus `docs/AI_HANDOFF.md`, `docs/CURRENT_SYSTEMS.md`, `docs/ARCHITECTURE.md`, `docs/CODEBASE_MAP.md`, and `docs/GAME_OVERVIEW.md`.
- Current shared-room persistence is still the browser/dev-file-backed path around `devLocalState.ts`, `devWorldSettings.ts`, `mobLabState.ts`, and the dev shared-room store.
- Firebase-shaped env vars and rules files remain in the repo, but the active runtime inside `src/` does not currently import a live production backend path.
- The existing room schema, furniture registry, placement math, and preview tooling are stable assets for the next milestone rather than rewrite targets.

## Current State

- v1.0 Shared Room MVP shipped on 2026-03-27 and is archived under `.planning/milestones/`.
- The live runtime now supports canonical room identity, committed shared edits, live partner presence, personal and couple progression, a room-first player shell, developer-only authoring workspace surfaces, shared memories, one canonical shared cat, and breakup-reset stakes.
- Shared-room commits remain authoritative for confirmed room and progression mutations, while presence, item locks, camera/player transforms, and authoring-tool persistence remain outside canonical room revisions.
- The v1.0 milestone audit was archived with accepted gaps because Phases `2`, `3.1`, and `4` are missing `VERIFICATION.md`.
- The next step is milestone definition, not more ad hoc v1 work.

## Next Milestone Goals

- Replace the dev file-backed shared-room stack with a real backend/auth path for one-couple room ownership.
- Deepen return-play motivation with more rituals and at least one second repeatable earn loop.
- Expand personalization through richer memories, deeper pet behavior, and additional room content sets.
- Retire v1.0 process debt by making phase verification artifacts and milestone tooling consistent.

## Constraints

- **Architecture**: Extend `roomState.ts`, `furnitureRegistry.ts`, and the current sandbox data model - replacing them would throw away proven brownfield behavior.
- **Scope**: Favor the next milestone's highest-leverage slice over breadth - backend/auth, loop depth, and content follow-through matter more than feature sprawl.
- **Compatibility**: Preserve `ownedFurniture` vs `furniture`, anchor-based surface decor, four-wall support, and current placement rules - these are existing invariants.
- **Performance**: Keep the browser-first 3D runtime responsive on typical desktop and laptop hardware - new shared-state work cannot require a renderer rewrite.
- **Authoring boundary**: Keep Mob Lab and Preview Studio as explicit authoring tools - do not merge their persistence into shared-room runtime state.
- **Delivery**: Keep planning artifacts milestone-scoped and archive shipped milestone documents to `.planning/milestones/`.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Treat initialization as brownfield, not greenfield | The repo already contains working systems and detailed architecture docs | Good |
| Use the solo sandbox as validated foundation and scope the roadmap around missing jam-MVP systems | Prevents re-planning features that already exist | Good |
| Extend the current room schema for shared-room sync instead of reviving deleted legacy architecture | Repo docs explicitly warn against restoring obsolete backend paths | Good |
| Sync only committed room edits first, then layer live presence and shared progression | Matches current edit flow and reduces conflict complexity | Good |
| Keep Mob Lab as the pet and imported-model authoring path while shared-room pet behavior stays runtime-specific | Preserves the existing separation between tooling and gameplay state | Good |
| Treat `.planning/codebase/*` as the canonical brownfield map during GSD execution | The repo is moving into GSD flow and needs one implementation navigation source | Good |
| Document inactive backend placeholders separately from active runtime architecture | Prevents planning against stale Firebase-shaped artifacts | Good |
| Phase 1 pairing uses invite codes plus lightweight local profiles, not full auth | Fits jam scope while still supporting reconnect and exclusive one-couple rooms | Good |
| Phase 1 shared persistence stays behind a replaceable `SharedRoomStore` and dev file-backed Vite backend | Preserves a clean boundary for the real backend later | Good |
| Phase 1 conflict handling is last-save-wins after canonical reload, with committed edits only | Keeps shared edits predictable without pretending live drag sync already exists | Good |
| Phase 2 development builds auto-enter `dev-shared-room` instead of showing pairing chrome first | Keeps iteration fast without splitting the shipped pairing/runtime path | Good |
| Phase 2 partner status UX comes from presence freshness instead of room commits | Waiting/reconnect states must stay reliable even when canonical room state does not change | Good |
| Phase 2 same-item conflicts use TTL soft locks plus canonical reload recovery | Reduces collisions without inventing fake client-side merge semantics | Good |
| Insert urgent Phase `03.1` before personalization/stakes work | The mixed player/debug shell was hurting both shipped UX and daily iteration | Good |
| Phase 4 personalization lives beside `RoomState` inside the shared-room document | Memories and the shared pet need canonical persistence without perturbing furniture ownership or placement rules | Good |
| Breakup reset rebuilds one fresh shared baseline through the normal mutation pipeline | Destructive state changes still need stale-revision replay safety and one authoritative reset contract | Good |
| Archive v1.0 despite milestone audit gaps | HEAD is stable enough to treat the missing verification artifacts as process debt rather than reopen shipped scope | Revisit |

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
3. Audit Out of Scope and active next-milestone goals
4. Archive milestone artifacts and refresh current-state context

---
*Last updated: 2026-03-27 after v1.0 milestone completion*
