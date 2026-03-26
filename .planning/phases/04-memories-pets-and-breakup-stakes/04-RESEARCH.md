# Phase 04: Memories, Pets, and Breakup Stakes - Research

**Researched:** 2026-03-27
**Domain:** Shared-room personalization, curated pet promotion, and destructive reset flow
**Confidence:** HIGH

<user_constraints>
## User Constraints (from 04-CONTEXT.md and active project rules)

### Locked Decisions

### Shared Memory Object
- **D-01:** Reuse the existing in-room `wall_frame` path instead of adding a separate memory-only placement system.
- **D-02:** A placed memory frame supports one visible shared image plus one optional short caption.
- **D-03:** Memory editing stays room-first and persists through the canonical shared-room document and reload path.

### Curated Shared-Room Pet Path
- **D-04:** Promote one curated shared-room pet only, using the existing cat path around `better_cat_glb`.
- **D-05:** Shared-room pet ownership is couple-owned and canonical to the shared room, while Mob Lab remains authoring-only.
- **D-06:** The first shared-room pet remains lightweight: persistent presence plus current room-safe wander behavior only.

### Breakup Stakes and Reset Scope
- **D-07:** Explain breakup stakes before a couple commits to the shared-room loop and again inside the destructive reset flow.
- **D-08:** Breakup lives behind an explicit danger-zone surface in the player shell, not a casual toolbar or dev-only control.
- **D-09:** Breakup reset wipes relationship-tied authoritative state: shared progression, shared room decor and inventory, memory-frame content, and shared pet records.
- **D-10:** Breakup reset must not wipe local profile identity, Mob Lab presets, Preview Studio work, or non-shared local tooling data.

### Authority and Brownfield Preservation
- **D-11:** Memory edits, shared pet state, and breakup reset all commit through the existing authoritative shared-room runtime and store boundary.
- **D-12:** Reset remains reload-safe and reconnect-safe: every client converges on one fresh canonical shared-room state.
- **D-13:** Preserve `ownedFurniture` versus placed `furniture`, anchor-based surface decor, four-wall wall support, and current room editing rules.
- **D-14:** Keep Mob Lab and Preview Studio as explicit authoring tools inside Developer View, not default player UI.
- **D-15:** Build on the Phase 03.1 player shell and developer workspace split instead of reintroducing mixed tooling into Player View.

### the agent's Discretion
- Exact storage and compression strategy for the shared frame image payload.
- Exact player-shell host surface for memory editing and breakup confirmation, as long as it stays in the shipped player path.
- Exact shared pet spawn and optional display-name rules, as long as the first pet stays curated and canonical.
- Exact fresh-baseline reset contents, as long as all relationship-tied shared state is cleared and non-shared data is preserved.

### Deferred Ideas (OUT OF SCOPE)
- Multi-photo galleries, scrapbook systems, or multiple concurrent frame slots.
- Arbitrary Mob Lab preset adoption into the live shared room.
- Rich pet systems such as needs, moods, training, breeding, or multiple active pets.
- Post-breakup archival, export, cooldown, or account-history systems.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MEMR-01 | Couple can place and edit at least one photo frame or equivalent memory object in the shared room. | Extend `SharedRoomDocument` with frame-memory data keyed to placed `wall_frame` ids, thread it through `RoomView`, and add a player-shell frame editor that commits canonically. |
| PETS-01 | Couple can own and display at least one live-room pet in the shared room without breaking the Mob Lab authoring workflow. | Add a single canonical shared-pet record for the curated cat, adapt it into the existing `RoomView` pet runtime, and keep Mob Lab as an optional developer-only preview surface. |
| STAK-01 | The game explains the breakup consequence before the couple commits to the shared room loop. | Add stakes copy and acknowledgment to `SharedRoomEntryShell` before create/join actions become available. |
| STAK-02 | Breakup and reset flow wipes shared room progression only after explicit confirmation. | Add a player-shell danger-zone dialog that commits one canonical reset mutation clearing progression, room decor/inventory, frame memories, and the shared pet. |
</phase_requirements>

## Summary

Phase 04 is primarily a shared-room document and player-shell mutation phase, not a new subsystem. The repo already has the right runtime slices: `wall_frame` exists in the room registry and renderer, the cat already runs through `RoomPetActor` using the curated `better_cat_glb` preset, and the authoritative shared-room boundary already supports replay-safe mutation commits. The work is to extend that boundary so the room can hold one personalized frame, one canonical cat, and one reset path that clears both.

