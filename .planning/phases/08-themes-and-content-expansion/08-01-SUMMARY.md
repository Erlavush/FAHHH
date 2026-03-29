---
phase: 08-themes-and-content-expansion
plan: 01
subsystem: themes
tags: [themes, personalization, registry, rendering]
provides:
  - Theme registry with "Starter Cozy" and "Midnight Modern" themes
  - Unlockable theme tracking in RoomMetadata
  - Theme-driven room shell and floor colors
key-files:
  modified: [src/lib/roomState.ts, src/lib/themeRegistry.ts, src/lib/sharedRoomValidation.ts, src/components/room-view/RoomShell.tsx, src/components/room-view/FloorStage.tsx, src/components/RoomView.tsx, src/App.tsx]
duration: 1 session
completed: 2026-03-29
---

# Plan 08-01 Summary: Theme Registry and Unlock Structure

## Accomplishments
- **Created Theme Registry:** Defined `src/lib/themeRegistry.ts` with `ThemeDefinition` and `THEME_REGISTRY`. This moves hardcoded room colors into a structured system that supports multiple visual styles.
- **Expanded Room Metadata:** Updated `RoomMetadata` in `src/lib/roomState.ts` to include `unlockedThemes: string[]`. This allows the room to track which themes the couple has acquired.
- **Robust Migration:** Updated `validateSharedRoomDocument` and `cloneRoomState` to ensure existing rooms are automatically migrated to have the `"starter-cozy"` theme unlocked and active.
- **Theme-Driven Rendering:** Updated `RoomShell.tsx` and `FloorStage.tsx` to read their colors from the active theme. This enables instantaneous visual changes when the `roomTheme` metadata field is updated.
- **Integrated Theme Data:** Updated `RoomView.tsx` and `App.tsx` to correctly pass the active `roomTheme` down to the low-level rendering components.
- **Regression Coverage:** Added `tests/themeRegistry.test.ts` and updated `tests/sharedRoomValidation.test.ts` to verify the new registry and migration logic.

## Verification
- Passed `tests/themeRegistry.test.ts` verifying theme lookup and defaults.
- Passed `tests/sharedRoomValidation.test.ts` verifying legacy document migration.
- Manually confirmed that the "Starter Cozy" theme retains its original look.

## Next Readiness
- Phase 08 Plan 02 is ready to focus on **Expanded Theme and Decor Sets**, specifically adding a way to purchase or unlock themes in the UI and adding more furniture that requires unlocking.
