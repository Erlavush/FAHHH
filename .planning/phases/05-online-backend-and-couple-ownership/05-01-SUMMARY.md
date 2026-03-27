---
phase: 05-online-backend-and-couple-ownership
plan: 01
subsystem: auth-and-ownership
tags: [firebase, auth, ownership, pair-link, shared-room, tests]
requires:
  - phase: 01-shared-room-backbone
    provides: shared room store/session boundaries and canonical room types
  - phase: 04-memories-pets-and-breakup-stakes
    provides: canonical room document now includes memories and shared pet state
provides:
  - explicit backend mode and Firebase config/auth helpers
  - hosted ownership bootstrap types and pair-link rule helpers
  - convenience-only local shared-room session semantics
affects: [shared-room-runtime, hosted-backend, auth-entry, phase-05-wave-2]
tech-stack:
  added: []
  patterns: [firebase uid as canonical player id, ownership bootstrap union, local session as convenience cache]
key-files:
  created:
    - src/lib/sharedBackendConfig.ts
    - src/lib/firebaseApp.ts
    - src/lib/firebaseAuth.ts
    - src/lib/sharedRoomOwnership.ts
    - src/lib/sharedRoomOwnershipStore.ts
    - tests/firebaseAuth.test.ts
    - tests/sharedRoomOwnership.test.ts
  modified:
    - .env.example
    - src/lib/sharedRoomTypes.ts
    - src/lib/sharedRoomSession.ts
    - tests/sharedRoomSession.test.ts
    - tests/sharedRoomTypes.test.ts
    - tests/sharedRoomRuntime.test.ts
key-decisions:
  - "Firebase Auth uid is now the canonical hosted player identity, and local profile storage only hydrates convenience fields around it."
  - "Hosted room entry is modeled as a bootstrap union of needs_linking, pending_link, and paired_room rather than overloading the old create/join dev flow."
patterns-established:
  - "Ownership rules are pure helpers first, so Firebase adapters can validate pair-link state without duplicating enforcement logic."
  - "Shared room session cache preserves room metadata and display-name continuity without silently inventing a second canonical player id."
requirements-completed: [PAIR-02, PAIR-03]
duration: 1 session
completed: 2026-03-27
---

# Phase 05 Plan 01 Summary

**Added Firebase auth/bootstrap contracts and pair-link ownership rules without letting local storage stay canonical**

## Accomplishments
- Added explicit backend selection plus lazy Firebase app/auth helpers for Google sign-in and auth-state subscription.
- Extended shared-room types with hosted membership, pending-link, and bootstrap state contracts, then locked the rules in pure ownership helpers and tests.
- Downgraded browser session/profile storage to convenience cache semantics so auth-derived ids can rehydrate the runtime without generating a new player identity.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add explicit backend config and Firebase Google-auth helpers first** - `eb62f4b` (feat)
2. **Task 2: Define the hosted ownership, bootstrap, and pending-link contract as pure domain types and rules** - `cddfebb` (feat)
3. **Task 3: Downgrade local session to convenience cache and prepare runtime-facing identity helpers** - `68a6471` (feat)

## Files Created/Modified
- `src/lib/sharedBackendConfig.ts` - Central backend-mode parsing and Firebase env validation.
- `src/lib/firebaseApp.ts` - Lazy Firebase app bootstrap.
- `src/lib/firebaseAuth.ts` - Google sign-in, sign-out, auth subscription, and Firebase-user to shared-profile mapping.
- `src/lib/sharedRoomOwnership.ts` - Pure pair-link normalization, readiness, bootstrap derivation, and membership-availability rules.
- `src/lib/sharedRoomOwnershipStore.ts` - Hosted ownership/bootstrap store contract for later Firebase adapters.
- `src/lib/sharedRoomTypes.ts` - Membership, pending-link, and hosted bootstrap type additions.
- `src/lib/sharedRoomSession.ts` - Canonical auth-id hydration while keeping local room/session data convenience-only.
- `tests/firebaseAuth.test.ts` - Backend-mode and Firebase auth helper coverage.
- `tests/sharedRoomOwnership.test.ts` - Pair-link exclusivity, readiness, and bootstrap-state coverage.
- `tests/sharedRoomSession.test.ts` - Canonical auth-id hydration and session-cache semantics coverage.

## Decisions Made
- Required complete Firebase config before honoring `VITE_SHARED_BACKEND=firebase`, so local development cannot accidentally enter a half-configured hosted mode.
- Added optional display-name metadata to pending links now, because the hosted confirm screen will need both participant names in Wave 3.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stabilized date-sensitive runtime fixtures while shifting to auth-derived ids**
- **Found during:** Task 3 (Downgrade local session to convenience cache and prepare runtime-facing identity helpers)
- **Issue:** Existing runtime assertions assumed a hardcoded `player-1` identity and one partial-ritual reload fixture used yesterday's day key, which breaks once auth-derived ids and real current dates are in play.
- **Fix:** Updated runtime fixtures to seed explicit auth-style player ids and aligned the partial-ritual test fixture to the current day.
- **Files modified:** `tests/sharedRoomRuntime.test.ts`
- **Verification:** `cmd /c npm test -- --maxWorkers 1 tests/sharedRoomSession.test.ts tests/sharedRoomRuntime.test.ts`
- **Committed in:** `68a6471`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The fix kept Wave 1 test coverage valid under the new hosted identity model without expanding scope.

## Issues Encountered
None.

## User Setup Required
None.

## Next Phase Readiness
- Firebase-backed room, ownership, and presence adapters can now target stable auth and ownership contracts instead of reverse-engineering them from the old dev create/join flow.
- Wave 2 still needs the actual Firestore/RTDB implementations and backend selection wiring; no hosted persistence exists yet.

---
*Phase: 05-online-backend-and-couple-ownership*
*Completed: 2026-03-27*
