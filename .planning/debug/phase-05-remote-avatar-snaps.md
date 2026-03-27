# Phase 05 Debug: Remote Avatar Snaps Instead Of Walking Smoothly

## Symptom

Partners can see each other, but remote movement looks like forward snapping in small increments instead of smooth walking.

## Root Cause

Remote movement is reconstructed from sparse presence snapshots. The presence layer publishes every 500 ms and polls every 1000 ms, the snapshot schema carries only position/facing/activity, and the remote avatar simply lerps to each new target. There is no buffered interpolation state, velocity, or animation phase to preserve continuous motion.

## Evidence

- `src/app/hooks/useSharedRoomPresence.ts:41-42` uses 500 ms publish and 1000 ms poll intervals.
- `src/lib/sharedPresenceTypes.ts:23-28` stores only position, facing, activity, pose, and `updatedAt`.
- `src/components/RoomView.tsx:500-508` passes only the latest remote target position/facing into the remote player.
- `src/components/MinecraftPlayer.tsx:524-529` smooths directly toward the newest target in remote mode instead of replaying buffered motion.

## Fix Direction

- Increase transport fidelity or add buffered interpolation inputs for remote motion.
- Carry enough remote motion state to animate locomotion between updates.
- Add a regression test/smoke check for partner movement smoothness.
