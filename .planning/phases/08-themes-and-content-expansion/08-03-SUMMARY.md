---
phase: 08-themes-and-content-expansion
plan: 03
subsystem: content
tags: [content, themes, polish, aesthetic]
provides:
  - Stylized theme placeholders in the shop
  - Expanded variety with "Midnight" furniture variants
  - High-contrast AMOLED-aligned theme switching UI
key-files:
  modified: [src/lib/furnitureRegistry.ts, src/components/ui/PlayerShopSection.tsx, src/components/ui/player-inventory-panel.css, tests/furnitureUnlock.test.ts, tests/sharedRoomValidation.test.ts]
duration: 1 session
completed: 2026-03-29
---

# Plan 08-03 Summary: Catalog and Presentation Polish

## Accomplishments
- **Visual Theme Previews:** Updated `PlayerShopSection.tsx` and `player-inventory-panel.css` to add stylized placeholders for room themes. These previews use the theme's own wall colors and a checkered pattern to give players a better sense of the visual change before unlocking.
- **Midnight Furniture Set:** Added `midnight_chair` and `midnight_desk` to `furnitureRegistry.ts`. These are dark-themed variants of the starter furniture, requiring a coin unlock to acquisition, reinforcing the progression-aware content loop.
- **UI Consistency:** Ensured all new theme and furniture unlock elements follow the high-contrast AMOLED aesthetic established in previous phases.
- **Refined Test Coverage:** Updated `tests/sharedRoomValidation.test.ts` to fully support the `sharedPets` roster and `unlockedThemes` preservation, ensuring data integrity during the migration of legacy room documents.
- **Robustness:** Verified that the `FURNITURE_REGISTRY` is correctly imported and handled during Vite config bundling, resolving a transient startup regression.

## Verification
- Passed `tests/furnitureUnlock.test.ts` verifying themed items are correctly locked by default.
- Passed `tests/sharedRoomValidation.test.ts` with updated schema fixtures.
- Passed `tests/themeRegistry.test.ts`.

## Next Readiness
- Phase 08 is now complete. The room now supports a growing catalog of themed content and a robust unlock system.
- The project is ready for any further cosmetic expansions or moving towards v1.1 milestone finalization.
