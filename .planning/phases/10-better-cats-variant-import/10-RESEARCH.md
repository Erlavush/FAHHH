# Phase 10: Better Cats Variant Import - Research

**Researched:** 2026-03-27
**Domain:** Curated Better Cats variant import on top of the shipped Phase 09 local cat-sanctuary loop
**Confidence:** HIGH

<user_constraints>
## User Constraints (from active planning state and request)

### Locked Decisions
- **D-01:** This phase follows the user's explicit request to make the next phase about importing different kinds of cats from `C:\Users\user\Downloads\Better Cats v4.0 1.21.10`.
- **D-02:** Firebase and the couple/shared-room direction stay intact for later couple-cat care work.
- **D-03:** The Phase 09 cat-sanctuary loop is already shipped; this phase should deepen visual cat variety, not replace the loop.
- **D-04:** Better Cats imports should use the existing GLB + Mob Lab path where possible.
- **D-05:** UI-heavy styling remains parallel-owned, so planning should favor stable data contracts and minimal required UI touchpoints.

### Deferred / Out of Scope
- Full hosted multi-cat variant syncing.
- Full OptiFine runtime parsing in the browser.
- Breed-specific AI systems.
- A new art pipeline that depends on the external download folder being present at game runtime.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PETS-05 | Player can adopt curated Better Cats visual variants in the local room while reusing the current cat behavior/runtime and preserving persistence. | Use repo-owned imported presets and manifest-driven catalog entries instead of one-off hard-coded cats or new AI types. |

</phase_requirements>

## Summary

The Better Cats pack is already compatible with the repo's direction, but not yet with its runtime seam. The downloaded folder includes a strong source set: one GLB/CEM cat baseline, twelve base coat textures under `assets/minecraft/textures/entity/cat/`, extra overlay textures like `cat_eyes` and `whiskers`, and many weighted `.properties` files under `optifine/random/entity/cat/` that describe randomized per-breed subvariants. That is enough material to deliver a convincing curated cat library without inventing new source art.

The best implementation path is not a full OptiFine clone. The browser runtime does not need to evaluate `skins.2` and `weights.2` at load time. Instead, the phase should translate the pack into repo-owned curated assets and metadata. A small import script plus a checked-in manifest can copy selected textures into `public/`, assign stable variant ids, and generate preset metadata or preset JSONs that the app can use predictably.

The current Better Cats GLB seam is strong but incomplete. `GlbMobPreviewActor.tsx` already performs the two critical fixes documented in the existing todo: it hides unwanted `thin`, `fluff`, `bobtail`, `small_leg`, and ghost ear meshes, while keeping `ear4` and `ear5`, and it repairs the exported tail hierarchy by attaching `tailTip` under `tailBase`. Those fixes should not move. The missing piece is texture override support: the GLB actor currently never uses `preset.textureSrc`, so all imported coat variants would still render as the same cat unless the actor learns to apply preset-provided textures and optional overlays.

The second architectural finding is that cat variants should stay on one gameplay species path. Creating separate `PetType`s for every breed would duplicate adoption, care, persistence, and behavior logic. A better fit for this codebase is to keep `minecraft_cat` as the gameplay species and let the selected imported preset or variant metadata determine the look. That preserves the Phase 09 care loop and the future shared-room direction.

The third finding is that Mob Lab should remain the validation gate. The repo already treats imported mobs as authoring-first assets, and `DEFAULT_IMPORTED_MOB_PRESETS` is the current source of truth for shipped imported presets. This phase should expand that preset library with curated Better Cats presets so each look can be previewed inside Mob Lab before being adopted into the live room.

The fourth finding is that persistence and catalog wiring are already close. `OwnedPet` already stores `presetId`, the local sandbox already persists the pet roster, and the Phase 09 multi-cat loop is live. That means the variant phase mainly needs to broaden the catalog and adoption callback shape so the player can choose which preset to adopt. Legacy cats can normalize to the default `better_cat_glb` preset.

**Primary recommendation:** execute Phase 10 in three waves. First, create a repo-owned Better Cats variant manifest and curated preset library sourced from the downloaded pack. Second, extend the GLB/Mob Lab seam so Better Cats presets actually apply their variant textures while preserving the existing mesh-filter and tail-fix logic. Third, wire a curated variant catalog into the local adoption/persistence flow so the live room can own multiple visually distinct cats without multiplying gameplay code paths.

## Better Cats Pack Findings

### Base coat textures found in the pack
- `all_black`
- `black`
- `british_shorthair`
- `calico`
- `jellie`
- `ocelot`
- `persian`
- `ragdoll`
- `red`
- `siamese`
- `tabby`
- `white`

