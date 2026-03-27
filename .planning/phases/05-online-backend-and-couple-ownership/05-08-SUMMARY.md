---
phase: 05-online-backend-and-couple-ownership
plan: 08
subsystem: room-interactions
tags: [furniture, beds, interactions, presence, tests]
requires:
  - phase: 05-online-backend-and-couple-ownership
    provides: occupancy-aware bed slot identity and shared presence pose mirroring
provides:
  - widened bed-side geometry
  - visibly separated two-player lie targets
  - bed-slot regression coverage against overlap
affects: [furniture-registry, room-interactions, shared-presence-pose]
tech-stack:
  added: []
  patterns: [geometry retune, slot-preserving pose mirroring]
key-files:
  created: []
  modified:
    - src/lib/furnitureRegistry.ts
    - tests/furnitureInteractions.test.ts
    - tests/sharedRoomPresenceUx.test.ts
key-decisions:
  - "The bed fix is geometric, not architectural: preserve the slot-aware presence seam and widen the actual lie lanes in the furniture registry."
  - "Both bed slots now share one mattress lane depth so the room reads as side-by-side sleeping instead of offset stacking."
patterns-established:
  - "When slot selection already exists, finish overlap bugs by retuning the source furniture geometry before adding another runtime seam."
requirements-completed: [ROOM-05]
duration: 1 session
completed: 2026-03-27
---

# Phase 05 Plan 08 Summary

**Finished the bed-sharing fix by turning the bed into two real left/right lie lanes instead of one side lane plus one center lane**

## Accomplishments
- Retuned the bed registry so the two lie slots are mirrored around the mattress center and use the same depth, which produces visibly separate left/right sleep positions.
- Tightened the bed interaction tests so slot spacing, approach geometry, and second-player slot selection are asserted from the retuned registry values.
- Reused the existing shared presence slot mirroring instead of adding another bed-specific runtime path, because the pose seam from Plan 06 was already correct.

## Task Commits

Wave 2 shipped inside the same fix commit as Plan 07 because the final UAT gap closure needed both smoother replica playback and the widened bed geometry:

1. **Retune bed-side geometry and finalize overlap fix** - `8ded933` (fix)

## Files Created/Modified
- `src/lib/furnitureRegistry.ts` - Mirrored bed interaction offsets now map to two real mattress sides.
- `tests/furnitureInteractions.test.ts` - Stronger bed-slot separation, approach-position, and second-slot regression coverage.
- `tests/sharedRoomPresenceUx.test.ts` - Existing slot-mirroring coverage remains the proof that shared presence preserves the chosen bed side end to end.

## Decisions Made
- Solved the remaining overlap at the furniture definition layer because slot-aware targeting and shared presence propagation were already correct after Plan 06.
- Kept the lie pose seam stable in `MinecraftPlayer.tsx`; changing registry geometry was enough to preserve slot mirroring while separating the avatars.

## Deviations from Plan

None. The plan closed by retuning bed geometry and strengthening the regression coverage around the existing slot-mirroring path.

## Issues Encountered
None.

## User Setup Required
None.

## Next Phase Readiness
- Manual retest can now validate the visual result directly in the room instead of debugging slot identity.
- Future paired interactions can follow the same pattern: pick a slot in interaction targeting, then let shared presence mirror it.

---
*Phase: 05-online-backend-and-couple-ownership*
*Completed: 2026-03-27*
