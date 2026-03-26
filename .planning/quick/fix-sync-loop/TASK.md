# Task: Fix synchronization loop and JSON corruption

## Problem
1. **Infinite Synchronization Loop**: When a room commit is performed, the server returns a new revision. If the client sees *any* difference (even order of items), it re-commits, causing a cycle (Revision 1 -> 2 -> 3... infinitely).
2. **Database Corruption**: Rapid-fire saves on Windows caused the JSON database to be partially overwritten with "trailing garbage," breaking `JSON.parse` and crashing the game.
3. **Performance Degredation**: The app was re-syncing the entire room state (all furniture) on every player movement (presence update), causing FPS drops and resetting the furniture editor while in use.

## Goals
1. [x] **Eliminate the Sync Loop**: Use order-independent equality checks and ensure `App.tsx` updates its "live" placements correctly after a commit.
2. [x] **Fix Database Corruption**: Implement a Singleton In-Memory database on the server with atomic "Write-then-Rename" persistence.
3. [x] **Restore FPS**: Revision-lock the room synchronization so it only re-syncs furniture when the room's global revision changes, not when players move.
4. [x] **Soft Sync Conflicts**: Automatically reload the room on 409 Revision Conflicts instead of blocking the user with an error overlay.
