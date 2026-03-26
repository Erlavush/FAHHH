---
phase: 04-memories-pets-and-breakup-stakes
plan: 02
subsystem: pet-runtime
tags: [shared-room, pets, player-shell, inventory, tests]
requires:
  - phase: 04-memories-pets-and-breakup-stakes
    plan: 01
    provides: expanded shared-room mutation payload and canonical metadata plumbing
provides:
  - canonical shared-room pet record
  - player-shell adoption flow for one curated shared cat
  - runtime adaptation from shared canonical state into the existing pet actor path
affects: [shared-room-document, inventory-panel, room-runtime]
tech-stack:
  added: []
  patterns: [canonical-to-runtime adapter, shared-room purchase mutation, authoring boundary preservation]
key-files:
  created:
    - src/lib/sharedRoomPet.ts
    - tests/sharedRoomPet.test.ts
  modified:
    - src/lib/sharedRoomTypes.ts
    - src/lib/sharedRoomValidation.ts
    - src/lib/sharedRoomStore.ts
    - src/app/hooks/useSharedRoomRuntime.ts
    - scripts/sharedRoomDevPlugin.mjs
    - src/App.tsx
    - src/app/components/InventoryPanel.tsx
    - tests/sharedRoomStore.test.ts
    - tests/sharedRoomRuntime.test.ts
key-decisions:
  - "The shipped shared-room pet path is one canonical cat only; Mob Lab stays an explicit authoring tool."
  - "The room runtime keeps using OwnedPet actors by adapting the shared canonical cat into that existing shape."
patterns-established:
  - "Player-shell inventory surfaces can switch between sandbox and shared-room catalog language without exposing authoring metadata."
requirements-completed: [PETS-01]
duration: 1 session
completed: 2026-03-27
---

# Phase 04 Plan 02 Summary

**Promoted one curated shared cat into canonical shared-room state without leaking Mob Lab into the player shell**

## Accomplishments
- Added `sharedPet` to the canonical shared-room document plus validation, runtime snapshot, and dev-plugin persistence.
- Added a pure helper that creates the shared cat record and adapts it into the existing room pet actor runtime shape.
- Reworked the inventory pet card so shared rooms show a shipped `Shared Companion` adoption flow while authoring-only preview metadata stays developer-only.

## Files Created/Modified
- `src/lib/sharedRoomPet.ts` - Canonical shared cat creation and runtime adaptation helpers.
- `src/App.tsx` - Shared-room adoption mutation and `displayedPets` derivation.
- `src/app/components/InventoryPanel.tsx` - Shared companion player copy and sandbox/shared catalog modes.
- `tests/sharedRoomPet.test.ts` - Shared cat helper coverage.
- `tests/sharedRoomStore.test.ts` - Canonical memory/pet persistence coverage.

## Decisions Made
- Fixed the canonical shared pet to `minecraft_cat` with `better_cat_glb` so the player path stays curated while Mob Lab remains separate.
- Hid preset identifiers from player-facing inventory cards to keep the shipped shell clean.

## Deviations from Plan
None - plan executed as specified.

## Issues Encountered
None.

## User Setup Required
None.

## Next Phase Readiness
- Breakup reset can now clear both shared personalization surfaces intentionally: frame memories and the shared cat.

---
*Phase: 04-memories-pets-and-breakup-stakes*
*Completed: 2026-03-27*

