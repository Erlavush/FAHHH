# Roadmap: Risk It All: Cozy Couple Room

## Milestones

- [x] **v1.0 Shared Room MVP** - Phases `1`, `2`, `3`, `3.1`, and `4` shipped on 2026-03-27. Archive: `.planning/milestones/v1.0-ROADMAP.md`
- [ ] **v1.1 Online Foundation** - Phases `5`, `6`, `7`, `8`, `9`, `10`, and `11` on roadmap.

## Overview

This milestone moves the shared-room MVP from a local/dev-only stack toward a durable online foundation, then uses that stronger base to broaden the reasons a couple returns to the room. The sequence keeps the shipped room-builder, player shell, Preview Studio, and Mob Lab boundaries intact while adding real backend ownership, more ritual variety, richer shared memories and pet behavior, additional themed content, curated Better Cats variant imports on top of the showcase cat loop, and a player-shell commerce/care polish pass that makes inventory, shopping, and pet care feel native to the shipped HUD.

**Execution guardrail:** Every v1.1 phase must ship with `VERIFICATION.md` and explicit requirement evidence so the next milestone audit does not inherit the documentation gap accepted at v1.0 closeout.

## Phases

**Phase Numbering:**
- Integer phases continue from the previous milestone (`5`, `6`, `7`, `8`, `9`, `10`, `11`)
- Decimal phases (`5.1`, `6.1`) remain available for urgent insertions if needed

### Phase 5: Online Backend and Couple Ownership
**Goal**: Replace the dev file-backed shared-room runtime with a real backend/auth foundation that preserves the current couple-room contract across browsers and devices.
**Depends on**: v1.0 Shared Room MVP
**Requirements**: [PAIR-02, PAIR-03, ROOM-04, ROOM-05]
**UI hint**: yes
**Success Criteria** (what must be TRUE):
  1. Couple can authenticate or reclaim their shared room identity from separate browsers or devices.
  2. Hosted shared-room data replaces the dev file-backed store for room, progression, memories, pet state, and presence.
  3. Ownership and membership enforcement prevent a third user or stale session from silently hijacking a room.
  4. Shared-room reconnect and migration flows preserve the current room-builder, player shell, and authoring-tool boundaries.
**Plans**: 3 plans

Plans:
- [x] 05-01: Define backend/auth contract, couple ownership rules, and migration from dev sessions
- [x] 05-02: Implement hosted shared-room, presence, and progression adapters behind the existing store boundaries
- [x] 05-03: Swap create/join/reconnect flows to the hosted backend with recovery and enforcement coverage

### Phase 6: Ritual Variety and Earn Loop Expansion
**Goal**: Deepen the return-play loop by adding multiple ritual variants and a second repeatable earn activity beyond the desk PC.
**Depends on**: Phase 5
**Requirements**: [RITL-02, ACTV-01]
**UI hint**: yes
**Success Criteria** (what must be TRUE):
  1. Couple can encounter more than one ritual type over time instead of only the desk PC path.
  2. The room offers a second repeatable earn loop that complements rather than replaces the existing desk PC flow.
  3. Rewards, streak interactions, and reconnect behavior remain predictable on the hosted backend.
  4. The player shell explains available rituals and activities without reintroducing debug clutter.
**Plans**: 3 plans

Plans:
- [x] 06-01: Define ritual rotation rules, shared reward contracts, and hosted persistence needs
- [x] 06-02: Add a second repeatable earn loop beyond the desk PC path
- [x] 06-03: Surface ritual selection, rotation, and activity-state UX in the player shell

### Phase 06.1: Codebase modularization and oversized-file decomposition (INSERTED)
**Goal**: Reduce oversized orchestrator and runtime files before Phase 7 so the next feature phase can land on stable, modular boundaries.
**Depends on**: Phase 6
**Requirements**: [CODE-01]
**Success Criteria** (what must be TRUE):
  1. `src/App.tsx`, `src/app/hooks/useSharedRoomRuntime.ts`, `src/lib/sharedProgression.ts`, and `tests/sharedRoomRuntime.test.ts` are decomposed so no refactor-target file remains above 1000 lines.
  2. App-shell composition, shared-room bootstrap/commit flow, and shared progression rules each live behind focused modules with clear ownership.
  3. Existing room-builder, shared-room, Preview Studio, and Mob Lab behavior remains unchanged aside from internal modularization.
  4. Automated regression coverage and the TypeScript build pass after the refactor.
