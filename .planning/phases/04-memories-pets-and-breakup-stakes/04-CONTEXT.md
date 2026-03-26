# Phase 4: Memories, Pets, and Breakup Stakes - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete the shared-room MVP fantasy by adding one editable shared memory object, one curated shared-room pet path, and the breakup-reset loop that makes the room feel emotionally meaningful. This phase covers only a jam-scope memory/frame flow, one deliberately promoted pet runtime, and explicit breakup warning plus reset behavior; galleries, richer pet simulation, multi-pet systems, and post-breakup account systems remain out of scope.

</domain>

<decisions>
## Implementation Decisions

### Shared Memory Object
- **D-01:** The first memory feature should reuse the existing in-room `wall_frame` path rather than introduce a separate memory-only placement system or gallery surface.
- **D-02:** A placed memory frame should support one visible shared image plus an optional short caption so the room gains one clear personalized artifact without expanding into albums, feeds, or multiple media slots.
- **D-03:** Memory editing should stay room-first: either partner edits the placed frame's content from the live shared-room flow, and the edited result persists through the canonical shared-room document and reload path.

### Curated Shared-Room Pet Path
- **D-04:** Phase 4 should promote one curated shared-room pet only, using the existing cat path built around the checked-in `better_cat_glb` preset instead of opening arbitrary Mob Lab preset import into the live room.
- **D-05:** Shared-room pet ownership is couple-owned and canonical to the shared room, while Mob Lab remains the authoring source for visuals and tuning only.
- **D-06:** The first shared-room pet should remain lightweight for jam scope: persistent presence plus the current room-safe wander behavior are enough; advanced needs, training, breeding, or species expansion are deferred.

### Breakup Stakes and Reset Scope
- **D-07:** The shipped shared-room flow must explain the breakup stakes before a couple commits to the room loop, then repeat the warning inside the destructive breakup/reset flow.
- **D-08:** The breakup action should live behind an explicit danger-zone style surface in the shared-room shell instead of a casual toolbar action, with unambiguous copy about what will be lost.
- **D-09:** The reset should wipe authoritative couple-owned shared-room state back to a fresh baseline, including shared progression, shared room decor/inventory state, memory-frame content, and shared pet records.
- **D-10:** Breakup reset must not wipe local profile identity, Mob Lab presets, Preview Studio work, or other non-shared authoring/local sandbox persistence outside the shared-room document path.

### Authority and Recovery
- **D-11:** Memory edits, shared pet state, and breakup resets should all commit through the same authoritative shared-room store/runtime boundary used in Phases 1-3 rather than presence transport or a new side save.
- **D-12:** Reset behavior should remain reconnect-safe and reload-safe: after a confirmed breakup, every client should converge on the same fresh canonical room state instead of trying to preserve stale local drafts.

### the agent's Discretion
- Exact storage strategy for frame images and captions, as long as it preserves canonical reload and does not merge Mob Lab persistence into room state.
- Exact UI copy, chip styling, modal wording, and status-strip messaging for memory edit feedback, pet presence, and breakup warnings.
- Exact pet spawn/home-position rules and any optional display-name support, as long as the first shared pet stays curated and lightweight.
- Exact fresh-baseline contents after breakup reset, as long as it is clearly communicated and fully clears the shared relationship-tied room state.

</decisions>

<specifics>
## Specific Ideas

- Treat the first memory object as "the room's framed shared photo" rather than the start of a media-management system.
- Favor the existing cat path because the GLB preset and live-room cat motion are already the strongest polished pet slice in the repo.
- Make the breakup flow feel serious and intentional, with warning copy that explicitly says the couple room, its memories, its pet state, and its shared progression will be reset.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product Scope and Phase Contract
- `.planning/PROJECT.md` - Brownfield product contract, jam-scope constraints, and the requirement to preserve authoring-tool boundaries while finishing the shared-room fantasy.
- `.planning/REQUIREMENTS.md` - Phase 4 contract for `MEMR-01`, `PETS-01`, `STAK-01`, and `STAK-02`.
- `.planning/ROADMAP.md` - Phase 4 goal, success criteria, and plan breakdown.
- `.planning/STATE.md` - Current handoff point and the note that Phase 4 is the remaining milestone work.

### Prior Phase Decisions
- `.planning/phases/01-shared-room-backbone/01-CONTEXT.md` - Canonical shared-room authority, ownership-versus-placement invariants, and migration constraints that memory/pet/reset work must preserve.
- `.planning/phases/02-live-presence-and-co-op-consistency/02-CONTEXT.md` - Presence separation, room-first shell behavior, and stale-local recovery patterns that Phase 4 must keep intact.
- `.planning/phases/03-shared-progression-and-ritual-loop/03-CONTEXT.md` - Canonical progression model plus explicit deferral of memories, pet expansion, and breakup semantics into Phase 4.

