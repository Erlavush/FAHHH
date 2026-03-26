---
phase: 02-live-presence-and-co-op-consistency
plan: 03
subsystem: runtime
tags: [react, vite, shared-room, locks, convergence]
requires:
  - phase: 02-live-presence-and-co-op-consistency
    provides: live presence transport and presence-driven room status UX
provides:
  - TTL-based same-item edit-lock transport
  - lock-aware furniture editor lifecycle with busy-item cues
  - canonical reload recovery for stale shared edits
  - regression coverage for lock expiry, busy-item UX, and stale reload convergence
affects: [phase-02-complete, shared-room-runtime, room-view, shared-presence]
tech-stack:
  added: []
  patterns: [ttl soft locks, local busy-item feedback, canonical reload recovery]
key-files:
  created:
    - tests/sharedRoomEditLocks.test.ts
  modified:
    - scripts/sharedRoomDevPlugin.mjs
    - src/App.tsx
    - src/app/hooks/useSharedRoomPresence.ts
    - src/app/hooks/useSharedRoomRuntime.ts
    - src/components/RoomView.tsx
    - src/components/room-view/EditDock.tsx
    - src/components/room-view/RoomFurnitureLayer.tsx
    - src/components/room-view/RoomSelectedFurnitureLayer.tsx
    - src/components/room-view/useRoomFurnitureEditor.ts
    - src/lib/sharedPresenceClient.ts
    - src/lib/sharedPresenceStore.ts
    - src/lib/sharedPresenceTypes.ts
    - src/lib/sharedPresenceValidation.ts
    - src/styles.css
    - tests/sharedRoomPresenceUx.test.ts
    - tests/useRoomFurnitureEditor.test.ts
key-decisions:
  - "Same-item edit locks live beside shared presence and canonical room documents instead of mutating room revisions."
  - "When a local same-item edit assumption goes stale, the runtime reloads the canonical room instead of preserving a drifting draft."
patterns-established:
  - "Shared-room presence now owns both avatar freshness and per-item lock polling, while the editor consumes a focused lock-aware boundary."
  - "Busy-item feedback stays in-scene and in-dock, while true recovery still reuses the existing canonical `Reloading latest room...` flow."
requirements-completed: [PRES-03]
duration: 18 min
completed: 2026-03-27
---

# Phase 02 Plan 03: Edit Lock and Convergence Summary

**Soft same-item locks, local busy-item cues, and canonical reload recovery for stale shared edits**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-26T23:47:29+08:00
- **Completed:** 2026-03-27T00:05:46+08:00
- **Tasks:** 3
- **Files modified:** 17

## Accomplishments

- Added a separate lock transport beside shared presence with typed lock payloads, validation, client/store methods, and Vite dev backend endpoints backed by a `locksByRoom` collection and a 5000 ms TTL.
- Wired the furniture editor lifecycle to acquire, renew, and release same-item locks while keeping different-item edits available, marking partner-held items with the existing blocked visual path, and surfacing `Your partner is editing this item` plus `Try another item or wait a moment.` in the edit dock.
- Added canonical reload recovery through the shared-room runtime so stale lock assumptions and lost same-item edit ownership recover through `Reloading latest room...` instead of leaving the local room draft drifting from the authoritative room.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend the presence boundary with soft same-item lock transport** - `bcb26b0` (feat)
2. **Task 2: Wire same-item locks into the furniture editor lifecycle and busy cues** - `9d17885` (feat)
3. **Task 3: Add canonical resync behavior and concurrent-edit regression tests** - `0ef47f1` (feat)

**Plan metadata:** recorded in the follow-up docs commit for this plan.

## Files Created/Modified

- `src/lib/sharedPresenceTypes.ts` - Added typed lock payloads and lock-room snapshot types.
- `src/lib/sharedPresenceValidation.ts` - Added validation for lock payloads and lock snapshot responses.
- `src/lib/sharedPresenceStore.ts` - Extended the shared presence boundary with load/acquire/renew/release lock methods.
- `src/lib/sharedPresenceClient.ts` - Added browser routes for the shared-room lock endpoints.
- `scripts/sharedRoomDevPlugin.mjs` - Added `locksByRoom`, TTL expiry pruning, and `/api/dev/shared-room/locks/*` endpoints without touching canonical room revisions.
- `src/app/hooks/useSharedRoomPresence.ts` - Polled room locks alongside partner presence and exposed partner/local lock sets plus acquire/renew/release helpers.
- `src/components/room-view/useRoomFurnitureEditor.ts` - Added lock-aware selection, renewal, release, busy-item state, and stale-edit recovery hooks.
- `src/components/RoomView.tsx` - Threaded lock state and stale-edit recovery through the live room.
- `src/components/room-view/RoomFurnitureLayer.tsx` - Reused the blocked-item path for partner-held locks on unselected furniture.
- `src/components/room-view/RoomSelectedFurnitureLayer.tsx` - Disabled confirm and showed blocked state when the selected item becomes partner-held.
- `src/components/room-view/EditDock.tsx` - Rendered the busy-item title and helper copy inline instead of escalating to a modal.
- `src/app/hooks/useSharedRoomRuntime.ts` - Exposed a dedicated stale-edit recovery callback that reuses canonical reload.
- `src/App.tsx` - Routed stale shared-edit recovery back into the runtime and passed lock state into `RoomView`.
- `src/styles.css` - Added `.room-item-busy` styling for the lightweight same-item lock explanation.
- `tests/sharedRoomEditLocks.test.ts` - Added regression coverage for lock expiry and stale canonical reload recovery.
- `tests/useRoomFurnitureEditor.test.ts` - Proved different-item edits stay available and busy-item state clears once the partner-held lock releases.
- `tests/sharedRoomPresenceUx.test.ts` - Updated presence hook mocks to cover the expanded presence/lock store contract.

## Decisions Made

- Kept soft edit locks in the same replaceable presence boundary as avatar freshness so future backend swaps do not have to reach into `RoomState` or canonical commit payloads.
- Reused the Phase 1 canonical reload path for stale same-item recovery instead of pretending to merge conflicting local drafts client-side.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Gate lock enforcement behind an actual shared-locking context**
- **Found during:** Task 2 (Wire same-item locks into the furniture editor lifecycle and busy cues)
- **Issue:** The editor would otherwise treat every selected committed item as stale in local tests or non-locking contexts where no shared lock transport was passed in.
- **Fix:** Added an explicit shared-locking gate so lock renew/stale recovery only run when the shared lock boundary is actually active.
- **Files modified:** `src/components/room-view/useRoomFurnitureEditor.ts`, `tests/useRoomFurnitureEditor.test.ts`
- **Verification:** `cmd /c npm test -- --maxWorkers 1 tests/useRoomFurnitureEditor.test.ts`
- **Committed in:** `9d17885` (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Minor guardrail only. No scope creep and no change to the plan outcome.

## Issues Encountered

- The Windows jsdom Vitest runs still required `--maxWorkers 1` to avoid the Node heap issue seen earlier in Phase 2 verification.

## User Setup Required

None - lock transport remains fully local to the existing dev shared-room backend.

## Next Phase Readiness

- Phase 2 is complete: avatar presence, partner status UX, deterministic dev bypass, and same-item convergence behavior are now all in place.
- Phase 3 can now focus on progression and ritual systems without reopening shared-room transport or concurrency foundations.

---
*Phase: 02-live-presence-and-co-op-consistency*
*Completed: 2026-03-27*