### Overlay/source extras found in the pack
- `cat_eyes.png`
- `cat_eyes_e.png`
- `whiskers.png`
- per-breed weighted subvariant pools in `optifine/random/entity/cat/*.properties`

### What the `.properties` files mean for planning
- They prove there is more variety available than the base coat list alone.
- They provide useful authoring references for future expansion.
- They do **not** need to be evaluated dynamically by the browser app in this phase.
- A curated subset can be flattened into explicit variant ids and stable preset metadata.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React + TypeScript | current repo stack | Catalog and runtime wiring | Already powers the live room, inventory, and imported-preset wiring. |
| Existing local sandbox persistence | repo-local | Persist adopted cat variants | Phase 09 already proved the local multi-cat roster path. |
| Existing imported-preset system | repo-local | Authoring and preview of curated cat presets | `mobLab.ts` and `mobLabState.ts` already provide the schema and persistence boundary. |
| Existing Better Cats GLB actor | repo-local | Variant-ready live rendering | It already solves the tricky mesh filter and tail hierarchy issues. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node asset script pattern | repo-local | Copying/generating repo-owned cat assets from the pack | Use for the curated import step so the app no longer depends on the external download at runtime. |
| Vitest | 3.0.5 declared | Preset, persistence, and manifest regressions | Required because this phase changes imported preset data and pet adoption flow. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Curated manifest/preset import | Full OptiFine runtime parser | Too much scope for the value delivered. |
| One gameplay species with many looks | Separate `PetType` per breed | Bloats catalog, persistence, and care logic. |
| Repo-owned copied assets | External file-path dependency to the Downloads folder | Fragile and non-shippable. |
| Reusing the existing GLB actor | New cat renderer path | Recreates solved problems like ghost mesh filtering and tail re-parenting. |

## Architecture Patterns

### Pattern 1: Translate the external pack into repo-owned assets and manifest data
**What:** Copy selected textures and overlays into `public/` and expose them through a stable manifest or generated preset files.
**When to use:** At the start of the phase.
**Why:** The runtime should not depend on `Downloads/` existing on the showcase or future deployment machine.

**Recommendation:** add a dedicated import script plus `src/lib/catVariants.ts` or equivalent manifest as the long-lived source of truth.

### Pattern 2: Keep cat variants as imported-preset look data, not new gameplay species
**What:** Let coat/breed differences live in preset metadata and adoption catalog entries.
**When to use:** For gameplay integration.
**Why:** The Phase 09 care, behavior, and room runtime should not fork per breed.

**Recommendation:** keep `minecraft_cat` as the gameplay species and let catalog entries choose the imported preset id.

### Pattern 3: Teach the GLB actor to honor variant textures while preserving Better Cats fixups
**What:** Apply preset-provided coat textures and optional overlays to the cloned GLB scene.
**When to use:** In the live room and Mob Lab preview path.
**Why:** Without this seam, imported coat variants still render identically.

**Recommendation:** keep the current ghost-mesh hiding and tail attachment logic exactly in `GlbMobPreviewActor.tsx`, and layer material/texture overrides on top.

### Pattern 4: Preview in Mob Lab before promoting to the room
**What:** Expand the checked-in imported-preset library with curated Better Cats presets.
**When to use:** During authoring and validation.
**Why:** The codebase already treats Mob Lab as the authoring-first import boundary.

**Recommendation:** add curated variant presets to `DEFAULT_IMPORTED_MOB_PRESETS` and keep runtime promotion explicit.

### Pattern 5: Normalize older sandbox cats forward
**What:** Preserve existing cat saves that only know about `better_cat_glb`.
**When to use:** When changing catalog and preset selection wiring.
**Why:** Phase 09 already shipped and those cats should survive the new variant system.

**Recommendation:** default legacy cats to the base preset or canonical default variant during load.

## Runtime State Inventory

