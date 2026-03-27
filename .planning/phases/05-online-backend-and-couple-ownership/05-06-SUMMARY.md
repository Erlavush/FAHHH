---
phase: 05-online-backend-and-couple-ownership
plan: 06
subsystem: room-interactions
tags: [furniture, beds, presence, interactions, tests]
requires:
  - phase: 05-online-backend-and-couple-ownership
    provides: shared presence pose payloads with bed slot identity
provides:
  - occupancy-aware bed-side selection
  - stable lie-slot propagation through shared presence
  - predictable full-bed rejection behavior
affects: [room-view-interactions, furniture-system, shared-presence-pose]
tech-stack:
  added: []
  patterns: [occupancy-aware interaction targeting, slot-aware pose payloads]
key-files:
  created: []
  modified:
    - src/lib/furnitureInteractions.ts
    - src/components/room-view/useRoomViewInteractions.ts
    - src/components/RoomView.tsx
    - tests/furnitureInteractions.test.ts
    - tests/sharedRoomPresenceUx.test.ts
key-decisions:
  - "Bed-side choice now comes from occupancy-aware targeting instead of always taking the first lie slot."
  - "The chosen slot travels through shared presence so both clients mirror the same bed side."
patterns-established:
  - "Furniture interaction targets can expose slot IDs and accept occupancy hints from runtime state."
  - "Shared presence pose payloads are now precise enough to mirror side-specific furniture interactions."
requirements-completed: [ROOM-05]
duration: 1 session
completed: 2026-03-27
---

# Phase 05 Plan 06 Summary

**Made shared bed use side-by-side by assigning lie slots from occupancy instead of forcing both partners into slot zero**

## Accomplishments
- Extended furniture interaction targeting so beds expose stable `primary` and `secondary` lie slots rather than one implicit pose.
- Wired room interactions to read occupied remote bed slots before selecting the local slot, which prevents overlap and makes full-bed behavior predictable.
- Propagated the selected bed slot through shared presence so remote rendering mirrors the same side choice on both clients.

## Task Commits

Wave 3 shipped inside the shared gap-closure commit because the slot-aware interaction logic and pose payload updates are coupled:

1. **Add occupancy-aware bed targeting and shared slot mirroring** - `74e66f9` (fix)

## Files Created/Modified
- `src/lib/furnitureInteractions.ts` - Slot-aware bed targeting with occupied-slot filtering and full-bed failure behavior.
- `src/components/room-view/useRoomViewInteractions.ts` - Runtime selection of the correct bed slot from shared presence occupancy.
- `src/components/RoomView.tsx` - Remote presence is now passed into interaction selection so beds can respect partner occupancy.
- `tests/furnitureInteractions.test.ts` - First-slot, second-slot, and no-slot-left coverage.
- `tests/sharedRoomPresenceUx.test.ts` - Shared presence pose retains bed `slotId` and `furnitureId`.

## Decisions Made
- Reused the existing bed offsets from the registry instead of inventing new furniture metadata, because the brownfield bed definitions already carried the right geometry.
- Treated a full bed as an explicit no-target case rather than silently overlapping or stealing the partner's slot.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None.

## Next Phase Readiness
- Two-person interaction work can now build on slot-aware furniture targeting instead of one shared pose per object.
- Shared presence carries enough pose detail to support more side-specific or paired interactions later.

---
*Phase: 05-online-backend-and-couple-ownership*
*Completed: 2026-03-27*
