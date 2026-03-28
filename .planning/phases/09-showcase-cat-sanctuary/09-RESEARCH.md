# Phase 09: Showcase Cat Sanctuary - Research

**Researched:** 2026-03-27
**Domain:** Local-first showcase cat simulation built on the current cozy room sandbox while preserving future couple/shared-room foundations
**Confidence:** HIGH

<user_constraints>
## User Constraints (from 09-CONTEXT.md and active project rules)

### Locked Decisions
- **D-01:** Keep Firebase, hosted shared-room, and the future couple-taking-care-of-cats direction intact.
- **D-02:** Optimize the March 28, 2026 showcase build for a single-player pass-and-play PC setup.
- **D-03:** Reframe the immediate fantasy around a cozy cat-room simulator inside the existing room-builder.
- **D-04:** Keep the loop readable: walk, care for cats, earn coins, adopt/store cats, decorate room, repeat.
- **D-05:** Multiple cats in the room are mandatory.
- **D-06:** `sit`, `lick`, and `sleep` are mandatory cat outcomes.
- **D-07:** Preserve the existing PC minigame and coin loop as part of the showcase economy.
- **D-08:** Preserve room-builder invariants and authoring-tool boundaries.
- **D-09:** UI-heavy work is parallel-owned by another agent; planning should minimize shell/layout churn.
- **D-10:** Hosted shared-room may remain on one shared cat for now if needed.

### Deferred / Out of Scope
- Full hosted multi-cat synchronization.
- Any rollback of couple/shared-room foundations.
- Big UI redesigns.
- Deep management-sim complexity beyond a readable showcase loop.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SHOW-01 | Showcase build is immediately readable and rewarding as a single-player cat-room demo without requiring pairing. | Prioritize the local sandbox path, keep hosted code intact, and make the cat loop visible without login friction. |
| PETS-03 | Player can adopt, keep active, and store multiple cats in one room without breaking pet persistence or room runtime. | Extend `OwnedPet` and local action hooks instead of rewriting room or shared-room schemas. |
| PETS-04 | Cats exhibit readable room-life behavior through improved movement, mood or needs state, and `sit` / `lick` / `sleep` presentation. | Upgrade the existing `RoomPetActor` + `petPathing` heuristic and bridge behavior state into the Better Cats GLB actor. |
| ACTV-02 | Caring for cats and the existing PC loop produce coins that can buy more cats or decor during a session. | Reuse `playerCoins`, `useAppRoomActions`, and the existing PC loop; add a simple local cat-care reward domain instead of a new economy. |

</phase_requirements>

## Summary

The repo is already closer to a cat showcase than it looks. The local sandbox path persists `OwnedPet[]` inside `devLocalState.ts`, `useLocalRoomSession.ts` keeps that roster live in React state, and `RoomView.tsx` already renders every pet in the array through `RoomPetActor`. That means the room can already support multiple local pets structurally. The main blockers are shallow pet records, a one-off buy gate (`ownedPetTypes.has(type)`), and the lack of a cat-care loop.

The biggest architectural decision is to make the showcase slice **local-first, not hosted-first**. The hosted room document still models exactly one canonical shared cat through `sharedPet` in `sharedRoomTypes.ts`, and trying to force a full multi-cat backend expansion into a 10-hour showcase pass is the wrong risk profile. The right move is to enrich the local `OwnedPet` roster, keep shared-room code intact, and design the new types and helper boundaries so future couple-cat work can grow into them later.

The second major finding is that the user's request for "complex pathfinding" should be interpreted pragmatically. The current `petPathing.ts` is not a real graph pathfinder; it samples targets inside room bounds while avoiding furniture circles and the player. For tomorrow's showcase, a believable upgrade is better than a mathematically ambitious one. A per-cat state machine with smarter target selection, recovery targets, home anchors, follow bias, and soft cat-to-cat avoidance will create far more audience impact than attempting a full navmesh or A* rewrite under time pressure.

