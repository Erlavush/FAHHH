# Cozy Couple Room Game

## Project Fantasy
This project is a cozy browser-based room-life game centered on the feeling of "we have our own room together." The player currently explores a single intimate 10x10 room, customizes a Minecraft-scale avatar with standard Minecraft skin PNGs, decorates the room in real time, and uses furniture like chairs, beds, and desks. The long-term goal is to evolve this solo sandbox into a shared couple room where two players pair up, enter one persistent space, decorate together, and see each other's presence live.

## Current Playable Loop
- Open the local sandbox room.
- Move the player with right-click on the floor.
- Orbit and zoom the camera freely.
- Toggle Build Mode to place, move, rotate, confirm, cancel, or delete furniture.
- Spawn floor, wall, and surface decor items from the catalog.
- Use current interactions in play mode:
  - `sit` on chairs
  - `lie` on the bed
  - `use_pc` at desks when a valid chair is present
- Refresh and continue from the saved local sandbox state.

## Final Product Direction
- Primary target: one polished shared couple room.
- Core pillars:
  - cozy room decorating
  - Minecraft-scale world logic
  - Minecraft-skin-compatible avatars
  - presence-first multiplayer
  - cosmetic progression, not economy-heavy simulation
- The current active product is a `local solo sandbox`.
- Firebase auth, invite pairing, shared-room sync, and partner presence exist only as a future-track skeleton right now.

## World Scale Rules
- `1 world unit = 1 block`.
- Ground plane uses Minecraft-like block logic.
- Room footprint is currently `10 x 10` blocks.
- `Y` is vertical height; `X/Z` are floor-plane axes.
- The player uses Minecraft-like proportions and Minecraft skin layout rules.
- Furniture should fit cleanly into block-relative footprints and remain readable beside a roughly `1.8`-unit-tall avatar.

## Current Product Status
- `Implemented now`: local sandbox room builder, furniture placement, wall decor, surface decor, room interactions, local persistence, imported furniture assets.
- `Legacy / future skeleton`: Firebase auth, invite pairing, shared room backend, presence sync.
- `Planned next`: stabilization, more content, better interactions, then reconnecting the multiplayer backend to the current room model.
