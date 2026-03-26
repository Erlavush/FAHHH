# Phase 1: Shared Room Backbone - Research

**Researched:** 2026-03-26
**Status:** Ready for planning

## Objective

Determine how to implement Phase 1 in the current brownfield codebase without regressing the existing room builder, inventory split, surface decor anchoring, four-wall support, or authoring-tool boundaries.

Phase 1 must satisfy:
- `PAIR-01`
- `ROOM-01`
- `ROOM-02`
- `ROOM-03`

## Brownfield Facts That Shape The Plan

- The active app is still a browser-only React/Vite client with no live backend path in `src/`.
- `src/lib/roomState.ts` already provides the canonical room schema and the critical split between `ownedFurniture` and placed `furniture`.
- `src/App.tsx` already distinguishes committed furniture changes from transient editor state.
- `src/lib/devLocalState.ts` is versioned, but it is browser-local and currently rejects persisted `wall_front` and `wall_right` placements during validation.
- Preview Studio, Mob Lab, world settings, and room data are already separate concerns and should remain separate.

## Key Findings

### 1. A Browser Client Cannot Be The File-Backed Database

The user wants a temporary file-backed local store during development. The current stack cannot do that directly from browser code:

- The app is a Vite browser client.
- Browser runtime can read/write `localStorage`, but not arbitrary local files.
- A real file-backed development store therefore needs a small Node-side adapter.

**Planning implication:**
Phase 1 should introduce a backend abstraction for shared-room operations, then provide a development-only local implementation behind it.

**Recommended shape:**
- Frontend talks to a `sharedRoomStore` interface.
- Development implementation is a local HTTP bridge backed by a JSON file or small file set on disk.
- Future real backend swaps the implementation, not the room model.

### 2. The Existing `RoomState` Should Stay The Canonical Shared-Room Payload

The current room model already captures the hard-won brownfield invariants:

- `ownedFurniture` vs placed `furniture`
- `anchorFurnitureId`
- `surfaceLocalOffset`
- four-wall wall placement and window behavior

Replacing that model in Phase 1 would create unnecessary regression risk.

**Planning implication:**
Wrap `RoomState`; do not replace it.

A shared-room document can add outer metadata such as:
- room id
- participant ids
- invite/join metadata
- revision/version number
- timestamps
- optional dev seed metadata

But the actual room contents should remain a `RoomState` payload.

### 3. Couple-Owned Inventory Can Reuse The Current Ownership Model

The user chose couple-owned inventory and explicitly wants to keep `ownedFurniture`.

That means the plan should:
- preserve `OwnedFurnitureItem`
- preserve `ownedFurnitureId` references on placements
- reinterpret the ownership layer as room/couple inventory

**Planning implication:**
Avoid a large rename/refactor in Phase 1. Preserve the schema shape, then adapt semantics and surrounding metadata.

### 4. Pairing Needs Minimal Persistent Identity Plus Invite Flow

The user locked these decisions:
- invite code / invite link pairing
- lightweight persistent profile
- one active partner and one shared room
- paired room becomes the main runtime path

**Planning implication:**
Phase 1 needs minimal player identity and pairing records, but not full auth.

The minimum viable data model is:
- persistent local player profile
- invite record or join token
- paired shared-room record with exactly two member slots

This should be designed so later auth can replace profile creation without rewriting room semantics.

### 5. Committed-Edit Sync Is The Right First Transport Boundary

The current app already has a useful separation:
- working/editor state remains local while dragging
- committed room state flows through `onCommittedFurnitureChange`

The user also explicitly chose:
- sync committed edits only
- last save wins for near-simultaneous commits
- canonical reload on reconnect

**Planning implication:**
Phase 1 should treat room mutations as committed operations or committed snapshots at confirmation time, not live drag telemetry.

That keeps Phase 1 out of Phase 2's presence/conflict complexity.

### 6. Silent Reset Behavior Is Dangerous For Shared Rooms

`src/lib/devLocalState.ts` currently falls back or resets on invalid persisted state, and its validator rejects `wall_front` and `wall_right`.

That behavior is tolerable for a solo sandbox but dangerous for shared-room authority because it can silently drop valid room data.

**Planning implication:**
Phase 1 should either:
- fix the shared validation path directly, or
- bypass the legacy validator for shared-room persistence and replace it with a complete room validator

