# Phase 06: Ritual Variety and Earn Loop Expansion - Research

**Researched:** 2026-03-27
**Domain:** Soft shared-presence progression, retro desk-PC ritual variety, and hosted-safe repeatable earn loops
**Confidence:** HIGH

<user_constraints>
## User Constraints (from 06-CONTEXT.md and active project rules)

### Locked Decisions

### Together Days and Room-Day Rules
- **D-01:** Replace punitive streak framing with a `Together Days` metric.
- **D-02:** A `Together Day` increments once per room-day when both partners visit within that same room-day; overlap is not required.
- **D-03:** Missing a day does nothing; there is no reset or decay.
- **D-04:** `Together Days` is sentimental only. Rewards come from activities.

### Desk PC Ritual Variety
- **D-05:** Ritual variety lives inside a retro 1990s desk-PC desktop/app suite.
- **D-06:** The desk PC must offer three game variants: snake-style, falling-block-style, and runner-style.
- **D-07:** Retro styling is scoped to the desk PC/apps only, not the whole shell.
- **D-08:** Each PC game stays playable anytime, but pays coins only once per room-day.
- **D-09:** One featured ritual/activity may rotate per room-day, but completion is optional and never punitive.

### Non-PC Earn Loop
- **D-10:** Add a repeatable earn loop beyond the desk PC.
- **D-11:** Planning default: `Cozy Rest`, a bed-based room-native couple activity.
- **D-12:** `Cozy Rest` payout requires both partners together for that activity.

### Persistence and Shell Surfacing
- **D-13:** Keep progression lightweight and room-centric.
- **D-14:** Rewards and activity state must persist through canonical hosted shared-room progression.
- **D-15:** Extend the existing progression model instead of introducing a second save path.
- **D-16:** Replace streak-facing shell language with `Together Days`.
- **D-17:** Surface visit/activity state through the existing subtle player shell.
- **D-18:** Planning assumes the progress stack replaces `Streak` with `Together Days`, and the companion/details surfaces show visit and payout availability state.

### Deferred / Out of Scope
- Whole-shell retro chrome outside the desk PC/apps.
- Literal branded Tetris or Chrome dino clones.
- Additional non-PC loops beyond one cozy room-native activity.
- Memory, pet, or broader content expansion.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RITL-02 | Couple can rotate through multiple daily ritual variants instead of only the desk PC flow. | Replace the single desk-PC ritual path with an activity registry plus room-day featured activity metadata, while keeping ritual completion optional and non-punitive. |
| ACTV-01 | Couple can access another repeatable earn loop beyond the desk PC path. | Reuse the existing two-slot bed interaction to add a canonical couple-only `Cozy Rest` payout path committed through `commitRoomMutation`. |
</phase_requirements>

## Summary

Phase 06 is an evolution of the existing shared progression system, not a new subsystem. The current code already has the right authority boundary: `useSharedRoomRuntime` commits canonical `progression` mutations with revision conflict replay, and `sharedProgression.ts` already owns room-day logic plus reward application. The work is to soften the semantics and widen the activity surface.

Today the progression model is hard-wired to one daily ritual path: a desk-PC completion writes a `desk_pc` ritual contribution, both partners completing that same ritual awards a daily bonus to both, and `advanceRitualDayIfNeeded` resets `streakCount` after missed days. That directly conflicts with the user decision to avoid obligation loops. Phase 06 therefore needs a schema and selector pass that keeps the room-day concept but retires streak pressure.

The cleanest move is to split the current concept of "daily ritual" into three distinct concerns:

1. **Together Days ledger:** sentimental shared-presence state that increments once per room-day when both partners have visited, with no reset behavior.
2. **Activity payout ledger:** per-room-day reward claim tracking so desk-PC apps and `Cozy Rest` can pay predictably without double-granting.
3. **Featured ritual metadata:** optional room-day guidance about which activity is highlighted, without making the room feel like homework.

That split preserves the hosted runtime guarantees. `commitRoomMutation` already reloads and replays on revision conflicts, which is exactly what reward-granting needs. The plan should extend `SharedRoomProgressionState`, keep mutations pure in `sharedProgression.ts`, and continue committing only confirmed reward/progression changes instead of presence noise.

