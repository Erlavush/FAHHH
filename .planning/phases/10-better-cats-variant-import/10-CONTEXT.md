# Phase 10: Better Cats Variant Import - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning
**Source:** User-requested follow-up after Phase 09 plus current Better Cats pack and runtime audit

<domain>
## Phase Boundary

Phase 10 builds directly on the shipped Phase 09 cat-sanctuary loop.
Its job is to turn the single-look Better Cats runtime into a curated multi-variant cat library sourced from the downloaded pack at `C:\Users\user\Downloads\Better Cats v4.0 1.21.10`, while preserving the existing room runtime, local sandbox persistence, and future couple/shared-room direction.

Success boundary:
- The repo gains a curated, repo-owned set of Better Cats textures and presets rather than relying on the external download folder at runtime.
- The live cat actor and Mob Lab can preview and render multiple Better Cats looks without breaking the current mesh-filter fixups, tail hierarchy correction, or cat behavior loop.
- The sandbox/local room can adopt and persist visually distinct cats from a curated first-wave variant set.
- The showcase cat-care loop from Phase 09 remains intact; cat variants are a content/depth expansion, not a rollback.
- Hosted Firebase/shared-room foundations remain intact even if hosted multi-variant syncing stays deferred.

</domain>

<decisions>
## Implementation Decisions

### Locked Decisions
- **D-01:** This phase follows the user's explicit request to make the next phase about importing different kinds of cats from `C:\Users\user\Downloads\Better Cats v4.0 1.21.10`.
- **D-02:** The external Better Cats download is source material, not a runtime dependency. Runtime assets must be copied or generated into repo-owned paths under `public/` and `src/lib/mob-presets/`.
- **D-03:** Use the existing Better Cats GLB actor and runtime seam rather than creating separate AI or behavior systems per breed.
- **D-04:** The first pass should be curated, not infinite. It should land strong distinct cats such as `tabby`, `red`, `calico`, `siamese`, `british_shorthair`, `ragdoll`, `black`, and `white` instead of promising full OptiFine parity.
- **D-05:** Preserve the current Better Cats GLB special handling: hidden ghost meshes, kept ear meshes, and the manual tail hierarchy fix must survive variant work.
- **D-06:** Do not implement a browser runtime that parses full OptiFine random-entity `.properties` files on the fly. Translate the pack into a curated manifest/preset layer inside this repo instead.
- **D-07:** Mob Lab remains the authoring and validation surface for imported cat looks. Live-room promotion stays explicit.
- **D-08:** The local sandbox path is the priority for multi-variant adoption. Hosted shared-room can remain on the existing single canonical shared cat until a later follow-up phase broadens that contract safely.
- **D-09:** UI-heavy visual work is still parallel-owned. This phase may add the minimal catalog and data-contract wiring needed to select cat variants, but it should not fight unrelated UI changes.

### the agent's Discretion
- Exact first-wave variant count as long as it is curated, visibly diverse, and larger than the current one-look cat baseline.
- Whether variants are surfaced through multiple presets, multiple catalog entries, or a manifest + preset combination, as long as the runtime avoids duplicating per-breed behavior logic.
- Whether overlay details like emissive eyes or whiskers land in the first pass or are deferred behind the base-coat import.
- Exact pricing and naming, as long as catalog entries are clear to the player and compatible with the current cat adoption loop.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope and planning truth
- `AGENTS.md`
- `.planning/PROJECT.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- `.planning/todos/pet-system/import-better-cat-variants.md`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/TESTING.md`
- `.planning/codebase/CONCERNS.md`
- `docs/AI_HANDOFF.md`
- `docs/CODEBASE_MAP.md`
- `docs/ARCHITECTURE.md`
- `docs/MOB_LAB.md`

