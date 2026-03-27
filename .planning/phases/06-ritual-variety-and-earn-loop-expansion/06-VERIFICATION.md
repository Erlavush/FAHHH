---
phase: 06-ritual-variety-and-earn-loop-expansion
status: passed
verified: 2026-03-27
requirements:
  - RITL-02
  - ACTV-01
automated_checks:
  - cmd /c npm test -- --maxWorkers 1 tests/pcMinigame.test.ts tests/sharedRoomRuntime.test.ts tests/sharedRoomPresenceUx.test.ts tests/shellViewModel.test.ts
  - cmd /c npm test
  - cmd /c npm run build
---

# Phase 06 Verification

## Goal

Deepen the shared room return loop without turning it into a daily-obligation game by replacing streak pressure with Together Days, expanding the desk PC into multiple retro activities, adding one room-native earn loop, and surfacing the new activity state cleanly in the player shell.

## Result

**Passed**

Phase 06 now turns the desk PC into a retro three-app desktop, pays each app once per room day through canonical reward claims, adds `Cozy Rest` as a same-bed couple reward committed through the hosted progression path, and replaces streak-facing shell copy with Together Days plus activity readiness. The room still reads as a cozy shared space first because the pixelated 1990s treatment remains inside the desk PC/apps rather than leaking into the whole shell.

## Requirement Coverage

- **RITL-02** - Passed. The desk PC now offers multiple ritual/activity variants (`Snake`, `Block Stacker`, `Runner`), the canonical progression model rotates and tracks room-day activity state, and the shell surfaces Together Days plus activity readiness without punitive streak messaging. Evidence: `src/lib/pcMinigame.ts`, `src/components/PcMinigameOverlay.tsx`, `src/lib/sharedProgression.ts`, `src/app/shellViewModel.ts`, `src/components/ui/PlayerProgressStack.tsx`, `src/components/ui/PlayerCompanionCard.tsx`, `tests/pcMinigame.test.ts`, `tests/sharedRoomRuntime.test.ts`, `tests/shellViewModel.test.ts`.
- **ACTV-01** - Passed. `Cozy Rest` now provides a second repeatable earn loop beyond the desk PC, becomes eligible only when both partners lie together on the same bed in different live slots, and pays once per room day through `cozy_rest_reward`. Evidence: `src/app/hooks/useSharedRoomPresence.ts`, `src/App.tsx`, `src/lib/sharedProgression.ts`, `tests/sharedRoomPresenceUx.test.ts`, `tests/sharedRoomRuntime.test.ts`.

## Must-Have Checks

- **Truth:** Desk PC exposes three retro apps with independent once-per-room-day reward claims and unlimited practice play.
  - **Evidence:** `src/lib/pcMinigame.ts`, `src/components/PcMinigameOverlay.tsx`, `tests/pcMinigame.test.ts`, `tests/sharedRoomRuntime.test.ts`
- **Truth:** Cozy Rest grants its payout only when both partners are lying together on the same bed and the reward is committed canonically.
  - **Evidence:** `src/app/hooks/useSharedRoomPresence.ts`, `src/App.tsx`, `tests/sharedRoomPresenceUx.test.ts`, `tests/sharedRoomRuntime.test.ts`
- **Truth:** Player shell replaces streak pressure with Together Days and surfaces canonical Desk PC / Cozy Rest status without debug clutter.
  - **Evidence:** `src/app/shellViewModel.ts`, `src/components/ui/PlayerProgressStack.tsx`, `src/components/ui/PlayerCompanionCard.tsx`, `src/components/ui/PlayerRoomDetailsSheet.tsx`, `tests/shellViewModel.test.ts`

## Automated Checks

- Passed `cmd /c npm test -- --maxWorkers 1 tests/pcMinigame.test.ts tests/sharedRoomRuntime.test.ts tests/sharedRoomPresenceUx.test.ts tests/shellViewModel.test.ts`
  - Result: retro desk shell, canonical desk/cozy reward paths, presence-derived Cozy Rest gating, and Together Days selector copy passed together
- Passed `cmd /c npm test`
  - Result: `41` test files, `209` tests passed
- Passed `cmd /c npm run build`
  - Result: TypeScript compile plus production Vite build passed

## Residual Risks

- This verification is code- and test-based; I did not run a fresh two-browser manual hosted smoke test for the exact live Cozy Rest experience.
- `src/App.tsx` still contains unrelated in-flight UI refactor work in the broader repo worktree, so future commits should continue to stage that file carefully.
- The Vite build still emits chunk-size warnings for large vendor bundles; that is pre-existing packaging debt, not a Phase 06 functional regression.

## Human Verification

A quick browser-level check is still worth doing for the feel of the retro desk shell and the exact bed-side presentation when two live players trigger Cozy Rest, but the shipped contract is now covered by automated tests and a clean production build.

---
*Verified: 2026-03-27*
