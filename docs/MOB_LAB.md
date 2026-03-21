# Mob Lab

This document explains the imported-mob tooling that now lives inside Preview Studio.

## Purpose

`Mob Lab` is a dev-time authoring tool for imported mobs or pets. It is not the live gameplay pet system.

The intended workflow is:

1. Bring a mob's source assets/spec into the repo.
2. Represent the mob as an `ImportedMobPreset`.
3. Preview and tune that preset inside Preview Studio -> `Mob Lab`.
4. Export/import JSON while iterating.
5. Promote the tuned preset into gameplay later only if the runtime integration is intentional.

## Current Scope

Mob Lab currently supports:

- one active imported mob preview at a time
- a small `5 x 5` grass-block platform
- live body-part transform editing
- live idle and walk animation tuning
- deterministic locomotion preview modes
- simple collider and ground-offset tuning
- high-fidelity GLB support with skeletal cloning (prevents scene theft)
- Smart Mesh-Only variant filtering (hides ghost geometry)
- browser-local auto-save plus JSON export/import
- browser-local auto-save plus JSON export/import

It currently does not support:

- direct Java-to-TypeScript entity conversion
- Minecraft/Forge AI or pathfinding parity
- automatic repo-file writes from inside the browser app
- automatic mounting of imported mobs into the main room runtime
- a general-purpose arbitrary skeleton/animation graph
- full OptiFine random-entity evaluation in the browser

## File Ownership

### Studio Host

- [FurniturePreviewStudio.tsx](/Z:/FAHHHH/src/components/FurniturePreviewStudio.tsx)

This file owns:

- studio mode switching between `furniture` and `mob_lab`
- Mob Lab state hydration and persistence wiring
- selected mob and selected part synchronization
- preset export/import actions

### Mob Lab Rendering

- [MobLabStage.tsx](/Z:/FAHHHH/src/components/mob-lab/MobLabStage.tsx)
- [MobPreviewActor.tsx](/Z:/FAHHHH/src/components/mob-lab/MobPreviewActor.tsx)
- [CemMobPreviewActor.tsx](/Z:/FAHHHH/src/components/mob-lab/CemMobPreviewActor.tsx)
- [GlbMobPreviewActor.tsx](/Z:/FAHHHH/src/components/mob-lab/GlbMobPreviewActor.tsx)

These files own:

- the fixed grass stage
- Mob Lab camera framing
- texture loading for imported mobs
- legacy cuboid-part rendering
- CEM node-tree rendering
- high-fidelity GLB rendering with procedural bone overrides
- live animation preview
- preview locomotion modes
- collider visualization

### Mob Lab UI

- [MobLabEditorPanel.tsx](/Z:/FAHHHH/src/components/mob-lab/MobLabEditorPanel.tsx)

This file owns the editing controls for:

- preset metadata
- rig transforms
- idle animation settings
- walk animation settings
- locomotion settings
- collider/physics settings

### Preset Schema and Persistence

- [mobLab.ts](/Z:/FAHHHH/src/lib/mobLab.ts)
- [mobLabState.ts](/Z:/FAHHHH/src/lib/mobLabState.ts)
- [mobTextureLayout.ts](/Z:/FAHHHH/src/lib/mobTextureLayout.ts)
- [cemTransforms.ts](/Z:/FAHHHH/src/lib/cemTransforms.ts)

These files own:

- the `ImportedMobPreset` schema
- box-model and CEM-model definitions
- default imported-mob presets
- localStorage persistence and validation
- texture face mapping helpers
- CEM transform conversion helpers


## Preset Shape

The current preset structure in [mobLab.ts](/Z:/FAHHHH/src/lib/mobLab.ts) separates imported-mob data into these layers:

- metadata: `id`, `label`, `sourceLabel`, `sourceMobPath`, `textureSrc`
- stage: model scale and camera framing for the lab
- animation: idle and walk tuning values
- locomotion: preview mode, speed, turn responsiveness, loop radius
- physics: ground offset, collider size, collider offset, collider visibility
- parts: editor-facing rig nodes and semantic role tags
- `cemModel`: optional recursive CEM tree with node overrides and animation targets


## Persistence Model

Mob Lab persistence is separate from the room sandbox save.

- Room/runtime save path: [devLocalState.ts](/Z:/FAHHHH/src/lib/devLocalState.ts)
- Mob Lab authoring save path: [mobLabState.ts](/Z:/FAHHHH/src/lib/mobLabState.ts)

Important current facts:

- Mob Lab state uses its own localStorage key
- the persisted Mob Lab schema is currently `version: 4`
- importing/exporting JSON is the intended browser-safe sharing workflow
- if you change the preset schema, update validation and persistence together
- removed built-in presets can be explicitly invalidated in persistence handling

## Default Imported Mobs

Current checked-in presets:

- `alexs_mobs_raccoon`: original cuboid-model baseline
- `better_cat_glb`: high-fidelity GLB-model baseline with 1:1 reference rig sync

Interpretation:

- raccoon remains the simple imported-mob baseline
## Guardrails For Another AI

- Do not mount imported mobs into [RoomView.tsx](/Z:/FAHHHH/src/components/RoomView.tsx) unless the task is explicitly about gameplay pet integration.
- Do not treat the current locomotion preview as gameplay pathfinding.
- Do not break preset JSON compatibility casually; if the schema changes, bump persistence handling deliberately.
- Do not assume every future mob will fit the same quadruped animation roles without extending the renderer.
- Keep imported-mob work isolated to Preview Studio until the preset and look-dev are stable.
- For OptiFine packs, prefer extending the importer or the CEM renderer instead of hand-editing giant generated JSON files when the issue is systemic.

## Best Next Uses

Mob Lab is currently best for:

- tuning a newly imported mob's body-part alignment
- fixing animation feel before gameplay integration
- checking collider size and stage framing
- iterating on texture mapping and CEM node placement
- validating OptiFine/CEM imports before runtime use

It is not yet the right place for:

- full pet AI
- room navigation/pathfinding
- multiplayer pet sync
- production gameplay behavior state
- live resource-pack ingestion directly from the browser