The clean planning move is to keep new shared personalization state outside `RoomState` and inside `SharedRoomDocument`. `RoomState` should continue owning room geometry, placements, and shared inventory invariants. Memory-frame content and the shared pet are higher-level shared-room features that should be validated, normalized, and committed alongside `roomState` and `progression`, not embedded into local-only sandbox state or Mob Lab persistence.

The highest-risk area is destructive reset. If breakup logic is implemented as scattered field clearing inside `App.tsx`, stale drafts and partial reloads will drift. The correct approach is a pure shared reset helper that rebuilds the fresh baseline from `createDefaultRoomState()` plus `createInitialSharedRoomProgression()`, clears new personalization fields, and then commits that result through the existing revision-checked shared-room mutation path.

No separate Phase 04 UI-SPEC is required to plan this well. Phase 03.1 already established the player/developer shell split. The right UI hosts are now obvious: `SharedRoomEntryShell` for pre-commit stakes copy, the shipped Player View for frame editing and breakup danger-zone UI, and Developer View only for optional Mob Lab look-dev access.

**Primary recommendation:** extend `SharedRoomDocument`, `SharedRoomRuntimeSnapshot`, and `commitSharedRoomState` to carry `frameMemories` and `sharedPet`; implement a pure breakup-reset helper over that expanded snapshot; then wire the player shell to open a wall-frame editor and a danger-zone breakup dialog while reusing the current cat runtime unchanged.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.3.1 declared | Player-shell dialogs, stakes warning, inventory pet actions | Phase 03.1 already put all relevant room-shell surfaces in React components under `src/app/components`. |
| TypeScript | 5.7.2 declared | Shared-room schema growth and mutation typing | Phase 04 adds new canonical document fields and reset helpers that should stay strongly typed. |
| Vite dev shared-room plugin | existing | File-backed authoritative shared-room persistence in development | The current shared-room store boundary already uses this path for canonical load, commit, and conflict handling. |
| CSS in `src/styles.css` | existing | Memory dialog and danger-zone styling in Player View | The repo already ships custom CSS and Player View styles from Phase 03.1. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@react-three/fiber` / `@react-three/drei` | existing | Render the personalized wall frame inside the live 3D room | Extend the existing `WallFrameModel` and room render pipeline instead of adding DOM overlays over the frame itself. |
| Vitest | 3.0.5 declared | Shared-room schema, store, runtime, and pure reset helper regression coverage | Use for all new canonical-state and reset helpers first. |
| Three.js texture utilities | existing | Turn one saved image data URL into a wall-frame material | Use only inside the frame render path; keep compression/sanitization outside the render loop. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Top-level shared-room `frameMemories` and `sharedPet` fields | Embedding memory or pet fields directly into `RoomState` | Pollutes the base room schema with higher-level relationship state and complicates local sandbox compatibility. |
| Compressed data URL stored canonically | New asset upload/backend pipeline | There is no real backend storage path in the active runtime; adding one is out of scope for this phase. |
| Existing `RoomPetActor` and curated cat preset | A second pet runtime or direct Mob Lab preset hydration in live gameplay | Violates the authoring/runtime boundary and creates avoidable duplication. |
| Pure breakup reset helper | Imperative field clearing spread across `App.tsx` and the dev plugin | Harder to test and easy to get wrong under reload, reconnect, and conflict replay. |

**Installation:**
```bash
# None. Reuse the current installed stack and shared-room runtime.
```

## Architecture Patterns

### Recommended Project Structure
```text
src/
|-- app/hooks/useSharedRoomRuntime.ts
|-- app/components/
|   |-- SharedRoomEntryShell.tsx
|   |-- MemoryFrameDialog.tsx
|   `-- BreakupResetDialog.tsx
|-- components/
|   |-- RoomView.tsx
|   |-- StarterFurnitureModels.tsx
|   `-- room-view/
|       |-- RoomMemoryFrameProxy.tsx
|       |-- RoomFurnitureActor.tsx
|       |-- RoomFurnitureLayer.tsx
|       `-- RoomSelectedFurnitureLayer.tsx
|-- lib/
|   |-- sharedRoomTypes.ts
|   |-- sharedRoomStore.ts
|   |-- sharedRoomValidation.ts
|   |-- sharedRoomMemories.ts
|   |-- sharedRoomPet.ts
|   |-- sharedRoomReset.ts
|   `-- memoryFrameImage.ts

tests/
|-- sharedRoomMemories.test.ts
|-- sharedRoomPet.test.ts
`-- sharedRoomReset.test.ts
```

### Pattern 1: Extend `SharedRoomDocument` with defaultable personalization fields
**What:** Add new canonical fields such as `frameMemories` and `sharedPet` to the shared-room document, runtime snapshot, validation path, and commit input.
**When to use:** For all Phase 04 relationship-tied state that must reload, replay, and reset with the shared room.
**Why:** The active authoritative boundary already knows how to load, validate, commit, and recover on revision conflicts. Reuse it.

