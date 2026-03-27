---
phase: 05-online-backend-and-couple-ownership
plan: 03
subsystem: hosted-entry-and-runtime-bootstrap
tags: [firebase, auth, pair-link, player-shell, presence, tests]
requires:
  - phase: 05-online-backend-and-couple-ownership
    provides: hosted ownership/bootstrap contracts and firebase-backed room/presence adapters
provides:
  - auth-first shared-room runtime bootstrap
  - hosted Google sign-in and mutual link-confirm player flow
  - automatic paired-room re-entry with pending-link presence separation
affects: [shared-room-runtime, player-shell, presence-hook, hosted-entry]
tech-stack:
  added: []
  patterns: [auth-first bootstrap union, player-view-only hosted entry shell, pair-link presence separate from room presence]
key-files:
  created:
    - src/lib/sharedRoomOwnershipClient.ts
    - tests/sharedRoomEntryShell.test.tsx
  modified:
    - src/App.tsx
    - src/app/components/SharedRoomBlockingOverlay.tsx
    - src/app/components/SharedRoomEntryShell.tsx
    - src/app/hooks/useSharedRoomPresence.ts
    - src/app/hooks/useSharedRoomRuntime.ts
    - src/styles.css
    - tests/sharedRoomPresenceUx.test.ts
    - tests/sharedRoomRuntime.test.ts
key-decisions:
  - "Hosted sign-in and pair-linking stay inside Player View only; Developer View remains hidden until room bootstrap finishes."
  - "Room presence starts only after `room_ready`, while pending-link presence publishes separately during `pending_link` so linking does not impersonate in-room presence."
patterns-established:
  - "Runtime bootstrap is now driven by auth state and ownership lookup before any canonical room subscription begins."
  - "The hosted entry shell uses explicit signed-out, needs-linking, and pending-link states instead of reusing the old dev create/join copy."
requirements-completed: [PAIR-02, ROOM-05, ROOM-04]
duration: 1 session
completed: 2026-03-27
---

# Phase 05 Plan 03 Summary

**Made the hosted backend the shipped player entry flow without polluting the developer workspace**

## Accomplishments
- Reworked the shared-room runtime around auth-first bootstrap states so authenticated paired players now auto-load their canonical room while signed-out and unpaired players stop at the hosted entry shell first.
- Replaced the old create/join shell with a Google sign-in, partner-code submit, mutual confirm, and waiting flow that matches the exclusive couple-link contract.
- Kept room presence dormant until a room is actually ready, while pending-link presence now drives the confirm/waiting states without leaking linking state into in-room presence.

## Task Commits

Wave 3 was committed atomically:

1. **Implement hosted auth-first entry, mutual linking, and paired-room auto re-entry** - `4874c05` (feat)

## Files Created/Modified
- `src/lib/sharedRoomOwnershipClient.ts` - Ownership-store factory that selects the hosted Firebase adapter without pushing Firebase imports into the app shell.
- `src/app/hooks/useSharedRoomRuntime.ts` - Auth-first bootstrap, automatic paired-room load, hosted sign-in/sign-out, and mutual pair-link orchestration.
- `src/app/hooks/useSharedRoomPresence.ts` - Separation between pending-link presence and in-room room presence so room presence only starts after `room_ready`.
- `src/app/components/SharedRoomEntryShell.tsx` - Hosted player-facing sign-in, code entry, confirm-link, waiting, and sign-out states.
- `src/app/components/SharedRoomBlockingOverlay.tsx` - Hosted loading and verification-failure copy for room bootstrap failures.
- `src/App.tsx` - Player-shell wiring for the hosted entry flow, blocking overlays, and developer-workspace suppression until the room is ready.
- `src/styles.css` - Hosted entry-shell styling aligned with the room-first player shell.
- `tests/sharedRoomEntryShell.test.tsx` - Player entry-shell rendering coverage for signed-out, code-entry, and confirm-link states.
- `tests/sharedRoomRuntime.test.ts` - Hosted bootstrap, automatic paired-room re-entry, offline-partner room entry, and sign-out reset coverage.
- `tests/sharedRoomPresenceUx.test.ts` - Guard that room presence does not start before the room is ready.

## Decisions Made
- Kept hosted auth and linking inside the player shell only, because exposing that flow in Developer View would violate the Phase 03.1 split and add non-shipped clutter to the workbench.
- Added a small ownership client seam instead of importing the Firebase ownership adapter directly into the runtime hook, keeping the backend choice centralized beside the other shared-room clients.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed a hosted bootstrap resubscribe loop while moving room adoption behind auth state**
- **Found during:** Task 1 / Task 3 (auth-first runtime bootstrap and App wiring)
- **Issue:** The new hosted bootstrap path recreated the room-adoption helper whenever the local profile changed, which risked repeated ownership and room subscriptions during auth transitions.
- **Fix:** Moved profile reads behind a stable ref inside the room-adoption path so the hosted bootstrap effect no longer restarts just because convenience profile metadata changes.
- **Files modified:** `src/app/hooks/useSharedRoomRuntime.ts`
- **Verification:** `cmd /c npm test -- --maxWorkers 1 tests/sharedRoomRuntime.test.ts tests/sharedRoomPresenceUx.test.ts`, `cmd /c npm run build`, and `cmd /c npm test`
- **Committed in:** `4874c05`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The fix kept the new auth-driven bootstrap stable without widening scope beyond the intended hosted entry flow.

## Issues Encountered
None beyond the auto-fixed bootstrap loop.

## User Setup Required
- Set `VITE_SHARED_BACKEND=firebase` plus valid `VITE_FIREBASE_*` environment values to activate the hosted runtime outside the local/dev fallback path.

## Next Phase Readiness
- Phase 6 can build new ritual and earn-loop work on a couple-owned hosted room that already survives sign-in, linking, reconnect, and partner-offline re-entry.
- The shipped player shell and developer workspace remain cleanly separated, so follow-up player UX work has a stable surface to extend.

---
*Phase: 05-online-backend-and-couple-ownership*
*Completed: 2026-03-27*