The second major finding is that the existing desk-PC flow is architecturally ready for expansion. `PcMinigameOverlay.tsx` already owns the modal shell, session lifecycle, result card, and reward callback. The current limitation is that it assumes one minigame and one cooldown-driven progress shape. Phase 06 should replace that with a retro desktop/app launcher plus per-app progress/reward tracking. The important part is to preserve the existing commit path in `App.tsx`: the overlay should still return a normalized result payload, and `App.tsx` should still persist rewards through `commitRoomMutation`.

The third major finding is that the non-PC loop should use the bed, not a brand-new room system. `furnitureInteractions.ts` already supports lie interactions with stable `primary` / `secondary` slots, and the Phase 05 UAT work already pushed bed-side occupancy into shared interaction flow. That makes the bed the safest room-native anchor for a couple-only activity. Planning should treat `Cozy Rest` as a progression mutation triggered from an existing furniture interaction, not as a new global menu or timer widget.

One local workspace caveat matters for planning: the player-shell UI is in the middle of a refactor. The old `src/app/components/PlayerCompanionCard.tsx` and related files are deleted in the current worktree, and `App.tsx` now imports those surfaces from `src/components/ui/*`. Plans should therefore reference the active shell paths in the workspace, not only the older paths listed in the brownfield map.

**Primary recommendation:** evolve `sharedProgression.ts` into a room-day activity ledger with `Together Days`, per-activity reward claims, and optional featured ritual metadata; expand the desk-PC overlay into a retro multi-app desktop that still commits through the existing reward mutation path; implement `Cozy Rest` as a bed-based canonical reward mutation; and retarget shell copy/components to the new progression vocabulary using the currently active `src/components/ui/*` surfaces.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React + TypeScript | current repo stack | Retro desk-PC desktop/app flow, shell copy updates, and result surfaces | Already powers the desk-PC overlay and room shell; no new UI framework is needed. |
| Existing shared progression domain | repo-local | Room-day, reward, and hosted-safe progression mutations | `sharedProgression.ts` already owns the correct pure-update boundary. |
| Existing shared runtime hook | repo-local | Canonical commit/reload/replay behavior for progression changes | `useSharedRoomRuntime.ts` already protects reward mutations with revision checks and replay. |
| Existing furniture interaction system | repo-local | Bed-triggered `Cozy Rest` interaction entry | The bed already supports two lie slots and occupancy-aware targeting. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing PC minigame helpers | repo-local | Shared score/result math and app session normalization | Expand or replace the single `pcMinigame.ts` helper with a small per-app registry instead of inventing disconnected reward math in the overlay. |
| Vitest | 3.0.5 declared | Progression, runtime mutation, and shell-copy regression tests | Keep using focused unit and runtime tests for room-day and payout rules. |
| CSS in existing app styles | repo-local | Retro desk-PC visuals and pixel-style window chrome | The user wants 1990s styling scoped to the desk PC/apps, not a design-system migration. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Extending canonical progression with activity ledgers | A second lightweight app-only save blob | Faster short-term, but violates the current single-canonical-progression boundary and risks hosted drift. |
| Bed-based `Cozy Rest` | Adding a new TV/snack/radio interaction from scratch | More content flavor, but higher implementation risk and no existing couple interaction slot model. |
| Retro desktop launcher inside `PcMinigameOverlay` | Separate full-screen app routes or an out-of-room PC menu | Less integrated with the room fantasy and unnecessary routing churn. |
| Optional featured ritual metadata | Hard daily quest requirements | Directly conflicts with the user's comfort-space framing and no-punishment rule. |

## Architecture Patterns

### Pattern 1: Replace streak semantics with explicit `Together Days` and activity ledgers
**What:** Retire the idea that `streakCount` is the room's primary relationship metric. Introduce dedicated fields for shared visit tracking, total together days, and per-room-day reward claims.
**When to use:** For all progression changes in Phase 06.
**Why:** The current `streakCount` reset behavior in `advanceRitualDayIfNeeded` directly violates the user intent. Reusing the room-day helper is good; reusing the streak meaning is not.

