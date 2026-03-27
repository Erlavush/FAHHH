---
phase: 05-online-backend-and-couple-ownership
plan: 07
subsystem: presence-runtime
tags: [presence, shared-pet, motion, playback, tests]
requires:
  - phase: 05-online-backend-and-couple-ownership
    provides: hosted room ownership, canonical shared pet, and ephemeral presence transport
provides:
  - passive canonical shared-pet visibility
  - buffered partner playback
  - buffered shared-cat playback
  - richer shared-pet live-state payloads
affects: [shared-room-runtime, shared-presence, room-view, pet-runtime]
tech-stack:
  added:
    - src/lib/liveMotionPlayback.ts
  patterns: [passive canonical refresh, buffered replica playback, short-horizon dead reckoning]
key-files:
  created:
    - src/lib/liveMotionPlayback.ts
  modified:
    - src/app/hooks/useSharedRoomRuntime.ts
    - src/app/hooks/useSharedRoomPresence.ts
    - src/components/MinecraftPlayer.tsx
    - src/components/room-view/RoomPetActor.tsx
    - src/lib/sharedPresenceTypes.ts
    - src/lib/sharedPresenceValidation.ts
    - src/lib/sharedRoomPet.ts
    - tests/sharedRoomRuntime.test.ts
    - tests/sharedRoomPet.test.ts
    - tests/sharedRoomPresence.test.ts
    - tests/sharedRoomPresenceUx.test.ts
key-decisions:
  - "Canonical pet ownership stays in the room document, but passive browsers now poll that canonical room seam until the first shared cat appears."
  - "Partner and shared-cat replicas now consume the same buffered motion helper instead of chasing one latest target."
  - "Shared-pet live state now carries velocity so replica playback can interpolate and briefly extrapolate between snapshots."
patterns-established:
  - "Canonical room state can use a quiet passive refresh for low-frequency cross-client adoption visibility without moving live motion into the room document."
  - "Replica actors share one buffered playback contract, regardless of whether the actor is a player or the shared cat."
requirements-completed: [ROOM-04, ROOM-05]
duration: 1 session
completed: 2026-03-27
---

# Phase 05 Plan 07 Summary

**Closed the remaining shared-cat and replica-motion gaps by combining passive canonical refresh with buffered live playback**

## Accomplishments
- Added a passive room refresh path so a browser that is only observing the room still notices first-time shared-cat adoption from the canonical room document.
- Raised partner presence cadence and introduced a shared buffered-motion helper so remote avatars and the shared cat both replay movement from a short replica timeline instead of sparse snap targets.
- Extended shared-pet live state with velocity and tightened the pet broadcast cadence so cat replicas can animate from the same richer motion seam as partner replicas.

## Task Commits

Wave 1 shipped in one focused runtime commit because passive canonical sync, buffered playback, and live-state schema updates are coupled:

1. **Add passive shared-pet refresh and smoother replica playback** - `8ded933` (fix)

## Files Created/Modified
- `src/lib/liveMotionPlayback.ts` - Shared buffered interpolation and short extrapolation helper for remote replicas.
- `src/app/hooks/useSharedRoomRuntime.ts` - Quiet passive canonical poll until the shared pet appears on passive browsers.
- `src/app/hooks/useSharedRoomPresence.ts` - Higher-frequency publish/poll cadence for smoother partner motion.
- `src/components/MinecraftPlayer.tsx` - Remote players now sample buffered motion instead of relying on one latest-target lerp.
- `src/components/room-view/RoomPetActor.tsx` - Shared cat replicas now stay on the buffered playback path instead of resetting to every incoming snapshot.
- `src/lib/sharedPresenceTypes.ts`, `src/lib/sharedPresenceValidation.ts`, `src/lib/sharedRoomPet.ts` - Shared-pet live state now carries velocity safely through clone and validation seams.
- `tests/sharedRoomRuntime.test.ts`, `tests/sharedRoomPet.test.ts`, `tests/sharedRoomPresence.test.ts`, `tests/sharedRoomPresenceUx.test.ts` - Coverage for passive pet visibility, richer pet motion state, and buffered replica sampling.

## Decisions Made
- Kept first-adoption visibility canonical by polling the room document instead of inventing a local-only pet bootstrap path on the passive browser.
- Used one motion helper for players and pets so playback tuning stays coherent across the room.
- Limited the passive sync to the missing-shared-pet case so normal canonical room loading and conflict recovery stay unchanged.

## Deviations from Plan

None. The plan shipped as passive canonical sync plus buffered playback, with the final motion helper factored into a dedicated library file.

## Issues Encountered
- The initial playback helper used `Array.prototype.at`, which does not compile against the current app TypeScript target. That was replaced with index access before closeout.

## User Setup Required
None.

## Next Phase Readiness
- Manual retest can now focus on the visual feel of partner/cat playback rather than basic cross-client visibility.
- Future replica actors can reuse `liveMotionPlayback.ts` instead of inventing another one-off interpolation path.

---
*Phase: 05-online-backend-and-couple-ownership*
*Completed: 2026-03-27*
