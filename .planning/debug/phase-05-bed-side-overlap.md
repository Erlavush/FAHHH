# Phase 05 Debug: Both Partners Overlap On The Bed

## Symptom

When both players lie on the same bed, both avatars use the exact same lying position instead of separate sides.

## Root Cause

The bed definition already includes primary and secondary interaction offsets, but the runtime never chooses between them. The bed interaction resolver always calls `getFurnitureInteractionTarget()`, which returns only the first target from `getFurnitureInteractionTargets()`, so both clients end up with the same lie slot.

## Evidence

- `src/lib/furnitureRegistry.ts:109-114` defines both the primary and secondary bed interaction offsets and pose offsets.
- `src/lib/furnitureInteractions.ts:223-255` builds both targets.
- `src/lib/furnitureInteractions.ts:258-262` drops back to only the first target through `getFurnitureInteractionTarget()`.

## Fix Direction

- Select bed interaction slots dynamically based on current occupancy.
- Persist the chosen slot through shared presence so both clients agree on left/right bed sides.
- Add two-partner bed interaction coverage.
