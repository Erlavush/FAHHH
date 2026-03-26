---
phase: 02-live-presence-and-co-op-consistency
plan: 01
subsystem: ui
tags: [react, vite, shared-room, presence, r3f]
requires:
  - phase: 01-shared-room-backbone
    provides: canonical shared-room load and commit authority
provides:
  - dedicated shared presence transport and validation
  - runtime presence publishing and polling hook
  - remote partner avatar rendering in the live room
  - regression coverage proving presence stays outside room revisions
affects: [02-02, 02-03, shared-room-runtime, room-view]
tech-stack:
  added: []
  patterns: [dedicated presence boundary, read-only remote avatar rendering]
key-files:
  created:
    - src/lib/sharedPresenceStore.ts
    - src/lib/sharedPresenceClient.ts
    - src/lib/sharedPresenceValidation.ts
    - src/app/hooks/useSharedRoomPresence.ts
    - tests/sharedRoomPresence.test.ts
  modified:
    - scripts/sharedRoomDevPlugin.mjs
    - src/components/MinecraftPlayer.tsx
    - src/components/RoomView.tsx
    - src/components/room-view/useRoomViewInteractions.ts
    - src/App.tsx
key-decisions:
  - "Presence transport stays separate from SharedRoomStore commits and never mutates the canonical room revision."
  - "MinecraftPlayer now supports a read-only remote mode so the partner avatar reuses the same visual rig without owning local movement."
patterns-established:
  - "Shared presence uses its own typed store/client/validation boundary beside the canonical room store."
  - "RoomView emits a richer local presence snapshot and consumes a remote presence snapshot without feeding authority back into room state."
requirements-completed: [PRES-01]
duration: 13 min
completed: 2026-03-26
---

# Phase 02 Plan 01: Live Presence Transport Summary

**Separate shared presence channel with remote partner avatar rendering, synced facing, and pose-aware room presence**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-26T23:15:00+08:00
- **Completed:** 2026-03-26T23:28:19+08:00
- **Tasks:** 3
- **Files modified:** 13

## Accomplishments

- Added a dedicated shared presence contract, client, store, and validation path that stays independent from canonical room commits.
- Extended the live room runtime to publish local position, facing, activity, and pose state through `useSharedRoomPresence`.
- Rendered a read-only remote partner avatar in `RoomView` and added regression tests proving presence updates do not touch room revisions.

## Task Commits

Each task was committed atomically:

1. **Task 1: Define the live presence contract and validation boundary** - `907f843` (feat)
2. **Task 2: Add the dev presence backend and runtime-facing local presence snapshots** - `9f51b10` (feat)
3. **Task 3: Render the remote partner avatar and add presence regression coverage** - `2b90d2b` (feat)

**Plan metadata:** recorded in the follow-up docs commit for this plan.

## Files Created/Modified

- `src/lib/sharedPresenceTypes.ts` - Presence snapshot, pose, and request/response transport types.
- `src/lib/sharedPresenceValidation.ts` - Independent presence payload validation and normalization.
- `src/lib/sharedPresenceStore.ts` - Replaceable presence-store interface for upsert/load/leave calls.
- `src/lib/sharedPresenceClient.ts` - Browser presence client targeting the new `/api/dev/shared-room/presence/*` endpoints.
- `src/app/hooks/useSharedRoomPresence.ts` - Local publish and room-poll orchestration plus remote partner selection.
- `scripts/sharedRoomDevPlugin.mjs` - Dev backend presence persistence and endpoints kept separate from canonical room commits.
- `src/components/MinecraftPlayer.tsx` - Shared local/remote avatar renderer with transform reporting and partner name labels.
- `src/components/RoomView.tsx` - Local presence emission and remote avatar rendering.
- `src/components/room-view/useRoomViewInteractions.ts` - Presence-friendly activity state derivation.
- `src/App.tsx` - Shared-room presence wiring once the canonical room is loaded.
- `tests/sharedRoomPresence.test.ts` - Regression coverage for presence transport and room revision safety.

## Decisions Made

- Kept presence transport fully separate from the Phase 1 `SharedRoomStore` boundary so movement/activity updates cannot spam or mutate canonical room documents.
- Reused `MinecraftPlayer` for both local and remote actors by adding a remote read-only mode instead of creating a second avatar implementation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added in-scene nameplate styling for remote presence**
- **Found during:** Task 3 (Render the remote partner avatar and add presence regression coverage)
- **Issue:** The remote avatar label needed explicit styling to stay readable over the live room background.
- **Fix:** Added a dedicated `.minecraft-player__nameplate` treatment in `src/styles.css`.
- **Files modified:** `src/styles.css`
- **Verification:** `cmd /c npm run build`
- **Committed in:** `2b90d2b` (part of Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Minor readability fix only. No scope creep and no change to the plan outcome.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `02-02` can build partner join/leave/reconnect UX on top of the new presence hook and dev backend endpoints.
- `02-03` can extend the shared presence boundary with same-item edit locks instead of creating a second multiplayer transport path.

---
*Phase: 02-live-presence-and-co-op-consistency*
*Completed: 2026-03-26*
