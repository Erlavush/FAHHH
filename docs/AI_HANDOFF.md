# AI Handoff

## Read This First

As of the current codebase state, the active product is a `local solo sandbox` that already contains several production-shaping systems:

- registry-driven furniture placement
- inventory ownership
- coin-based buying and selling
- buyable wall windows with real wall openings
- preview-studio-generated shop thumbnails
- a real-time world clock with sun/moon lighting

This is no longer just the earliest empty-room prototype, but it is also not yet the full paired couple-room game.

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
- [furnitureCollision.ts](/Z:/FAHHHH/src/lib/furnitureCollision.ts)
- [surfaceDecor.ts](/Z:/FAHHHH/src/lib/surfaceDecor.ts)
- [furnitureInteractions.ts](/Z:/FAHHHH/src/lib/furnitureInteractions.ts)
- [wallOpenings.ts](/Z:/FAHHHH/src/lib/wallOpenings.ts)

## What Is Implemented Now

### Core Room Sandbox

- Single 10x10 room with block-relative world scale.
- Minecraft-skin-compatible avatar import and rendering.
- Right-click movement in play mode.
- Furniture interactions for `sit`, `lie`, and `use_pc`.
- Stable build-mode editing with draft vs committed placements.

### Builder and Placement

- Floor, wall, and surface placement layers.
- Improved gizmo reliability and direct-drag behavior.
- Collision rules for floor items, wall items, and surface decor.
- Surface decor hosts with anchored local offsets.
- Real selection/confirm/cancel/store flow.
- Smooth wheel zoom instead of stepped OrbitControls zoom.

### Inventory and Economy

- Ownership is separate from placement.
- Stored items and placed items are tracked independently.
- Buying furniture costs coins.
- Selling bought furniture refunds full price for now.
- Starter furniture can be removed but does not mint coins.
- Current starting balance is `180` coins.

### Catalog and UX

- Catalog has been reworked into a room inventory/shop panel.
- Every registry item has `shopPreviewSrc` and `shortDescription`.
- Info popovers exist beside shop actions.
- A preview studio exists for generating clean thumbnail captures.
- Some items already use real PNG thumbnails; others still use placeholder SVGs.

### Windows and Room Shell

- `window` is now a real wall furniture type.
- Back and left walls open around placed windows.
- Starter room includes actual starter-owned window placements.
- Window glass/frame rendering lives in [WallWindowModel.tsx](/Z:/FAHHHH/src/components/WallWindowModel.tsx).
- Wall segmentation logic is isolated in [wallOpenings.ts](/Z:/FAHHHH/src/lib/wallOpenings.ts).

### Lighting and World Time

- The old `day/night` mode toggle has been replaced by a 24-hour world clock.
- The scene can follow either:
  - local machine time
  - accelerated in-world `Minecraft Time`
  - a user-locked inspection time
- The sun and moon are rendered as actual scene bodies.
- Directional sun and moon lights move from southwest to northeast across the room.
- Lighting state also drives sky color, tone mapping exposure, hemisphere colors, AO, bloom, and vignette.
- Fake window ray decals are gone; the scene is now driven by the global clock/lighting rig.

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

The Leva dev panel currently exposes:

- local clock
- world clock
- `Use Minecraft Time`
- `Minecraft Time (24h)`
- `Lock Time`
- `Locked Time (24h)`
- `Sync Lock To Now`
- sun/shadow toggles
- fog controls
- lighting multipliers
- post-processing controls
- live player/camera coordinates
- room metadata counters

## Current Data Model

### Registry

[furnitureRegistry.ts](/Z:/FAHHHH/src/lib/furnitureRegistry.ts) is the canonical furniture taxonomy.

It currently defines:

- 14 furniture types
- price
- category
- model key
- surface family
- footprint
- interaction metadata
- support surfaces
- preview image metadata
- short descriptions
- wall opening metadata for windows

### Room State

[roomState.ts](/Z:/FAHHHH/src/lib/roomState.ts) is the active room schema.

Important current facts:

- `DEFAULT_ROOM_LAYOUT_VERSION = 6`
- room theme is `starter-cozy`
- starter room includes 13 placed starter items
- every starter placement has a corresponding owned item
- surface decor uses `anchorFurnitureId` and `surfaceLocalOffset`

### Local Persistence

[devLocalState.ts](/Z:/FAHHHH/src/lib/devLocalState.ts) persists:

- skin source
- camera position
- player position
- player coins
- room state

Important current facts:

- persisted sandbox schema is currently `version: 3`
- legacy furniture-only saves are migrated forward
- outdated local layouts reset to the current fallback room if the layout version is older

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

## Visual and Asset Notes

- The bed now uses a custom GLB from [public/models/custom/bed.glb](/Z:/FAHHHH/public/models/custom/bed.glb).
- The wardrobe is now a hardcoded model wrapper, not the earlier broken imported wardrobe shell.
- Shop preview support exists for every registry item, but only some items currently use final PNG captures.
- The preview studio is the intended path for creating the remaining thumbnails.

## Tests and Project Health

Current automated coverage exists for:

- economy
- furniture collision
- furniture interactions
- furniture registry completeness
- invite-code utilities
- room-state helpers
- starter-room legacy helpers
- surface decor
- wall opening segmentation

The active sandbox systems are primarily covered by:

- [economy.test.ts](/Z:/FAHHHH/tests/economy.test.ts)
- [furnitureCollision.test.ts](/Z:/FAHHHH/tests/furnitureCollision.test.ts)
- [furnitureInteractions.test.ts](/Z:/FAHHHH/tests/furnitureInteractions.test.ts)
- [furnitureRegistry.test.ts](/Z:/FAHHHH/tests/furnitureRegistry.test.ts)
- [roomState.test.ts](/Z:/FAHHHH/tests/roomState.test.ts)
- [surfaceDecor.test.ts](/Z:/FAHHHH/tests/surfaceDecor.test.ts)
- [wallOpenings.test.ts](/Z:/FAHHHH/tests/wallOpenings.test.ts)

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

## Current Known Gaps

- No multiplayer runtime is wired into the active app shell yet.
- No real earning loop exists yet beyond buying/selling logic.
- No levels, streak, quests, minigames, pets, or breakup state are in the active runtime.
- Many shop previews are still placeholders.
- Visual polish is still in progress, especially for art-set cohesion and advanced lighting quality.

## Best Next Steps

If continuing from the current codebase, the highest-value next layers are:

1. Define and persist progression data beyond coins.
2. Add one real coin earn loop, likely a PC minigame or a daily quest.
3. Add editable/custom frames.
4. Add one pet implementation.
5. Reconcile multiplayer/auth/pairing with the current room-state model.

If continuing visual work first, the next high-value path is:

1. Finish final PNG shop thumbnails.
2. Improve art-set coherence for the furniture roster.
3. Continue global lighting polish on top of the world clock, not per-item hacks.
