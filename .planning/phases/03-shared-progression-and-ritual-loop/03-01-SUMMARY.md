---
phase: 03-shared-progression-and-ritual-loop
plan: 01
subsystem: shared-room-domain
tags: [shared-room, progression, migration, ui]
requires: []
provides:
  - canonical per-player and couple progression schema
  - legacy sharedCoins migration into authoritative progression
  - toolbar, status-strip, and inventory progression surfaces
affects: [phase-03, shared-room-runtime, app-shell]
tech-stack:
  added: []
  patterns:
    - canonical nested progression state
    - load-time legacy schema normalization
    - room-first progression UI
key-files:
  created:
    - src/lib/sharedProgression.ts
    - src/lib/sharedProgressionTypes.ts
    - tests/sharedProgression.test.ts
  modified:
    - src/App.tsx
    - src/app/components/InventoryPanel.tsx
    - src/app/components/SceneToolbar.tsx
    - src/app/components/SharedRoomStatusStrip.tsx
    - src/app/hooks/useSharedRoomRuntime.ts
    - src/lib/sharedRoomClient.ts
    - src/lib/sharedRoomStore.ts
    - src/lib/sharedRoomTypes.ts
    - src/lib/sharedRoomValidation.ts
    - src/styles.css
    - tests/sharedRoomRuntime.test.ts
    - tests/sharedRoomValidation.test.ts
patterns-established:
  - shared-room runtime snapshots now expose canonical progression instead of top-level sharedCoins
  - shell progression copy stays in the toolbar and status strip instead of a separate dashboard
requirements-completed:
  - PROG-01
  - PROG-03
completed: 2026-03-27
---

# Phase 03 Plan 01: Progression Contract Summary

## Accomplishments

- Added a canonical `SharedRoomProgressionState` with per-player coins, XP, levels, desk-PC history, and couple ritual/streak state.
- Migrated legacy `sharedCoins` documents forward through validation and the dev shared-room store so the live runtime only consumes authoritative `progression`.
- Swapped the room shell over to personal wallet and level readouts while keeping the UI room-first: the toolbar now shows wallet/XP, the shared status strip shows streak and ritual state, and the inventory copy reflects shared-room ownership.

## Implementation Commits

- `cecb297` - Phase 3 progression, ritual, runtime, and UI implementation
- `4c1f1f8` - Shared-room follow-up that keeps the Phase 4 pet shop path out of the Phase 3 live-room economy

## Notes

- The migration split preserves purchasing power by dividing legacy `sharedCoins` across current members and giving any odd remainder to the creator.
- Late-joining partners get canonical progression records without silent backfilled migration currency.

---
*Completed: 2026-03-27*
