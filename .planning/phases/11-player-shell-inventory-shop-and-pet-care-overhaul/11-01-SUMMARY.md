---
phase: 11-player-shell-inventory-shop-and-pet-care-overhaul
plan: 01
subsystem: drawer-contract-and-shell-state
tags: [player-shell, inventory, shop, pet-care, state]
provides:
  - Shared drawer-mode type and explicit Inventory / Shop / Pet Care selector metadata
  - App-owned drawer mode state threaded into the existing player drawer contract
  - Companion-card copy that can advertise the dedicated Pet Care surface when care is needed
key-files:
  created: [.planning/phases/11-player-shell-inventory-shop-and-pet-care-overhaul/11-01-SUMMARY.md]
  modified: [src/app/types.ts, src/app/shellViewModel.ts, src/App.tsx, src/components/ui/InventoryPanel.tsx, tests/shellViewModel.test.ts]
requirements-completed: [SHELL-01]
duration: 1 session
completed: 2026-03-28
---

# Phase 11-01 Summary

**Split drawer contract and player-shell state**

## Accomplishments
- Added `PlayerDrawerMode` as the shared shell contract for `inventory`, `shop`, and `pet_care` so the drawer split is owned by App state instead of one mixed component.
- Added `getPlayerDrawerTabsState(...)` to expose the player-facing `Inventory`, `Shop`, and `Pet Care` tab metadata, including care urgency when local cats need attention.
- Threaded `playerDrawerMode` through `App.tsx` and the existing `InventoryPanel` prop contract without changing room, furniture, or pet domain semantics.
- Extended the shell-view-model coverage so the split drawer labels and the new `Open Pet Care` shortcut copy are regression-checked before the visual rebuild lands.

## Verification
- Passed `cmd /c npm test -- --maxWorkers 1 tests/shellViewModel.test.ts`

## Next Readiness
- Phase 11-02 can now split the mixed drawer UI into dedicated `Inventory`, `Shop`, and `Pet Care` surfaces without inventing new shell state.
- The follow-on wiring work can open the existing drawer into a specific mode while preserving shared-room and sandbox pet boundaries.
