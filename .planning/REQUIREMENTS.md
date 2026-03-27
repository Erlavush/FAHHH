# Requirements: Risk It All: Cozy Couple Room

**Defined:** 2026-03-27
**Core Value:** Two partners can build and maintain a room that feels shared, earned, and emotionally meaningful.

## v1 Requirements

### Pairing and Ownership

- [x] **PAIR-02**: Couple can authenticate or reclaim their shared room identity across browsers and devices using the selected backend/auth flow.
- [x] **PAIR-03**: Room membership and ownership enforcement prevent third users or stale clients from silently claiming or corrupting a couple's room.

### Shared Room

- [x] **ROOM-04**: Shared-room documents, presence, progression, memories, and pet state sync through the hosted backend instead of the dev file-backed store.
- [x] **ROOM-05**: Both partners can leave and re-enter their room from different browsers or devices without losing room identity or committed shared state.

### Rituals

- [ ] **RITL-02**: Couple can rotate through multiple daily ritual variants instead of only the desk PC flow.

### Activities

- [ ] **ACTV-01**: Couple can access another repeatable earn loop beyond the desk PC path.

### Personalization

- [ ] **MEMR-02**: Couple can maintain a richer memory collection beyond a single frame or object.
- [ ] **PETS-02**: Shared-room pet has deeper behavior such as needs, moods, or interactions that matter during room visits.

### Content

- [ ] **CONT-01**: Room themes, decor sets, and cosmetic variants expand after the first shared loop is stable.

## v2 Requirements

### Room Architecture

- **ROOM-06**: Couple can place decor on ceiling and rooftop surfaces.
- **SURF-01**: Couple can customize global room materials and colors.

### Content

- **CONT-02**: Couple can access a broader library of imported furniture, decor, and pet variants without hand-curating each milestone.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Public hubs or many-room social spaces | Conflicts with the private one-couple room fantasy and expands scope too far |
| Native mobile clients | Browser-first scope still fits the current stack and timeline better |
| Automatic Mob Lab promotion into gameplay | Authoring and runtime boundaries should stay explicit |
| Restoring the removed legacy backend/auth path wholesale | The new backend must extend the current room schema rather than revive stale architecture |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PAIR-02 | Phase 5 | Complete |
| PAIR-03 | Phase 5 | Complete |
| ROOM-04 | Phase 5 | Complete |
| ROOM-05 | Phase 5 | Complete |
| RITL-02 | Phase 6 | Pending |
| ACTV-01 | Phase 6 | Pending |
| MEMR-02 | Phase 7 | Pending |
| PETS-02 | Phase 7 | Pending |
| CONT-01 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-27 after completing Phase 5*
