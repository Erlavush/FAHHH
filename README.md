# Risk It All: Cozy Couple Room

A browser-first cozy couple-room sandbox and authoring playground built with React, Vite, React Three Fiber, and TypeScript.

## What This Repo Is Right Now

The active product in this repository is a `local solo sandbox` plus an in-app content studio.

It is not the full paired multiplayer game yet.

What already works in the current runtime:

- a single-room 3D sandbox with Minecraft-skin-compatible avatars
- build mode with floor, wall, and surface placement
- inventory ownership with stored-vs-placed furniture
- coin-based furniture buying and selling
- four-wall wall decor and window placement
- drag-across-wall editing for wall decor
- confirm / cancel / store editing flow with stable gizmo controls
- a desk PC minigame earn loop
- a real-time world clock with sun/moon lighting and post-processing
- a temporary Pet Store plus live in-room raccoon and cat pets
- a dual-mode Preview Studio for furniture captures and Mob Lab look-dev
- browser-local persistence for room data, world settings, and Mob Lab state
- a small performance monitor HUD for runtime FPS feedback

## Final Game Direction

The long-term game direction is still `Risk It All`:

- two partners pair into one shared room
- each partner earns coins and progression
- the couple maintains a shared streak
- the room is decorated with earned furniture, decor, frames, and pets
- the desk PC contains repeatable activities and minigames
- daily quests provide steady progression
- couple memories such as photos make the room personal
- if the couple breaks up, the shared room and its progress are wiped

## Most Important Docs

- [.planning/PROJECT.md](.planning/PROJECT.md): active GSD project brief and scope
- [.planning/ROADMAP.md](.planning/ROADMAP.md): active GSD phase roadmap
- [.planning/STATE.md](.planning/STATE.md): current GSD execution state
- [.planning/codebase/ARCHITECTURE.md](.planning/codebase/ARCHITECTURE.md): refreshed brownfield ownership map
- [.planning/codebase/STRUCTURE.md](.planning/codebase/STRUCTURE.md): folder-by-folder navigation guide
- [.planning/codebase/CONCERNS.md](.planning/codebase/CONCERNS.md): known risks and debt before editing
- [AI handoff](docs/AI_HANDOFF.md): best source of truth for another AI or teammate
- [Current systems](docs/CURRENT_SYSTEMS.md): what exists in the runtime today
- [Architecture](docs/ARCHITECTURE.md): ownership boundaries and module responsibilities
- [Codebase map](docs/CODEBASE_MAP.md): fastest navigation guide for the current folder layout
- [Mob Lab guide](docs/MOB_LAB.md): imported-mob authoring pipeline and guardrails
- [Implementation roadmap](docs/ROADMAP.md): non-GSD product roadmap snapshot
- [Game overview](docs/GAME_OVERVIEW.md): long-term product vision
- [Diagrams](docs/DIAGRAMS.md): runtime and data-flow diagrams
- [MCP setup](docs/MCP_SETUP.md): recommended AI tooling stack
- [llms.txt](llms.txt): root-level AI navigation summary

## Current Runtime Entry Points

Start here when working on the active app:

- [src/App.tsx](src/App.tsx)
- [src/components/RoomView.tsx](src/components/RoomView.tsx)
- [src/components/FurniturePreviewStudio.tsx](src/components/FurniturePreviewStudio.tsx)
- [src/components/room-view](src/components/room-view)
- [src/components/mob-lab](src/components/mob-lab)
- [src/lib/roomState.ts](src/lib/roomState.ts)
- [src/lib/furnitureRegistry.ts](src/lib/furnitureRegistry.ts)
- [src/lib/devLocalState.ts](src/lib/devLocalState.ts)
- [src/lib/devWorldSettings.ts](src/lib/devWorldSettings.ts)
- [src/app/clock.ts](src/app/clock.ts)
- [src/app/hooks/useSandboxWorldClock.ts](src/app/hooks/useSandboxWorldClock.ts)
- [src/lib/gameLoop.ts](src/lib/gameLoop.ts)
- [src/lib/roomPlacementEquality.ts](src/lib/roomPlacementEquality.ts)
- [src/lib/mobLab.ts](src/lib/mobLab.ts)
- [src/lib/mobLabState.ts](src/lib/mobLabState.ts)
- [src/lib/pets.ts](src/lib/pets.ts)
- [vite.config.js](vite.config.js)

## Getting Started

1. Copy `.env.example` to `.env` only if you need local environment variables for future connected features.
2. Install dependencies.
3. Start the dev server.

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

## Current Persistence Boundary

The active runtime is browser-local on purpose:

- room/runtime data lives in `devLocalState.ts`
- world settings and UI state live in `devWorldSettings.ts`
- Mob Lab authoring state lives in `mobLabState.ts`

The shared-room backend, pairing, and multiplayer sync layer are future work. They are not the active runtime path in this repo.

Known current concern:

- `devLocalState.ts` still validates persisted placement surfaces against `floor`, `wall_back`, `wall_left`, and `surface` only, so `wall_front` and `wall_right` saves should be treated as at risk until that validator is fixed.
