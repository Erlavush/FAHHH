# Phase 1: Shared Room Backbone - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Pair one couple into one authoritative shared room and make confirmed room state load and persist reliably without regressing current room-schema, inventory, placement, or authoring invariants. This phase establishes pairing, shared-room identity, temporary development persistence, and committed-edit sync only; live presence, progression, rituals, memories, pets expansion, and breakup logic remain out of scope.

</domain>

<decisions>
## Implementation Decisions

### Pairing and Room Entry
- **D-01:** Pairing uses an invite code or invite link flow.
- **D-02:** Each player gets a lightweight persistent profile for Phase 1 rather than full auth-first accounts.
- **D-03:** Pairing is exclusive: one active partner and one shared room at a time.
- **D-04:** Once paired, the shared room becomes the main runtime path.

### Shared Room Seeding and Development Persistence
- **D-05:** There is no user-facing solo sandbox in the product; pairing is the start of the actual game loop.
- **D-06:** During development, shared-room state uses a file-backed local-only store as the temporary backend.
- **D-07:** The temporary local file store is disposable when the real backend arrives; no migration is required.
- **D-08:** A curated starter-room file will be designed later as the canonical default room seed. Until then, the current room can act as a development/testing seed only.

### Shared Inventory and Edit Rights
- **D-09:** Shared-room furniture inventory is couple-owned rather than attributed to one partner.
- **D-10:** Both partners can commit place, store, sell, and remove edits in Phase 1.
- **D-11:** Keep the existing `ownedFurniture` concept, but reinterpret it as shared room inventory instead of solo-player inventory.
- **D-12:** Economy and coin attribution can stay simple and temporary in Phase 1; richer progression decisions belong to later phases.
- **D-13:** Default room items are seeded but fully editable by the couple.

### Authority and Reconnect Behavior
- **D-14:** The shared store is authoritative on open and reconnect; clients always reload the latest canonical shared-room state.
- **D-15:** Only committed room edits sync to shared storage; drag, hover, and other in-progress editor state stays local.
- **D-16:** If two committed edits race, last save wins and both clients reload the canonical room state.

### the agent's Discretion
- Exact temp file-store format, path, and serialization layout for the development-only backend.
- Exact lightweight profile fields beyond stable identity plus basic display metadata.
- Whether pairing presents both a short code and a deep link, as long as invite-based joining remains the flow.
- How the client communicates reload/resync status after authoritative saves or reconnects.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product Scope and Phase Contract
- `.planning/PROJECT.md` - Brownfield product definition, active shared-room goals, and non-negotiable guardrails.
- `.planning/REQUIREMENTS.md` - Phase 1 requirement contract for `PAIR-01`, `ROOM-01`, `ROOM-02`, and `ROOM-03`.
- `.planning/ROADMAP.md` - Phase 1 goal, success criteria, and plan breakdown.
- `.planning/STATE.md` - Current project state plus blockers that affect this phase.

### Brownfield Architecture and Risks
- `.planning/codebase/ARCHITECTURE.md` - Active runtime ownership and current persistence/data-flow boundaries.
- `.planning/codebase/STRUCTURE.md` - Source-tree ownership and where shared-room changes should land.
- `.planning/codebase/CONCERNS.md` - Known persistence and backend risks, especially the missing shared backend and wall-surface validation gap.
- `.planning/codebase/INTEGRATIONS.md` - Confirms there is no active remote backend or auth provider in the current runtime.

### Runtime Truth and Guardrails
- `docs/AI_HANDOFF.md` - Current runtime truth, room-schema guardrails, and explicit warning not to restore the removed legacy backend path.
- `docs/CURRENT_SYSTEMS.md` - Current solo runtime behavior and persistence boundaries that Phase 1 must preserve or intentionally replace.
- `docs/ARCHITECTURE.md` - Active architecture and the requirement to extend the current registry-driven room model.
- `docs/ROADMAP.md` - Repo-level recommended shared-room build order, especially "define the new shared-room/backend shape directly from the current `roomState.ts` model" and "sync only confirmed room edits first".

### Core Code Boundaries
- `src/lib/roomState.ts` - Canonical room schema, `ownedFurniture` split, starter room model, and ownership normalization helpers.
- `src/lib/devLocalState.ts` - Current browser-local persistence, versioning, validation behavior, and the `wall_front` / `wall_right` validator gap.
- `src/App.tsx` - App-shell orchestration for room state, committed furniture updates, and current save boundaries.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/roomState.ts`: Already defines the room metadata, placed furniture, and inventory split that shared-room work should extend rather than replace.
- `src/lib/devLocalState.ts`: Provides a versioned persistence shape, validation flow, and fallback/reset behavior that can inform a temporary file-backed shared adapter.
- `src/App.tsx`: Already owns authoritative app-shell room state and distinguishes committed room updates from transient scene state.
- `src/lib/roomPlacementEquality.ts`: Existing diff suppression can help avoid redundant shared commits.
- `src/components/RoomView.tsx` plus `src/components/room-view/*`: The editor already surfaces committed furniture changes separately from local working edits.

### Established Patterns
- The codebase preserves `ownedFurniture` separately from placed `furniture`; Phase 1 should preserve that split.
- Surface decor depends on `anchorFurnitureId` and `surfaceLocalOffset`; shared persistence must round-trip both exactly.
- World data and world settings are split today; shared-room persistence should not accidentally absorb unrelated UI/world-setting state.
- The active runtime has no backend or auth provider; any Phase 1 shared-room path must be layered onto the current local-first schema.
- Current persistence validation in `src/lib/devLocalState.ts` does not accept `wall_front` or `wall_right`; Phase 1 planning should account for fixing or bypassing this gap before shared-state adoption.

### Integration Points
- `src/App.tsx` load/save boundary is the natural insertion point for swapping local sandbox persistence to a shared-room adapter.
- `src/lib/roomState.ts` is the schema boundary for room documents, room seeds, and inventory ownership semantics.
- `src/app/hooks/useSandboxInventory.ts` and inventory UI will need to read the shared inventory interpretation without collapsing placement ownership rules.
- Tests around room state, collisions, placement resolvers, surface decor, and wall openings provide the core regression net for shared-room schema work.

</code_context>

<specifics>
## Specific Ideas

- The current room in the repo is for development/testing only and should not be treated as the final player-facing default room.
- A dedicated file-based local store should capture the room state during development and act as a temporary database for shared-room work.
- A final curated starter/default room will be designed later and should become the canonical seed once available.

</specifics>

<deferred>
## Deferred Ideas

- Replace the temporary file-backed development store with a real shared backend in a later phase.
- Design and art-pass the final curated starter room file after the shared-room backbone is working.
- Richer economy ownership, player attribution, progression, and conflict handling belong to later phases.

</deferred>

---

*Phase: 01-shared-room-backbone*
*Context gathered: 2026-03-26*
