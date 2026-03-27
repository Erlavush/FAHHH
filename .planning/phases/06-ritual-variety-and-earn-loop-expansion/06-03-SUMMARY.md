---
phase: 06-ritual-variety-and-earn-loop-expansion
plan: 03
subsystem: player-shell
tags: [player-shell, together-days, shell-view-model, build]
requires:
  - phase: 06-ritual-variety-and-earn-loop-expansion/06-02
    provides: canonical desk-app and Cozy Rest claim state plus App reward wiring
provides:
  - Together Days shell selectors and activity-status labels
  - Player companion card, progress stack, and room details surfaces that show canonical activity readiness
  - Phase 06 verification-ready shell wording without streak-pressure copy
affects: [player-shell, App, shellViewModel, shared-status-surfaces]
tech-stack:
  added: []
  patterns: [selector-driven UI copy, canonical activity rows, build-verified shell integration]
key-files:
  created: [.planning/phases/06-ritual-variety-and-earn-loop-expansion/06-03-SUMMARY.md]
  modified: [src/app/shellViewModel.ts, src/components/ui/PlayerCompanionCard.tsx, src/components/ui/PlayerProgressStack.tsx, src/components/ui/PlayerRoomDetailsSheet.tsx, src/app/components/SharedRoomStatusStrip.tsx, src/App.tsx, tests/shellViewModel.test.ts]
key-decisions:
  - "Replaced streak-facing shell copy with Together Days while leaving the retro treatment scoped to the desk PC itself."
  - "Summarized the three desk apps into one companion-card Desk PC status while letting the details sheet show per-activity rows."
  - "Used the player dock for live Cozy Rest readiness so the room-native activity stays discoverable without creating a new dashboard."
patterns-established:
  - "Pattern 1: shellViewModel owns player-facing wording for Together Days, visit state, and activity readiness instead of hardcoding UI copy in App."
  - "Pattern 2: the details sheet can render canonical activity rows for lightweight loop explanation without exposing debug or backend terminology."
requirements-completed: [RITL-02, ACTV-01]
duration: 1 session
completed: 2026-03-27
---

# Phase 06-03 Summary

**Together Days shell surfacing and canonical activity-state UX**

## Performance

- **Duration:** 1 session
- **Completed:** 2026-03-27
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Replaced streak-facing shell selectors with `Together Days`, `Visited today`, `Paid today`, and `Ready now` state driven from canonical progression and presence.
- Updated the active player-shell surfaces so the progress stack, companion card, room details sheet, and status strip all understand desk-PC versus Cozy Rest state without turning the main room shell retro.
- Added shell-level Cozy Rest surfacing in the player dock when the partners are already lying together live on the same bed.

## Files Created/Modified
- `.planning/phases/06-ritual-variety-and-earn-loop-expansion/06-03-SUMMARY.md` - Plan summary for shell surfacing work.
- `src/app/shellViewModel.ts` - Together Days selectors, activity labels, and Cozy Rest dock state.
- `src/components/ui/PlayerCompanionCard.tsx` - Companion card rows for visit state, Desk PC, and Cozy Rest.
- `src/components/ui/PlayerProgressStack.tsx` - Together Days replaces the old streak card.
- `src/components/ui/PlayerRoomDetailsSheet.tsx` - `Today's activities` list plus Together Days summary.
- `src/app/components/SharedRoomStatusStrip.tsx` - Compact Together Days and activity-state copy for the shared-status surface.
- `src/App.tsx` - Canonical shell-state assembly and Together Days wiring.
- `tests/shellViewModel.test.ts` - Selector coverage for Together Days and activity copy.

## Decisions Made
- Kept the desk PC summary compressed on the companion card while exposing app-by-app rows in the details sheet so the shell stays quiet but informative.
- Used non-punitive room-day visit wording instead of instructing players to protect or preserve a streak.
- Left the broader room shell warm and current rather than spreading pixel-window chrome outside the desk PC overlay.

## Verification
- Passed `cmd /c npm test -- --maxWorkers 1 tests/shellViewModel.test.ts`
- Passed `cmd /c npm test`
- Passed `cmd /c npm run build`

## Issues Encountered
- `src/App.tsx` already carried unrelated in-flight shell refactor work, so the Phase 06 wiring had to be layered carefully on top of the existing UI split instead of reverting or rewriting it.

## Next Phase Readiness
- Phase 07 can build on a calmer shell baseline that already distinguishes sentimental progress, visit state, and activity availability.
- The player shell no longer depends on streak pressure language, so deeper memories or pet loops can land without conflicting messaging.

---
*Phase: 06-ritual-variety-and-earn-loop-expansion*
*Completed: 2026-03-27*
