---
phase: 05-online-backend-and-couple-ownership
plan: 05
subsystem: live-sync-and-shared-pet
tags: [firebase, presence, pet, motion, interpolation, tests]
requires:
  - phase: 05-online-backend-and-couple-ownership
    provides: explicit runtime entry modes and stable hosted presence seams
provides:
  - ephemeral shared pet live-state sync
  - richer remote actor motion payloads
  - room presence updates that avoid canonical room revision churn
affects: [presence-store, room-view, remote-avatars, shared-pet]
tech-stack:
  added: []
  patterns: [ephemeral motion contract, authoritative live pet replica path, predicted remote-motion interpolation]
key-files:
  created: []
  modified:
    - src/lib/sharedPresenceTypes.ts
    - src/lib/sharedPresenceValidation.ts
    - src/lib/firebasePresenceStore.ts
    - scripts/sharedRoomDevPlugin.mjs
    - src/app/hooks/useSharedRoomPresence.ts
    - src/App.tsx
    - src/components/RoomView.tsx
    - src/components/MinecraftPlayer.tsx
    - src/lib/sharedRoomPet.ts
    - src/components/room-view/RoomPetActor.tsx
    - tests/sharedRoomPresence.test.ts
    - tests/sharedRoomPresenceUx.test.ts
    - tests/sharedRoomPet.test.ts
key-decisions:
  - "Shared cat behavior and remote locomotion stay on the ephemeral presence channel instead of canonical room revisions."
  - "One client can simulate the shared cat authoritatively while other clients render from replicated live state."
patterns-established:
  - "Room presence snapshots now carry motion and shared-pet live state without mutating canonical room documents."
  - "Remote avatars render from predicted motion data rather than simple target snapping."
requirements-completed: [ROOM-04, ROOM-05]
duration: 1 session
completed: 2026-03-27
---

# Phase 05 Plan 05 Summary

**Turned partner motion and the shared cat into one live ephemeral layer instead of two drifting local simulations**

## Accomplishments
- Extended the presence contract with remote motion payloads and shared-pet live state while keeping those updates out of canonical room revision churn.
- Wired RoomView, MinecraftPlayer, and RoomPetActor to consume the richer live-state seam so partner movement reads as walking and the starter cat stays aligned across clients.
- Preserved brownfield boundaries by keeping the new fidelity inside presence adapters and room-runtime consumers rather than leaking it into room commits.

## Task Commits

Wave 2 shipped inside the shared gap-closure commit because the new motion contract, runtime wiring, and tests all depend on the same live-state payload:

1. **Add shared pet live sync and smoother remote actor motion** - `74e66f9` (fix)

## Files Created/Modified
- `src/lib/sharedPresenceTypes.ts` - Ephemeral motion and shared-pet live-state fields.
- `src/lib/sharedPresenceValidation.ts` - Backward-compatible normalization for new motion and pet state payloads.
- `src/lib/firebasePresenceStore.ts` - Hosted presence persistence for per-player presence plus shared-pet live state.
- `scripts/sharedRoomDevPlugin.mjs` - Dev presence persistence updated to mirror the richer live-state payload.
- `src/app/hooks/useSharedRoomPresence.ts` - Higher-frequency publishing plus shared-pet live-state transport.
- `src/App.tsx` - Shared-pet authority seeding and live-state wiring into the room runtime.
- `src/components/RoomView.tsx` - Remote motion and shared-pet live-state plumbing into room actors.
- `src/components/MinecraftPlayer.tsx` - Predicted remote motion and walking presentation between presence updates.
- `src/lib/sharedRoomPet.ts` - Clone/create helpers for shared-pet live state.
- `src/components/room-view/RoomPetActor.tsx` - Authority/replica split for one shared cat simulation.
- `tests/sharedRoomPresence.test.ts` - Guard that live-state updates do not mutate canonical room revisions.
- `tests/sharedRoomPresenceUx.test.ts` - Remote motion and shared pose payload coverage.
- `tests/sharedRoomPet.test.ts` - Shared-pet live-state helper and persistence coverage.

## Decisions Made
- Kept cat wander state ephemeral because pet motion is live presentation, not a canonical room-edit event.
- Published enough motion intent to smooth the remote avatar without attempting to build a full rollback or deterministic networked movement system in this milestone.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Guarded shared-pet authority seeding against null runtime pet snapshots**
- **Found during:** Task 2 (runtime wiring in `App.tsx`)
- **Issue:** The first build surfaced a nullability failure when the room runtime had not loaded a shared pet yet but the new authority-seeding effect tried to read it as present.
- **Fix:** Hoisted a narrowed shared-runtime pet reference before seeding local live state so the effect only derives authority state when a shared pet actually exists.
- **Files modified:** `src/App.tsx`
- **Verification:** `cmd /c npm run build`, `cmd /c npm test`
- **Committed in:** `74e66f9`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The fix stayed inside the planned live-sync wiring and prevented a bootstrap-time nullability regression.

## Issues Encountered
- The shared-pet authority bootstrap needed one extra null guard to satisfy the TypeScript build once the runtime wiring was complete.

## User Setup Required
None beyond the Phase 5 Firebase configuration already documented.

## Next Phase Readiness
- Shared live actors now have a stable ephemeral contract that later ritual or pet-depth work can reuse.
- The room runtime can add more co-present behavior without polluting canonical room documents or edit revision counts.

---
*Phase: 05-online-backend-and-couple-ownership*
*Completed: 2026-03-27*
