---
phase: 04-memories-pets-and-breakup-stakes
plan: 01
subsystem: shared-room-runtime
tags: [shared-room, memories, room-view, dialog, tests]
requires:
  - phase: 01-shared-room-backbone
    provides: canonical shared room document and commit pipeline
  - phase: 03.1-ui-overhaul-and-developer-player-view-split
    provides: player shell overlays and room-first UI surfaces
provides:
  - canonical frame-memory schema and validation
  - wall-frame memory rendering in the live room
  - player memory dialog and pure image-preparation helper
affects: [shared-room-document, room-runtime, player-shell]
tech-stack:
  added: []
  patterns: [canonical metadata outside RoomState, room-linked wall-frame proxies, pure shared-room helper tests]
key-files:
  created:
    - src/lib/sharedRoomMemories.ts
    - src/lib/memoryFrameImage.ts
    - src/components/room-view/RoomMemoryFrameProxy.tsx
    - src/app/components/MemoryFrameDialog.tsx
    - tests/sharedRoomMemories.test.ts
  modified:
    - src/lib/sharedRoomTypes.ts
    - src/lib/sharedRoomValidation.ts
    - src/lib/sharedRoomStore.ts
    - src/app/hooks/useSharedRoomRuntime.ts
    - scripts/sharedRoomDevPlugin.mjs
    - src/components/StarterFurnitureModels.tsx
    - src/components/RoomView.tsx
    - src/components/room-view/FurnitureVisual.tsx
    - src/components/room-view/RoomFurnitureActor.tsx
    - src/components/room-view/RoomFurnitureLayer.tsx
    - src/components/room-view/RoomSelectedFurnitureLayer.tsx
    - src/App.tsx
    - src/styles.css
    - tests/sharedRoomRuntime.test.ts
    - tests/sharedRoomStore.test.ts
    - tests/sharedRoomValidation.test.ts
key-decisions:
  - "Shared frame memories live in the canonical shared-room document instead of RoomState so decor rules stay untouched."
  - "Wall frames open memories through a dedicated proxy in player mode rather than repurposing furniture interaction commands."
patterns-established:
  - "Shared-room mutation callbacks now carry roomState, progression, frameMemories, and sharedPet together."
  - "Room visuals consume canonical metadata through thin props instead of reaching into app state directly."
requirements-completed: [MEMR-01]
duration: 1 session
completed: 2026-03-27
---

# Phase 04 Plan 01 Summary

**Added canonical shared memory frames with live room rendering and a player editor**

## Accomplishments
- Extended the shared-room schema, validation, runtime snapshot, and dev plugin so frame memories persist canonically and survive conflict replay.
- Added wall-frame image/caption rendering plus a dedicated in-room memory proxy that opens a player-facing memory dialog.
- Added pure helper coverage for caption sanitization, pruning, and runtime/store validation behavior.

## Files Created/Modified
- `src/lib/sharedRoomMemories.ts` - Caption sanitization, pruning, cloning, and upsert helpers.
- `src/lib/memoryFrameImage.ts` - Browser-side image preparation for shared frame uploads.
- `src/components/room-view/RoomMemoryFrameProxy.tsx` - Player interaction proxy for wall-frame memories.
- `src/app/components/MemoryFrameDialog.tsx` - Player memory upload and caption editor.
- `src/components/StarterFurnitureModels.tsx` - Wall-frame rendering for shared photo and caption content.
- `src/App.tsx` - Canonical save/clear mutation wiring for memory frames.
- `tests/sharedRoomMemories.test.ts` - Pure helper regression coverage.

## Decisions Made
- Kept memories keyed by `furnitureId` so deleting or moving the frame naturally controls the memory lifecycle.
- Reused the shared-room mutation path for both save and clear actions to keep stale-revision replay behavior consistent.

## Deviations from Plan
None - plan executed as specified.

## Issues Encountered
None.

## User Setup Required
None.

## Next Phase Readiness
- Shared-room personalization metadata is now canonical, so the shared pet and breakup reset flows can clear or preserve it intentionally.

---
*Phase: 04-memories-pets-and-breakup-stakes*
*Completed: 2026-03-27*