**Plans**: 3 plans

Plans:
- [x] 06.1-01: Split shared progression rules into focused domain modules with stable exports
- [x] 06.1-02: Decompose shared room runtime bootstrap, hosted pairing, and commit flows plus split runtime tests
- [x] 06.1-03: Break App shell orchestration into dedicated hooks and composition components without regressing player/developer views

### Phase 7: Memory Collection and Shared Pet Depth
**Goal**: Expand personalization so the room can hold a richer shared memory collection and a more meaningful shared-pet loop.
**Depends on**: Phase 06.1
**Requirements**: [MEMR-02, PETS-02]
**UI hint**: yes
**Success Criteria** (what must be TRUE):
  1. Couple can maintain more than one meaningful shared memory item or collection surface.
  2. The shared pet gains deeper behavior such as needs, moods, or interactions that matter during visits.
  3. Hosted persistence preserves richer memories and pet state without leaking Mob Lab authoring data into gameplay.
  4. New personalization systems still respect current room placement, ownership, and player/developer shell boundaries.
**Plans**: 3 plans

Plans:
- [ ] 07-01: Expand shared memory storage and room presentation beyond one frame
- [ ] 07-02: Add deeper shared-pet needs, moods, or interactions without breaking Mob Lab boundaries
- [ ] 07-03: Tie shared memories and pet state into return-play behaviors and reset-safe rules

### Phase 8: Themes and Content Expansion
**Goal**: Add enough new themed content and cosmetic breadth that the stronger online loop feels worth sustaining.
**Depends on**: Phase 7
**Requirements**: [CONT-01]
**UI hint**: yes
**Success Criteria** (what must be TRUE):
  1. Couple can unlock or acquire additional room themes, decor sets, or cosmetic variants after the first shared loop is stable.
  2. New content fits the existing furniture registry, preview flows, and room presentation without looking placeholder.
  3. Content acquisition and display feel aligned with the updated progression and ritual systems.
  4. Expanded content does not regress the existing room-builder, inventory, and authoring pipelines.
**Plans**: 3 plans

Plans:
- [ ] 08-01: Define unlockable theme/content structure on top of the current furniture registry
- [ ] 08-02: Add at least one expanded room theme or decor set with progression-aware acquisition
- [ ] 08-03: Polish catalog, preview, and in-room presentation so the new content feels shipped

### Phase 9: Showcase Cat Sanctuary
**Goal**: Turn the next playable slice into a showcase-ready cozy cat sanctuary where a single player can walk the room, care for multiple cats, earn coins, and improve the space without removing the future couple/shared-room foundation.
**Depends on**: Phase 06.1
**Requirements**: [SHOW-01, PETS-03, PETS-04, ACTV-02]
**Success Criteria** (what must be TRUE):
  1. The build is immediately readable as a cat-room showcase on a single public PC and does not require live pairing to be enjoyable.
  2. The local/sandbox runtime can adopt, keep active, and store multiple cats without breaking room persistence or the future hosted path.
  3. Cats present smarter room-life behavior with improved movement and visible `sit`, `lick`, and `sleep` outcomes.
  4. Cat care plus the existing PC loop feed a clear coin economy that lets players buy more cats or decor during a live session.
**Plans**: 3 plans

Plans:
- [x] 09-01: Expand the local cat roster, persistence, and adopt/store rules for a multi-cat showcase room
- [x] 09-02: Upgrade cat room behavior with smarter target selection and readable `sit` / `lick` / `sleep` presentation
- [x] 09-03: Wire cat-care rewards, shell contracts, and final showcase integration without regressing shared-room foundations

