# Mob Lab

This document explains the imported-mob tooling that lives inside Preview Studio.

## Purpose

`Mob Lab` is a dev-time authoring tool for imported mobs and future pets. It is not the live gameplay pet system.

The intended workflow is:

1. bring a mob's source assets into the repo
2. represent that mob as an `ImportedMobPreset`
3. preview and tune the preset inside Preview Studio -> `Mob Lab`
4. export/import JSON while iterating
5. promote the tuned preset into live gameplay only when the runtime integration is intentional

## Current Scope

Mob Lab currently supports:

- one active imported mob preview at a time
- a small `5 x 5` grass-block platform
- live body-part transform editing
- live idle and walk animation tuning
- deterministic locomotion preview modes
- simple collider and ground-offset tuning
- `box`, `cem`, and `glb` render modes
- high-fidelity GLB support with skeletal cloning
- mesh-only filtering for hiding ghost geometry and unused variants
- browser-local auto-save plus JSON export/import

It currently does not support:

- direct Java-to-TypeScript entity conversion
- Minecraft/Forge AI or pathfinding parity
- automatic repo-file writes from inside the browser app
- automatic mounting of imported mobs into the room runtime
- arbitrary skeleton retargeting beyond the supported render modes
- full OptiFine random-entity evaluation in the browser

## File Ownership

### Studio Host

- [../src/components/FurniturePreviewStudio.tsx](../src/components/FurniturePreviewStudio.tsx)

This file owns:

- studio mode switching between `furniture` and `mob_lab`
- Mob Lab state hydration and persistence wiring
- selected mob and selected part synchronization
- preset export/import actions
- lazy loading of the heavy Mob Lab stage and editor panel

### Mob Rendering

- [../src/components/mob-lab/ImportedMobActor.tsx](../src/components/mob-lab/ImportedMobActor.tsx)
- [../src/components/mob-lab/MobPreviewActor.tsx](../src/components/mob-lab/MobPreviewActor.tsx)
- [../src/components/mob-lab/CemMobPreviewActor.tsx](../src/components/mob-lab/CemMobPreviewActor.tsx)
- [../src/components/mob-lab/GlbMobPreviewActor.tsx](../src/components/mob-lab/GlbMobPreviewActor.tsx)
- [../src/components/mob-lab/MobLabStage.tsx](../src/components/mob-lab/MobLabStage.tsx)

These files own:

- the fixed grass stage
- Mob Lab camera framing
- texture loading for imported mobs
- simple box-model rendering
- CEM node-tree rendering
- GLB rendering with procedural overrides
- live animation preview
- preview locomotion modes
- collider visualization

Important current detail:

- `ImportedMobActor.tsx` selects the renderer by `getMobRenderMode(preset)` and lazy-loads the CEM and GLB actors

### Mob Lab UI

- [../src/components/mob-lab/MobLabEditorPanel.tsx](../src/components/mob-lab/MobLabEditorPanel.tsx)

This file owns the editing controls for:

- preset metadata
- rig transforms
- idle animation settings
- walk animation settings
- locomotion settings
- collider/physics settings

### Preset Schema And Persistence

- [../src/lib/mobLab.ts](../src/lib/mobLab.ts)
- [../src/lib/mobLabState.ts](../src/lib/mobLabState.ts)
- [../src/lib/mobTextureLayout.ts](../src/lib/mobTextureLayout.ts)
- [../src/lib/cemTransforms.ts](../src/lib/cemTransforms.ts)

These files own:

- the `ImportedMobPreset` schema
- render-mode helpers
- default imported-mob presets
- localStorage persistence and validation
- texture face mapping helpers
- CEM transform conversion helpers

## Preset Shape

The current preset structure in [../src/lib/mobLab.ts](../src/lib/mobLab.ts) separates imported-mob data into these layers:

- metadata: `id`, `label`, `sourceLabel`, `sourceMobPath`, `textureSrc`
- stage: model scale and camera framing for the lab
- animation: idle and walk tuning values
- locomotion: preview mode, speed, turn responsiveness, loop radius
- physics: ground offset, collider size, collider offset, collider visibility
- parts: editor-facing rig nodes and semantic role tags
- `cemModel`: optional recursive CEM tree with animation-node metadata
- `renderMode`: `box`, `cem`, or `glb`

## Persistence Model

Mob Lab persistence is separate from the room sandbox save.

- room/runtime save path: [../src/lib/devLocalState.ts](../src/lib/devLocalState.ts)
- world-settings save path: [../src/lib/devWorldSettings.ts](../src/lib/devWorldSettings.ts)
- Mob Lab authoring save path: [../src/lib/mobLabState.ts](../src/lib/mobLabState.ts)

Important current facts:

- Mob Lab uses its own localStorage key and schema
- the persisted Mob Lab schema is currently `version: 2`
- importing/exporting JSON is the intended browser-safe sharing workflow
- if you change the preset schema, update validation and migration together
- removed or renamed built-in preset ids should be handled deliberately during load

## Default Imported Mobs

Current checked-in presets:

- `alexs_mobs_raccoon`
- `better_cat_glb`

Interpretation:

- the raccoon is the current simple imported-mob baseline
- the cat is the high-fidelity GLB baseline
- both can already be promoted into the live room through the temporary pet runtime

## Live-Room Bridge

Mob Lab is the authoring source of truth for imported-mob looks, but live-room pets are bridged separately:

- [../src/lib/pets.ts](../src/lib/pets.ts) defines which imported presets are exposed as gameplay pets
- [../src/components/room-view/RoomPetActor.tsx](../src/components/room-view/RoomPetActor.tsx) renders pets in the room
- [../src/lib/petPathing.ts](../src/lib/petPathing.ts) provides the simplified room-safe movement logic

Important boundary:

- Mob Lab preview locomotion is not gameplay pet AI
- room pets are currently a deliberately simpler runtime path

## Guardrails For Another AI

- Do not mount imported mobs into `RoomView.tsx` unless the task is explicitly about live-room pet integration.
- Do not treat preview locomotion as gameplay pathfinding.
- Do not break preset JSON compatibility casually; if the schema changes, bump migration intentionally.
- Do not assume every future mob fits the same quadruped animation roles without extending the renderer.
- Keep imported-mob authoring isolated to Preview Studio until the preset and look-dev are stable.
- Do not remove GLB cloning or mesh filtering from the renderer path.

## Best Next Uses

Mob Lab is currently best for:

- tuning a newly imported mob's body-part alignment
- fixing animation feel before gameplay integration
- checking collider size and stage framing
- iterating on texture mapping and CEM node placement
- validating imported presets before runtime use

It is not yet the right place for:

- full pet AI
- room navigation/pathfinding
- multiplayer pet sync
- production gameplay behavior state
- live resource-pack ingestion directly from the browser
