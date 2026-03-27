# Risk It All: Cozy Couple Room

## What This Is

Risk It All is a browser-based cozy couple-room game built around shared intimacy, earned decoration, and emotional stakes. v1.0 shipped the shared-room MVP on a local/dev runtime; v1.1 now focuses on turning that MVP into a durable online foundation while broadening the reasons a couple returns to the room.

## Core Value

Two partners can build and maintain a room that feels shared, earned, and emotionally meaningful.

## Current Milestone: v1.1 Online Foundation

**Goal:** Move the shared-room MVP off the dev-only persistence stack onto a real couple-owned online foundation while deepening rituals, personalization, and content breadth.

**Target features:**
- Production backend/auth and real room ownership across browsers and devices
- Multiple ritual variants plus a second repeatable earn loop
- Richer memory collection, deeper pet behavior, and additional themed room content
- Oversized runtime and regression files are decomposed before deeper milestone work so active code does not keep growing past 1k-line boundaries
- Mandatory phase verification artifacts to retire the process debt carried out of v1.0

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
- [x] Each partner keeps a persistent wallet, XP, and level while the couple shares Together Days and a lightweight daily ritual loop.
- [x] The shipped room runtime now separates a player-facing shell from a developer workspace and keeps Preview Studio and Mob Lab as explicit authoring tools.
- [x] Couple can place one shared memory object, own one canonical shared cat, and trigger an explicit breakup-reset flow with confirmation.
- [x] Couple can authenticate or reclaim their room identity through Google sign-in, exclusive couple linking, and automatic paired-room re-entry across browsers or devices.
- [x] Shared-room documents, presence, progression, memories, and the shared cat now sync through hosted Firebase adapters instead of the dev-only shared-room store.
- [x] Couple now has Together Days, a retro three-app desk PC with once-per-room-day payouts, and a bed-based Cozy Rest earn loop surfaced in the player shell.

### Active

- [ ] Couple can maintain a richer memory collection, interact with a deeper shared-pet loop, and unlock additional themed content.
- [ ] Every v1.1 phase closes with explicit `VERIFICATION.md` coverage so the next milestone audit is evidence-complete.

### Out of Scope

- Open-world or many-room social spaces - the project is centered on one intimate couple room.
- Deep RPG or economy-sim systems - progression should stay lightweight and room-centric for jam scope.
- Native mobile clients - browser-first delivery keeps scope aligned with the current stack.
- Restoring the removed legacy backend or auth path wholesale - future sync must extend the current room schema instead of reviving stale architecture.

## Context

- Brownfield React, Vite, TypeScript, and React Three Fiber codebase with a working solo sandbox and a shipped local/dev shared-room MVP.
- The repo currently contains 157 `.ts` / `.tsx` files and about 25,959 TypeScript lines across `src/` and `tests/`.
- Refreshed brownfield implementation mapping in `.planning/codebase/*` remains the canonical navigation layer for architecture, structure, testing, and concerns.
- Current runtime truth lives in README plus `docs/AI_HANDOFF.md`, `docs/CURRENT_SYSTEMS.md`, `docs/ARCHITECTURE.md`, `docs/CODEBASE_MAP.md`, and `docs/GAME_OVERVIEW.md`.
- The browser/dev-file-backed sandbox path still exists for local iteration and authoring state, but couple-owned room runtime now has a hosted Firebase-backed path inside `src/`.
- Firebase Auth, Firestore, and Realtime Database are now active runtime integrations behind the shared-room store and presence seams rather than placeholder artifacts.
- v1.0 was archived with accepted audit gaps because Phases `2`, `3.1`, and `4` are missing `VERIFICATION.md`, so v1.1 planning treats verification artifacts as a delivery guardrail rather than optional docs.
- The existing room schema, furniture registry, placement math, and preview tooling are stable assets for the next milestone rather than rewrite targets.

## Current State

- v1.0 Shared Room MVP shipped on 2026-03-27 and is archived under `.planning/milestones/`.
- The live runtime now supports canonical room identity, committed shared edits, live partner presence, personal and couple progression, a room-first player shell, developer-only authoring workspace surfaces, shared memories, one canonical shared cat, and breakup-reset stakes.
- The room-builder now supports ceiling placement with a starter catalog set of overhead fixtures and decor, including preview-studio support and practical nighttime ceiling lighting.
- Camera-occluded walls and the ceiling now preserve their shadow-casting occluders, so room lighting stays stable while peeling surfaces away for interior visibility.
- Shared-room commits remain authoritative for confirmed room and progression mutations, while presence, item locks, camera/player transforms, and authoring-tool persistence remain outside canonical room revisions.
- Phase 5 now adds Google-auth couple ownership, hosted room/bootstrap adapters, pair-link presence, and automatic paired-room re-entry without breaking the brownfield local dev sandbox fallback.
- v1.1 is now scoped around ritual/activity depth, richer memories and pet behavior, additional content expansion, and one follow-on Phase 9 slot for major improvements on top of the online foundation.
- Phase 6 is now complete: Together Days, the retro desk-PC activity suite, Cozy Rest, and the matching shell surfacing are part of the active baseline.
- Phase 06.1 is now complete: `src/App.tsx`, `src/app/hooks/useSharedRoomRuntime.ts`, `src/lib/sharedProgression.ts`, and the shared-room runtime regression coverage are split into modular seams under the 1k guardrail.
- The next planned phase directory on disk is Phase 09; roadmap placeholders 7 and 8 still need planning before that broader follow-on work is reshaped.

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
| Phase 5 uses Firebase Auth + Firestore + Realtime Database behind the existing shared-room seams | Keeps auth, canonical room data, and ephemeral presence separated without reviving the removed legacy backend path | Good |
| Phase 5 hosted entry is auth-first while the dev sandbox remains an explicit fallback when Firebase is not configured | Preserves shipped player behavior without breaking the brownfield local iteration path | Good |
| Phase 4 personalization lives beside `RoomState` inside the shared-room document | Memories and the shared pet need canonical persistence without perturbing furniture ownership or placement rules | Good |
| Breakup reset rebuilds one fresh shared baseline through the normal mutation pipeline | Destructive state changes still need stale-revision replay safety and one authoritative reset contract | Good |
| Archive v1.0 despite milestone audit gaps | HEAD is stable enough to treat the missing verification artifacts as process debt rather than reopen shipped scope | Revisit |
| Continue numbering from Phase 5 and require verification artifacts in every v1.1 phase | Keeps history continuous while preventing another milestone audit evidence gap | Pending |
| Insert urgent Phase `06.1` before Phase 7 to pay down oversized-file debt | `App.tsx`, `useSharedRoomRuntime.ts`, `sharedProgression.ts`, and the shared-room runtime regression coverage were already too large for safe feature growth | Good |

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
*Last updated: 2026-03-27 after completing Phase 06.1 codebase modularization*




