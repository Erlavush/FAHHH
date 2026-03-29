# Phase 08: Themes and Content Expansion - Research

**Researched:** 2026-03-29
**Domain:** Cosmetic breadth and themed content
**Confidence:** HIGH

<user_constraints>
- Couple can unlock or acquire additional room themes, decor sets, or cosmetic variants.
- New content fits the existing furniture registry, preview flows, and room presentation.
- Content acquisition and display feel aligned with the updated progression and ritual systems.
- Expanded content does not regress existing systems.
</user_constraints>

## Current State

### Room Themes
- `RoomMetadata` has a `roomTheme` string field (default: `"starter-cozy"`).
- Colors for walls, floor, baseboards, etc., are hardcoded in `RoomShell.tsx` and `FloorStage.tsx`.
- There is no registry for themes.

### Furniture Registry
- `FURNITURE_REGISTRY` is a flat record of `FurnitureDefinition`.
- Each definition has `unlockKey` and `starterUnlocked`.
- Currently, all furniture is unlocked by default in the starter room (`DEFAULT_ROOM_STATE`).

### Progression & Unlocks
- `RoomMetadata` has `unlockedFurniture: FurnitureType[]`.
- No system yet for *locking* items or purchasing unlocks (other than buying individual items for coins).

## Proposed Changes

### 1. Theme Registry
- Create `src/lib/themeRegistry.ts` to define themes.
- Move room shell and floor colors into `ThemeDefinition`.
- Update `RoomShell.tsx` and `FloorStage.tsx` to read colors from the active theme.

### 2. Unlockable Themes
- Add `unlockedThemes: string[]` to `RoomMetadata`.
- Add `price` and `unlockKey` to `ThemeDefinition`.
- Surface themes in the Shop or a new "Themes" tab in the inventory drawer.

### 3. Themed Furniture Sets
- Expand `FurnitureDefinition` to include a `themeTag` or similar (optional).
- Add new furniture items to `FURNITURE_REGISTRY` that are *not* `starterUnlocked`.
- Implement a way to "unlock" a furniture type in the shop for a one-time coin cost.

### 4. Progression Integration
- Ritual rewards could occasionally unlock a theme or a specific piece of furniture.
- Higher levels could be required for certain themes.

## Risks & Pitfalls
- **Visual Regression:** Changing how colors are applied to the room shell might cause flickering or incorrect lighting if not handled carefully with `useMemo`.
- **UI Clutter:** Adding a "Themes" tab might clutter the already expanded drawer.
- **Migration:** Existing rooms need to have `"starter-cozy"` in their `unlockedThemes` list.

## Success Criteria
1. At least two distinct room themes can be toggled (if unlocked).
2. The shop surfaces items or themes that require unlocking.
3. Purchasing an unlock correctly updates `RoomMetadata`.
4. The room shell correctly reflects the selected theme's visual style.
