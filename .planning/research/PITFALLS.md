# Pitfalls Research

**Domain:** Brownfield cozy shared-room game
**Researched:** 2026-03-26
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Breaking the ownership-versus-placement split

**What goes wrong:**
Shared-room sync duplicates, loses, or mutates furniture because owned inventory and placed furniture are treated as the same thing.

**Why it happens:**
Teams shortcut multiplayer by syncing whatever is visible in the scene instead of respecting the existing domain model.

**How to avoid:**
Validate all shared edit operations against `ownedFurniture`, placed `furniture`, and current room rules before persistence writes.

**Warning signs:**
Stored counts drift, selling affects the wrong copy, or reconnecting creates duplicated placements.

**Phase to address:**
Phase 1 - Shared Room Backbone

---

### Pitfall 2: Syncing transient edit gestures instead of committed actions

**What goes wrong:**
Dragging, nudging, or rotating furniture becomes jittery, conflict-prone, and hard to reconcile across both clients.

**Why it happens:**
Real-time syncing looks attractive before the room-edit contract is fully defined.

**How to avoid:**
Treat local edit gestures as client-side only until confirm; synchronize committed room operations and rehydrate the result.

**Warning signs:**
Items snap backward, concurrent edits overwrite each other unpredictably, or room FPS drops during editing.

**Phase to address:**
Phase 2 - Live Presence and Co-op Consistency

---

### Pitfall 3: Reviving obsolete backend assumptions

**What goes wrong:**
New shared-room work grows around deleted or stale auth and pairing ideas instead of the current sandbox architecture.

**Why it happens:**
Old multiplayer scaffolding feels faster to reuse than designing adapters around the present room model.

**How to avoid:**
Plan Phase 1 around the current `roomState.ts`, registry-driven inventory, and documented browser-local persistence boundaries.

**Warning signs:**
New code bypasses room helpers, duplicates old schemas, or introduces a parallel runtime path.

**Phase to address:**
Phase 1 - Shared Room Backbone

---

### Pitfall 4: Adding progression without a visible couple ritual

**What goes wrong:**
Levels and streaks exist in data but do not change player behavior because there is no clear daily reason to return together.

**Why it happens:**
Progression schemas are easier to implement than meaningful couple-facing loops.

**How to avoid:**
Tie progression UI, streak logic, and one daily ritual into visible room-facing feedback during Phase 3.

**Warning signs:**
Progression updates only in debug or menus, or players can ignore the ritual without losing meaning.

**Phase to address:**
Phase 3 - Shared Progression and Ritual Loop

---

### Pitfall 5: Hiding the breakup stakes until too late

**What goes wrong:**
The core hook lands as a surprise punishment instead of an understood emotional mechanic.

**Why it happens:**
Teams focus on reset implementation before warning language and confirmation UX.

**How to avoid:**
Explain the consequence before commitment, repeat it at reset time, and require explicit confirmation before destructive actions.

**Warning signs:**
Users cannot explain what will be lost, or the reset can fire from a vague or low-friction action.

**Phase to address:**
Phase 4 - Memories, Pets, and Breakup Stakes

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Writing backend payloads directly from UI components | Fast first integration | Hard-to-test sync logic and schema drift | Never for room state |
| Broadcasting full room snapshots for every state change | Easy first multiplayer demo | High bandwidth, conflict complexity, and poor recovery semantics | Only in throwaway prototypes |
| Treating all imported pets as gameplay-ready | Fast content volume | Runtime instability and unclear ownership of asset quality | Only after explicit curation |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Auth and pairing | Allowing room identity to float independently of couple identity | Create one stable room identity per couple relationship |
| Shared persistence | Mixing solo local-save migration and shared-room migration with no version strategy | Version shared room data and explicitly normalize from the current solo schema |
| Presence transport | Sending full room data over the presence channel | Send only movement, facing, and session-state payloads |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Streaming every drag tick | Jitter, dropped frames, noisy resync | Sync confirmed actions only | Immediately under two active editors |
| Re-serializing the full room on every lightweight update | High CPU and noisy network writes | Isolate small operation payloads from full snapshots | As room density and pet count rise |
| Loading authoring-only modules into the base runtime | Larger bundle and slower scene startup | Keep Preview Studio and Mob Lab lazy-loaded | At first meaningful growth in imported assets |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trusting client-submitted room edits without ownership validation | Inventory tampering or item duplication | Validate ownership and allowed operations server-side or in the authoritative adapter |
| Weak pairing or room-join tokens | Unauthorized room access | Use explicit room membership checks tied to the couple identity |
| Breakup reset without strong confirmation | Accidental destructive reset | Require explicit confirm language and audit the destructive path carefully |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Silent edit conflict resolution | Users think furniture vanished or duplicated randomly | Show predictable resync behavior and preserve committed results only |
| Abstract progression with weak room feedback | The room feels grindy instead of meaningful | Surface streak, rewards, and ritual completion where players already look |
| Breakup risk explained only in settings or docs | The main hook feels unfair | Explain stakes during pairing and again before reset |

## "Looks Done But Isn't" Checklist

- [ ] **Pairing:** verify reconnect and re-entry, not just first-time join.
- [ ] **Shared room sync:** verify ownership, sell, store, and placement invariants under concurrent edits.
- [ ] **Presence:** verify leave, reconnect, and stale-avatar cleanup.
- [ ] **Progression:** verify both personal and couple state survive refresh and partner absence.
- [ ] **Breakup reset:** verify the warning copy, confirmation, and actual data wipe all match.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Inventory drift after sync work | HIGH | Freeze destructive actions, run room-state reconciliation, and repair owned-versus-placed counts before resuming feature work |
| Presence transport coupled to room writes | MEDIUM | Split movement and session data into a separate channel, then simplify room persistence payloads |
| Breakup reset semantics unclear | MEDIUM | Disable the destructive path, rewrite warning UX, and re-run manual scenario validation before re-enabling |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Ownership-versus-placement split breaks | Phase 1 | Shared edits preserve counts and inventory invariants |
| Transient edit sync causes conflict | Phase 2 | Concurrent edit scenarios converge predictably |
| Obsolete backend assumptions return | Phase 1 | Shared adapters extend current room schema only |
| Progression lacks a visible ritual | Phase 3 | Daily ritual and streak changes are obvious in-room or in shell UI |
| Breakup stakes are hidden | Phase 4 | Users see the consequence before commitment and before reset |

## Sources

- `docs/AI_HANDOFF.md` - current guardrails and known regression boundaries
- `docs/ARCHITECTURE.md` - architecture constraints and data ownership
- `docs/CURRENT_SYSTEMS.md` - existing brownfield behavior that must not regress
- `docs/GAME_OVERVIEW.md` - product-level risk and retention hooks

---
*Pitfalls research for: brownfield cozy shared-room game*
*Researched: 2026-03-26*