### Brownfield Architecture and Risks
- `.planning/codebase/ARCHITECTURE.md` - Current shared-room runtime layering, shell ownership, and authoritative persistence boundary.
- `.planning/codebase/STRUCTURE.md` - Source ownership map for app-shell, room-view, shared-room, and authoring-tool modules.
- `.planning/codebase/TESTING.md` - Existing Vitest layout and where shared-room, pet, and reset tests belong.
- `.planning/codebase/CONCERNS.md` - Known schema, persistence, and validation risks that Phase 4 must account for.

### Runtime and Product Docs
- `docs/AI_HANDOFF.md` - Runtime truth, current shared-room guardrails, and the current imported-mob/pet bridge.
- `docs/ARCHITECTURE.md` - Active architecture rules, especially extending the current runtime instead of reviving obsolete backend paths.
- `docs/CODEBASE_MAP.md` - Navigation map for the app shell, room runtime, and domain modules touched by Phase 4.
- `docs/CURRENT_SYSTEMS.md` - Current wall-frame, pet-store, and persistence behavior plus the remaining gaps around advanced pets and breakup logic.
- `docs/GAME_OVERVIEW.md` - Final product fantasy and jam-MVP requirement for editable photo frames, one pet, and breakup reset stakes.
- `docs/MOB_LAB.md` - Explicit authoring/runtime boundary for imported mobs and the rule that live-room pet promotion must be deliberate.
- `docs/ROADMAP.md` - Existing project-level advice to add editable picture frames, promote pets intentionally from Mob Lab, and add breakup reset only after shared progression exists.

### Core Code Boundaries
- `src/App.tsx` - Shared-room shell orchestration, toolbar/status surfaces, inventory routing, and the likely home for breakup/settings UI.
- `src/app/hooks/useSharedRoomRuntime.ts` - Canonical shared-room load/reload/commit boundary that memories, pets, and resets must use.
- `src/lib/sharedRoomTypes.ts` - Shared-room document shape that will need to grow for memory and pet state.
- `src/lib/sharedRoomStore.ts` - Store contract for authoritative shared-room commits and reloads.
- `src/lib/roomState.ts` - Starter room and baseline layout rules that the breakup reset should return to.
- `src/lib/furnitureRegistry.ts` - `wall_frame` registry entry and other room-item definitions that the memory flow should reuse.
- `src/components/room-view/FurnitureVisual.tsx` - Live-room rendering path for `wall_frame` visuals.
- `src/components/PosterModel.tsx` - Existing visual model reused by poster and wall-frame furniture.
- `src/lib/pets.ts` - Current gameplay-pet registry and couple-facing pet type boundary.
- `src/components/room-view/RoomPetActor.tsx` - Live-room pet render/motion path already specialized for the cat preset.
- `src/lib/petPathing.ts` - Simplified room-safe pet movement path that Phase 4 should keep lightweight.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/furnitureRegistry.ts` plus `src/components/room-view/FurnitureVisual.tsx`: already define and render `wall_frame`, so the first memory object can be layered onto an existing furniture path instead of adding a parallel placement system.
- `src/components/PosterModel.tsx`: already supplies the frame/poster visual shell that a memory frame can reuse or extend.
- `src/lib/pets.ts`, `src/components/room-view/RoomPetActor.tsx`, and `src/lib/petPathing.ts`: already provide a lightweight live-room pet registry, actor, and movement model, with the cat path currently the most production-ready slice.
- `src/app/hooks/useSharedRoomRuntime.ts`, `src/lib/sharedRoomTypes.ts`, and `src/lib/sharedRoomStore.ts`: already own the authoritative shared-room data load, commit, and reload path that new memory/pet/reset state should extend.
- `src/App.tsx` plus existing shared-room shell components: already host progression, status-strip, and inventory UI, making them the natural place for danger-zone and memory/pet status surfaces.

### Established Patterns
- Shared-room state mutations are authoritative, committed operations; presence transport remains separate from canonical room data.
- The app shell owns room-level UI and destructive flows, while `RoomView` owns live scene rendering.
- Mob Lab is the authoring source for imported-mob visuals, but room pets intentionally run on a simpler gameplay path.
- Brownfield invariants from earlier phases still apply: preserve `ownedFurniture` versus placed `furniture`, anchor-based surface decor, four-wall support, and canonical reload on stale local state.

### Integration Points
- Extend the shared-room document/store types with memory-frame content, shared pet records, and breakup/reset metadata or commands.
- Hook memory editing and breakup confirmation into the existing shared-room shell rather than burying them in dev tools.
- Reuse the current room pet actor and cat preset in the live room while keeping Mob Lab persistence separate.
- Add focused tests around shared-room schema validation, reload/recovery behavior, memory editing, pet persistence, and destructive reset convergence.

</code_context>

<deferred>
## Deferred Ideas

- Multiple memory objects, albums, photo galleries, or scrapbook-style browsing.
- Arbitrary Mob Lab preset adoption or user-imported pet promotion directly into the live shared room.
- Rich pet systems such as needs, moods, interactions, breeding, or multiple active pet types.
- Post-breakup recovery systems, cooldowns, archival exports, or account-level relationship history.

</deferred>

---

*Phase: 04-memories-pets-and-breakup-stakes*
*Context gathered: 2026-03-27*
