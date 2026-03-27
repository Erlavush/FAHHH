# Phase 05 Debug: Both Partners Overlap On The Bed

## Symptom

Bed sharing improved only partially. The runtime no longer treats the bed as one unnamed slot, but the two avatars still overlap visually instead of reading as clearly separated left and right sides.

## Root Cause

Logical slot selection now exists, but the visual pose data is still not distinct enough. The registry's primary and secondary bed offsets and pose offsets do not create sufficient separation on the mattress, so even when slot selection picks a different target, the lying avatars still collapse into each other visually.

## Evidence

- `src/lib/furnitureInteractions.ts` now carries slot IDs and occupancy-aware selection, so the remaining failure is no longer just "slot zero always wins."
- `src/lib/furnitureRegistry.ts` still defines a primary bed offset of `[-0.62, 0, 0.2]` and a secondary offset of `[0, 0, 0.5]`, with identical pose offsets for both sides, which leaves the final lie poses too close together.
- User retest screenshot shows the two avatars still stacking on the mattress even after the occupancy-aware patch landed.

## Fix Direction

- Re-tune the bed interaction offsets and pose offsets so primary and secondary sides are visually separated on the actual bed model.
- Keep slot identity flowing through shared presence, but verify the final rendered pose rather than only the logical slot choice.
- Add regression coverage that asserts two-partner bed use stays visibly side-by-side.
