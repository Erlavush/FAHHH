# Phase 09: Showcase Cat Sanctuary - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning
**Source:** User-requested March 28 showcase pivot plus current runtime audit

<domain>
## Phase Boundary

Phase 09 is an urgent showcase-focused vertical slice built on top of the current Phase 06.1 baseline.
It re-centers the playable loop around caring for a growing family of cats inside the cozy room, but it must preserve the future Firebase/couple-owned direction and the current room-builder runtime.

Success boundary:
- The March 28, 2026 showcase build is readable in under 30 seconds on a single public PC and does not require live pairing or hosted setup to be enjoyable.
- The local/sandbox runtime can host multiple cats in one room, move cats between active room and stored roster, and persist that roster safely between sessions.
- Cats feel observably alive through better room-safe movement plus readable `sit`, `lick`, and `sleep` behaviors.
- The existing PC loop and coin economy remain useful and now feed cat adoption, cat care, and room-improvement motivation.
- Current room-builder invariants, furniture/inventory boundaries, authoring-tool separation, and hosted/couple foundations remain intact.

</domain>

<decisions>
## Implementation Decisions

### Locked Decisions
- **D-01:** Do not remove Firebase, hosted shared-room support, or the future couple-taking-care-of-cats direction. This phase is a showcase focus, not an architectural rollback.
- **D-02:** Tomorrow's showcase build on **2026-03-28** is optimized for a single-player pass-and-play PC setup. The local/sandbox path must stand on its own if hosted/shared-room setup is unavailable or undesirable during the event.
- **D-03:** The player-facing fantasy for this phase is a cozy cat-room simulator or cat sanctuary inside the existing room-builder.
- **D-04:** The core showcase loop is: walk the room, care for cats, earn coins, adopt or store more cats, decorate the room, and make the room become visibly more alive over time.
- **D-05:** Multiple cats in one room are mandatory. Active in-room cats and stored roster cats need distinct state; storing a cat must not delete ownership.
- **D-06:** Readable cat life is mandatory. Improved room-safe movement plus `sit`, `lick`, and `sleep` behavior or animation outcomes are must-have deliverables for this phase.
- **D-07:** The existing PC minigame and coin loop should remain in the showcase build and feed the cat-adoption loop instead of being removed.
- **D-08:** Preserve `ownedFurniture` versus placed `furniture`, `anchorFurnitureId` plus `surfaceLocalOffset`, four-wall support, current placement rules, and the Preview Studio / Mob Lab persistence boundary.
- **D-09:** UI polish is parallel-owned by another agent. This phase should expose stable gameplay data, callbacks, and shell labels, and should touch UI files only when the gameplay loop cannot function otherwise. Never revert or fight unrelated UI edits found in the worktree.
- **D-10:** The hosted shared-room schema may remain on one canonical shared cat for now if needed. The phase priority is a strong showcase path without deleting or breaking future couple multi-cat work.

