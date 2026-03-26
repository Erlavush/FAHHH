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
- [x] Couple can create or join one shared room via invite code and load the same canonical room document. Validated in Phase 1.
- [x] Confirmed shared-room buy, place, store, sell, and remove flows persist through the shared-room store without collapsing ownership into placement. Validated in Phase 1.
- [x] Shared-room state survives refresh and reconnect against the dev file-backed shared-room store while keeping Preview Studio and Mob Lab persistence separate. Validated in Phase 1.
- [x] Development builds auto-enter a deterministic shared room for iteration, while shipped builds keep the real create/join flow. Validated in Phase 2 Plan 02.
- [x] Each partner can see when the other partner joins, reconnects, or leaves through non-blocking presence status UX. Validated in Phase 2 Plan 02.
- [x] Same-item shared-room edits use soft locks and stale local assumptions recover by canonical reload instead of silent drift. Validated in Phase 2 Plan 03.
- [x] Each shared-room partner keeps a persistent personal wallet, XP, level, and desk-PC history inside the canonical room document. Validated in Phase 3.
- [x] The live room shell surfaces personal wallet/XP plus shared streak and ritual state without a separate dashboard. Validated in Phase 3.
- [x] The desk PC now drives a shared daily ritual that grants both partners a bonus on the second distinct same-day completion. Validated in Phase 3.

### Active

- [ ] Player-facing room UI is organized, aesthetic, and readable instead of looking like a stacked development shell.
- [ ] Developer tooling lives in a separate developer view/workspace so iteration stays fast without polluting the shipped player experience.
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

## Current State

- Phase 3 is complete. The shared-room runtime now carries canonical personal progression, desk-PC ritual history, daily streak state, and conflict-aware replay for progression-affecting mutations.
- Phase 03.1 is now an urgent inserted phase focused on UI overhaul: split developer tooling from the shipped player shell, reorganize runtime surfaces, and improve development workflow before more player-facing content lands.
- Shared-room commits remain authoritative for confirmed room and progression mutations, while live presence updates, item locks, camera/player transforms, and authoring-tool persistence stay outside canonical room revisions.
- Remaining milestone work is Phase 03.1 UI overhaul first, then shared memories, shared-room pet promotion, and breakup stakes.

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
| Insert urgent Phase 03.1 before personalization/stakes work | The current shell mixes real player UI with developer tooling, making both the shipped experience and daily iteration worse | Good |

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
*Last updated: 2026-03-27 after Phase 03.1 insertion*
