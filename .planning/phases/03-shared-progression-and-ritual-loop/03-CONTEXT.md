# Phase 3: Shared Progression and Ritual Loop - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Layer personal progression, couple streak state, and one daily ritual onto the authoritative shared room so the room has a repeatable return loop. This phase covers the first canonical progression schema, visible progression UI, desk-PC reward integration, ritual completion, and reconnect-safe streak persistence only; memory objects, richer ritual rotation, pet expansion, breakup/reset semantics, and broader content expansion remain out of scope.

</domain>

<decisions>
## Implementation Decisions

### Personal Progression and Shared Room Economy
- **D-01:** Phase 3 introduces per-partner progression records with personal coins, XP, and level while the room's `ownedFurniture` inventory remains couple-owned.
- **D-02:** Room purchases should spend the active partner's personal coins, but the purchased furniture becomes shared room ownership immediately.
- **D-03:** The old single shared-coin surface stops being the primary player-facing economy once personal progression exists; migration should preserve room purchasing power without silently duplicating or deleting value.
- **D-04:** Progression stays lightweight and room-centric for jam scope; no secondary currencies, skill trees, or broad quest systems in Phase 3.

### Couple Ritual and Streak Rules
- **D-05:** The first daily ritual should reuse the existing desk-PC loop rather than inventing a brand-new gameplay surface.
- **D-06:** A ritual day completes when both partners each finish one desk-PC check-in for that room day; the two completions may happen asynchronously.
- **D-07:** Normal desk-PC runs keep granting personal rewards, while the first full couple ritual completion of the day grants the extra ritual bonus and advances the shared streak.
- **D-08:** Ritual and streak evaluation use one canonical room-day boundary per couple instead of each client's local midnight.
- **D-09:** Missing the ritual for a full room day resets the streak; reconnects and reloads inside the same room day must preserve partial ritual progress.

### Progression and Ritual UI Surfaces
- **D-10:** Progression feedback must live in the main room shell rather than only in debug tools or hidden menus.
- **D-11:** The toolbar should surface the active player's personal wallet and level progress, while the shared-room status layer should surface couple streak and today's ritual state.
- **D-12:** The desk-PC overlay should show personal reward results plus ritual contribution, daily bonus, and streak feedback when a run completes.
- **D-13:** UI should remain subtle and room-first, reusing the current toolbar/status-strip language instead of introducing a standalone progression dashboard.

### Persistence and Authority
- **D-14:** Personal progression and couple ritual/streak data belong in authoritative shared-room progression state that loads and reloads with the canonical room.
- **D-15:** Phase 3 should extend the current shared-room document/store boundary instead of creating a second gameplay save path or routing progression through presence transport.

### the agent's Discretion
- Exact XP curve, level thresholds, and ritual bonus numbers.
- Exact migration math from current `sharedCoins` into the Phase 3 progression model, as long as player-visible value is preserved and not silently duplicated.
- Exact naming/copy for the first ritual as long as it stays warm, room-centered, and obviously daily.
- Exact visualization for streak chips, progress bars, and empty states within the existing shell.

</decisions>

<specifics>
## Specific Ideas

- Use the existing desk PC as the first shared ritual anchor so Phase 3 proves a return-play loop without opening a second large interaction surface.
- Keep progression feedback close to the toolbar, shared-room status strip, and PC results card so the room stays primary.
- Treat ritual completion as a couple-facing daily check-in, not a heavy quest log.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product Scope and Phase Contract
- `.planning/PROJECT.md` - Brownfield product definition, jam-scope progression goals, and the requirement to keep progression lightweight and room-centric.
- `.planning/REQUIREMENTS.md` - Phase 3 contract for `PROG-01`, `PROG-02`, `PROG-03`, and `RITL-01`.
- `.planning/ROADMAP.md` - Phase 3 goal, success criteria, and plan breakdown.
- `.planning/STATE.md` - Current state, blockers, and the handoff into Phase 3.

### Prior Phase Decisions and Brownfield Research
- `.planning/phases/01-shared-room-backbone/01-CONTEXT.md` - Locked shared inventory ownership, authoritative reload, and committed-edit decisions that progression must build on.
- `.planning/phases/02-live-presence-and-co-op-consistency/02-CONTEXT.md` - Room-first UI, presence separation, and canonical reload behavior that Phase 3 must preserve.
- `.planning/research/ARCHITECTURE.md` - Recommended progression-layer and shared-room adapter boundaries.
- `.planning/research/FEATURES.md` - MVP feature dependency chain from individual progression into streak and ritual.
- `.planning/research/PITFALLS.md` - Phase 3 warning that progression must stay tied to a visible couple ritual.

### Brownfield Architecture and Verification
- `.planning/codebase/ARCHITECTURE.md` - Current shell/runtime layering and shared-room authority boundaries.
- `.planning/codebase/STRUCTURE.md` - Source-tree ownership for app-shell, room-view, and shared-room modules.
- `.planning/codebase/TESTING.md` - Existing Vitest patterns and where new progression/state tests should land.
- `.planning/codebase/CONCERNS.md` - Known persistence and validation risks, especially around stale schema handling.

