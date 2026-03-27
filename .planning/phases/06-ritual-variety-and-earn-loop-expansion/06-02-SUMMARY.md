---
phase: 06-ritual-variety-and-earn-loop-expansion
plan: 02
subsystem: gameplay
tags: [desk-pc, cozy-rest, shared-runtime, presence, vitest]
requires:
  - phase: 06-ritual-variety-and-earn-loop-expansion/06-01
    provides: Together Days progression schema, room-day claim ledger, and activity helpers
provides:
  - Retro desk-PC desktop with Snake, Block Stacker, and Runner app flows
  - Canonical per-app desk-PC payouts that allow replay without duplicate room-day rewards
  - Cozy Rest couple reward path gated by same-bed live presence and committed through hosted progression
affects: [06-03, App-shell, shared-room-runtime, presence]
tech-stack:
  added: []
  patterns: [focused vitest TDD, canonical reward commits, presence-derived eligibility]
key-files:
  created: [.planning/phases/06-ritual-variety-and-earn-loop-expansion/06-02-SUMMARY.md]
  modified: [src/lib/pcMinigame.ts, src/components/PcMinigameOverlay.tsx, src/lib/sharedProgression.ts, src/App.tsx, src/app/hooks/useSharedRoomPresence.ts, tests/pcMinigame.test.ts, tests/sharedRoomRuntime.test.ts, tests/sharedRoomPresenceUx.test.ts]
key-decisions:
  - "Kept desk-PC replay always available and moved once-per-room-day payout gating into the canonical activity-claim ledger instead of overlay cooldown state."
  - "Used one presence-derived Cozy Rest eligibility selector based on live same-bed, different-slot lie poses so App and tests share the same contract."
  - "Kept Cozy Rest as a couple claim through applySharedActivityCompletionToProgression so reload and stale-revision replay stay predictable."
patterns-established:
  - "Pattern 1: activity-specific payout state is derived from canonical progression and pushed back into the UI as readiness or paid-today state."
  - "Pattern 2: room-native co-op earn loops can depend on presence for eligibility while still committing rewards only through shared-room mutations."
requirements-completed: [RITL-02, ACTV-01]
duration: 1 session
completed: 2026-03-27
---

# Phase 06-02 Summary

**Retro desk PC variety, canonical app payouts, and Cozy Rest reward commits**

## Performance

- **Duration:** 1 session
- **Completed:** 2026-03-27
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Replaced the single PC minigame framing with a retro desktop shell that launches `Snake`, `Block Stacker`, and `Runner` while preserving one normalized result payload.
- Wired each desk app through canonical `pc_game_reward:*` commit reasons so payouts are once per room day, practice reruns stay available, and per-app stats persist across reloads.
- Added `Cozy Rest` as a same-bed couple reward path that becomes eligible only when both partners are lying live on the same bed in different slots and pays through `cozy_rest_reward`.

## Files Created/Modified
- `.planning/phases/06-ritual-variety-and-earn-loop-expansion/06-02-SUMMARY.md` - Plan summary for the activity-path implementation.
- `src/lib/pcMinigame.ts` - Retro desk app definitions, reward helpers, and backward-compatible result typing.
- `src/components/PcMinigameOverlay.tsx` - Retro desk-PC desktop/app shell plus paid-today versus practice-only result states.
- `src/lib/sharedProgression.ts` - Canonical per-app claim handling, per-app desk stats, and couple Cozy Rest reward support.
- `src/App.tsx` - Desk app reward reasons, canonical claim-derived paid state, Cozy Rest mutation, and room-shell activity wiring.
- `src/app/hooks/useSharedRoomPresence.ts` - Shared Cozy Rest eligibility selector based on live same-bed / different-slot lie poses.
- `tests/pcMinigame.test.ts` - Retro desk shell coverage.
- `tests/sharedRoomRuntime.test.ts` - Canonical desk app and Cozy Rest reward coverage.
- `tests/sharedRoomPresenceUx.test.ts` - Same-bed Cozy Rest eligibility coverage.

## Decisions Made
- Reused the shared activity claim ledger for both desk apps and Cozy Rest instead of inventing a second reward persistence path.
- Let the old `PcMinigameResult` type remain backward-compatible by making `activityId` optional for legacy callers while the new retro desk flow always emits it.
- Kept Cozy Rest payout values lightweight and sentimental rather than competitive: a small couple-wide reward that complements the desk PC instead of replacing it.

## Verification
- Passed `cmd /c npm test -- --maxWorkers 1 tests/pcMinigame.test.ts tests/sharedRoomRuntime.test.ts tests/sharedRoomPresenceUx.test.ts tests/shellViewModel.test.ts`
- Passed `cmd /c npm test`
- Passed `cmd /c npm run build`

## Issues Encountered
- The initial shared-room runtime test additions failed because `applySharedActivityCompletionToProgression` was missing from the test import block, which made the mutation callback throw before commits happened.
- Type drift from the retro desk contract surfaced during the build; restoring a backward-compatible `PcMinigameResult` shape resolved existing callers without weakening the new desk-app flow.

## Next Phase Readiness
- The player shell can now read canonical desk-app and Cozy Rest status instead of guessing from local cooldown state.
- Phase 06-03 can focus entirely on surfacing Together Days and activity readiness cleanly because the reward contracts and presence gating are already stable.

---
*Phase: 06-ritual-variety-and-earn-loop-expansion*
*Completed: 2026-03-27*
