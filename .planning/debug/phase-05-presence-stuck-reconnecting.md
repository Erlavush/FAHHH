# Phase 05 Debug: Presence Stuck On Reconnecting

## Symptom

After the second browser closed, the player shell kept showing `Reconnecting` in the companion card instead of degrading to a simple partner-away state.

## Root Cause

The dev presence store retains old partner presence records until an explicit leave call removes them. When a browser tab closes without that leave request, the stale partner presence remains in the room snapshot, `derivePresenceFreshness()` ages it into `reconnecting`, and the player shell keeps rendering the reconnecting copy forever.

## Evidence

- `scripts/sharedRoomDevPlugin.mjs:405-417` loads and returns stored room presence without pruning stale entries.
- `scripts/sharedRoomDevPlugin.mjs:492-516` only removes partner presence when `leaveSharedPresenceInDatabase()` is called explicitly.
- `src/app/hooks/useSharedRoomPresence.ts:117-121` returns `reconnecting` for stale-but-present snapshots older than the hold threshold.
- `src/app/hooks/useSharedRoomPresence.ts:487` maps that stale freshness directly to `Partner reconnecting`.
- `src/app/shellViewModel.ts:117-120` renders `Partner reconnecting` as the visible `Reconnecting` card.

## Fix Direction

- Prune stale dev presence records on read or add TTL cleanup.
- Distinguish short reconnect windows from true partner-offline states in shell copy.
- Add regression coverage for abrupt browser closes.