**Recommendation:** model the couple state as something close to:
- `togetherDaysCount`
- `longestTogetherDaysCount` only if still meaningful, otherwise drop it
- `visitDay` with `dayKey`, `visitedByPlayerId`, `countedAt`
- `featuredActivityId` / `featuredDayKey`
- `activityClaimsByDayKey[dayKey][activityId]`

### Pattern 2: Separate solo PC claims from couple-only activity claims
**What:** Treat desk-PC apps and `Cozy Rest` as different claim shapes even if they live under one room-day ledger.
**When to use:** In the new progression schema and reward helpers.
**Why:** PC apps pay the player who played them; `Cozy Rest` is explicitly a couple-only activity. Forcing both into one flat claim shape will either lock one partner out of solo PC rewards or make the bed activity too loose.

**Recommendation:** keep one canonical ledger, but let claim records distinguish between:
- per-player PC app claims keyed by `activityId` and `playerId`
- couple claim records keyed only by `activityId`

### Pattern 3: Keep desk-PC gameplay always playable and decouple practice from payout eligibility
**What:** Let players open and replay desk-PC apps freely while reward eligibility is determined by progression state, not a UI cooldown.
**When to use:** For all three retro PC apps.
**Why:** The user asked for once-per-day payout, not once-per-day play lockout. The current `pcMinigame.ts` cooldown is a useful temporary mechanic, but it is the wrong contract for Phase 06.

**Recommendation:** retire the single 60-second reward cooldown as the primary gate. Instead:
- allow app sessions anytime
- compute `paidToday` from progression room-day claim state
- show result copy like `Coins already claimed today - practice run only`

### Pattern 4: Turn `PcMinigameOverlay` into a retro desktop shell, not three unrelated modals
**What:** Reuse the existing overlay as the frame for a small retro desktop with icons/app windows for the three activities.
**When to use:** For the desk-PC UX portion of the phase.
**Why:** The overlay already owns focus, escape handling, start/result flow, and reward callbacks. Keeping one shell reduces routing churn and keeps the room fantasy intact.

**Recommendation:** split the current implementation into:
- desktop shell / launcher chrome
- app registry describing id, label, intro copy, reward rules, and session component
- one normalized completion payload returned to `App.tsx`

### Pattern 5: Commit `Cozy Rest` through `commitRoomMutation`, not presence state
**What:** When both partners satisfy the bed-activity rule, write the reward and claim state through the canonical room document.
**When to use:** For the non-PC earn loop.
**Why:** Presence is ephemeral by design. The payout rule must survive reloads, reconnects, and conflict replay.

**Recommendation:** the runtime may detect live eligibility from presence/interaction state, but the actual reward grant must be one pure progression mutation that writes the canonical claim record and reward outcome.

### Pattern 6: Keep shell surfacing subtle and target the active component paths
**What:** Update the shell selectors and UI copy without creating a new dashboard.
**When to use:** For the player-facing room shell surfaces.
**Why:** Phase 03.1 already split the developer workspace from the player shell. Phase 06 should preserve that subtlety.

**Recommendation:** target the active files in the current workspace:
- `src/app/shellViewModel.ts`
- `src/components/ui/PlayerCompanionCard.tsx`
- `src/components/ui/PlayerProgressStack.tsx`
- `src/components/ui/PlayerRoomDetailsSheet.tsx`
- `src/app/components/PlayerRoomShell.tsx`

### Pattern 7: Use existing runtime replay guarantees to keep rewards predictable
**What:** Continue using `commitRoomMutation` for rewarding activities instead of ad hoc direct writes.
**When to use:** For desk-PC reward commits and `Cozy Rest` reward commits.
**Why:** `useSharedRoomRuntime.ts` already reloads the latest room document and replays the mutation after revision conflicts. That is the safest hosted behavior already present in the codebase.

## Runtime State Inventory

