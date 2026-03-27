---
phase: 05-online-backend-and-couple-ownership
plan: 02
subsystem: hosted-backend
tags: [firebase, firestore, realtime-database, shared-room, presence, pair-link, tests]
requires:
  - phase: 05-online-backend-and-couple-ownership
    provides: firebase auth config, ownership bootstrap contract, and convenience-only local session cache
provides:
  - Firestore-backed ownership and canonical room adapters
  - Realtime Database-backed room presence, edit-lock, and pair-link presence adapters
  - backend-mode client switching between dev and firebase store implementations
affects: [shared-room-runtime, auth-entry, presence-hook, phase-05-wave-3]
tech-stack:
  added: []
  patterns: [memory-backed adapter testing for hosted stores, firestore canonical plus rtdb ephemeral split, backend mode selected in client factories]
key-files:
  created:
    - src/lib/firebaseOwnershipStore.ts
    - src/lib/firebaseRoomStore.ts
    - src/lib/firebasePresenceStore.ts
    - tests/firebaseOwnershipStore.test.ts
  modified:
    - src/lib/sharedRoomClient.ts
    - src/lib/sharedPresenceClient.ts
    - src/lib/sharedRoomValidation.ts
    - src/lib/sharedPresenceTypes.ts
    - src/lib/sharedPresenceStore.ts
    - src/lib/sharedPresenceValidation.ts
    - tests/sharedRoomStore.test.ts
    - tests/sharedRoomPresence.test.ts
    - tests/sharedRoomEditLocks.test.ts
    - tests/sharedRoomPresenceUx.test.ts
key-decisions:
  - "Hosted adapters are tested through injected in-memory databases first, so room/presence contracts stay stable without needing live Firebase during unit runs."
  - "The runtime keeps one canonical seam per concern: Firestore owns room and ownership documents, while RTDB owns presence, locks, and pending-link presence."
patterns-established:
  - "Hosted ownership finalization creates the starter room, memberships, and shared cat in one adapter transaction boundary."
  - "Client modules choose backend mode centrally, leaving hooks and shell code free of Firebase-specific branching."
requirements-completed: [ROOM-04, PAIR-03]
duration: 1 session
completed: 2026-03-27
---

# Phase 05 Plan 02 Summary

**Added hosted Firestore room ownership plus RTDB presence adapters behind the existing shared-room and presence seams**

## Accomplishments
- Added Firebase ownership and room adapters that can bootstrap pair codes, finalize a trusted starter room, and load/commit canonical room documents.
- Added Firebase presence adapters for room presence, edit locks, and pair-link presence while keeping that ephemeral state separate from room revisions.
- Switched the shared room and presence clients to explicit backend-mode selection, keeping the dev adapters as a fallback without leaking Firebase logic into the app shell.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build the Firestore ownership and canonical room adapters with atomic pair finalization** - `543c761` (feat)
2. **Task 2: Build the Realtime Database presence, linking presence, and edit-lock adapter** - `3def663` (feat)
3. **Task 3: Wire backend selection so the runtime can switch from dev adapters to hosted adapters explicitly** - `9103d71` (feat)

## Files Created/Modified
- `src/lib/firebaseOwnershipStore.ts` - Hosted pair-code, pending-link, membership, and starter-room finalization adapter.
- `src/lib/firebaseRoomStore.ts` - Hosted canonical room load/commit adapter.
- `src/lib/firebasePresenceStore.ts` - Hosted presence, edit-lock, and pair-link presence adapter with RTDB cleanup hooks.
- `src/lib/sharedRoomClient.ts` - Backend-mode selection between dev and firebase room stores.
- `src/lib/sharedPresenceClient.ts` - Backend-mode selection between dev and firebase presence stores.
- `src/lib/sharedRoomValidation.ts` - Membership and pending-link validation helpers for hosted data.
- `src/lib/sharedPresenceTypes.ts` - Pair-link presence shapes.
- `tests/firebaseOwnershipStore.test.ts` - Hosted ownership/finalization regression coverage.
- `tests/sharedRoomPresence.test.ts` - Hosted presence and pair-link presence regression coverage.

## Decisions Made
- Kept the dev fetch clients exported as the old factory names so existing tests and fallback code paths did not need a second refactor just to gain backend-mode selection.
- Added no-op pair-link presence methods on the dev presence client because the new interface is broader than the legacy dev transport, but pending-link presence is only meaningful in hosted mode.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed hosted adapter timestamp normalization for fake-timer and TTL correctness**
- **Found during:** Task 2 (Build the Realtime Database presence, linking presence, and edit-lock adapter)
- **Issue:** The new hosted timestamp helper treated millisecond inputs like strings, which made pending-link expiry and lock TTL behavior inconsistent under fake timers.
- **Fix:** Broadened timestamp normalization to handle strings, numbers, and `Date` objects consistently across Firebase ownership, room, and presence adapters.
- **Files modified:** `src/lib/firebaseOwnershipStore.ts`, `src/lib/firebaseRoomStore.ts`, `src/lib/firebasePresenceStore.ts`
- **Verification:** `cmd /c npm test -- --maxWorkers 1 tests/sharedRoomPresence.test.ts tests/sharedRoomEditLocks.test.ts` and `cmd /c npm run build`
- **Committed in:** `3def663`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The fix was necessary for correct hosted TTL semantics and did not change the planned adapter scope.

## Issues Encountered
None.

## User Setup Required
None.

## Next Phase Readiness
- The hosted data layer is now available behind the existing store seams, so Wave 3 can switch the runtime and player entry shell to auth-first bootstrap states.
- The shipped player flow still uses the old local/dev entry assumptions; auth/bootstrap UX is not wired yet.

---
*Phase: 05-online-backend-and-couple-ownership*
*Completed: 2026-03-27*
