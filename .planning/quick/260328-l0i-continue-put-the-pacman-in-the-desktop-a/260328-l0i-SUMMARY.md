# Quick Task 260328-l0i Summary

Status: completed
Date: 2026-03-28

## Outcome

- Replaced the desk PC Runner app with a Pacman desktop app that lives inside the existing Pixel Gigs shell and keeps the same launch, replay, payout, and result-card flow.
- Added a dedicated Pacman board component with pellets, power pellets, ghosts, lives, score tracking, keyboard controls, and touch-friendly D-pad controls tuned for the in-room desktop overlay.
- Preserved backward compatibility for saved/shared progression by normalizing legacy `pc_runner` activity ids, desk-PC app progress, and claim records into `pc_pacman`.
- Removed runner-only runtime wiring and dead runner-specific desktop CSS selectors.

## Key Files

- `src/components/PcMinigameOverlay.tsx`
- `src/components/pc-minigame/PcPacmanBoard.tsx`
- `src/components/pc-minigame/pc-pacman.css`
- `src/lib/pcMinigame.ts`
- `src/lib/shared-progression/normalizeProgression.ts`
- `tests/pcMinigame.test.ts`
- `tests/sharedProgression.test.ts`

## Verification

- `cmd /c npm test`
- `cmd /c npm run build`

## Notes

- The Pacman desk app was integrated as a repo-native React component informed by the referenced Pacman project rather than dropping that standalone project structure directly into this runtime.