### Pattern 2: Key memory records by placed `wall_frame` id and prune aggressively
**What:** Store one frame-memory record per placed frame id in a top-level map such as `frameMemories[furnitureId]`.
**When to use:** For editable frame content only.
**Why:** The room already owns wall-frame placement identity. Keying by furniture id means the memory follows the exact placed frame and can be removed automatically if that frame is stored, sold, or deleted.

### Pattern 3: Store the frame image canonically as a compressed data URL
**What:** Resize and encode the uploaded image in the browser, then commit the resulting string plus optional caption to the shared-room document.
**When to use:** Jam-scope shared memory persistence without a real asset service.
**Why:** It preserves canonical reload behavior in the current file-backed dev store with the fewest moving pieces. The executor should cap size before commit so the document does not balloon uncontrollably.

### Pattern 4: Reuse the existing pet runtime by adapting canonical pet state to `OwnedPet`
**What:** Add one `sharedPet` record to the shared-room document, then adapt it into the existing `RoomView` `pets` prop when the shared room is active.
**When to use:** For the curated cat only.
**Why:** `RoomView` already renders the cat correctly from `DEFAULT_IMPORTED_MOB_PRESETS["better_cat_glb"]`. There is no reason to create a second actor or merge Mob Lab persistence into gameplay.

### Pattern 5: Implement breakup as one pure canonical reset mutation
**What:** Add a helper such as `createBreakupResetMutation(snapshot, actorPlayerId, nowIso)` that returns the full fresh shared-room state.
**When to use:** For the final explicit confirmation step only.
**Why:** A pure helper can be tested against the exact reset contract: same room identity and members, fresh starter room, fresh progression, empty memories, and no shared pet.

### Pattern 6: Put stakes UI only in shipped player surfaces
**What:** Use `SharedRoomEntryShell` for the pre-commit warning and Player View details/dialog surfaces for the active breakup danger zone.
**When to use:** Always.
**Why:** The warning and danger zone are part of the shipped experience. Mob Lab, Dev Panel, and Developer View are the wrong place for relationship-stakes copy.

### Recommended Sequencing
1. Extend the shared-room schema, store, validation, and runtime snapshot for frame memories first.
2. Add the curated shared cat on the same authoritative path, adapting it into the current pet runtime.
3. Add the pre-commit stakes warning and the canonical breakup reset flow once the new memory and pet state exist to be cleared.

## Runtime State Inventory

| Area | Current State | Required Phase 04 Action |
|------|---------------|--------------------------|
| `src/lib/sharedRoomTypes.ts` | Shared document holds only `roomState`, `progression`, membership, and invite metadata | Add defaultable memory and pet fields without breaking older documents. |
| `src/lib/sharedRoomValidation.ts` | Validates room, membership, and progression data; upgrades legacy `sharedCoins` | Normalize missing `frameMemories` and `sharedPet`, prune stale frame records, and preserve backwards compatibility. |
| `src/app/hooks/useSharedRoomRuntime.ts` | Mutation callbacks return only `roomState` and `progression` | Expand snapshot and mutation result typing so memory, pet, and breakup reset all commit through one replay-safe path. |
| `src/components/RoomView.tsx` | Already renders placed furniture and pets, but pets come only from local `ownedPets` | Accept canonical frame-memory and shared-pet data from the app shell and keep rendering in the same room stage. |
| `src/components/StarterFurnitureModels.tsx` | `WallFrameModel` shows placeholder art only | Allow the frame art plane to render personalized content when a frame-memory record exists. |
| `src/app/components/InventoryPanel.tsx` | Pet Store is local-sandbox-only and hides in shared-room mode | Expose one curated shared-room cat adoption surface while keeping Mob Lab links developer-only. |
| `src/app/components/SharedRoomEntryShell.tsx` | Explains create/join flow only | Add the first breakup-stakes disclosure before create/join. |
| `src/app/components/PlayerRoomDetailsSheet.tsx` | Hosts secondary player actions only | Add the active-room danger-zone entry point for breakup/reset. |
| `src/lib/mobLab.ts` and `DEFAULT_IMPORTED_MOB_PRESETS` | Already ship the curated `better_cat_glb` preset | Keep this as the runtime preset source; do not replace it with local Mob Lab save data. |

## Common Pitfalls

### Pitfall 1: Putting frame content into local-only sandbox state
**What goes wrong:** One player sees the photo, the other does not, or reload loses the frame entirely.
**How to avoid:** Memory frame content must live in `SharedRoomDocument` and flow through the existing commit and reload path.

