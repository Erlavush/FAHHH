---
phase: 02-live-presence-and-co-op-consistency
plan: 02
subsystem: runtime
tags: [react, vite, shared-room, presence, dev-bypass]
requires:
  - phase: 02-live-presence-and-co-op-consistency
    provides: dedicated presence transport and remote avatar rendering
provides:
  - deterministic development shared-room bootstrap
  - runtime dev bypass with retry-safe auto-entry
  - subtle shipped-build partner join, leave, and reconnect status UX
  - regression coverage for presence freshness-driven copy
affects: [02-03, shared-room-runtime, shared-room-dev-plugin, presence-ux]
tech-stack:
  added: []
  patterns: [deterministic dev bootstrap, non-blocking presence status, freshness-driven UX]
key-files:
  created:
    - tests/sharedRoomPresenceUx.test.ts
  modified:
    - scripts/sharedRoomDevPlugin.mjs
    - src/App.tsx
    - src/app/components/SharedRoomStatusStrip.tsx
    - src/app/hooks/useSharedRoomPresence.ts
    - src/app/hooks/useSharedRoomRuntime.ts
    - src/lib/sharedRoomClient.ts
    - src/lib/sharedRoomStore.ts
    - src/styles.css
    - tests/sharedRoomRuntime.test.ts
    - tests/sharedRoomStore.test.ts
key-decisions:
  - "Development bypass now boots one deterministic room directly instead of flashing the pairing shell during iteration."
  - "Presence freshness, not canonical room revisions, drives waiting, joined, reconnecting, and returned partner copy."
patterns-established:
  - "Shared-room runtime can bootstrap a development-only session without branching the shipped pairing flow."
  - "Partner status UX stays local, compact, and non-blocking while canonical room save/reload states still override the strip when needed."
requirements-completed: [PRES-02]
duration: 17 min
completed: 2026-03-26
---

# Phase 02 Plan 02: Presence UX and Dev Bypass Summary

**Deterministic development room entry plus subtle shipped-build partner join, leave, and reconnect status UX**

## Performance

- **Duration:** 17 min
- **Started:** 2026-03-26T23:30:12+08:00
- **Completed:** 2026-03-26T23:47:29+08:00
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Added a deterministic `dev-shared-room` bootstrap path and `/api/dev/shared-room/dev-bootstrap` endpoint so development builds enter one reusable shared room immediately.
- Updated `useSharedRoomRuntime` and `App.tsx` to auto-enter that room in development, hide the temporary entry/status surfaces while bypass is active, and retry bootstrap safely when no shared session exists yet.
- Added presence freshness-driven status copy and shipped-build status-strip styling for `Waiting for partner`, `Partner joined`, `Partner reconnecting`, `Partner is back`, and `Together now`, with regression coverage around reconnect behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add deterministic development bootstrap for the shared room** - `48589a3` (feat)
2. **Task 2: Auto-enter the dev room and hide temporary player-facing surfaces during development** - `b232f90` (feat)
3. **Task 3: Add subtle join, leave, and reconnect presence status UX** - `e3f8085` (feat)

**Plan metadata:** recorded in the follow-up docs commit for this plan.

## Files Created/Modified

- `src/lib/sharedRoomStore.ts` - Added `bootstrapDevSharedRoom` store support for deterministic development entry.
- `src/lib/sharedRoomClient.ts` - Added the browser client request targeting `/api/dev/shared-room/dev-bootstrap`.
- `scripts/sharedRoomDevPlugin.mjs` - Added deterministic development room bootstrap behavior and third-player rejection.
- `src/app/hooks/useSharedRoomRuntime.ts` - Added runtime dev bypass entry, retry-safe bootstrap, and guardrails against duplicate bootstrap requests.
- `src/App.tsx` - Hid temporary pairing/status surfaces while dev bypass is active and passed through presence status copy.
- `src/app/hooks/useSharedRoomPresence.ts` - Derived freshness-based partner presence status titles and bodies.
- `src/app/components/SharedRoomStatusStrip.tsx` - Rendered compact presence-mode status copy while preserving canonical save/reload messaging.
- `src/styles.css` - Added dedicated presence strip styling and success/attention variants.
- `tests/sharedRoomStore.test.ts` - Covered deterministic dev bootstrap and third-partner rejection.
- `tests/sharedRoomRuntime.test.ts` - Covered automatic dev room entry.
- `tests/sharedRoomPresenceUx.test.ts` - Covered non-blocking reconnect UX and freshness-driven status transitions.

## Decisions Made

- Kept development bypass inside the existing shared-room runtime instead of creating a separate dev-only runtime path, so shipped builds still exercise the real pairing flow.
- Let canonical save/reload messages override the presence strip only when the room itself is syncing; all partner join/leave/reconnect messaging remains presence-driven and non-blocking.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Prevent repeated dev bootstrap requests on unstable rerenders**
- **Found during:** Task 2 (Auto-enter the dev room and hide temporary player-facing surfaces during development)
- **Issue:** The dev bootstrap path could be retriggered repeatedly before session state landed if the bootstrap source props were unstable across rerenders.
- **Fix:** Added a request-in-flight guard in `useSharedRoomRuntime` and let `reloadRoom` retry the bootstrap path when no session exists yet.
- **Files modified:** `src/app/hooks/useSharedRoomRuntime.ts`, `tests/sharedRoomRuntime.test.ts`
- **Verification:** `cmd /c npm test -- --maxWorkers 1 tests/sharedRoomRuntime.test.ts`
- **Committed in:** `b232f90` (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Minor runtime hardening only. No scope creep and no change to the plan outcome.

## Issues Encountered

- The default Vitest worker settings exhausted Node heap on Windows for the jsdom runtime suite. Verification passed with `cmd /c npm test -- --maxWorkers 1 ...`.

## User Setup Required

None - development bypass remains local to the existing dev backend.

## Next Phase Readiness

- `02-03` can extend the same presence boundary with soft same-item edit locks instead of introducing a second concurrency transport.
- Canonical reload messaging is already in place, so stale same-item conflicts can recover through the existing shared-room reload surface.

---
*Phase: 02-live-presence-and-co-op-consistency*
*Completed: 2026-03-26*
