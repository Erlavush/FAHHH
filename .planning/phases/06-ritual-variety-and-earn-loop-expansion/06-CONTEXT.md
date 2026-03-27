# Phase 6: Ritual Variety and Earn Loop Expansion - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Deepen the shared room's return-play loop without turning it into a daily obligation game. Phase 6 replaces the punitive streak emphasis with a softer shared-presence metric, expands the desk PC into multiple retro ritual variants, adds one room-native non-PC earn loop, and updates the player shell so rituals and activity availability are visible without debug clutter. Memories, richer pet needs, content expansion, and whole-shell UI overhauls remain out of scope.

</domain>

<decisions>
## Implementation Decisions

### Together Days and Room-Day Rules
- **D-01:** Replace the punitive shared daily streak emphasis with a `Together Days` metric that records shared presence without punishing missed days.
- **D-02:** A `Together Day` increments once per room-day when both partners visit the room within that same room-day; simultaneous overlap is not required.
- **D-03:** Missing a room-day does nothing to `Together Days`; there is no reset, decay, or pressure to log in every day.
- **D-04:** `Together Days` is sentimental/progress-signaling only. Coins and rewards should come from rituals and activities, not from the counter itself.

### Ritual Variety and Retro Desk PC Suite
- **D-05:** Ritual variety should live inside a retro 1990s desk-PC desktop/app suite rather than through a modern UI treatment or a separate out-of-room menu.
- **D-06:** The desk PC should offer three ritual/activity variants: `Snake`, a block-stacker inspired by classic falling-block games, and a runner inspired by the offline browser dinosaur game. Do not use literal branded copies.
- **D-07:** The retro/pixelated visual direction applies only to the desk PC desktop, game windows, and reward/result surfaces. The rest of the room shell should stay warm, cozy, and aligned with the Phase 03.1 player-shell split.
- **D-08:** Each desk-PC game remains playable anytime for fun, but each game pays coins only once per room-day.
- **D-09:** To satisfy ritual rotation, planning should assume one featured ritual/activity rotates per room-day from the available activity pool, but featured-ritual completion is optional and must not act like a punitive streak gate. This is a planning default carried from the discussion rather than a user-explicit lock.

### Non-PC Earn Loop
- **D-10:** Phase 6 must still add a repeatable earn loop beyond the desk PC path.
- **D-11:** The planning default for the non-PC loop is `Cozy Rest`: a bed-based room-native couple activity that reuses the existing two-slot lie interaction and awards a once-per-room-day payout when both partners participate in the same live session.
- **D-12:** The non-PC activity payout should require both partners to be there together for that activity. This is a planning default derived from the room's comfort-space fantasy and the current reusable bed interaction surface.

### Rewards, Persistence, and Progression Shape
- **D-13:** Keep progression lightweight and room-centric. No new currencies, quest logs, or obligation-heavy progression systems in Phase 6.
- **D-14:** Ritual/activity rewards must remain predictable on the hosted backend and persist through the canonical shared-room progression state, not through ephemeral presence-only state.
- **D-15:** Phase 6 should extend the existing shared progression model with `Together Days`, per-activity room-day payout tracking, and ritual rotation state instead of introducing a second gameplay save path.

### Player-Shell Surfacing
- **D-16:** Replace streak-facing player-shell messaging with `Together Days` messaging.
- **D-17:** The player shell should show today's shared-presence/activity state quietly through the existing companion card, progress stack, and room-details surfaces rather than through a new standalone dashboard.
- **D-18:** Planning should assume the `Streak` card in the progress stack becomes `Together Days`, and the companion card/details sheet shows today's visit state plus activity availability/reset status. This is a planning default carried forward because the user moved directly into plan-phase before answering the final surfacing batch.

### the agent's Discretion
- Exact payout numbers, XP values, and score thresholds for each PC app and for `Cozy Rest`.
- Exact room-day boundary implementation, as long as players experience it as one clear room-day that can count both visits once.
- Exact featured-ritual selection logic, as long as multiple ritual variants rotate over time without creating a punishment loop.
- Exact pixel font, window chrome, iconography, and app naming for the desk PC, as long as the style reads as aggressively retro and not modern.
- Exact copy and visual treatment for the `Together Days` counter, visit-state messaging, and "paid today" activity indicators.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product Scope and Phase Contract
- `.planning/PROJECT.md` - Core value, milestone goals, lightweight-progression constraint, and authoring/runtime boundaries.
- `.planning/REQUIREMENTS.md` - Phase 6 requirement contract for `RITL-02` and `ACTV-01`.
- `.planning/ROADMAP.md` - Phase 6 goal, success criteria, and plan breakdown.
- `.planning/STATE.md` - Current hosted-runtime status, carry-forward concerns, and continuity from Phase 5.

### Prior Phase Decisions That Still Bind Phase 6
- `.planning/phases/01-shared-room-backbone/01-CONTEXT.md` - Shared room authority, committed-edit sync, and schema invariants that still apply.
- `.planning/phases/02-live-presence-and-co-op-consistency/02-CONTEXT.md` - Presence remains separate from canonical commits; room entry stays usable when the partner is away.
- `.planning/phases/03-shared-progression-and-ritual-loop/03-CONTEXT.md` - Existing progression/ritual baseline that Phase 6 is intentionally softening and extending.
- `.planning/phases/04-memories-pets-and-breakup-stakes/04-CONTEXT.md` - Canonical room-state rules and player-shell ownership for shared features.
- `.planning/phases/05-online-backend-and-couple-ownership/05-CONTEXT.md` - Hosted progression/presence split and Firebase-backed authority boundary.
- `.planning/phases/03.1-ui-overhaul-and-developer-player-view-split/03.1-UI-SPEC.md` - Player-shell versus developer-workspace UI contract that Phase 6 must preserve.

