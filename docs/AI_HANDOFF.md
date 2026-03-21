# AI Handoff

## Read This First

As of the current codebase state, the active product is a `local solo sandbox` plus an in-app authoring studio.

The active codebase already contains several production-shaping systems:

- registry-driven furniture placement
- inventory ownership
- coin-based buying and selling
- a desk PC minigame earn loop
- buyable wall windows with real wall openings
- preview-studio-generated furniture thumbnails
- a real-time world clock with sun/moon lighting
- a new Mob Lab for imported-mob look-dev and tuning
- generic high-fidelity GLB mob rendering with procedural physics
- real-time FPS performance monitoring HUD

This is no longer the earliest empty-room prototype, but it is also not yet the full paired couple-room game.

## Current Runtime Truth

These files define the actual running sandbox and should be treated as the current source of truth:

- [App.tsx](/Z:/FAHHHH/src/App.tsx)
- [RoomView.tsx](/Z:/FAHHHH/src/components/RoomView.tsx)
- [FurniturePreviewStudio.tsx](/Z:/FAHHHH/src/components/FurniturePreviewStudio.tsx)
- [WallWindowModel.tsx](/Z:/FAHHHH/src/components/WallWindowModel.tsx)
- [furnitureRegistry.ts](/Z:/FAHHHH/src/lib/furnitureRegistry.ts)
- [roomState.ts](/Z:/FAHHHH/src/lib/roomState.ts)
- [devLocalState.ts](/Z:/FAHHHH/src/lib/devLocalState.ts)
- [economy.ts](/Z:/FAHHHH/src/lib/economy.ts)
- [pcMinigame.ts](/Z:/FAHHHH/src/lib/pcMinigame.ts)
- [furnitureCollision.ts](/Z:/FAHHHH/src/lib/furnitureCollision.ts)
- [surfaceDecor.ts](/Z:/FAHHHH/src/lib/surfaceDecor.ts)
- [furnitureInteractions.ts](/Z:/FAHHHH/src/lib/furnitureInteractions.ts)
- [wallOpenings.ts](/Z:/FAHHHH/src/lib/wallOpenings.ts)
- [mobLab.ts](/Z:/FAHHHH/src/lib/mobLab.ts)
- [mobLabState.ts](/Z:/FAHHHH/src/lib/mobLabState.ts)

## The Two Active 3D Contexts

### 1. Live Room Runtime

The live sandbox room is owned by [RoomView.tsx](/Z:/FAHHHH/src/components/RoomView.tsx).

This is where gameplay currently exists:

- player movement
- build mode
- interactions
- furniture placement
- room shell and windows
- world lighting
- PC minigame entry

### 2. Preview Studio

The in-app content studio is owned by [FurniturePreviewStudio.tsx](/Z:/FAHHHH/src/components/FurniturePreviewStudio.tsx).

It now has two modes:

- `Furniture Studio`: thumbnail capture for furniture/shop assets
- `Mob Lab`: imported-mob preview and tuning (now supports high-fidelity GLB models)

This distinction matters. Imported presets are authored in Mob Lab first, then optionally promoted into the live room. Right now, both the `alexs_mobs_raccoon` and the high-fidelity `minecraft_cat` (GLB) are fully integrated into gameplay.

## What Is Implemented Now

### Core Room Sandbox

- single `10 x 10` room with block-relative world scale
- Minecraft-skin-compatible avatar import and rendering
- right-click movement in play mode
- furniture interactions for `sit`, `lie`, and `use_pc`
- stable build-mode editing with draft vs committed placements

### Builder and Placement

- floor, wall, and surface placement layers
- improved gizmo reliability and direct-drag behavior
- collision rules for floor items, wall items, and surface decor
- surface decor hosts with anchored local offsets
- real selection / confirm / cancel / store flow
- smooth wheel zoom instead of stepped OrbitControls zoom

### Inventory and Economy

- ownership is separate from placement
- stored items and placed items are tracked independently
- buying furniture costs coins
- selling bought furniture refunds full price for now
- starter furniture can be removed but does not mint coins
- the inventory panel also contains a temporary `Pet Store` section
- the current Pet Store exposes a `0`-coin raccoon adoption flow for room-runtime testing
- current starting balance is `180` coins
- the first live earn loop comes from the desk PC minigame

### PC Minigame

- `use_pc` desk interactions open the `Pixel Gigs` overlay once the player reaches the desk seat
- runs last `25` seconds and reward coins based on score
- completed runs trigger a real-time cooldown before the next attempt
- best score, last result, total earned coins, and cooldown timestamp are persisted locally

### Catalog and Preview Studio

- the catalog has been reworked into a room inventory/shop panel
- every registry item has `shopPreviewSrc` and `shortDescription`
- info popovers exist beside shop actions
- Preview Studio exists for generating clean thumbnail captures
- some items already use real PNG thumbnails; others still use placeholder SVGs

### Mob Lab