### Pitfall 2: Leaving orphan frame records after room edits
**What goes wrong:** A removed or stored `wall_frame` leaves dead memory data behind, so a later frame can inherit stale content accidentally.
**How to avoid:** Prune frame-memory records against placed `wall_frame` ids during validation and before commit.

### Pitfall 3: Treating Mob Lab's saved preset library as canonical gameplay pet state
**What goes wrong:** The live shared pet changes when a local developer edits Mob Lab, or the runtime depends on local-only preset data.
**How to avoid:** Keep the shared-room pet record to the curated `better_cat_glb` path and reuse `DEFAULT_IMPORTED_MOB_PRESETS`.

### Pitfall 4: Reusing local `ownedPets` as the shared pet source
**What goes wrong:** Shared-room reloads cannot converge because pet ownership still lives in browser-local sandbox state.
**How to avoid:** Derive live shared-room pets from the canonical `sharedPet` field whenever `sharedRoomActive` is true.

### Pitfall 5: Clearing only some breakup state
**What goes wrong:** The room layout resets but progression, frame content, or the cat remains, which breaks the game's stakes contract.
**How to avoid:** Use one pure reset helper that returns the complete canonical target state and test every cleared field.

### Pitfall 6: Kicking the reset flow into Developer View
**What goes wrong:** The shipped player path never actually explains or exposes the stakes correctly.
**How to avoid:** Keep the warning and danger-zone UI in Player View and the entry shell only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shared image storage | A new asset backend or local-only cache indirection | Browser-side resize + compressed data URL committed to the shared room document | The active runtime has no deployable shared asset service. |
| Shared pet renderer | A second pet actor or direct Mob Lab runtime dependency | Existing `RoomPetActor` plus `DEFAULT_IMPORTED_MOB_PRESETS["better_cat_glb"]` | The cat path is already production-ready enough for jam scope. |
| Breakup reset logic | Manual field clearing inside button handlers | A pure `sharedRoomReset.ts` helper | Easier to test and safer under conflict replay. |
| Memory placement system | A second gallery or photo-only furniture family | Existing `wall_frame` placement and render path | The phase explicitly reuses the room-first object already in the registry. |

## Open Questions

1. **Should breakup reset also clear room membership or invite ownership?**
   - Recommendation: no. Preserve room id, invite code, and current members for jam scope, and reset only relationship-tied shared room content. There is no account-level breakup system yet.

2. **How large should the shared frame payload be?**
   - Recommendation: resize on upload and store a compressed data URL sized for one in-room frame, not original camera-roll resolution.

3. **Should the player be able to rename the shared cat now?**
   - Recommendation: optional. If naming is added, keep it lightweight and store it on the shared pet record; otherwise ship the curated cat without a naming flow.

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/phases/04-memories-pets-and-breakup-stakes/04-CONTEXT.md`
- `src/App.tsx`
- `src/app/hooks/useSharedRoomRuntime.ts`
- `src/lib/sharedRoomTypes.ts`
- `src/lib/sharedRoomStore.ts`
- `src/lib/sharedRoomValidation.ts`
- `src/lib/sharedRoomSeed.ts`
- `src/lib/sharedProgression.ts`
- `src/lib/roomState.ts`
- `src/lib/furnitureRegistry.ts`
- `src/lib/pets.ts`
- `src/lib/petPathing.ts`
- `src/components/RoomView.tsx`
- `src/components/room-view/FurnitureVisual.tsx`
- `src/components/room-view/RoomPetActor.tsx`
- `src/components/StarterFurnitureModels.tsx`
- `src/app/components/SharedRoomEntryShell.tsx`
- `src/app/components/PlayerRoomDetailsSheet.tsx`
- `src/app/components/InventoryPanel.tsx`
- `tests/sharedRoomStore.test.ts`
- `tests/sharedRoomRuntime.test.ts`
- `tests/sharedRoomValidation.test.ts`

### Secondary (MEDIUM confidence)
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/TESTING.md`
- `.planning/codebase/CONCERNS.md`
- `docs/AI_HANDOFF.md`
- `docs/CODEBASE_MAP.md`
- `docs/CURRENT_SYSTEMS.md`
- `docs/GAME_OVERVIEW.md`
- `docs/MOB_LAB.md`

## Metadata

**Confidence breakdown:**
- Shared-room schema and mutation strategy: HIGH
- Memory-frame storage and render integration: HIGH
- Breakup baseline recommendation: MEDIUM

**Research date:** 2026-03-27
**Valid until:** 2026-04-03