### Runtime and Architecture Guardrails
- `docs/AI_HANDOFF.md` - Runtime truth, desk-PC baseline, room-builder invariants, and current best-next-step direction.
- `docs/ARCHITECTURE.md` - Active shell/runtime boundaries and the rule to extend current systems rather than revive deleted architecture.
- `docs/CODEBASE_MAP.md` - Navigation map for app-shell, shared-room, and room runtime ownership.

### Core Code Boundaries
- `src/lib/sharedProgression.ts` - Existing ritual/streak/progression logic that must evolve into `Together Days`, rotation state, and new activity reward tracking.
- `src/lib/sharedProgressionTypes.ts` - Canonical progression schema that will need new Phase 6 fields.
- `src/lib/sharedRoomTypes.ts` - Hosted shared-room document contract that carries progression canonically.
- `src/app/hooks/useSharedRoomRuntime.ts` - Canonical load/reload/commit boundary where new reward mutations must remain predictable.
- `src/App.tsx` - Current glue for progression selectors, PC reward commit flow, companion card state, and shell surfacing.
- `src/components/PcMinigameOverlay.tsx` - Current single-game desk-PC surface that should become the retro desktop/app suite.
- `src/app/shellViewModel.ts` - Existing companion/progress shell messaging that currently assumes streak-based ritual copy.
- `src/app/components/PlayerProgressStack.tsx` - Existing `Streak` card surface to convert into `Together Days`.
- `src/app/components/PlayerCompanionCard.tsx` - Current player-shell ritual/details surface for visit-state and activity messaging.
- `src/app/components/SharedRoomStatusStrip.tsx` - Existing subtle status surface that may still carry compact ritual/activity state.
- `src/lib/furnitureRegistry.ts` - Current interaction-capable furniture definitions, including bed and desk.
- `src/lib/furnitureInteractions.ts` - Existing bed and desk interaction/slot rules that make the bed-based `Cozy Rest` loop the cleanest non-PC default.

### Verification Anchors
- `tests/sharedProgression.test.ts` - Existing ritual/streak regression coverage that Phase 6 will need to update around `Together Days` and new reward contracts.
- `tests/sharedRoomRuntime.test.ts` - Canonical runtime mutation/reload coverage for progression commits.
- `tests/shellViewModel.test.ts` - Current ritual/streak shell-copy expectations that will change with `Together Days`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/PcMinigameOverlay.tsx`: already provides the desk-PC modal shell, session flow, result cards, and reward plumbing that can be expanded into a retro multi-app desktop.
- `src/lib/sharedProgression.ts`: already centralizes room-day handling, ritual status building, and reward mutations for shared progression.
- `src/app/shellViewModel.ts`, `src/app/components/PlayerCompanionCard.tsx`, and `src/app/components/PlayerProgressStack.tsx`: already own the exact player-shell surfaces that need new `Together Days` and activity copy.
- `src/lib/furnitureRegistry.ts` plus `src/lib/furnitureInteractions.ts`: already support `use_pc`, `sit`, and two-slot `lie` interactions, making the bed the strongest reusable anchor for a non-PC loop.
- `src/app/hooks/useSharedRoomRuntime.ts`: already guarantees hosted canonical mutation/reload behavior and stale-conflict replay, which Phase 6 rewards should reuse.

### Established Patterns
- Canonical room/progression state is authoritative; presence, movement, and transient room activity remain outside canonical revisions unless a confirmed reward/progression mutation occurs.
- The player shell is room-first and subtle; debug tooling and authoring surfaces stay in the developer workspace.
- Progression is lightweight and room-centric; Phase 6 should not introduce new currencies or a heavy quest dashboard.
- The runtime already uses a room-day concept in shared progression, so expanding that is safer than inventing a rolling timer model from scratch.

### Integration Points
- Extend `SharedRoomProgressionState` with `Together Days`, ritual/activity rotation state, and per-activity room-day reward tracking.
- Refactor `PcMinigameOverlay` into a retro desktop/app launcher while preserving the hosted reward commit path already used from `App.tsx`.
- Add a bed-based couple reward mutation through `commitRoomMutation` in `useSharedRoomRuntime.ts` rather than through presence-only state.
- Update shell selectors and copy so the progress stack, companion card, and room details explain `Together Days`, visit-state, and activity payout/reset status without adding a new dashboard.
- Refresh tests around shared progression, runtime mutation replay, and shell copy to match the softened non-streak design.

</code_context>

<specifics>
## Specific Ideas

- The room should feel like a comfort space first and a game second.
- `Together Days` should feel like a scrapbook-style relationship marker, not a streak pressure mechanic.
- The desk PC should feel like opening an old family computer or retro bedroom PC, with pixel windows and no modern UI styling.
- The Phase 6 non-PC loop should feel cozy and intimate rather than competitive; `Cozy Rest` on the bed is the planning default because it fits the fantasy and reuses the strongest existing couple interaction surface.

</specifics>

<deferred>
## Deferred Ideas

- Turning the entire player shell into retro PC chrome; Phase 6 keeps that style scoped to the desk PC/apps only.
- Literal branded `Tetris` or Google offline dinosaur clones; use inspired-but-original variants instead.
- Additional non-PC activity surfaces such as snacks, tea, fridge, radio, or TV sync; these can become later content/loop expansion if Phase 6 needs more breadth after the bed-based loop lands.
- Pet-care loops, memory expansion, and broader content unlocks; those remain in later phases.

</deferred>

---

*Phase: 06-ritual-variety-and-earn-loop-expansion*
*Context gathered: 2026-03-27*
