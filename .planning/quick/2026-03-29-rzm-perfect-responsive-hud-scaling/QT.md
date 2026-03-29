# QT: Perfect Responsive HUD Scaling

## Objective
Finalize the dynamic scaling and layout positioning for all HUD components (Dock, Clock, Companion Card, and Music Player) to ensure they are perfectly readable and correctly stacked across all viewports (Mobile, Tablet, Desktop).

## Completed Work
1.  **useUiScale Hook Architecture**:
    -   Baseline design width set to 2200px (User-preferred compact look).
    -   Scale floor set to 0.60 to maintain mobile touchability.
    -   Scale ceiling set to 1.15 to prevent ultra-wide bloating.
2.  **HUD Dock Stabilization**:
    -   Removed all media-query width overrides in `player-hud-dock.css`.
    -   Forced 1240px stage width baseline to stabilize relative icon offsets.
    -   Refactored stage pieces (BuildIcon, InventoryIcon) to use `left: 50%` center-anchored positioning.
3.  **Shell Layout & Music Player**:
    -   Added `bottomRight` slot to `PlayerRoomShell`.
    -   Moved `BackgroundMusicPlayer` into the shell layout.
    -   Implemented responsive stacking: Music Player moves above the dock on mobile to prevent overlap.
4.  **Component Polish**:
    -   Fixed relative import paths in `MinecraftClock.tsx`, `BackgroundMusicPlayer.tsx`, etc.
    -   Repaired CSS syntax errors (missing braces) in clock and music player styles.
    -   Applied `--ui-scale` transforms globally to Clock, Dock, Card, and Music components.

## Verification
-   Verified desktop "100%" view is compact (75% equivalent).
-   Verified mobile view respects 0.60 scale floor and clears the bottom dock.
-   Verified inventory group icons stay in place on desktop.
-   Verified syntax errors resolved in console.