| Area | Current State | Required Phase 10 Action |
|------|---------------|--------------------------|
| `src/lib/mob-presets/better_cat_glb.json` | One Better Cats preset exists today. | Expand to a curated preset library or generate per-variant presets. |
| `src/components/mob-lab/GlbMobPreviewActor.tsx` | Applies mesh filtering and tail fix, but not preset-driven texture overrides. | Add texture/material override support without losing existing Better Cats fixups. |
| `src/lib/mobLab.ts` | Preset schema does not distinguish curated cat variants today. | Carry variant-aware metadata and register additional curated presets. |
| `src/lib/mobLabState.ts` | Validates the current preset shape. | Accept and persist any new variant metadata fields safely. |
| `src/lib/pets.ts` | Gameplay species registry is one cat + one raccoon. | Keep species logic simple while exposing a curated cat-variant catalog. |
| `src/app/hooks/useAppRoomActions.ts` | Buys cats by species, not by chosen imported look. | Accept the selected cat catalog entry or preset when adopting a local cat. |
| `src/lib/devLocalState.ts` | Persists preset ids for owned pets already. | Preserve legacy preset ids and new curated preset ids. |
| `src/components/ui/InventoryPanel.tsx` | Shows one cat entry in the store today. | Surface a curated set of variant entries with minimal UI churn. |

## Common Pitfalls

### Pitfall 1: Depending on the Downloads folder at runtime
**What goes wrong:** The game works only on the dev machine and not on the showcase or shipped build.
**How to avoid:** Import curated assets into repo-owned paths during the phase.

### Pitfall 2: Parsing OptiFine random rules live in the browser
**What goes wrong:** The phase scope balloons into a compatibility project.
**How to avoid:** Flatten the pack into curated variant metadata ahead of time.

### Pitfall 3: Creating a new pet type for every cat look
**What goes wrong:** Behavior and catalog logic start duplicating per breed.
**How to avoid:** Keep one gameplay cat species and vary the imported preset/look.

### Pitfall 4: Breaking Better Cats mesh cleanup while adding textures
**What goes wrong:** Ears, fluff meshes, or tail hierarchy regress.
**How to avoid:** Preserve the current `GlbMobPreviewActor.tsx` ghost-mesh filter and `tailBase.attach(tailTip)` logic.

### Pitfall 5: Forgetting Mob Lab validation
**What goes wrong:** Variant looks reach the live room without a stable authoring checkpoint.
**How to avoid:** Register curated presets in the imported-preset library and preview them there first.

### Pitfall 6: Breaking old saved cats
**What goes wrong:** Existing Phase 09 saves reset or lose cats after the catalog expands.
**How to avoid:** Normalize missing variant detail to the base preset during load.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Better Cats variety | Live parser for full OptiFine random rules | Curated manifest and generated presets | Better scope control and a shippable result. |
| Breed support | New AI per breed | Same runtime behavior + different preset/look | Phase 09 already solved the gameplay loop. |
| Asset availability | External absolute paths in shipped preset data | Repo-owned copied textures under `public/` | Works on any machine. |
| Rendering fixes | New GLB cleanup logic elsewhere | Existing `GlbMobPreviewActor.tsx` seam | The difficult Better Cats quirks are already known there. |

## Open Questions

1. **How many curated variants should land in the first wave?**
   - Recommendation: ship at least eight clearly distinct coats, then leave secondary/random pool depth for later.

2. **Should eye overlays and whiskers land immediately?**
   - Recommendation: prioritize base coat correctness first; add overlays only if they fit cleanly into the material seam.

3. **Should hosted shared-room cats gain variant support in this phase?**
   - Recommendation: no. Keep the hosted path stable and local-first for this slice.

## Sources

### Primary (HIGH confidence)
- `.planning/todos/pet-system/import-better-cat-variants.md`
- `C:\Users\user\Downloads\Better Cats v4.0 1.21.10\assets\minecraft\textures\entity\cat\`
- `C:\Users\user\Downloads\Better Cats v4.0 1.21.10\assets\minecraft\optifine\random\entity\cat\`
- `src/lib/mob-presets/better_cat_glb.json`
- `src/components/mob-lab/GlbMobPreviewActor.tsx`
- `src/lib/mobLab.ts`
- `src/lib/mobLabState.ts`
- `src/lib/pets.ts`
- `src/lib/devLocalState.ts`
- `src/app/hooks/useAppRoomActions.ts`
- `src/components/ui/InventoryPanel.tsx`
- `scripts/generate_minecraft_vanilla_cat_rig.mjs`
- `docs/MOB_LAB.md`

### Secondary (MEDIUM confidence)
- `.planning/PROJECT.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/CONCERNS.md`
- `docs/AI_HANDOFF.md`
- `docs/CODEBASE_MAP.md`

## Metadata

**Confidence breakdown:**
- Curated import strategy over full OptiFine runtime parsing: HIGH
- Reusing the existing Better Cats GLB seam: HIGH
- Preset-driven variant catalog instead of per-breed gameplay species: HIGH
- Overlay support in first pass: MEDIUM
- Exact first-wave breed count: MEDIUM

**Research date:** 2026-03-27
**Valid until:** 2026-03-28
