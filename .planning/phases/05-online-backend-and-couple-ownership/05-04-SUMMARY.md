---
phase: 05-online-backend-and-couple-ownership
plan: 04
subsystem: runtime-bootstrap-and-presence-ux
tags: [firebase, player-shell, dev-fallback, presence, ux, tests]
requires:
  - phase: 05-online-backend-and-couple-ownership
    provides: hosted auth entry shell and firebase-backed room and presence seams
provides:
  - explicit hosted-unavailable player entry state
  - local dev fallback labeling inside the player shell
  - bounded reconnecting-to-away partner presence behavior
affects: [shared-room-runtime, player-shell, presence-hook, dev-plugin]
tech-stack:
  added: []
  patterns: [backend-state union, explicit entry-mode truth, stale presence TTL pruning]
key-files:
  created: []
  modified:
    - src/lib/sharedBackendConfig.ts
    - src/app/hooks/useSharedRoomRuntime.ts
    - src/app/hooks/useSharedRoomPresence.ts
    - src/app/components/SharedRoomEntryShell.tsx
    - src/app/components/PlayerCompanionCard.tsx
    - src/app/shellViewModel.ts
    - scripts/sharedRoomDevPlugin.mjs
    - tests/sharedRoomRuntime.test.ts
    - tests/sharedRoomEntryShell.test.tsx
    - tests/sharedRoomPresence.test.ts
    - tests/sharedRoomPresenceUx.test.ts
    - tests/shellViewModel.test.ts
key-decisions:
  - "Hosted Firebase requests now surface an explicit unavailable state instead of silently auto-entering the dev room."
  - "Partner reconnecting is transient; long-stale presence degrades to partner-away rather than a permanent alarm card."
patterns-established:
  - "Runtime bootstrap exposes backend truth through explicit entry modes before the room shell renders."
  - "Dev presence snapshots prune stale records on read so abrupt browser closes settle into partner-away copy."
requirements-completed: [PAIR-02, ROOM-05]
duration: 1 session
completed: 2026-03-27
---

# Phase 05 Plan 04 Summary

**Made hosted entry tell the truth about backend state and softened stale partner presence into a clear away state**

## Accomplishments
- Added explicit backend-state and entry-mode handling so the player shell can distinguish hosted-ready, hosted-unavailable, and local dev fallback instead of silently skipping to the room.
- Added a dedicated hosted-unavailable shell plus local-fallback labeling so localhost UAT can no longer mistake the dev sandbox for the real hosted auth path.
- Pruned stale dev presence and bounded reconnect freshness so abrupt browser closes settle into `Partner away` instead of leaving a permanent `Reconnecting` card.

## Task Commits

Wave 1 shipped inside the shared gap-closure commit because backend truth and partner-presence freshness touch the same runtime seam:

1. **Expose hosted-unavailable entry state and bound reconnecting presence** - `74e66f9` (fix)

## Files Created/Modified
- `src/lib/sharedBackendConfig.ts` - Backend-mode introspection that exposes whether Firebase was requested, available, or misconfigured.
- `src/app/hooks/useSharedRoomRuntime.ts` - Entry-mode handling for hosted, hosted-unavailable, dev-fallback, and legacy room bootstrap.
- `src/app/components/SharedRoomEntryShell.tsx` - Player-facing hosted-unavailable and local-dev fallback copy.
- `src/app/components/PlayerCompanionCard.tsx` - Companion eyebrow now reflects the active room mode.
- `src/app/hooks/useSharedRoomPresence.ts` - Reconnecting-to-away freshness transition after a bounded timeout.
- `src/app/shellViewModel.ts` - Calmer partner-away copy and room-mode labels for the player shell.
- `scripts/sharedRoomDevPlugin.mjs` - TTL-based stale presence pruning in the dev adapter.
- `tests/sharedRoomRuntime.test.ts` - Hosted-unavailable regression coverage.
- `tests/sharedRoomEntryShell.test.tsx` - Hosted-unavailable and local-dev fallback shell coverage.
- `tests/sharedRoomPresence.test.ts` - Stale dev presence pruning coverage.
- `tests/sharedRoomPresenceUx.test.ts` - Reconnecting-to-away UX coverage.
- `tests/shellViewModel.test.ts` - Partner-away copy and room-mode label assertions.

## Decisions Made
- Kept local dev fallback available for iteration speed, but made it visibly local-only so Phase 5 hosted verification cannot be misread.
- Treated reconnecting as a short bridge state only; once the freshness window expires, the shell now prefers a quieter partner-away message.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
- Set `VITE_SHARED_BACKEND=firebase` plus valid `VITE_FIREBASE_*` values to exercise the real hosted path; when those are missing, the shell now explicitly reports hosted-unavailable instead of entering the dev room.

## Next Phase Readiness
- Hosted verification can now tell whether the app is in Firebase mode, hosted-unavailable mode, or local dev fallback before any room behavior is interpreted.
- Later multiplayer polish work can rely on partner-away presence semantics instead of a sticky reconnecting state.

---
*Phase: 05-online-backend-and-couple-ownership*
*Completed: 2026-03-27*
