---
phase: 06-ritual-variety-and-earn-loop-expansion
plan: 01
subsystem: gameplay
tags: [progression, vitest, room-day, activities]
requires:
  - phase: 05-online-backend-and-couple-ownership
    provides: canonical shared-room progression and hosted-safe mutation boundaries
provides:
  - Together Days progression fields with legacy streak migration
  - Room-day visit tracking and featured activity rotation helpers
  - Canonical per-activity reward claim ledger for PC apps and Cozy Rest
affects: [06-02, 06-03, sharedProgression, shared-room-runtime]
tech-stack:
  added: []
  patterns: [additive progression migration, room-day activity ledger, focused vitest TDD]
key-files:
  created: [.planning/phases/06-ritual-variety-and-earn-loop-expansion/06-01-SUMMARY.md]
  modified: [src/lib/sharedProgressionTypes.ts, src/lib/sharedProgression.ts, tests/sharedProgression.test.ts]
key-decisions:
  - "Added Together Days and activity-ledger fields alongside legacy streak fields so the existing runtime can keep compiling while Phase 06 rolls forward."
  - "Used a deterministic featured-activity selector derived from the room day key so reloads stay stable without new persistence machinery."
  - "Kept historical claim buckets by day key while rotating current-day visit and featured-activity state forward."
patterns-established:
  - "Pattern 1: shared room-day state rolls through pure helpers before reward or visit mutations land."
  - "Pattern 2: activity payouts are blocked by canonical claim records instead of ephemeral UI cooldown state."
requirements-completed: [RITL-02, ACTV-01]
duration: 21min
completed: 2026-03-27
---

# Phase 06-01 Summary

**Together Days migration, featured activity rotation, and canonical room-day claim helpers for shared progression**

## Performance

- **Duration:** 21 min
- **Started:** 2026-03-27T16:24:19+08:00
- **Completed:** 2026-03-27T16:45:00+08:00
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added the Phase 06 progression schema for Together Days, visit-day state, featured activity metadata, and per-day activity claims.
- Migrated legacy streak-only rooms into the new sentimental Together Days fields without dropping stored progress.
- Added pure helpers for room-day visit counting, claim status lookup, duplicate-claim blocking, and non-punitive day rollover behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Together Days, visit-day, and activity-claim types with legacy migration** - `e03fd83`, `168ccb9` (test, feat)
2. **Task 2: Add room-day visit, featured-activity, and reward-claim helpers while keeping runtime compatibility** - `8e2393a`, `69b2c52` (test, feat)

**Plan metadata:** pending docs commit

_Note: TDD tasks used separate RED and GREEN commits._

## Files Created/Modified
- `.planning/phases/06-ritual-variety-and-earn-loop-expansion/06-01-SUMMARY.md` - Plan summary and commit trail for Wave 1 progression work.
- `src/lib/sharedProgressionTypes.ts` - Canonical Together Days, featured activity, and activity-claim schema.
- `src/lib/sharedProgression.ts` - Migration, visit counting, day rollover, and claim helper implementation.
- `tests/sharedProgression.test.ts` - Regression coverage for legacy migration, visit counting, duplicate claims, and non-punitive rollover.

## Decisions Made
- Preserved legacy streak fields during this plan instead of deleting them immediately, because downstream runtime and shell code still reference them in later Phase 06 plans.
- Treated desk-PC claims as per-player and left room for couple-wide claims so Cozy Rest can share the same canonical ledger.
- Kept featured activity guidance deterministic and optional rather than introducing a mandatory daily quest mechanic.

## Deviations from Plan

None - plan executed exactly as written.

---

**Total deviations:** 0 auto-fixed (none)
**Impact on plan:** None. The implemented helper layer matches the planned scope and leaves later Phase 06 UI/runtime wiring unblocked.

## Issues Encountered
- Focused Vitest runs initially failed inside the sandbox with `spawn EPERM`; rerunning the same test command with escalation resolved it.
- `apply_patch` was unavailable because the Windows sandbox refresh failed, so file edits were completed through deterministic shell writes instead.
- One large shell write exceeded the Windows command-length limit; splitting the work into smaller targeted replacements resolved it without changing scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `sharedProgression.ts` now exposes the pure room-day primitives that 06-02 can call from the retro desk PC and Cozy Rest reward flows.
- The canonical state can now represent Together Days, featured ritual guidance, and once-per-day activity rewards without relying on ephemeral presence state.
- Remaining work for Phase 06 is integration and surfacing, not progression-schema invention.

---
*Phase: 06-ritual-variety-and-earn-loop-expansion*
*Completed: 2026-03-27*