| Area | Current State | Required Phase 06 Action |
|------|---------------|--------------------------|
| `src/lib/sharedProgressionTypes.ts` | Couple progression only knows `streakCount`, `lastCompletedDayKey`, and one `ritual` day with `source: "desk_pc"`. | Extend the schema for `Together Days`, visit tracking, featured activity metadata, and per-activity reward claims. |
| `src/lib/sharedProgression.ts` | Room-day logic exists, but rewarding and banners assume one desk-PC ritual and streak resets. | Refactor pure helpers so room-day advancement preserves `Together Days`, applies optional featured activity rotation, and computes PC/bed reward eligibility without punishment loops. |
| `src/lib/pcMinigame.ts` | One session helper, one reward formula, one short cooldown. | Replace or expand into per-app logic and a practice-versus-paid result contract. |
| `src/components/PcMinigameOverlay.tsx` | One minigame, one results card, one `onComplete` flow. | Turn it into a retro desktop/app launcher with three app experiences and a normalized result payload. |
| `src/App.tsx` | Commits PC rewards through `commitRoomMutation` and reads shell state from selectors. | Preserve the commit path, expand it for activity ids and `Cozy Rest`, and wire new shell/status props. |
| `src/app/hooks/useSharedRoomRuntime.ts` | Canonical shared-room mutation entry point with conflict replay. | Reuse as-is for new reward mutations; do not move payout logic into presence or component-local state. |
| `src/lib/furnitureInteractions.ts` | Bed interactions already expose stable `primary` / `secondary` slots. | Reuse bed interaction state as the trigger for `Cozy Rest` instead of creating a new room interaction system. |
| `src/app/shellViewModel.ts` | Companion card state still exposes `streakLabel` and desk-check-in copy. | Replace streak text with `Together Days` and add quiet visit / activity availability messaging. |
| `src/components/ui/PlayerProgressStack.tsx` | Third card is hard-coded to `Streak`. | Convert that card to `Together Days` and optionally a compact activity-ready indicator if needed. |
| `src/components/ui/PlayerCompanionCard.tsx` | Shows ritual title/body plus `streakLabel`. | Update it to reflect `Together Days`, room-day visit state, and activity availability/reset status. |
| `src/components/ui/PlayerRoomDetailsSheet.tsx` | Details sheet currently shows invite and room actions only. | Add quiet ritual/activity detail rows instead of introducing a new dashboard surface. |
| `tests/sharedProgression.test.ts` | Locks current streak and desk-only ritual semantics. | Rewrite around `Together Days`, optional featured activity logic, and per-activity payout rules. |
| `tests/sharedRoomRuntime.test.ts` | Covers canonical desk-PC progression commit and reload behavior. | Extend to cover activity-id-based reward commits and `Cozy Rest` canonical persistence. |
| `tests/shellViewModel.test.ts` | Expects `Streak` copy and daily desk ritual text. | Update to `Together Days`, visit-state messaging, and non-punitive activity copy. |

## Common Pitfalls

### Pitfall 1: Rebranding `streakCount` to `Together Days` without changing semantics
**What goes wrong:** The UI copy changes, but missed-day resets still happen in `advanceRitualDayIfNeeded`.
**How to avoid:** Treat `Together Days` as a different metric with its own room-day visit logic and no reset behavior.

### Pitfall 2: Using one shared `lastCompletedAt` field for all three PC apps
**What goes wrong:** Playing one app incorrectly blocks or mutates the reward state for the others.
**How to avoid:** Use an app registry and per-app claim/progress records.

### Pitfall 3: Locking the desk PC when only the reward should be locked
**What goes wrong:** Players lose the ability to replay games for fun after claiming the daily reward.
**How to avoid:** Separate `canPlay` from `canEarnToday` in both logic and UI copy.

### Pitfall 4: Granting `Cozy Rest` from ephemeral presence state only
**What goes wrong:** Reloads or conflicts can duplicate or lose the payout.
**How to avoid:** Detect eligibility however you want, but grant rewards only through one canonical progression mutation.

### Pitfall 5: Planning against stale shell paths
**What goes wrong:** Execution edits deleted files or misses the active UI refactor paths.
**How to avoid:** Re-read the current workspace before execution and target `src/components/ui/*` where the shell primitives live today.

