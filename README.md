# Risk It All: Cozy Couple Room

A browser-first cozy couple-room game foundation built with React, Vite, React Three Fiber, and Firebase-ready skeletons.

## What This Repo Is Right Now

The active product in this repository is a `local sandbox foundation`, not the full multiplayer jam game yet.

What already works in the live runtime:

- a single-room 3D sandbox with Minecraft-skin-compatible avatars
- build mode with floor, wall, and surface placement
- stable gizmo editing, confirm/cancel/store flow, and smooth camera zoom
- inventory ownership model with stored vs placed furniture
- coin-based furniture buying and selling
- a redesigned room inventory/shop panel with previews and item descriptions
- a preview studio for generating thumbnail images
- buyable wall windows that open real holes in the back and left walls
- a real-time world clock with a single cinematic lighting pipeline, blue sky backdrop, and dev controls for locking and scrubbing time
- a desk PC minigame earn loop with saved best score and cooldown tracking
- local persistence for room state, player position, camera, coins, and skin

## Final Game Direction

The final game direction is still `Risk It All`:

- two partners pair into one persistent room
- each partner earns coins and levels up
- the couple keeps a shared streak together
- furniture, decor, frames, and pets are bought with earned currency
- the desk PC contains minigames for extra coins
- daily quests provide steady progression
- picture frames can display the couple's own photos
- pets like cats and dogs make the room feel alive
- if the couple breaks up, the shared room and its progress are wiped

## Most Important Docs

- [AI handoff](/Z:/FAHHHH/docs/AI_HANDOFF.md): current source of truth for another AI or collaborator
- [Current systems](/Z:/FAHHHH/docs/CURRENT_SYSTEMS.md): gameplay/runtime behavior that exists now
- [Architecture](/Z:/FAHHHH/docs/ARCHITECTURE.md): file ownership and system boundaries
- [Codebase map](/Z:/FAHHHH/docs/CODEBASE_MAP.md): fastest navigation guide for the current folder layout
- [Roadmap](/Z:/FAHHHH/docs/ROADMAP.md): implemented foundation vs next priorities
- [Game overview](/Z:/FAHHHH/docs/GAME_OVERVIEW.md): long-term product vision
- [Diagrams](/Z:/FAHHHH/docs/DIAGRAMS.md): runtime and roadmap diagrams
- [MCP setup](/Z:/FAHHHH/docs/MCP_SETUP.md): recommended AI-tooling stack for this repo
- [llms.txt](/Z:/FAHHHH/llms.txt): repo-root AI navigation summary

## Current Runtime Truth

If you are extending the current playable sandbox, start from:

- [App.tsx](/Z:/FAHHHH/src/App.tsx)
- [RoomView.tsx](/Z:/FAHHHH/src/components/RoomView.tsx)
- [furnitureRegistry.ts](/Z:/FAHHHH/src/lib/furnitureRegistry.ts)
- [roomState.ts](/Z:/FAHHHH/src/lib/roomState.ts)
- [devLocalState.ts](/Z:/FAHHHH/src/lib/devLocalState.ts)
- [economy.ts](/Z:/FAHHHH/src/lib/economy.ts)
- [furnitureCollision.ts](/Z:/FAHHHH/src/lib/furnitureCollision.ts)
- [surfaceDecor.ts](/Z:/FAHHHH/src/lib/surfaceDecor.ts)
- [furnitureInteractions.ts](/Z:/FAHHHH/src/lib/furnitureInteractions.ts)
- [wallOpenings.ts](/Z:/FAHHHH/src/lib/wallOpenings.ts)

Do not treat the older backend/couple-room skeleton as the active runtime schema.

## Getting Started

1. Copy `.env.example` to `.env`.
2. Fill in Firebase variables only if you want to work on connected features later.
3. Install dependencies.
4. Start the dev server.

On Windows PowerShell with strict script execution:

```powershell
cmd /c npm install
cmd /c npm run dev
```

Useful commands:

```powershell
cmd /c npm test
cmd /c npm run build
```

If Firebase is not configured, the app runs in browser-only local sandbox mode.
