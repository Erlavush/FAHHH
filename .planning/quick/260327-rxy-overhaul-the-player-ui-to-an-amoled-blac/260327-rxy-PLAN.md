# PLAN: AMOLED Player Theme and CSS Modularization

## Step 1: Split the player-facing UI CSS [DONE]
- [x] Move shared-room overlay chrome out of `src/styles.css` into a dedicated module.
- [x] Move player inventory drawer styling out of `src/styles.css` into a dedicated module.
- [x] Fold responsive player-shell rules into the new modular CSS files.

## Step 2: Apply the AMOLED black-and-white theme [DONE]
- [x] Re-theme the global player-facing surfaces so they visually align with the digital clock.
- [x] Keep high-contrast action hierarchy for primary buttons, pills, and stats.

## Step 3: Verify and record the result [DONE]
- [x] Run `cmd /c npm run build`.
- [x] Update the quick-task summary and `.planning/STATE.md`.
