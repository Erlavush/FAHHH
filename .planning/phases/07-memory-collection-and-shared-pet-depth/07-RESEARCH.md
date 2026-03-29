# Phase 07: Memory Collection and Shared Pet Depth - Research

**Researched:** 2026-03-29
**Domain:** Personalized shared-room depth (Memories & Pets)
**Confidence:** HIGH

<user_constraints>
- Couple can maintain more than one meaningful shared memory item or collection surface.
- The shared pet gains deeper behavior such as needs, moods, or interactions that matter during visits.
- Hosted persistence preserves richer memories and pet state without leaking Mob Lab authoring data into gameplay.
- New personalization systems still respect current room placement, ownership, and player/developer shell boundaries.
</user_constraints>

## Current State

### Memories
- `SharedRoomFrameMemory` stores one image and caption per `furnitureId` (intended for `wall_frame`).
- `SharedRoomDocument` stores a flat `Record<string, SharedRoomFrameMemory>`.
- `pruneSharedRoomFrameMemories` cleans up memories that no longer have a corresponding `wall_frame` in `RoomState`.

### Pets
- `SharedRoomPetRecord` currently only supports ONE cat (`sharedPet` field in `SharedRoomDocument`).
- Hardcoded to `presetId: "better_cat_glb"`.
- No care state, display name, or behavior profile persisted at the shared level (mapped to defaults in `toRuntimeOwnedPet`).

## Proposed Changes

### 1. Memories Expansion
- **Schema Update:** Add `collectionId?: string` to `SharedRoomFrameMemory` (default: "default").
- **Collection Support:** Introduce a "Memory Album" concept where memories can be grouped.
- **Pruning Logic:** Maintain `furnitureId` as the primary key for *active* frames, but allow a broader collection that persists even if a specific frame is removed (optional, to be decided). *Decision: Keep it simple for now and just allow more frames to have memories.*

### 2. Shared Pet Depth
- **Roster Support:** Change `SharedRoomDocument` to use `sharedPets: SharedRoomPetRecord[]`.
- **Richer State:**
  ```typescript
  export interface SharedRoomPetRecord {
    id: string;
    type: "minecraft_cat";
    presetId: string; // Now variant-aware
    displayName: string;
    behaviorProfileId: PetBehaviorProfileId;
    care: OwnedPetCareState;
    spawnPosition: Vector3Tuple;
    adoptedAt: string;
    adoptedByPlayerId: string;
  }
  ```
- **Syncing:** Shared pet care actions must be committed to the shared room state.

### 3. Runtime Integration
- Update `SharedRoomDocument` and `SharedRoomRuntimeSnapshot` to reflect the roster and expanded memory state.
- Update `commitSharedRoomState` to handle the new fields.
- Ensure `useSharedRoomRuntime` correctly bridges these deeper records to the `OwnedPet` actors in the scene.

## Risks & Pitfalls
- **Migration:** Legacy rooms have `sharedPet: SharedRoomPetRecord | null`. Need to migrate to `sharedPets: SharedRoomPetRecord[]`.
- **Conflict Resolution:** Concurrent pet care actions or memory updates. `commitRoomMutation` (optimistic replay) should handle this.
- **Large State:** Many memories with base64 images could bloat the document. *Mitigation: Firestore/RTDB limits should be monitored, but for a cozy couple room, a few dozen photos are usually fine.*

## Success Criteria
1. Multiple wall frames can each hold distinct, persisted memories with captions.
2. The shared room supports multiple adoptable cats, each with their own persisted name, personality, and care state.
3. Pet care actions in a shared room are visible to the partner after a sync/reload.
4. Legacy shared-room data is automatically migrated to the new schema on load.