### the agent's Discretion
- Exact cat names, prices, care timers, and reward numbers as long as the loop stays readable and generous enough for showcase play.
- Whether cat variants are separate catalog entries, optional fields, or deferred, as long as the room can visibly support multiple cats.
- The exact pathing upgrade, as long as it feels smarter and room-safe in the 10-hour timebox; a believable heuristic upgrade is acceptable if it outperforms the current wander-only behavior.
- The minimal UI wiring needed to expose adopt, store, and care actions while respecting parallel UI work.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope and guardrails
- `AGENTS.md` - Repo mission, brownfield guardrails, edit policy, and required verification commands.
- `.planning/PROJECT.md` - Current milestone intent, preserved couple/shared-room direction, and current focus.
- `.planning/ROADMAP.md` - Phase 09 goal, success criteria, and plan breakdown once updated.
- `.planning/REQUIREMENTS.md` - Showcase cat-sanctuary requirement IDs for this phase.
- `.planning/STATE.md` - Current continuity, phase ordering reality, and known brownfield concerns.
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/TESTING.md`
- `.planning/codebase/CONCERNS.md`
- `docs/AI_HANDOFF.md`
- `docs/CODEBASE_MAP.md`
- `docs/ARCHITECTURE.md`

### Pet runtime boundaries
- `src/lib/pets.ts` - Local pet registry and owned-pet schema.
- `src/lib/petPathing.ts` - Current obstacle-aware wander target logic.
- `src/components/room-view/RoomPetActor.tsx` - Live runtime cat behavior and shared pet motion bridge.
- `src/components/RoomView.tsx` - Live room pet rendering entry point.
- `src/components/mob-lab/MobPreviewActor.tsx` - External motion state contract for imported actors.
- `src/components/mob-lab/GlbMobPreviewActor.tsx` - Better Cats GLB runtime animation and bone transform seam.

### Local showcase boundaries
- `src/app/hooks/useLocalRoomSession.ts` - Local sandbox persistence surface and owned-pet state owner.
- `src/lib/devLocalState.ts` - Browser-local save validation and migration for sandbox pets.
- `src/app/hooks/useAppRoomActions.ts` - Buy/adopt/spend/store action boundary for sandbox and hosted paths.
- `src/components/ui/InventoryPanel.tsx` - Current catalog and pet-store wiring surface.
- `src/App.tsx` - Top-level glue for room runtime, PC rewards, and player-shell state.
- `src/app/shellViewModel.ts` - Current subtle player-shell labels and actions.

### Economy and future shared-room compatibility
- `src/lib/pcMinigame.ts` - Existing coin loop that should remain in the showcase build.
- `src/lib/sharedProgression.ts` - Existing room-first progression patterns and activity-reward helpers.
- `src/lib/sharedProgressionTypes.ts` - Current activity/progression types; useful reference for future cat-care coupling.
- `src/lib/sharedRoomTypes.ts` - Current hosted document still models one canonical shared cat.
- `src/lib/sharedRoomPet.ts` - Shared-cat runtime adapter that must keep working.

### Verification anchors
- `tests/pets.test.ts`
- `tests/petPathing.test.ts`
- `tests/shellViewModel.test.ts`
- `tests/sharedProgression.test.ts`
- `tests/sharedRoomPet.test.ts`
- `tests/sharedRoomRuntime.commitFlow.test.ts`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets already in the repo
- `useLocalRoomSession.ts` already persists `OwnedPet[]` in the sandbox save, so the showcase slice can stay reliable without hosted setup.
- `RoomView.tsx` already renders every pet in the `pets` array through `RoomPetActor`, so the runtime is structurally ready for multiple local cats.
- `RoomPetActor.tsx` already owns per-pet random seeds, obstacle-aware movement, and shared-live-state broadcasting, making it the right place for a richer local state machine.
- `GlbMobPreviewActor.tsx` already uses `useAnimations` and manual bone transforms for the Better Cats GLB, so state-driven `sit`, `lick`, and `sleep` behavior can be added without replacing the imported actor stack.
- `useAppRoomActions.ts` already owns local-versus-hosted action branching for cat adoption and coin spending, so showcase work can reuse that boundary instead of inventing a second action system.

### Current blockers that this phase must address
- `PET_REGISTRY` and the local buy flow still behave like one-off pet unlocks rather than a reusable cat roster.
- `ownedPetTypes.has(type)` currently blocks multiple sandbox cats of the same type.
- `OwnedPet` has only `id`, `type`, `presetId`, `acquiredFrom`, and `spawnPosition`; there is no roster status, care state, or behavior profile.
- `RoomPetActor.tsx` currently chooses wander targets and walk motion only; it does not own readable idle states.
- `sharedRoomTypes.ts` still models one shared canonical cat. That future path must stay intact while the local showcase path becomes much richer.

### Integration guidance
- Treat the showcase slice as local-first and future-friendly: richer cat state can live in `OwnedPet` for now without deleting the single shared-cat hosted contract.
- Prefer pure helpers for behavior and care logic so tests can cover them before runtime wiring.
- Keep UI-facing work to data labels, callbacks, and minimal prop additions. Another agent owns the actual visual polish.

</code_context>

<specifics>
## Specific Ideas

- The room should feel like a cat sanctuary first and a systems spreadsheet second.
- Many visible cats matter more than rare backend-perfect features for the showcase PC.
- Spectator moments should include cats following the player, stopping to lick, curling up to sleep, and clustering near cozy spots.
- The room-builder remains important because decorating the room is part of caring for the cats, not a separate mode.
- Cat care should feel generous and readable; the player should be able to earn enough coins during a short showcase session to adopt more cats and make the room visibly better.

</specifics>

<deferred>
## Deferred Ideas

- Full hosted multi-cat synchronization and couple co-care flows.
- Any rollback of Firebase/auth or the shared-room ownership model.
- A brand-new UI shell or large layout redesigns; another agent owns UI-heavy work in parallel.
- Deep breeding, hygiene, disease, or management-sim complexity.
- Broad asset-pipeline expansion beyond what the showcase cat slice directly needs.

</deferred>

---
*Phase: 09-showcase-cat-sanctuary*
*Context gathered: 2026-03-27*
