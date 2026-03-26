# Roadmap: Risk It All: Cozy Couple Room

## Milestones

- [x] **v1.0 Shared Room MVP** - Phases `1`, `2`, `3`, `3.1`, and `4` shipped on 2026-03-27. Archive: `.planning/milestones/v1.0-ROADMAP.md`
- [ ] **v1.1 Online Foundation** - Phases `5`, `6`, `7`, and `8` planned.

## Overview

This milestone moves the shared-room MVP from a local/dev-only stack toward a durable online foundation, then uses that stronger base to broaden the reasons a couple returns to the room. The sequence keeps the shipped room-builder, player shell, Preview Studio, and Mob Lab boundaries intact while adding real backend ownership, more ritual variety, richer shared memories and pet behavior, and additional themed content.

**Execution guardrail:** Every v1.1 phase must ship with `VERIFICATION.md` and explicit requirement evidence so the next milestone audit does not inherit the documentation gap accepted at v1.0 closeout.

## Phases

**Phase Numbering:**
- Integer phases continue from the previous milestone (`5`, `6`, `7`, `8`)
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
- [ ] 05-01: Define backend/auth contract, couple ownership rules, and migration from dev sessions
- [ ] 05-02: Implement hosted shared-room, presence, and progression adapters behind the existing store boundaries
- [ ] 05-03: Swap create/join/reconnect flows to the hosted backend with recovery and enforcement coverage

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
- [ ] 06-01: Define ritual rotation rules, shared reward contracts, and hosted persistence needs
- [ ] 06-02: Add a second repeatable earn loop beyond the desk PC path
- [ ] 06-03: Surface ritual selection, rotation, and activity-state UX in the player shell

### Phase 7: Memory Collection and Shared Pet Depth
**Goal**: Expand personalization so the room can hold a richer shared memory collection and a more meaningful shared-pet loop.
**Depends on**: Phase 6
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

## Progress

**Execution Order:**
Phases execute in numeric order: 5 -> 6 -> 7 -> 8

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 5. Online Backend and Couple Ownership | v1.1 | 0/3 | Not started | - |
| 6. Ritual Variety and Earn Loop Expansion | v1.1 | 0/3 | Not started | - |
| 7. Memory Collection and Shared Pet Depth | v1.1 | 0/3 | Not started | - |
| 8. Themes and Content Expansion | v1.1 | 0/3 | Not started | - |
