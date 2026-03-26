# Coding Conventions

**Analysis Date:** 2026-03-26

## Naming Patterns

**Files:**
- `PascalCase.tsx` for React components and 3D model components such as `src/components/RoomView.tsx` and `src/components/WallWindowModel.tsx`
- `camelCase.ts` for hooks, helpers, and domain modules such as `src/lib/devLocalState.ts` and `src/components/room-view/useRoomViewLighting.ts`
- `*.test.ts` for Vitest files under `tests/`

**Functions:**
- `camelCase` for all functions
- Hooks use the `use*` prefix
- Event handlers use `handle*` naming heavily in `src/App.tsx`, `src/components/RoomView.tsx`, and the app-shell components

**Variables:**
- `camelCase` for local variables and refs
- `UPPER_SNAKE_CASE` for constants such as `DEFAULT_ROOM_LAYOUT_VERSION`, `WORLD_SETTINGS_KEY`, and `DEFAULT_STARTING_COINS`

**Types:**
- `PascalCase` for interfaces and type aliases
- No `I*` interface prefix
- Union types are string-literal based and common in domain modules

## Code Style

**Formatting:**
- Double quotes for strings
- Semicolons are used consistently
- Indentation is two spaces in most TypeScript/TSX files
- No repo-local Prettier config found

**Linting:**
- No ESLint config or lint script found in the workspace root
- The main enforced quality gate in scripts is TypeScript checking via `cmd /c npm run build`

## Import Organization

**Order:**
1. External packages
2. Internal relative modules
3. Type-only imports, usually inline via `import { type X }`

**Grouping:**
- Blank lines usually separate external imports from internal imports
- No path aliases are configured; imports are relative

## Error Handling

**Patterns:**
- Validate and return safe fallbacks at boundaries instead of throwing through the UI
- Persistence helpers in `src/lib/devLocalState.ts`, `src/lib/devWorldSettings.ts`, and `src/lib/mobLabState.ts` sanitize parsed values before accepting them
- UI handlers favor early returns for invalid state, missing prerequisites, or not-enough-coins checks

**Error Types:**
- No custom error hierarchy found in the active app code
- No central logging or error middleware layer exists in the current client-only runtime

## Logging

**Framework:**
- No structured logger found
- Runtime debugging is mostly visual: `Leva`, `DevPanel`, `PerformanceMonitor`, and scene overlays

**Patterns:**
- Avoid adding `console.log` noise to normal gameplay code
- Prefer explicit UI/debug controls over ad hoc logs when inspecting stateful 3D behavior

## Comments

**When to Comment:**
- Comments are sparse and usually explain coordinate systems, timing constants, or non-obvious engine math
- Good examples live in `src/lib/gameLoop.ts` and a few geometry helpers

**JSDoc/TSDoc:**
- Used selectively, mainly for domain math or conversion helpers
- Not required for every internal function

**TODO Comments:**
- No active `TODO`, `FIXME`, or `HACK` comments were found in the inspected source and tests

## Function Design

**Size:**
- Orchestrator files such as `src/App.tsx` and `src/components/FurniturePreviewStudio.tsx` are still large
- Most lower-level helpers in `src/lib/` and `src/components/room-view/` stay more focused

**Parameters:**
- Options objects appear when functions need optional identifiers or metadata
- Domain helpers often accept typed tuples and explicit callback functions

**Return Values:**
- Early return style is common
- Pure helpers typically return plain objects, arrays, or tuples without wrapper abstractions

## Module Design

**Exports:**
- Named exports are preferred across the codebase
- `src/App.tsx` is the main default export

**Barrel Files:**
- No broad barrel-file pattern is used
- Most modules are imported directly by file path

---

*Convention analysis: 2026-03-26*
*Update when patterns change*