### Phase 10: Better Cats Variant Import
**Goal**: Expand the shipped cat-sanctuary loop with curated Better Cats visual variants that can be previewed, adopted, and persisted through the existing cat runtime without breaking the future couple/shared-room foundation.
**Depends on**: Phase 9
**Requirements**: [PETS-05]
**UI hint**: yes
**Success Criteria** (what must be TRUE):
  1. The repo contains a curated, repo-owned Better Cats variant library sourced from the downloaded pack rather than depending on the external folder at runtime.
  2. Mob Lab and the Better Cats GLB actor can preview or render multiple distinct cat coats while preserving the current ghost-mesh filtering and tail hierarchy correction.
  3. The local sandbox can adopt and persist curated Better Cats looks without multiplying gameplay species or regressing the Phase 09 cat-care loop.
  4. Hosted/shared-room foundations remain intact even if hosted multi-variant cats stay deferred.
**Plans**: 3 plans

Plans:
- [x] 10-01: Curate Better Cats pack assets and preset metadata into repo-owned variant artifacts
- [ ] 10-02: Extend Mob Lab and the Better Cats GLB runtime for variant-aware texture rendering
- [ ] 10-03: Wire curated cat variants into local adoption, persistence, and minimal store surfacing

### Phase 11: Player Shell Inventory, Shop, and Pet Care Overhaul
**Goal**: Rebuild the player-facing inventory drawer into a warm clock-themed shell that separates owned inventory, shopping, and pet care without regressing current room, pet, or authoring boundaries.
**Depends on**: Phase 10
**Requirements**: [SHELL-01]
**UI hint**: yes
**Success Criteria** (what must be TRUE):
  1. Player-facing drawer surfaces split into distinct `Inventory`, `Shop`, and `Pet Care` flows instead of mixing owned furniture, purchasing, cat adoption, and care actions in one generic panel.
  2. The visual language matches the warm framed bottom HUD and digital cat clock through shared palette, typography, framing, and button treatment rather than the older black/white drawer styling.
  3. Existing runtime boundaries remain intact: `ownedFurniture` vs placed furniture, local cat roster vs cat adoption catalog, and shared-room single-companion rules are preserved.
  4. Player shell polish does not leak Preview Studio or Mob Lab authoring affordances into the shipped path, and mobile/desktop drawer behavior stays usable.
**Plans**: 3 plans

Plans:
- [x] 11-01: Define split drawer information architecture, shell state contracts, and safe data boundaries
- [x] 11-02: Rebuild the player drawer surfaces and theme tokens to match the warm HUD and clock
- [x] 11-03: Wire the separated inventory, shop, and pet-care flow into the player shell with regression coverage

## Progress

**Execution Order:**
Showcase sequencing now continues as `5 -> 6 -> 06.1 -> 9 -> 10 -> 11`, with Phases 7 and 8 retained as later memory/content follow-ons after the curated cat-variant and shell-polish slices.

Phase 11 shipped on 2026-03-28 as a user-requested shell-polish pass while Phase 10 still retains 10-02 and 10-03 Better Cats follow-up work.

A public-demo showcase lane now also exists outside the numbered roadmap phases: `VITE_APP_MODE=showcase` boots a repo-owned sandbox snapshot and hard-disables hosted/dev shared-room bootstrap so static deployments can showcase the local cat sanctuary safely. Production bundles must read that flag through a static Vite env access so the showcase mode survives Vercel builds.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 5. Online Backend and Couple Ownership | v1.1 | 3/3 | Complete | 2026-03-27 |
| 6. Ritual Variety and Earn Loop Expansion | v1.1 | 3/3 | Complete | 2026-03-27 |
| 06.1. Codebase modularization and oversized-file decomposition | v1.1 | 3/3 | Complete | 2026-03-27 |
| 7. Memory Collection and Shared Pet Depth | v1.1 | 0/3 | Not started | - |
| 8. Themes and Content Expansion | v1.1 | 0/3 | Not started | - |
| 9. Showcase Cat Sanctuary | v1.1 | 3/3 | Complete | 2026-03-27 |
| 10. Better Cats Variant Import | v1.1 | 1/3 | In progress | - |
| 11. Player Shell Inventory, Shop, and Pet Care Overhaul | v1.1 | 3/3 | Complete | 2026-03-28 |



