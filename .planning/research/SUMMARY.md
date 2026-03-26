# Project Research Summary

**Project:** Risk It All: Cozy Couple Room
**Domain:** Brownfield browser-based shared-room game
**Researched:** 2026-03-26
**Confidence:** MEDIUM

## Executive Summary

This repo is not an empty game prototype. It is a brownfield solo sandbox and authoring toolkit that already validates the hardest local-room fundamentals: 3D room editing, inventory ownership, local persistence, lighting, Preview Studio, Mob Lab, and a first coin-earning loop. The correct project direction is to preserve that foundation and add the missing shared-room systems around it rather than restarting architecture from scratch.

The research points to one clear roadmap shape: establish a single authoritative shared room first, add live presence second, layer progression and a daily ritual third, then finish the fantasy with memories, pets, and breakup stakes. The main risk is not lack of rendering or content capability; it is accidentally breaking current room invariants while introducing shared-state behavior.

## Key Findings

### Recommended Stack

The current React, Vite, TypeScript, React Three Fiber, and Three.js stack is already appropriate for the product. The next architectural move is not a stack migration; it is adding shared-state adapters and progression modules around the existing room domain. Preview Studio and Mob Lab should remain authoring-only boundaries, and any shared-room backend should extend the present schema instead of reviving obsolete legacy paths.

**Core technologies:**
- React - shell and UI orchestration around the room and progression systems
- React Three Fiber and Three.js - live room rendering, interaction layers, and authoring stages
- TypeScript - protects room and progression schema evolution during the multiplayer transition

### Expected Features

The must-have slice is tightly scoped: paired shared room, partner presence, persistent progression and streak, one daily ritual, one memory object, one shared-room pet path, and breakup warning plus reset. The differentiator is the emotional "Risk It All" consequence, not breadth of content.

**Must have (table stakes):**
- Shared room pairing and persistence - users expect the room to truly be shared
- Live partner presence - otherwise the experience still feels solo
- Progression and ritual loop - otherwise the room lacks return-play motivation

**Should have (competitive):**
- Breakup reset with explicit warning - defines the product fantasy
- Memory object and pet path - makes the room feel personal, not purely mechanical

**Defer (v2+):**
- Broader social spaces
- More content breadth before the first complete shared loop is stable

### Architecture Approach

The architecture should keep the current room domain model authoritative and add adapters for shared persistence, presence, and progression. Room edits and presence should not be treated as the same transport problem. Authoring tools remain separate from live gameplay persistence.

**Major components:**
1. Shared-room adapter - pairing, room identity, committed room sync, migration
2. Presence transport - lightweight avatar movement and session state
3. Progression layer - individual progress, shared streak, and ritual rewards
4. Personalization and stakes layer - memories, pets, and breakup reset

### Critical Pitfalls

1. **Breaking owned-versus-placed furniture semantics** - validate shared edits against the current room model.
2. **Syncing transient gestures instead of committed actions** - keep dragging local and sync confirmed results.
3. **Reviving obsolete backend assumptions** - extend the current room schema instead of rebuilding around deleted paths.
4. **Adding progression without a visible ritual** - tie streak and reward systems to a clear couple-facing loop.
5. **Hiding breakup stakes until too late** - explain the risk before commitment and before reset.

## Implications for Roadmap

### Phase 1: Shared Room Backbone
**Rationale:** Every later feature needs one authoritative room identity and stable committed room persistence.
**Delivers:** Pairing, shared room load, committed edit sync, reconnect-safe shared state.
**Addresses:** Shared room table stakes.
**Avoids:** Inventory drift and schema split regressions.

### Phase 2: Live Presence and Co-op Consistency
**Rationale:** Once one room exists, presence can prove the room is truly for two without overloading room persistence.
**Delivers:** Remote avatar visibility, join/leave state, predictable concurrent edit behavior.
**Uses:** Lightweight presence transport separate from room documents.
**Implements:** Dedicated co-op consistency boundary.

### Phase 3: Shared Progression and Ritual Loop
**Rationale:** The room needs a reason to matter over time before the breakup stakes can land.
**Delivers:** Individual progression, shared streak, and one daily ritual.

### Phase 4: Memories, Pets, and Breakup Stakes
**Rationale:** Personalization and destructive stakes only matter after the couple loop is real.
**Delivers:** Memory object, shared-room pet path, breakup warning, and reset.

### Phase Ordering Rationale

- Shared room identity is the hard dependency for presence, memories, pets, and reset semantics.
- Presence is easier to stabilize when committed room sync already exists.
- Progression should be layered onto stable shared state before adding emotional reset stakes.
- Memories and pets are higher value once the room already feels shared and persistent.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** backend or service selection for shared persistence, auth, and room identity
- **Phase 2:** convergence rules for concurrent edits and reconnect behavior
- **Phase 4:** breakup UX, destructive confirmation semantics, and shared pet-state boundaries

Phases with standard patterns:
- **Phase 3:** progression schema and daily ritual design can largely follow established game-loop patterns once room identity exists

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Current package versions and runtime architecture are explicit in repo files |
| Features | MEDIUM | Product direction is clear, but exact MVP details still need planning-level decisions |
| Architecture | MEDIUM | Brownfield boundaries are well documented, but backend choice remains open |
| Pitfalls | MEDIUM | Risks are strongly implied by existing constraints and likely shared-state failure modes |

**Overall confidence:** MEDIUM

### Gaps to Address

- Backend and auth strategy for one-couple, one-room ownership is still open.
- Concurrent edit conflict rules need explicit planning and tests.
- Migration path from purely local saves to shared room identity needs a deliberate user-facing story.

## Sources

### Primary (HIGH confidence)
- `README.md` - runtime status and final game direction
- `docs/AI_HANDOFF.md` - current system truth and regression guardrails
- `docs/ARCHITECTURE.md` - code ownership and module boundaries
- `docs/CODEBASE_MAP.md` - brownfield navigation and boundary map
- `docs/GAME_OVERVIEW.md` - game fantasy, pillars, MVP, and scope boundaries

### Secondary (MEDIUM confidence)
- `docs/ROADMAP.md` - current next-step recommendations from the repo
- `docs/CURRENT_SYSTEMS.md` - detailed inventory of implemented runtime behavior

---
*Research completed: 2026-03-26*
*Ready for roadmap: yes*
