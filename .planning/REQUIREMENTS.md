# Requirements: Risk It All: Cozy Couple Room

**Defined:** 2026-03-26
**Core Value:** Two partners can build and maintain a room that feels shared, earned, and emotionally meaningful.

## v1 Requirements

### Pairing

- [x] **PAIR-01**: Couple can create or join one shared room that represents their relationship.

### Shared Room

- [x] **ROOM-01**: Both partners load the same committed room layout, owned furniture state, and shared decor when entering the shared room.
- [x] **ROOM-02**: Confirmed place, store, sell, and remove actions update shared room state without duplicating or losing owned items.
- [x] **ROOM-03**: Shared room state survives refresh, reconnect, and migration from the current solo sandbox model.

### Presence

- [x] **PRES-01**: Each partner can see the other partner's avatar position and facing in the room.
- [x] **PRES-02**: Each partner can see when the other partner joins, reconnects, or leaves.
- [x] **PRES-03**: When both partners edit near the same time, the room converges on one predictable committed result.

### Progression

- [ ] **PROG-01**: Each partner has persistent individual coins and level progression.
- [ ] **PROG-02**: Couple has a shared streak that updates from repeatable room activity.
- [ ] **PROG-03**: Shared progression state is visible in the UI and survives refresh and reconnect.

### Rituals

- [ ] **RITL-01**: Couple can complete at least one daily quest or ritual that grants progression.

### Personalization

- [ ] **MEMR-01**: Couple can place and edit at least one photo frame or equivalent memory object in the shared room.
- [ ] **PETS-01**: Couple can own and display at least one live-room pet in the shared room without breaking the Mob Lab authoring workflow.

### Stakes

- [ ] **STAK-01**: The game explains the breakup consequence before the couple commits to the shared room loop.
- [ ] **STAK-02**: Breakup and reset flow wipes shared room progression only after explicit confirmation.

## v2 Requirements

### Rituals

- **RITL-02**: Couple can rotate through multiple daily ritual variants.
- **ACTV-01**: Couple can access another repeatable earn loop beyond the desk PC path.

### Personalization

- **MEMR-02**: Couple can maintain a richer memory collection beyond a single frame or object.
- **PETS-02**: Shared-room pets have deeper behavior such as needs, moods, or interactions.

### Content

- **CONT-01**: Room themes, decor sets, and cosmetic variants expand after the first shared loop is stable.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Public hubs or many-room social spaces | Conflicts with the private one-couple room fantasy and expands scope too far |
| Native mobile clients | Browser-first scope fits the current stack and jam timeline better |
| Automatic Mob Lab promotion into gameplay | Authoring and runtime boundaries should stay explicit |
| Large content expansion before loop completion | More content does not replace missing shared-room fundamentals |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PAIR-01 | Phase 1 | Complete |
| ROOM-01 | Phase 1 | Complete |
| ROOM-02 | Phase 1 | Complete |
| ROOM-03 | Phase 1 | Complete |
| PRES-01 | Phase 2 | Complete |
| PRES-02 | Phase 2 | Complete |
| PRES-03 | Phase 2 | Complete |
| PROG-01 | Phase 3 | Pending |
| PROG-02 | Phase 3 | Pending |
| PROG-03 | Phase 3 | Pending |
| RITL-01 | Phase 3 | Pending |
| MEMR-01 | Phase 4 | Pending |
| PETS-01 | Phase 4 | Pending |
| STAK-01 | Phase 4 | Pending |
| STAK-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-27 after Phase 2 completion*
