# TASK: AMOLED Player Theme and CSS Modularization

## Objective
- Align the player-facing UI with the digital clock through a pure AMOLED black-and-white treatment.
- Refactor scattered player UI CSS into smaller, easier-to-navigate modules.

## Requirements
- Keep the player room shell, shared-room overlays, and inventory drawer behavior intact.
- Preserve responsive layout behavior for the player HUD and drawer surfaces.
- Avoid touching developer-only workspace styling unless needed for shared selectors.
- Pass `cmd /c npm run build` after the refactor.