Either way, regression coverage is mandatory before shared persistence ships.

### 7. Default Room Seeding Should Be Isolated From Runtime Persistence

The user clarified:
- current room is a development/testing room only
- final starter/default room will be curated later
- temporary dev file-store data is disposable

**Planning implication:**
Separate these concerns:
- a room seed source
- canonical shared-room persistence
- player-local settings/cache

Do not bake the current dev room directly into the long-term shared-room flow.

## Recommended Technical Direction

### Recommended Architecture

Use a layered shared-room boundary:

1. `shared-room domain types`
   - wrappers around `RoomState`
   - pair/invite/profile types
   - revision metadata

2. `shared-room store interface`
   - create profile
   - create invite / join invite
   - load shared room
   - commit shared room mutation

3. `development local-file implementation`
   - Node-side file persistence
   - development-only adapter
   - canonical room reload after commit

4. `frontend integration`
   - pair/join shell UI
   - main runtime switches from solo-local persistence to shared-room loading
   - committed room operations write through the shared-room adapter

### Recommended Persistence Strategy For Phase 1

Prefer a single authoritative room document with a revision number over ad hoc partial local merges.

For Phase 1, the simplest safe rule is:
- client loads latest canonical room on entry/reconnect
- client submits committed mutation against the latest known revision
- store writes new canonical room state and increments revision
- if two commits race, later accepted write becomes canonical
- both clients reload canonical state

This aligns with the user's last-save-wins decision while keeping the implementation predictable.

### Recommended Dev-Only Store Shape

Recommended minimum records:

- `profiles`
  - `playerId`
  - display name
  - created/updated timestamps

- `invites`
  - invite code
  - room id
  - creator player id
  - expiry / consumed state

- `rooms`
  - room id
  - member ids
  - `RoomState`
  - revision
  - seed metadata
  - updated timestamp

The exact on-disk representation can stay simple:
- one JSON database file, or
- one directory with per-room files plus shared profile/invite indexes

The important planning rule is not file layout; it is the adapter boundary.

## Planning Risks

### High Risk

- Reusing `devLocalState.ts` shared-room validation as-is and silently losing `wall_front` / `wall_right` placements
- Letting shared-room work absorb world settings, Preview Studio state, or Mob Lab persistence
- Reworking `RoomState` too aggressively instead of wrapping it
- Mixing live drag state into Phase 1 sync

### Medium Risk

- Letting pairing/auth concerns expand into full account product scope
- Tying the temp file-store implementation too tightly to the final backend shape
- Failing to separate room seed data from canonical live room data

### Low Risk

- Minimal pair/join UI itself; the architectural boundary is riskier than the frontend surface

## Test And Verification Implications

Phase 1 planning should include automated coverage for:

- shared room schema round-trips
- preservation of `ownedFurniture` versus placed `furniture`
- preservation of `anchorFurnitureId` and `surfaceLocalOffset`
- acceptance of all four wall surfaces in any shared-room validation path
- invite/join and profile persistence helpers
- last-save-wins canonical reload behavior at the adapter/domain level

Existing tests around room state, placement resolution, and editor commit behavior should be reused rather than bypassed.

## Recommended Plan Breakdown

The roadmap's three-plan split is still correct.

### Plan 01-01

Define the new shared-room domain and pair/join contract:
- lightweight profile
- invite flow
- room wrapper types around `RoomState`
- dev seed strategy

### Plan 01-02

Build the authoritative persistence adapter:
- shared-room store interface
- development local-file implementation
- room load/create/join/commit APIs
- complete validation path for shared-room documents

### Plan 01-03

Integrate committed room editing into the shared-room path:
- pair/join UI and runtime handoff
- canonical room load/reload
- committed place/store/sell/remove sync
- inventory semantics preserved as couple-owned room inventory

## Recommended Planning Guardrails

- Fix or replace the incomplete wall-surface validation before trusting shared persistence.
- Keep shared-room state separate from Preview Studio, Mob Lab, and world settings.
- Preserve `RoomState` and inventory split; add wrappers around it.
- Keep live presence out of Phase 1.
- Keep progression/account sophistication out of Phase 1.
- Make the development file store replaceable by a future real backend.

## Research Outcome

Phase 1 is plan-ready.

The key implementation choice is to add a replaceable shared-room adapter around the current room schema, not to retrofit shared behavior directly into the existing local-only persistence module.
