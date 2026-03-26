# Testing Patterns

**Analysis Date:** 2026-03-26

## Test Framework

**Runner:**
- Vitest 3.0.5
- Config lives in `vite.config.js` under the `test` key

**Assertion Library:**
- Vitest built-in `expect`
- Current tests use standard matchers such as `toBe`, `toEqual`, `toHaveLength`, `arrayContaining`, and `toBeUndefined`

**Run Commands:**
```bash
cmd /c npm test                                # Run the suite once
cmd /c npx vitest run tests/roomState.test.ts  # Run a single file
cmd /c npx vitest run tests/sharedRoomRuntime.test.ts  # Run shared-room runtime coverage
cmd /c npx vitest --watch                      # Watch mode (not scripted, but supported)
```

## Test File Organization

**Location:**
- Tests live in a separate top-level `tests/` directory

**Naming:**
- `<feature>.test.ts` naming throughout, for example `roomState.test.ts`, `furnitureCollision.test.ts`, `roomViewSpawn.test.ts`

**Structure:**
```text
tests/
|-- economy.test.ts
|-- furnitureCollision.test.ts
|-- furnitureInteractions.test.ts
|-- sharedRoomRuntime.test.ts
|-- sharedRoomStore.test.ts
|-- mobLabState.test.ts
|-- roomState.test.ts
|-- roomViewLighting.test.ts
|-- roomViewPlacementResolvers.test.ts
`-- useRoomFurnitureEditor.test.ts
```

## Test Structure

**Suite Organization:**
- `describe` blocks per module or feature
- `it` blocks describe a concrete runtime guarantee
- `beforeEach` and `afterEach` appear only when state reset is needed, such as `localStorage` cleanup or hook harness teardown

**Patterns:**
- Pure utility tests dominate the suite
- Arrange/act/assert is often implicit, with inline helper creators near the top of each file
- DOM-oriented tests opt into `jsdom` explicitly when needed, for example `tests/useRoomFurnitureEditor.test.ts` and `tests/sharedRoomRuntime.test.ts`

## Mocking

**Framework:**
- Minimal mocking via Vitest `vi`

**Patterns:**
- `vi.fn()` is used for callback spies in hook tests
- The suite currently avoids heavy module mocking

**What to Mock:**
- Callback boundaries for hooks and editor orchestration
- Browser APIs such as `localStorage` and clipboard-adjacent UI flows through the jsdom environment

**What NOT to Mock:**
- Pure domain math and registry helpers
- Most domain rules are tested against real implementations

## Fixtures and Factories

**Test Data:**
- Helper creators are usually defined inline inside the test file
- Real preset-like objects are sometimes cloned and modified in tests such as `tests/mobLabState.test.ts`

**Location:**
- No dedicated `tests/fixtures/` or `tests/factories/` directory exists

## Coverage

**Requirements:**
- No explicit coverage threshold or coverage script found
- The current suite emphasizes critical domain math and room-edit invariants instead

**Configuration:**
- No separate coverage config found in the workspace root

**View Coverage:**
```bash
cmd /c npx vitest run --coverage
```

## Test Types

**Unit Tests:**
- Main test type in this repo
- Cover room state, economy, lighting, collisions, pets, spawn logic, surface decor, wall openings, shared-room validation/store rules, and Mob Lab validation

**Integration / Hook Tests:**
- Light integration-style coverage exists for hooks such as `useRoomFurnitureEditor`
- Shared-room runtime bootstrap and canonical helper behavior now also have focused hook coverage in `tests/sharedRoomRuntime.test.ts`

**E2E Tests:**
- None found
- No browser-driven editor flow suite exists yet

## Common Patterns

**Async / Browser State Testing:**
- `window.localStorage.clear()` in `beforeEach` for persistence tests
- `@vitest-environment jsdom` on hook tests that need a DOM

**Error / Edge Testing:**
- Tests focus on invariants, schema normalization, and fallback behavior rather than snapshot testing

**Snapshot Testing:**
- Not used

---

*Testing analysis: 2026-03-26*
*Update when test patterns change*
