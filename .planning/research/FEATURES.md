# Feature Research

**Domain:** Cozy shared-room game built from a brownfield solo sandbox
**Researched:** 2026-03-26
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Shared room pairing | The product fantasy is about one couple owning one room together | HIGH | Must be anchored to the current room schema, not a second gameplay path |
| Live partner presence | A shared room feels incomplete without seeing the other person in it | HIGH | Presence can be lightweight before richer interaction systems |
| Stable shared room persistence | Decor and room progress must survive refresh and reconnect | HIGH | Preserve current ownership and placement invariants |
| Earned progression | The room needs reasons to return beyond decoration alone | MEDIUM | Use the existing coin loop as foundation instead of inventing a brand-new economy |
| One repeatable ritual | The docs repeatedly frame streaks and daily quests as core retention glue | MEDIUM | A single well-defined daily loop is enough for jam scope |
| Personal memory object | The room should feel private and personal, not just mechanically decorated | MEDIUM | Photo frame or equivalent memory surface is enough for v1 |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Breakup wipes shared progress | Gives the room emotional risk that most cozy decorators do not have | HIGH | Must be clearly explained and deliberately confirmed |
| Minecraft-skin-compatible 3D room sandbox | Gives immediate personality and visual ownership | MEDIUM | Already validated in the current runtime |
| Authoring pipeline for pets and imported content | Makes future personalization extensible without blocking current gameplay | MEDIUM | Keep the authoring/runtime boundary intact |
| Intimate one-room scope | The private couple-space framing is sharper than a generic social sandbox | LOW | Scope discipline is part of the feature strategy |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Public hubs or many-room social spaces | Feels like "more multiplayer" | Dilutes the private couple fantasy and explodes backend scope | Keep one couple, one room for MVP |
| Real-time syncing of every drag and gizmo motion | Feels more "live" during editing | High conflict risk and bandwidth cost before room rules are hardened | Sync committed edit operations first |
| Big content drops before loop completion | New furniture and pets feel exciting | More content cannot replace missing pairing, streak, and reset stakes | Finish one complete shared loop first |
| Auto-promoting all Mob Lab creations into gameplay | Seems efficient | Mixes unfinished authoring data into shared runtime state | Promote curated pets explicitly |

## Feature Dependencies

```text
PAIR-01 shared room pairing
    -> ROOM-01 shared room load
        -> PRES-01 live partner presence
        -> MEMR-01 shared memory objects
        -> PETS-01 shared-room pets

ROOM-02 committed edit sync
    -> PRES-03 predictable concurrent editing

PROG-01 individual progression
    -> PROG-02 shared streak
        -> RITL-01 daily ritual
            -> STAK-02 breakup reset has meaningful cost
```

### Dependency Notes

- **Shared room pairing requires stable room load:** without one room identity, presence and memory features have nowhere reliable to live.
- **Committed edit sync must exist before edit-conflict handling:** otherwise concurrent edits produce inventory drift and lost placements.
- **Shared streak depends on individual and shared progression data:** streaks only matter when the couple loop survives between sessions.
- **Breakup reset depends on meaningful shared progression:** without earned room state, the emotional hook does not land.

## MVP Definition

### Launch With (v1)

- [ ] Shared room pairing and persistence - core product fantasy
- [ ] Live partner presence - proves this is a room for two, not a solo sandbox
- [ ] Shared progression with streak - creates emotional and behavioral continuity
- [ ] One daily ritual - gives the couple a reason to come back together
- [ ] One memory object and one pet path - proves personalization beyond furniture
- [ ] Breakup explanation and reset flow - validates the "Risk It All" hook

### Add After Validation (v1.x)

- [ ] More quest variety - add after the first ritual is sticky
- [ ] More memory objects and room themes - add after the first personal loop feels valuable
- [ ] More pet types and behaviors - add after one shared pet path is stable

### Future Consideration (v2+)

- [ ] Additional minigames - defer until the base shared loop is stable
- [ ] Broader social features - defer unless the product intentionally moves beyond one private room
- [ ] Mobile-specific clients - defer until browser retention and loop quality are proven

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Shared room pairing and load | HIGH | HIGH | P1 |
| Live partner presence | HIGH | HIGH | P1 |
| Shared progression and streak | HIGH | MEDIUM | P1 |
| Daily ritual | HIGH | MEDIUM | P1 |
| Memory object | MEDIUM | MEDIUM | P2 |
| Shared-room pet path | MEDIUM | MEDIUM | P2 |
| Breakup reset | HIGH | HIGH | P1 |

## Sources

- `README.md` - current runtime and long-term game direction
- `docs/GAME_OVERVIEW.md` - final fantasy, core loop, jam MVP, and scope boundaries
- `docs/ROADMAP.md` - next-step framing from the existing brownfield repo
- `docs/CURRENT_SYSTEMS.md` - validated features already present in the runtime

---
*Feature research for: cozy shared-room game built from a brownfield solo sandbox*
*Researched: 2026-03-26*