### Runtime Truth and Product Docs
- `docs/AI_HANDOFF.md` - Runtime guardrails, active systems, and explicit "best next steps" toward progression, level, streak, and shared goals.
- `docs/ARCHITECTURE.md` - Active architecture boundary and the requirement to extend current runtime surfaces rather than reviving a legacy backend path.
- `docs/CODEBASE_MAP.md` - Navigation map for the app shell, room runtime, and domain modules Phase 3 will touch.
- `docs/CURRENT_SYSTEMS.md` - Current PC minigame, economy, persistence, and missing progression systems.
- `docs/GAME_OVERVIEW.md` - Final game fantasy, core loop, and jam-MVP expectation for individual progression plus couple streak and one daily quest loop.
- `docs/ROADMAP.md` - Existing brownfield recommendation to add canonical progression, then the daily loop, then level and streak.

### Core Code Boundaries
- `src/App.tsx` - Top-level wallet, PC reward, toolbar, inventory, and shared-room orchestration that Phase 3 extends.
- `src/app/hooks/useSharedRoomRuntime.ts` - Canonical shared-room load/reload/commit boundary where progression state must attach.
- `src/app/components/SceneToolbar.tsx` - Existing compact shell surface for player-facing economy and progression signals.
- `src/app/components/SharedRoomStatusStrip.tsx` - Existing shared-room status surface that can host streak and ritual state.
- `src/app/components/InventoryPanel.tsx` - Current buy/sell flow that still assumes one room wallet and will need progression-aware economy changes.
- `src/components/PcMinigameOverlay.tsx` - Existing desk-PC earn loop UI that should surface ritual contribution and reward breakdown.
- `src/lib/pcMinigame.ts` - Current desk-PC reward and cooldown logic that Phase 3 will wrap with progression and ritual outcomes.
- `src/lib/sharedRoomTypes.ts` - Shared-room document shape that must expand for personal and couple progression data.
- `src/lib/sharedRoomStore.ts` - Store contract that will need authoritative progression commit/load semantics.
- `src/lib/devLocalState.ts` - Solo fallback persistence shape and current local-only coin/progress fields that must stay separate from shared-room authority.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/App.tsx`: Already owns the player wallet, PC reward application, inventory actions, and shared-room commit calls that Phase 3 must restructure.
- `src/app/components/SceneToolbar.tsx`: Already renders a compact top-level status row and can carry personal coin / level UI without inventing a new shell.
- `src/app/components/SharedRoomStatusStrip.tsx`: Already owns subtle shared-room state messaging and is the natural place for streak / ritual status.
- `src/components/PcMinigameOverlay.tsx` plus `src/lib/pcMinigame.ts`: Already provide the first repeatable earn loop that the ritual can extend instead of replacing.
- `src/app/hooks/useSharedRoomRuntime.ts`, `src/lib/sharedRoomTypes.ts`, and `src/lib/sharedRoomStore.ts`: Already define the authoritative shared-room document and commit boundary that progression should extend.
- `src/lib/devLocalState.ts`: Shows the current solo/local persistence boundary that should stay a fallback path rather than becoming the shared progression source of truth.

### Established Patterns
- The app shell owns non-scene UI and persistence orchestration; progression surfaces belong in `src/App.tsx` and `src/app/*`, not inside `RoomView`.
- Canonical shared-room reload already wins on reconnect and stale local assumptions; progression writes should follow the same authority model.
- Presence transport is deliberately separate from committed shared-room state; ritual and streak progress should not piggyback on presence freshness alone.
- Preview Studio, Mob Lab, and world-settings persistence stay outside the live shared-room progression path.

### Integration Points
- Extend `SharedRoomDocument` and store interfaces with personal and couple progression state so reload and reconnect naturally hydrate the same authoritative data.
- Replace the single `playerCoins` shared-room assumption in `src/App.tsx`, `SceneToolbar.tsx`, and `InventoryPanel.tsx` with active-player progression plus couple ritual selectors.
- Hook ritual contribution and bonus resolution into the existing PC minigame completion path before later adding broader activity variants.
- Add focused tests beside `tests/pcMinigame.test.ts`, `tests/sharedRoomRuntime.test.ts`, and shared-room store validation coverage so progression survives refresh, reconnect, and partner absence.

</code_context>

<deferred>
## Deferred Ideas

- Multiple ritual variants or ritual rotation (`RITL-02`) after the first daily loop is stable.
- Additional minigames or second earn loops beyond the desk PC.
- Shared room growth meters, quest logs, or broader RPG-style progression surfaces.
- Memory objects, pet expansion, and breakup/reset semantics.

</deferred>

---

*Phase: 03-shared-progression-and-ritual-loop*
*Context gathered: 2026-03-27*
