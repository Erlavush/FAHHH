# Plan: Fix Sync Loop & DB Corruption

## Implementation Details

### 1. Equality & Normalization (`src/lib/roomPlacementEquality.ts`)
- Refactored `placementListsMatch` to be order-independent. It now finds each placement in the other list regardless of its index.
- Added a `0.0001` epsilon to position comparisons to avoid float precision loops.

### 2. Synchronization Guard (`src/App.tsx`)
- Updated `handleCommittedFurnitureChange` to update `liveFurniturePlacements` immediately along with `roomState`. This prevents the "Rubber-Bander" effect where URE (the editor) would reset its own draft state from `initialPlacements` during a commit.
- Optimatized the main sync `useEffect` (line 347) to ONLY trigger if `runtimeSnapshot.revision` changed. This stops the app from re-rendering the whole room 60 times a second during player movement.

### 3. Shared Room Runtime Improvements (`src/app/hooks/useSharedRoomRuntime.ts`)
- Added soft-handling for `409 Revision Conflict`. It now calls `reloadRoom()` instead of setting a blocking error state.
- Added `error.status === 404` handling to `loadRoom` to automatically clear session state if the server's database was reset.

### 4. Dev Server Stability (`scripts/sharedRoomDevPlugin.mjs`)
- **Singleton In-Memory DB**: The plugin now maintains a single `inMemoryDatabase` reference. Every HTTP request uses the singleton, stopping all "read-then-write" race conditions.
- **Queued Atomic Moves**: Saves are now queued and use `fs.renameSync(tempPath, databasePath)` on Windows.
- **Vite Ignore-list**: Added `.data/**` to `vite.config.js` `server.watch.ignored` so the server doesn't reboot on every save.
- **Fixed Crash**: Restored the missing `SharedRoomHttpError` class definition.

## Verification
- Verified persistence: Placing multiple items in rapid succession works without 500/512 errors.
- Verified movement: Player movement no longer drops FPS or resets furniture placement drafts.
- Verified corruption: No trailing garbage or malformed JSON in `.data/shared-room-dev-db.json`.