### Better Cats source material
- `C:\Users\user\Downloads\Better Cats v4.0 1.21.10\assets\minecraft\textures\entity\cat\`
- `C:\Users\user\Downloads\Better Cats v4.0 1.21.10\assets\minecraft\optifine\random\entity\cat\`
- `C:\Users\user\Downloads\Better Cats v4.0 1.21.10\assets\minecraft\optifine\cem\cat.jem`
- `C:\Users\user\Downloads\Better Cats v4.0 1.21.10\assets\minecraft\optifine\cem\cat - Converted.bbmodel`

### Current cat import/runtime seams
- `src/lib/mobLab.ts`
- `src/lib/mobLabState.ts`
- `src/lib/mob-presets/better_cat_glb.json`
- `src/components/mob-lab/GlbMobPreviewActor.tsx`
- `src/components/mob-lab/MobPreviewActor.tsx`
- `src/components/room-view/RoomPetActor.tsx`
- `src/lib/pets.ts`
- `src/lib/devLocalState.ts`
- `src/app/hooks/useAppRoomActions.ts`
- `src/components/ui/InventoryPanel.tsx`
- `src/App.tsx`

### Existing scripting pattern
- `scripts/generate_minecraft_vanilla_cat_rig.mjs`

### Verification anchors
- `tests/pets.test.ts`
- `tests/devLocalState.test.ts`
- `tests/mobLabState.test.ts`
- `tests/shellViewModel.test.ts`

</canonical_refs>

<code_context>
## Existing Code Insights

### What already helps this phase
- `better_cat_glb.json` already gives the repo one high-fidelity cat GLB baseline to build on.
- `GlbMobPreviewActor.tsx` already hides unwanted Better Cats ghost geometry and repairs the exported tail hierarchy at runtime.
- `RoomPetActor.tsx` already drives live-room cat motion through imported presets, so a variant-aware preset path can reuse the current behavior system.
- `scripts/generate_minecraft_vanilla_cat_rig.mjs` proves the repo already accepts one-off asset-generation scripts that read the Better Cats pack and emit repo-owned artifacts.
- `useAppRoomActions.ts`, `pets.ts`, and `InventoryPanel.tsx` already own the local cat adoption path, so variant selection can ride the existing showcase loop.

### What is missing today
- `GlbMobPreviewActor.tsx` currently preserves the mesh filter/tail fix, but it does not apply `preset.textureSrc` to the Better Cats GLB, so curated coat imports would still look the same unless that seam is added.
- `ImportedMobPreset` and `DEFAULT_IMPORTED_MOB_PRESETS` only expose one shipped Better Cats cat preset today.
- The local cat adoption/catalog flow is keyed around one cat definition, not a curated library of same-species visual variants.
- The external Better Cats download contains many textures and weighted `.properties` files, but the browser app has no repo-owned manifest that interprets those files into curated playable variants.

### Integration guidance
- Keep variant work data-driven: use repo-owned manifests or per-variant preset files rather than hard-coded branching throughout gameplay code.
- Reuse one cat behavior/runtime path; the imported look should vary more than the AI.
- Preserve older saved cats by normalizing legacy records to the default Better Cats preset if they lack explicit variant/preset detail.
- Treat OptiFine `.properties` weights as authoring references, not as a required runtime parser target.

</code_context>

<specifics>
## Specific Ideas

- Use a small import script to copy and normalize curated texture assets from the download folder into `public/textures/cats/better-cats/`.
- Generate or author multiple Better Cats preset JSONs that all point to `/models/better_cat.glb` but differ by variant metadata and `textureSrc`.
- Keep the live adoption story simple: the player should see several named cat entries and adopt the look they want without learning Mob Lab internals.
- Mob Lab should become the quick sanity-check surface for each imported coat before it reaches the live room.

</specifics>

<deferred>
## Deferred Ideas

- Full OptiFine random-entity parity in the browser.
- Automatic runtime ingestion from arbitrary user-selected resource packs.
- Hosted/shared-room multi-variant cat syncing.
- Breed-specific behavior differences or separate AI logic.
- Deep breeding or genetics systems.
- Large UI redesigns for the pet store beyond the minimal selection wiring needed for this phase.

</deferred>

---
*Phase: 10-better-cats-variant-import*
*Context gathered: 2026-03-27*
