# PLAN: UI Refactor and Minecraft Clock

## Step 1: Create Directories [DONE]
- [x] Create `src/components/ui/`.

## Step 2: Refactor Components [DONE]
- [x] Move player-facing HUD components to `src/components/ui/`.
- [x] Create `src/components/ui/index.ts` for unified exports.
- [x] Fix cross-references and App.tsx imports.

## Step 3: Implement MinecraftClock [DONE]
- [x] Create `MinecraftClock.tsx` with responsive props (label, ampm).
- [x] Create `minecraft-clock.css` with advanced visuals (recessed matte screen, outer frame).
- [x] Transition font from VT323 to **Orbitron** based on user feedback.
- [x] Implement AM/PM subscripts in the bottom-corner layout.
- [x] Scale down UI proportions for better HUD integration.

## Step 4: Update Layout Shell [DONE]
- [x] Modify `PlayerRoomShell.tsx` to support the `topCenter` layout slot.
- [x] Move View Mode Toggle to **Top Left** to clear the clock path.

## Step 5: Update App.tsx [DONE]
- [x] Logic for 12-hour clock conversion in `useSandboxWorldClock.ts`.
- [x] Integrate new clock into the main gameplay shell.
