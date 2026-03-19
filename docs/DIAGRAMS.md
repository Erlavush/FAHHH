# Diagrams

## Current Runtime Architecture
Current: how the active solo sandbox runtime is structured.

```mermaid
flowchart LR
  Player["Player / Builder"] --> App["App.tsx<br/>UI shell + toggles + persistence bridge"]
  App --> Room["RoomView.tsx<br/>3D runtime scene"]
  App --> Save["devLocalState.ts<br/>local sandbox persistence"]
  App -. future track .-> Backend["backend/* + Firebase"]

  Room --> Avatar["MinecraftPlayer.tsx"]
  Room --> Registry["furnitureRegistry.ts<br/>item taxonomy + metadata"]
  Room --> RoomState["roomState.ts<br/>room metadata + placements"]
  Room --> Collision["furnitureCollision.ts<br/>placement blocking"]
  Room --> Surface["surfaceDecor.ts<br/>hosted tabletop logic"]
  Room --> Interactions["furnitureInteractions.ts<br/>sit / lie / use_pc targeting"]
  Room --> Models["model components + imported pack assets"]
```

## Current Mode and Interaction Flow
Current: how the player moves between play mode, build mode, and interaction states.

```mermaid
stateDiagram-v2
  [*] --> PlayMode

  PlayMode --> MovePlayer: Right-click floor
  MovePlayer --> PlayMode

  PlayMode --> ApproachInteraction: Right-click chair / bed / desk
  ApproachInteraction --> ActiveInteraction: Reach target
  ActiveInteraction --> PlayMode: Stand / right-click floor

  PlayMode --> BuildMode: Toggle Build Mode On
  BuildMode --> PlayMode: Toggle Build Mode Off

  BuildMode --> CatalogOpen: Toggle catalog
  CatalogOpen --> DraftEditing: Spawn item

  BuildMode --> DraftEditing: Double-click floor or wall item
  BuildMode --> DraftEditing: Single-click surface decor

  DraftEditing --> BuildMode: Confirm
  DraftEditing --> BuildMode: Cancel
  DraftEditing --> BuildMode: Delete
  DraftEditing --> BuildMode: Deselect
```

## Placement System Diagram
Current: the three placement families and their rule sets.

```mermaid
flowchart TD
  Def["FurnitureDefinition"] --> Floor["Floor item"]
  Def --> Wall["Wall item"]
  Def --> Surface["Surface decor"]

  Floor --> FloorRules["floor bounds clamp + rotated footprint collision"]
  Wall --> WallRules["wall_back / wall_left bounds + wall overlap"]
  Surface --> Host["host furniture with supportSurface"]
  Host --> Anchor["anchorFurnitureId + surfaceLocalOffset"]
  Anchor --> Sync["surface decor follows host move / rotate"]

  Surface --> Snap["grid on = 0.5 step<br/>4 sub-slots inside each 1x1 block"]
  Surface --> Free["grid off = free placement anywhere on host top"]
```

## Current Data Model Diagram
Current: the local sandbox save and room model structure.

```mermaid
flowchart TD
  Sandbox["PersistedSandboxState"] --> Skin["skinSrc"]
  Sandbox --> Camera["cameraPosition"]
  Sandbox --> Player["playerPosition"]
  Sandbox --> Room["RoomState"]

  Room --> Meta["RoomMetadata"]
  Room --> Placements["RoomFurniturePlacement[]"]

  Placements --> Registry["FurnitureDefinition"]
  Placements --> SurfaceAnchor["anchorFurnitureId / surfaceLocalOffset<br/>(surface decor only)"]
```

## Full Product Roadmap Diagram
Future: the intended path from current local sandbox to the full couple-room release.

```mermaid
flowchart LR
  A["Current: Local Solo Sandbox"] --> B["Phase 0: Docs + AI Handoff Pack"]
  B --> C["Phase 1: Core System Stabilization"]
  C --> D["Phase 2: Content + Interaction Completion"]
  D --> E["Phase 3: UX / Mobile / Builder Polish"]
  E --> F["Phase 4: Save Schema + Data Model Unification"]
  F --> G["Phase 5: Themes / Cosmetics / Progression"]
  G --> H["Phase 6: Auth + Pairing + Shared Room Backend"]
  H --> I["Phase 7: Live Sync + Partner Presence Beta"]
  I --> J["Phase 8: V1 Polish + Release"]
```

## Current vs Future Boundary
Future-facing note: backend and auth already exist in the repo, but the active runtime currently stops at the local solo sandbox.

```mermaid
flowchart TD
  Current["Current Active Product<br/>Local Solo Sandbox"] --> CurrentTruth["Registry + RoomState + RoomView"]
  Current --> LocalSave["Local sandbox persistence"]

  Future["Future Connected Couple Product"] --> Auth["Google auth"]
  Future --> Pairing["Invite pairing"]
  Future --> SharedRoom["Shared room backend"]
  Future --> Presence["Live partner presence"]

  CurrentTruth -. must be adopted by .-> SharedRoom
  LocalSave -. schema should converge with .-> SharedRoom
```