The imported-mob authoring pipeline now exists inside Preview Studio.

- preview locomotion supports `idle`, `walk_in_place`, and `loop_path`
- high-fidelity GLB support with `GlbMobPreviewActor.tsx`
- **Hierarchy Reconstruction**: manual bone re-parenting (e.g., tail segments) is handled in code via `attach()`
- **Scene Stability**: GLTF cloning prevents "scene theft" between Mob Lab and Room View
- **Mesh Filtering**: Smart Mesh-Only filter hides variant ghost lines (thintails, bobtails, etc.)
- collider size, offset, and visibility are editable live
- presets auto-save locally and can be exported/imported as JSON

Important current limits:

- Mob Lab is preset-driven, not direct Java entity execution
- the current renderer is role-based and best suited to quadruped-style cuboid mobs
- preview locomotion is deterministic authoring behavior, not gameplay pathfinding
- imported mobs are not mounted into the main room automatically; current live-room integration is an explicit raccoon-only test path

### Windows and Room Shell

- `window` is a real wall furniture type
- back and left walls open around placed windows
- starter room includes actual starter-owned window placements
- window glass/frame rendering lives in [WallWindowModel.tsx](/Z:/FAHHHH/src/components/WallWindowModel.tsx)
- wall segmentation logic is isolated in [wallOpenings.ts](/Z:/FAHHHH/src/lib/wallOpenings.ts)

### Lighting and World Time

- the old `day/night` mode toggle has been replaced by a 24-hour world clock
- the scene can follow either:
  - local machine time
  - accelerated in-world `Minecraft Time`
  - a user-locked inspection time
- the moon is rendered as a visible scene body, while the daytime sky look comes from a wrapper-level blue backdrop gradient behind the transparent canvas
- directional sun and moon lights move from southwest to northeast across the room
- lighting state also drives the backdrop gradient, fog tint, tone mapping exposure, hemisphere colors, AO, bloom, and vignette
- fake window ray decals are gone; the scene is driven by the global clock/lighting rig
- there is no render-mode toggle right now; the active scene path is a single cinematic lighting/post-processing pipeline

### Performance Monitoring

- a real-time **Performance Monitor** (FPS counter) exists in the bottom-left of the main UI
- calculation uses `requestAnimationFrame` for high precision
- features a color-coded status indicator (Green/Yellow/Red)

## Current Top-Level UI

The toolbar currently exposes:

- `Build Mode`
- `Inventory`
- `Grid Snap`
- `Coins`
- current `Time`
- `Import Minecraft Skin`
- `Preview Studio`
- `Reset Camera`
- `Reset Room`
- `Stand Up / Cancel Interaction`
- `Dev Panel`

Inside Preview Studio, the top-level mode switch is now:

- `Furniture Studio`
- `Mob Lab`

## Current Data Model

### Registry

[furnitureRegistry.ts](/Z:/FAHHHH/src/lib/furnitureRegistry.ts) is the canonical furniture taxonomy.

It currently defines:

- furniture type and label
- price
- category
- model key
- surface family
- footprint
- default rotation
- interaction metadata
- support-surface metadata
- preview image metadata
- short descriptions
- wall-opening metadata for windows

### Room State

[roomState.ts](/Z:/FAHHHH/src/lib/roomState.ts) is the active room schema.

Important current facts:

- `DEFAULT_ROOM_LAYOUT_VERSION = 6`
- room theme is `starter-cozy`
- starter room includes placed starter items plus corresponding owned items
- surface decor uses `anchorFurnitureId` and `surfaceLocalOffset`

### Local Persistence

[devLocalState.ts](/Z:/FAHHHH/src/lib/devLocalState.ts) persists:

- skin source
- camera position
- player position
- player coins
- room state
- PC minigame progress
- owned pets

Important current facts:

- persisted sandbox schema is currently `version: 5`
- legacy furniture-only saves are migrated forward
- outdated local layouts reset to the current fallback room if the layout version is older

### Mob Lab Presets

[mobLab.ts](/Z:/FAHHHH/src/lib/mobLab.ts) defines the imported-mob preset schema.

Important current facts:

- presets separate metadata, stage settings, animation, locomotion, physics, and parts
- each part has stable ids, hierarchy links, optional semantic roles, cuboid geometry, and transforms
- the current default preset library contains the finalized Alex's Mobs raccoon

[mobLabState.ts](/Z:/FAHHHH/src/lib/mobLabState.ts) persists Mob Lab authoring state.

Important current facts:

- Mob Lab persistence is separate from the room sandbox save
- the Mob Lab schema is currently `version: 2`
- loading a legacy Mob Lab `version: 1` state preserves the new checked-in final raccoon preset instead of old local raccoon data
- browser localStorage plus JSON export/import is the current persistence model

## Current Furniture Set

### Floor Furniture

- bed
- desk
- chair
- fridge
- wardrobe
- office desk
- office chair

### Wall Decor

- tall window
- poster
- wall frame