The third major finding is that the animation seam already exists. `GlbMobPreviewActor.tsx` uses `useAnimations`, clones the Better Cats scene safely, and already layers manual bone transforms on top of locomotion. The cleanest implementation path is to extend the external motion state with a behavior enum, choose named clips when available (`sleep`, `sit`, `lick`, etc.), and fall back to clearly readable procedural poses when the clip library is incomplete. This is much lower risk than replacing the imported actor stack.

The fourth major finding is that the economy loop does not need reinvention. The app already has `playerCoins`, a PC minigame reward path, and a single action boundary in `useAppRoomActions.ts`. Showcase cat care should use those same patterns. A small pure domain helper for care-state decay and care-action rewards can feed local coins immediately and later be lifted into shared progression if the couple-cat direction demands it.

The final operational finding is that UI work is explicitly parallel-owned. Planning should therefore focus on data contracts, callbacks, and shell labels that another agent can skin. Heavy layout rewrites would create unnecessary merge risk with the parallel UI worktree.

**Primary recommendation:** implement Phase 09 as a three-plan local-first showcase slice: first extend the cat roster and persistence model for multiple active or stored cats while keeping hosted shared-cat logic intact; next upgrade `RoomPetActor`, `petPathing`, and the Better Cats GLB actor with readable behavior states and `sit` / `lick` / `sleep` outcomes; finally add a lightweight cat-care reward domain and wire it into existing app hooks and shell labels so the PC loop and cat care together feed the adoption and decoration loop.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React + TypeScript | current repo stack | Local roster state, app callbacks, and shell selectors | Already powers `App.tsx`, `useLocalRoomSession.ts`, and every current gameplay surface. |
| Existing local sandbox persistence | repo-local | Reliable showcase save path | `devLocalState.ts` already persists room state, coins, minigame progress, and pets without external setup. |
| Existing room pet runtime | repo-local | Multi-cat rendering and movement | `RoomView.tsx` + `RoomPetActor.tsx` already host pet motion inside the room. |
| Better Cats GLB actor | repo-local | Readable cat animation and pose presentation | `GlbMobPreviewActor.tsx` already owns the imported cat scene, clips, and bone transform seam. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing PC minigame stack | repo-local | Coin-source that survives into the cat showcase | Keep the existing desk-PC loop intact and let it complement cat care. |
| Existing shared progression helpers | repo-local | Future reference for reward-pattern design | Use as a model for pure reward helpers without forcing hosted multi-cat work now. |
| Vitest | 3.0.5 declared | Regression coverage for pet model, behavior, care, and shell selectors | Required because this phase touches persistence, runtime behavior, and app contracts. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Local-first showcase cats | Full hosted multi-cat shared-room expansion | Too risky for the March 28, 2026 showcase timebox and unnecessary for one public PC. |
| Smarter heuristic movement + state machine | Full navmesh or A* pathfinding | Higher implementation risk and lower showcase payoff per hour. |
| Behavior-driven clip selection with pose fallback | Rebuilding cat animation from scratch | The Better Cats actor already has the necessary seams. |
| Lightweight cat-care reward helpers | A new currency or management system | Adds complexity without improving first-look showcase readability. |
| Data-contract-first UI wiring | Large shell rewrite | Conflicts with the user's explicit parallel UI ownership. |

## Architecture Patterns

### Pattern 1: Treat the local cat roster as inventory plus active-room state
**What:** Keep cat ownership and in-room population distinct through a roster-ready `OwnedPet` shape.
**When to use:** For all local showcase cat work.
**Why:** The player needs to adopt, keep active, and store cats without deleting progress.

**Recommendation:** enrich `OwnedPet` with `status`, `displayName`, `behaviorProfileId`, and care-state fields, then let `RoomView` keep rendering only the `active_room` subset.

### Pattern 2: Upgrade the current obstacle sampler instead of replacing it
**What:** Extend the current target-sampling pet movement with behavior-driven target selection and recovery helpers.
**When to use:** For all movement/pathing work in this phase.
**Why:** It fits the 10-hour timebox and keeps the room-safe brownfield math intact.

