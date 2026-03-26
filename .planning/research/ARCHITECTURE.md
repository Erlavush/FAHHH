# Architecture Research

**Domain:** Brownfield browser-based shared-room game
**Researched:** 2026-03-26
**Confidence:** MEDIUM

## Standard Architecture

### System Overview

```text
+---------------------------------------------------------------+
| Client Runtime                                                |
|  - App shell (toolbar, inventory, progression UI)             |
|  - Live room scene (RoomView + room-view modules)             |
|  - Preview Studio / Mob Lab (authoring-only boundary)         |
+---------------------------+-----------------------------------+
                            |
                            v
+---------------------------------------------------------------+
| Shared Gameplay Boundary                                      |
|  - Pairing and room identity                                  |
|  - Shared room persistence adapter                            |
|  - Presence transport                                         |
|  - Progression and streak state                               |
+---------------------------+-----------------------------------+
                            |
                            v
+---------------------------------------------------------------+
| Brownfield Domain Core                                        |
|  - roomState.ts and furnitureRegistry.ts                      |
|  - economy, interactions, pets, wall and surface rules        |
|  - local persistence adapters and schema migration helpers    |
+---------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| App shell | Owns non-scene UI, mode toggles, inventory, and progression surfaces | Extend `src/App.tsx` and `src/app/*` instead of creating a second shell |
| Live room runtime | Owns room rendering, edit interactions, player movement, and pet actors | Keep `RoomView.tsx` as composition shell with focused modules in `src/components/room-view` |
| Shared room adapter | Converts current room domain objects into shared persistence and sync operations | Add adapters around existing room schema rather than embedding backend logic inside view code |
| Presence channel | Sends lightweight partner movement and session status | Keep separate from committed room edit operations |
| Progression layer | Tracks personal coins and levels plus couple streak and ritual progress | Add domain modules beside current economy and persistence helpers |
| Preview Studio / Mob Lab | Continues to own imported-model tuning and asset prep | Keep lazy-loaded and out of the live shared-state path |

## Recommended Project Structure

```text
src/
|-- app/                 # Shell UI and high-level orchestration
|-- components/
|   |-- room-view/       # Live room scene modules
|   `-- mob-lab/         # Authoring-only imported-model tools
|-- lib/
|   |-- shared/          # New shared-room adapters and sync rules
|   |-- progression/     # New progression, streak, and ritual rules
|   `-- existing domain  # roomState, registry, economy, pets, persistence
`-- tests/               # Unit coverage for adapters, schemas, and sync rules
```

### Structure Rationale

- **`src/lib/shared/`**: keeps room sync and pairing logic out of UI shells and away from renderer-specific code.
- **`src/lib/progression/`**: prevents streak and ritual logic from leaking into unrelated room-edit modules.
- **Existing `room-view` and `mob-lab` folders**: preserve the current brownfield split between gameplay runtime and authoring tools.

## Architectural Patterns

### Pattern 1: Authoritative domain model with adapters

**What:** Keep `roomState.ts`, registry data, and interaction rules as the source of truth, then add adapter layers for local or shared persistence.
**When to use:** Any time new backend or multiplayer behavior touches room data.
**Trade-offs:** Slightly more plumbing, but far less risk of schema drift and UI-specific hacks.

### Pattern 2: Commit-based room sync

**What:** Synchronize confirmed room actions such as place, store, sell, rotate, and delete instead of streaming every transient drag frame.
**When to use:** Shared editing and room-state persistence.
**Trade-offs:** Less "live while dragging" feel, but dramatically simpler conflict handling and better consistency.

### Pattern 3: Separate runtime and authoring boundaries

**What:** Treat Preview Studio and Mob Lab as tooling that can feed curated outputs into gameplay, not as live shared-state systems.
**When to use:** Imported pets, thumbnails, and future asset workflows.
**Trade-offs:** Requires explicit promotion steps, but avoids unstable authoring state leaking into player-facing sessions.

## Data Flow

### Key Data Flows

1. **Committed room edit flow:** User edits locally in `RoomView` -> confirmed action is emitted -> shared adapter validates ownership and room rules -> persistence updates -> both clients rehydrate the same committed room state.
2. **Presence flow:** Client publishes lightweight position and facing updates -> partner subscribes and renders remote avatar -> join and leave state updates independently of room document writes.
3. **Progression flow:** Room activity or ritual completes -> progression module computes rewards and streak changes -> persistence writes personal and couple progression -> shell UI reflects updated state.

## Build Order Implications

1. Pairing and authoritative shared-room persistence come first because presence, memories, pets, and breakup logic all depend on one stable room identity.
2. Presence comes second because it can remain lightweight while room edit rules harden.
3. Progression and ritual systems come after room identity exists so they can reference the same couple and room state.
4. Memories, pets, and breakup stakes come last because they rely on stable shared-room and progression semantics.

## Anti-Patterns

### Anti-Pattern 1: Replacing the room schema wholesale

**What people do:** Build a second room model for multiplayer and slowly drift away from the validated solo sandbox.
**Why it's wrong:** Duplicates logic, breaks migrations, and makes bugs hard to reason about.
**Do this instead:** Extend the current schema and keep persistence concerns in adapters.

### Anti-Pattern 2: Mixing authoring state into live gameplay persistence

**What people do:** Persist Mob Lab or Preview Studio editing state as if it were production room data.
**Why it's wrong:** Leaks unstable or half-authored content into player sessions.
**Do this instead:** Keep explicit promotion boundaries between tooling and runtime.

### Anti-Pattern 3: Treating presence and room edits as one transport problem

**What people do:** Broadcast full room state on every motion tick.
**Why it's wrong:** Creates conflict, bandwidth, and performance problems immediately.
**Do this instead:** Separate lightweight presence from committed room operations.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Auth and pairing provider | Couple identity plus room membership | Must map cleanly onto one couple, one room semantics |
| Shared persistence backend | Authoritative room and progression documents | Should version room data and preserve brownfield migration rules |
| Presence transport | Ephemeral movement and session status channel | Keep payloads small and independent from room document writes |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `src/app` <-> `src/lib/shared` | Typed actions and selectors | UI should not own sync semantics directly |
| `src/components/room-view` <-> `src/lib/roomState.ts` | Existing room domain contracts | Preserve current invariants and helper usage |
| `src/components/mob-lab` <-> live room runtime | Explicit promotion only | Do not couple authoring saves to shared gameplay persistence |

## Sources

- `docs/ARCHITECTURE.md` - current runtime ownership map and boundaries
- `docs/CODEBASE_MAP.md` - folder structure and navigation rules
- `docs/AI_HANDOFF.md` - active runtime constraints and warnings
- `docs/GAME_OVERVIEW.md` - product-level implications for phase ordering

---
*Architecture research for: brownfield browser-based shared-room game*
*Researched: 2026-03-26*
