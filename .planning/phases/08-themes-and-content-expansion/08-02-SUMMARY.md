---
phase: 08-themes-and-content-expansion
plan: 02
subsystem: content
tags: [content, themes, shop, progression, unlocks]
provides:
  - Theme and furniture unlock actions in useAppRoomActions
  - Theme purchase section in the Player Shop
  - Theme selection in the Room Details sheet
  - First locked furniture item: "Comfy Beanbag"
key-files:
  modified: [src/app/hooks/useAppRoomActions.ts, src/components/ui/PlayerShopSection.tsx, src/components/ui/PlayerRoomDetailsSheet.tsx, src/components/ui/player-shell-panels.css, src/App.tsx, src/app/components/AppPlayerView.tsx, src/components/ui/InventoryPanel.tsx, src/lib/furnitureRegistry.ts, src/lib/roomState.ts]
duration: 1 session
completed: 2026-03-29
---

# Plan 08-02 Summary: Theme and Decor Sets

## Accomplishments
- **Implemented Unlock Actions:** Added `handleUnlockTheme`, `handleUnlockFurniture`, and `handleSetTheme` to `useAppRoomActions.ts`. These actions handle both local sandbox state and shared-room mutations, including coin deductions.
- **Surfaced Themes in Shop:** Updated `PlayerShopSection.tsx` to include a new "Room Themes" section where players can purchase and unlock new visual styles for their room.
- **Enabled Theme Switching:** Added a theme selector to `PlayerRoomDetailsSheet.tsx`, allowing players to instantly switch between any themes they have already unlocked.
- **Introduced Locked Content:** Registered the "Comfy Beanbag" in `furnitureRegistry.ts` as the first item that is not unlocked by default. It requires a one-time coin unlock in the shop before it can be purchased and placed.
- **Improved UI Feedback:** Updated the shop grid to clearly distinguish between unlocked and available items, showing the one-time unlock price vs. the per-item purchase price.
- **Unified Roster Logic:** Fixed a regression in `useAppRoomActions.ts` and `useAppShellCallbacks.ts` to fully support the `sharedPets` roster introduced in Phase 07.

## Verification
- Passed `tests/furnitureUnlock.test.ts` verifying that `starterUnlocked: false` items are correctly excluded from the initial room state.
- Passed `tests/themeRegistry.test.ts` and `tests/sharedRoomValidation.test.ts`.
- Manually verified that theme and furniture unlock callbacks are correctly wired through `App.tsx` and the drawer UI.

## Next Readiness
- Phase 08 Plan 03 is ready to focus on **Catalog and Presentation Polish**, specifically improving the visual previews for themes and ensuring the new content feels fully integrated into the Minecraft-inspired aesthetic.