**Recommendation:** add pure helpers for `follow_player`, `rest`, and `recovery` targets, plus soft avoidance of other active cats.

### Pattern 3: Drive animation from explicit behavior state
**What:** Bridge cat runtime behavior state into the Better Cats GLB actor.
**When to use:** For `sit`, `lick`, and `sleep` outcomes.
**Why:** The imported actor already exposes `useAnimations` and manual transforms.

**Recommendation:** extend `MobExternalMotionState` with `behaviorState` and let `GlbMobPreviewActor.tsx` choose named clips first, then pose fallback transforms.

### Pattern 4: Keep cat-care rewards inside the existing action/economy path
**What:** Use `playerCoins` and `useAppRoomActions.ts` for local showcase rewards.
**When to use:** For feeding, petting, and play actions.
**Why:** The existing app already owns spending and reward flow; new care actions should feel like another room-native earn loop, not a second economy.

**Recommendation:** add a pure `catCare.ts` module for decay and reward math, then call it from `useAppRoomActions.ts`.

### Pattern 5: Preserve the hosted shared-cat contract explicitly
**What:** Keep `sharedPet` in `sharedRoomTypes.ts` working exactly as it does today.
**When to use:** Throughout the whole phase.
**Why:** The future couple-cat direction still depends on the hosted foundation; showcase work must not damage it.

**Recommendation:** gate multi-cat behavior to the local sandbox path first, and keep hosted adoption on the existing single `minecraft_cat` flow.

## Runtime State Inventory

| Area | Current State | Required Phase 09 Action |
|------|---------------|--------------------------|
| `src/lib/pets.ts` | `OwnedPet` is a minimal record with no roster or care semantics. | Add roster-ready fields, behavior profile, and care state. |
| `src/lib/devLocalState.ts` | Pets persist locally, but only the old shallow record shape is accepted. | Validate and normalize richer local cat records without breaking older saves. |
| `src/app/hooks/useLocalRoomSession.ts` | Local sandbox already owns the pet array and persistence loop. | Keep it as the showcase source of truth and add care ticking / roster-ready state handling. |
| `src/app/hooks/useAppRoomActions.ts` | Local pet adoption is a one-off unlock; shared-room adoption is single shared cat. | Remove the local one-cat gate, add store/activate/care callbacks, keep hosted single-cat logic. |
| `src/components/room-view/RoomPetActor.tsx` | Obstacle-aware wanderer with walk-only presentation. | Add per-cat behavior state, smarter target choice, and behavior-based motion output. |
| `src/lib/petPathing.ts` | Samples wander targets and avoids furniture/player. | Add rest/follow/recovery helpers and soft cat-to-cat avoidance. |
| `src/components/mob-lab/GlbMobPreviewActor.tsx` | Walk loop plus manual bone motion; no explicit sit/lick/sleep bridge. | Map behavior state to clips or fallback poses. |
| `src/App.tsx` | Already glues room runtime, PC loop, and shell state together. | Compute cat summaries and pass care/adopt/store callbacks without rewriting the whole shell. |
| `src/app/shellViewModel.ts` | No cat-sanctuary specific labels yet. | Add concise active/stored/needs-care labels for the parallel UI owner. |
| `src/lib/sharedRoomTypes.ts` / `src/lib/sharedRoomPet.ts` | One canonical shared cat. | Preserve compatibility; do not broaden hosted schema in this phase. |

## Common Pitfalls

### Pitfall 1: Trying to solve hosted multi-cat architecture first
**What goes wrong:** The team burns showcase time on backend/schema work instead of visible room play.
**How to avoid:** Treat the showcase slice as local-first and preserve the hosted single-cat path.

### Pitfall 2: Keeping the local one-cat adoption gate
**What goes wrong:** The room never becomes visually impressive enough for a public showcase.
**How to avoid:** Remove the local duplicate-type purchase block and add active/stored roster state.

### Pitfall 3: Building a heavy pathfinding system
**What goes wrong:** Time disappears into infrastructure and the cats still do not look better on screen.
**How to avoid:** Upgrade the current heuristic with behavior state, follow bias, and recovery targets.

