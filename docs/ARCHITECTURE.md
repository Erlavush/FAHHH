# Architecture

## Runtime Ownership Map
### App Layer
[App.tsx](Z:/FAHHHH/src/App.tsx) owns the top-level application shell:
- build mode toggle
- catalog open state
- grid snap toggle
- skin import
- debug panel toggle
- camera reset
- room reset
- local sandbox load/save bridge
- passing initial and committed state into the scene

### Scene Layer
[RoomView.tsx](Z:/FAHHHH/src/components/RoomView.tsx) owns the actual live game runtime:
- Three.js / React Three Fiber scene
- camera reporting
- player movement target
- committed furniture vs draft furniture
- selection, hover, drag, gizmo, confirm/cancel/delete
- placement resolution for floor, wall, and surface decor
- collision blocking state
- interaction approach and active pose state

### Avatar Layer
[MinecraftPlayer.tsx](Z:/FAHHHH/src/components/MinecraftPlayer.tsx) owns:
- Minecraft-skin-compatible avatar rendering
- walking / idle / sit / lie / use_pc poses
- skin texture handling

## Core Data Ownership
### Registry
[furnitureRegistry.ts](Z:/FAHHHH/src/lib/furnitureRegistry.ts) is the canonical item taxonomy.

It defines:
- furniture type
- label
- model key
- category
- placement family
- footprint
- default rotation
- interaction metadata
- support surface metadata

No furniture should bypass the registry.

### Room Model
[roomState.ts](Z:/FAHHHH/src/lib/roomState.ts) is the canonical current room model.

It defines:
- `RoomState`
- `RoomMetadata`
- `RoomFurniturePlacement`
- starter room layout
- cloning and update helpers

This is the current gameplay data model to preserve and extend.

### Local Persistence
[devLocalState.ts](Z:/FAHHHH/src/lib/devLocalState.ts) owns:
- local sandbox serialization
- load / save / migration handling
- validation of persisted room data

This is the current active save path.

## Placement and Editing Subsystems
### Collision
[furnitureCollision.ts](Z:/FAHHHH/src/lib/furnitureCollision.ts) owns placement blocking logic.

It currently supports:
- rotated floor footprint overlap
- wall overlap on the same wall
- surface decor overlap on the same host
- player overlap blocking for non-rug floor items
- rug-specific exception rules

### Surface Decor Hosting
[surfaceDecor.ts](Z:/FAHHHH/src/lib/surfaceDecor.ts) owns:
- detecting valid surface hosts
- converting between world and local surface coordinates
- snapping on support surfaces
- clamping decor to host tops
- syncing anchored decor after host movement

### Interactions
[furnitureInteractions.ts](Z:/FAHHHH/src/lib/furnitureInteractions.ts) owns runtime interaction target selection.

It currently resolves:
- `sit`
- `lie`
- `use_pc`

It also contains the desk-chair detection logic for PC use.

## Imported Asset Pipeline
Imported assets are wrapped so they behave like the hand-built low-poly furniture:
- [PackAssetModel.tsx](Z:/FAHHHH/src/components/PackAssetModel.tsx): generic loader / scaler / overlay wrapper
- [OfficePackModels.tsx](Z:/FAHHHH/src/components/OfficePackModels.tsx): office desk and office chair wrappers
- [FridgeModel.tsx](Z:/FAHHHH/src/components/FridgeModel.tsx): fridge wrapper

Expected asset workflow:
1. load the imported model
2. isolate the correct nodes
3. normalize size to the room's block scale
4. apply offset so the asset sits correctly on the floor
5. connect it to a registry item with a footprint and category

## Current vs Legacy/Future Modules
### Current Source of Truth
- [App.tsx](Z:/FAHHHH/src/App.tsx)
- [RoomView.tsx](Z:/FAHHHH/src/components/RoomView.tsx)
- [furnitureRegistry.ts](Z:/FAHHHH/src/lib/furnitureRegistry.ts)
- [roomState.ts](Z:/FAHHHH/src/lib/roomState.ts)
- [surfaceDecor.ts](Z:/FAHHHH/src/lib/surfaceDecor.ts)
- [furnitureCollision.ts](Z:/FAHHHH/src/lib/furnitureCollision.ts)
- [furnitureInteractions.ts](Z:/FAHHHH/src/lib/furnitureInteractions.ts)

### Legacy / Future Skeleton
These are important, but they are not the current gameplay source of truth:
- [types.ts](Z:/FAHHHH/src/lib/types.ts)
- [contracts.ts](Z:/FAHHHH/src/lib/backend/contracts.ts)
- `backend/*`
- [AuthGate.tsx](Z:/FAHHHH/src/components/AuthGate.tsx)
- [PairingScreen.tsx](Z:/FAHHHH/src/components/PairingScreen.tsx)
- [WelcomeOverlay.tsx](Z:/FAHHHH/src/components/WelcomeOverlay.tsx)

These modules represent the earlier/future connected-couple architecture and will need reconciliation with the current room-builder data model before multiplayer is restored.

## Important Implementation Constraints
- Do not add furniture without going through the registry.
- Do not change room placement semantics casually.
- Do not treat `types.ts` as the canonical room-builder schema.
- Do not restore Firebase sync by reusing legacy shapes blindly; sync must adopt the current registry + room-state model.