### Surface Decor

- vase
- books

### Accents

- table
- rug
- floor lamp

## Visual and Asset Notes

- the bed uses a custom GLB from [public/models/custom/bed.glb](/Z:/FAHHHH/public/models/custom/bed.glb)
- the wardrobe is a hardcoded model wrapper, not the earlier broken imported wardrobe shell
- shop preview support exists for every registry item, but only some items currently use final PNG captures
- the Preview Studio furniture mode is the intended path for creating the remaining thumbnails
- the first imported mob texture currently lives at [raccoon.png](/Z:/FAHHHH/public/textures/alexsmobs/raccoon.png)

## Tests and Project Health

Current automated coverage exists for:

- economy
- furniture collision
- furniture interactions
- furniture registry completeness
- invite-code utilities
- room-state helpers
- PC minigame rules
- starter-room legacy helpers
- surface decor
- wall opening segmentation
- world-lighting transitions
- simple pet pathing helpers

The active sandbox systems are primarily covered by:

- [economy.test.ts](/Z:/FAHHHH/tests/economy.test.ts)
- [furnitureCollision.test.ts](/Z:/FAHHHH/tests/furnitureCollision.test.ts)
- [furnitureInteractions.test.ts](/Z:/FAHHHH/tests/furnitureInteractions.test.ts)
- [furnitureRegistry.test.ts](/Z:/FAHHHH/tests/furnitureRegistry.test.ts)
- [roomState.test.ts](/Z:/FAHHHH/tests/roomState.test.ts)
- [pcMinigame.test.ts](/Z:/FAHHHH/tests/pcMinigame.test.ts)
- [surfaceDecor.test.ts](/Z:/FAHHHH/tests/surfaceDecor.test.ts)
- [wallOpenings.test.ts](/Z:/FAHHHH/tests/wallOpenings.test.ts)
- [worldLighting.test.ts](/Z:/FAHHHH/tests/worldLighting.test.ts)
- [petPathing.test.ts](/Z:/FAHHHH/tests/petPathing.test.ts)

Most recent known health in this repo state:

- `npm test`: passing
- `npm run build`: passing

## Important Legacy and Future-Track Modules

These files exist and are still useful, but they are not the active runtime model for the sandbox:

- [types.ts](/Z:/FAHHHH/src/lib/types.ts)
- [starterRoom.ts](/Z:/FAHHHH/src/lib/room/starterRoom.ts)
- [firebase.ts](/Z:/FAHHHH/src/firebase.ts)
- [AuthGate.tsx](/Z:/FAHHHH/src/components/AuthGate.tsx)
- [PairingScreen.tsx](/Z:/FAHHHH/src/components/PairingScreen.tsx)
- invite-code utilities and Firebase-ready auth/pairing UI

Interpretation:

- the repo still contains an older/future couple-room data shape
- the current app runtime does not boot through that path
- multiplayer work must reconcile those modules with `furnitureRegistry.ts` + `roomState.ts`, not replace the current sandbox model with the old one

## Things Another AI Should Not Accidentally Regress

- Do not remove the distinction between `ownedFurniture` and `furniture` placements.
- Do not bypass registry-driven metadata when adding furniture.
- Do not break `surfaceLocalOffset` anchoring rules for tabletop decor.
- Do not reintroduce fake window-only sunlight logic on top of the world clock system.
- Do not replace the current local room schema with the older backend `types.ts` shapes.
- Do not treat starter furniture as coin-generating sellables.
- Do not lose the fixed-height wall-window opening behavior in v1.
- Do not treat Mob Lab preview locomotion as gameplay pet AI.
- Do not break the temporary pet registry, room-pet save data, or the explicit raccoon/cat promotion path.
- Do not mount imported mobs into the room runtime by accident when only authoring/tuning is requested.
- **Do not remove GLTF cloning** (`SkeletonUtils.clone`) in `GlbMobPreviewActor`; it is required to prevent the model disappearing from the room when opening Mob Lab.
- **Do not disable the Mesh-Only Filter**; it is essential for hiding CEM variant ghost lines (thintails, etc.).

## Current Known Gaps

- no multiplayer runtime is wired into the active app shell yet
- only one live earn loop exists so far: the desk PC minigame
- no levels, streak, quests, or breakup state are in the active runtime yet
- only the raccoon is wired into the live room right now, with simple wander behavior rather than a full pet gameplay loop
- many shop previews are still placeholders
- visual polish is still in progress, especially for art-set cohesion and advanced lighting quality

## Best Next Steps

If continuing from the current codebase, the highest-value next gameplay layers are:

1. define and persist progression data beyond coins
2. add a second real coin earn loop, likely a daily quest or another PC activity
3. add level and streak state once earning/spending is no longer one-sided

If continuing imported-mob work, the safer path is:

1. keep tuning presets in Mob Lab first
2. generalize the preset/render pipeline only when a second mob forces it
3. add gameplay pet integration after authoring and look-dev are stable