### Pitfall 4: Depending on animation clips that may not exist
**What goes wrong:** `sit`, `lick`, or `sleep` silently fall back to walk-only behavior.
**How to avoid:** Add explicit pose fallback transforms in the GLB actor.

### Pitfall 5: Hiding the care loop inside ephemeral component state
**What goes wrong:** Cat needs reset unpredictably and the loop feels fake.
**How to avoid:** Persist care state in the local pet roster and update it through pure helpers.

### Pitfall 6: Fighting parallel UI edits
**What goes wrong:** Merge conflicts and lost polish work.
**How to avoid:** Restrict this phase to selectors, callbacks, and minimal prop plumbing when UI files must be touched.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multiple cats | A brand-new room schema | Roster-ready `OwnedPet[]` on the local sandbox path | Already persisted and rendered today. |
| Better pathing | Full navmesh or A* | Behavior-driven target sampling and recovery helpers | Better risk/reward for the showcase timebox. |
| Sit/lick/sleep | A custom animation engine | `GlbMobPreviewActor.tsx` clip selection plus pose fallback | The imported actor stack already exists. |
| Cat-care economy | A new currency | Existing `playerCoins` + local action hooks | Keeps the loop readable and compatible with the current app. |
| Showcase UX | Large shell rewrites | Minimal labels/callbacks for the parallel UI owner | Matches the user's explicit UI collaboration constraint. |

## Open Questions

1. **Should local showcase cats use distinct visual variants or repeated cat copies first?**
   - Recommendation: plan for repeated cats and personality diversity first. If visual variants land cheaply, treat them as a bonus rather than a blocker.

2. **How many active cats should the room support tomorrow?**
   - Recommendation: plan for a cap of six active cats to keep spectacle high without risking room-performance chaos.

3. **How aggressive should need decay be in a showcase build?**
   - Recommendation: keep it intentionally fast enough that a player sees care opportunities within minutes, but not so fast that the room feels stressful.

4. **Should care rewards be local-only for now?**
   - Recommendation: yes. Preserve hosted foundations, but keep the showcase loop local-first and reliable.

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- `.planning/phases/09-showcase-cat-sanctuary/09-CONTEXT.md`
- `src/lib/pets.ts`
- `src/lib/devLocalState.ts`
- `src/app/hooks/useLocalRoomSession.ts`
- `src/app/hooks/useAppRoomActions.ts`
- `src/components/RoomView.tsx`
- `src/components/room-view/RoomPetActor.tsx`
- `src/lib/petPathing.ts`
- `src/components/mob-lab/MobPreviewActor.tsx`
- `src/components/mob-lab/GlbMobPreviewActor.tsx`
- `src/components/ui/InventoryPanel.tsx`
- `src/App.tsx`
- `src/app/shellViewModel.ts`
- `src/lib/pcMinigame.ts`
- `src/lib/sharedRoomTypes.ts`
- `src/lib/sharedRoomPet.ts`
- `tests/pets.test.ts`
- `tests/petPathing.test.ts`
- `tests/shellViewModel.test.ts`

### Secondary (MEDIUM confidence)
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/TESTING.md`
- `.planning/codebase/CONCERNS.md`
- `docs/AI_HANDOFF.md`
- `docs/CODEBASE_MAP.md`
- `docs/ARCHITECTURE.md`
- `tests/sharedProgression.test.ts`
- `tests/sharedRoomPet.test.ts`
- `tests/sharedRoomRuntime.commitFlow.test.ts`

## Metadata

**Confidence breakdown:**
- Local-first showcase path recommendation: HIGH
- Multi-cat roster on sandbox path: HIGH
- Heuristic pathing upgrade instead of full navmesh: HIGH
- Behavior-state bridge into Better Cats GLB actor: HIGH
- Exact care reward numbers and showcase caps: MEDIUM
- Visual variant feasibility inside the timebox: MEDIUM

**Research date:** 2026-03-27
**Valid until:** 2026-03-28
