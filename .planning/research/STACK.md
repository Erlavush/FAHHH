# Stack Research

**Domain:** Brownfield browser-based cozy multiplayer room-building game
**Researched:** 2026-03-26
**Confidence:** MEDIUM

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 18.3.1 | App shell, stateful UI, and workflow surfaces | Already anchors the brownfield runtime and supports incremental multiplayer UI work without resetting the app shell |
| React Three Fiber | 8.17.14 | Declarative scene composition for the live room and authoring views | Keeps Three.js integration inside React state flow and matches the current rendering architecture |
| Three.js | 0.173.0 | 3D scene graph, math, cameras, and materials | Required by the existing room builder, lighting model, and imported-model pipeline |
| Vite | 6.0.1 | Dev server and production bundling | Fast iteration and existing chunking rules already support the split between runtime and heavy authoring modules |
| TypeScript | 5.7.2 | Domain schema safety across room state, persistence, and gameplay systems | Important for evolving the current room schema into shared-state adapters without accidental shape drift |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @react-three/drei | 9.122.0 | Scene helpers, controls, and rendering utilities | Use when extending room interaction or authoring helpers inside existing R3F patterns |
| @react-three/postprocessing | 2.19.1 | Effect-composer integration | Keep using for the current lighting and atmosphere stack instead of ad hoc visual forks |
| postprocessing | 6.38.3 | Underlying post-processing effects | Use when extending the existing bloom, AO, and grading pipeline |
| leva | 0.10.1 | Debug and tuning controls | Keep for developer-only world and lighting tuning, not user-facing production UI |
| firebase | 11.0.2 | Reserved dependency for future connected features | Only use if a shared-room backend is chosen around the current schema; do not restore it as a parallel legacy runtime |
| vitest, jsdom, Testing Library | 3.0.5 / 26.0.0 / 6.6.3 | Fast unit and component-adjacent validation | Use for schema, room logic, sync adapters, and UI regression coverage before adding any heavier end-to-end layer |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `cmd /c npm test` | Regression testing | Existing test suite already covers core room math, persistence helpers, pets, and imported-model helpers |
| `cmd /c npm run build` | Type-check plus bundle validation | Important after any cross-module schema or chunking change |
| Repo docs under `docs/` | Brownfield architecture reference | Treat `AI_HANDOFF.md`, `CURRENT_SYSTEMS.md`, `ARCHITECTURE.md`, and `CODEBASE_MAP.md` as the current system map |

## Installation

```bash
# Current project dependencies are already declared in package.json
cmd /c npm install
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Keep React + Vite + R3F + Three | Migrate to a different engine or web-game framework | Only if the project intentionally resets scope beyond the current browser runtime, which this roadmap does not recommend |
| Extend current room and persistence models | Backend-first rewrite with a new domain schema | Only if the team is willing to discard current brownfield behavior and migration history |
| Keep Preview Studio and Mob Lab as separate tooling surfaces | Merge authoring state directly into gameplay runtime | Only if the product intentionally drops the current authoring/runtime boundary, which would increase regression risk |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Full renderer or engine rewrite | Would reset a proven sandbox and delay the actual shared-room milestone | Extend the current React, R3F, and Three architecture |
| Reviving the removed legacy backend path as-is | Repo docs say it is no longer the runtime truth and would compete with the current room model | Build a new shared-state adapter around the current schema |
| Syncing transient drag state frame-by-frame | Creates conflict and bandwidth problems before the core loop is stable | Sync committed room edits and lightweight presence first |

## Stack Patterns by Variant

**If adding shared-room sync:**
- Keep the client-side room editor authoritative for local interaction feel.
- Sync committed room operations and shared documents, not every pointer movement.

**If expanding authoring tools:**
- Keep Preview Studio and Mob Lab lazy-loaded and separate from the live room path.
- Promote assets into gameplay intentionally after validation.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `react@18.3.1` | `react-dom@18.3.1`, `@vitejs/plugin-react@4.3.4` | Matches the current app shell stack |
| `@react-three/fiber@8.17.14` | `three@0.173.0`, `@react-three/drei@9.122.0` | Existing room and preview code already target this combination |
| `vite@6.0.1` | `typescript@5.7.2` | Current build script uses `tsc --noEmit` before bundling |

## Sources

- `package.json` - package versions and runtime toolchain
- `README.md` - current runtime, future direction, and verification commands
- `docs/ARCHITECTURE.md` - module boundaries and current rendering structure
- `docs/AI_HANDOFF.md` - active runtime truths and guardrails

---
*Stack research for: brownfield browser-based cozy multiplayer room-building game*
*Researched: 2026-03-26*