### Pitfall 6: Making featured rituals feel mandatory
**What goes wrong:** The room becomes a chores game again.
**How to avoid:** Keep featured activity guidance cosmetic or bonus-facing, never the only route to stable progress.

### Pitfall 7: Introducing a new currency or heavy quest tracker
**What goes wrong:** Phase scope drifts away from the lightweight comfort-room design.
**How to avoid:** Reuse coins, XP, and subtle shell surfacing only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shared-presence sentiment | A renamed streak counter with reset logic | A dedicated `Together Days` visit ledger | The user's core request is no punishment for missed days. |
| Desk-PC variety | Three isolated fullscreen routes with separate reward code | One retro desktop shell with an app registry | Preserves the room fantasy and centralizes reward flow. |
| Couple activity | A new global minigame system | Bed-based `Cozy Rest` on the existing lie interaction | Lowest brownfield risk and strongest thematic fit. |
| Reward persistence | Presence-only flags or component-local storage | `sharedProgression.ts` + `commitRoomMutation` | Keeps hosted behavior predictable across reload and conflict replay. |
| Shell surfacing | A new dashboard or debug panel | Existing companion/progress/details surfaces | Matches the player-shell contract from Phase 03.1. |

## Open Questions

1. **Should desk-PC once-per-day rewards be per player or room-global?**
   - Recommendation: plan for per-player claims on desk-PC apps and a couple-global claim for `Cozy Rest`. That matches the current personal-wallet model and avoids one partner consuming the other's solo fun reward.

2. **Should featured activity rotation affect rewards or only guidance copy?**
   - Recommendation: keep it guidance-first in Phase 06. If it affects rewards at all, make it a light bonus, never the only meaningful progression path.

3. **Should `Together Days` preserve a `longest` metric?**
   - Recommendation: only if implemented as total counted shared days, not a consecutive streak. Otherwise it reintroduces confusing streak-adjacent meaning.

4. **What room-day boundary should players perceive?**
   - Recommendation: reuse the existing room-day helper first and keep the user-facing copy simply `today` / `next room day` unless testing proves timezone confusion.

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/phases/06-ritual-variety-and-earn-loop-expansion/06-CONTEXT.md`
- `.planning/phases/06-ritual-variety-and-earn-loop-expansion/06-DISCUSSION-LOG.md`
- `src/App.tsx`
- `src/app/hooks/useSharedRoomRuntime.ts`
- `src/lib/sharedProgression.ts`
- `src/lib/sharedProgressionTypes.ts`
- `src/lib/pcMinigame.ts`
- `src/components/PcMinigameOverlay.tsx`
- `src/lib/furnitureInteractions.ts`
- `src/app/shellViewModel.ts`
- `src/components/ui/PlayerCompanionCard.tsx`
- `src/components/ui/PlayerProgressStack.tsx`
- `src/components/ui/PlayerRoomDetailsSheet.tsx`
- `src/app/components/PlayerRoomShell.tsx`
- `tests/sharedProgression.test.ts`
- `tests/sharedRoomRuntime.test.ts`
- `tests/shellViewModel.test.ts`

### Secondary (MEDIUM confidence)
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/TESTING.md`
- `.planning/codebase/CONCERNS.md`
- `docs/AI_HANDOFF.md`
- `docs/ARCHITECTURE.md`
- `docs/CODEBASE_MAP.md`
- `.planning/phases/03.1-ui-overhaul-and-developer-player-view-split/03.1-UI-SPEC.md`
- `.planning/phases/05-online-backend-and-couple-ownership/05-CONTEXT.md`

## Metadata

**Confidence breakdown:**
- Canonical progression-extension approach: HIGH
- Bed-based non-PC activity recommendation: HIGH
- Retro desk-PC shell expansion path: HIGH
- Desk-PC claim shape recommendation (per-player versus room-global): MEDIUM
- Exact room-day perception copy: MEDIUM

**Research date:** 2026-03-27
**Valid until:** 2026-04-03
