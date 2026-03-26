# Roadmap: Risk It All: Cozy Couple Room

## Overview

This roadmap turns the proven solo sandbox into a jam-ready shared couple-room MVP in four phases. The sequence preserves the existing room-builder, inventory, and authoring foundations while adding shared room identity, co-op presence, progression, memories, pets, and the breakup stakes that define the game fantasy.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): planned milestone work
- Decimal phases (2.1, 2.2): urgent insertions if needed later

- [x] **Phase 1: Shared Room Backbone** - Pair one couple to one room and make committed room state authoritative. Completed 2026-03-26.
- [ ] **Phase 2: Live Presence and Co-op Consistency** - Make the room visibly shared and keep concurrent editing predictable.
- [ ] **Phase 3: Shared Progression and Ritual Loop** - Add personal progression, shared streak, and one daily reason to return.
- [ ] **Phase 4: Memories, Pets, and Breakup Stakes** - Finish the emotional fantasy with personalization and meaningful loss.

## Phase Details

### Phase 1: Shared Room Backbone
**Goal**: Turn the current solo sandbox into a couple-linked room that can load and persist one authoritative room state without regressing existing room invariants.
**Depends on**: Nothing (brownfield foundation already exists)
**Requirements**: [PAIR-01, ROOM-01, ROOM-02, ROOM-03]
**UI hint**: yes
**Success Criteria** (what must be TRUE):
  1. Couple can pair into one shared room and both clients load the same committed room contents.
  2. Confirmed place, store, sell, and remove actions persist to shared state without inventory drift.
  3. Shared room state survives refresh, reconnect, and migration from the current solo model.
  4. Existing ownership, placement, and authoring boundaries remain intact while shared persistence is introduced.
**Plans**: 3 plans

Plans:
- [x] 01-01: Define shared room identity, pairing flow, and migration contract from solo saves
- [x] 01-02: Add authoritative shared-room persistence adapters around the current room schema
- [x] 01-03: Sync committed room-edit operations while preserving ownership-versus-placement rules

### Phase 2: Live Presence and Co-op Consistency
**Goal**: Make the shared room feel alive for two people while concurrent actions converge predictably.
**Depends on**: Phase 1
**Requirements**: [PRES-01, PRES-02, PRES-03]
**UI hint**: yes
**Success Criteria** (what must be TRUE):
  1. Each partner can see the other partner's avatar position and facing in the room.
  2. Join, leave, and reconnect state is visible and reliable.
  3. Near-simultaneous edits converge on one predictable committed room result.
  4. Presence sync does not spam full room payloads or noticeably hurt room performance.
**Plans**: 3 plans

Plans:
- [x] 02-01: Add partner presence transport and remote avatar rendering to the live room
- [x] 02-02: Implement join, leave, and reconnect UX around the shared room session
- [ ] 02-03: Define conflict-resolution and resync behavior for concurrent edits

### Phase 3: Shared Progression and Ritual Loop
**Goal**: Give the couple a persistent reason to return by layering progression, streaks, and a daily ritual onto the shared room.
**Depends on**: Phase 2
**Requirements**: [PROG-01, PROG-02, PROG-03, RITL-01]
**UI hint**: yes
**Success Criteria** (what must be TRUE):
  1. Each partner keeps coins and level progression across sessions.
  2. Couple streak and ritual progress are visible and update correctly.
  3. Activity rewards persist without desync between partners.
  4. The room has a clear return-play ritual beyond decoration alone.
**Plans**: 3 plans

Plans:
- [ ] 03-01: Define canonical player and couple progression data plus UI surfaces
- [ ] 03-02: Connect desk-PC rewards and one daily ritual to the new progression model
- [ ] 03-03: Persist streak logic, recovery behavior, and reconnect-safe progression updates

### Phase 4: Memories, Pets, and Breakup Stakes
**Goal**: Complete the product fantasy with shared memories, a curated shared-room pet path, and the high-stakes reset loop.
**Depends on**: Phase 3
**Requirements**: [MEMR-01, PETS-01, STAK-01, STAK-02]
**UI hint**: yes
**Success Criteria** (what must be TRUE):
  1. Couple can place and edit a memory object in the shared room.
  2. At least one shared-room pet persists without breaking Mob Lab authoring boundaries.
  3. Breakup consequences are clearly explained before commitment and before reset.
  4. Confirmed breakup resets shared room progression exactly as designed.
**Plans**: 3 plans

Plans:
- [ ] 04-01: Add one shared memory object or photo-frame flow to the room runtime
- [ ] 04-02: Promote one curated pet path into the shared-room runtime safely
- [ ] 04-03: Design and implement breakup warning, confirmation, and reset behavior

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Shared Room Backbone | 3/3 | Complete | 2026-03-26 |
| 2. Live Presence and Co-op Consistency | 2/3 | In Progress | - |
| 3. Shared Progression and Ritual Loop | 0/3 | Not started | - |
| 4. Memories, Pets, and Breakup Stakes | 0/3 | Not started | - |
