# Phase 05 Debug: Remote Avatar Snaps Instead Of Walking Smoothly

## Symptom

Partners can see each other, but remote movement looks like forward snapping in small increments instead of smooth walking.

## Root Cause

The current fix improved transport cadence and added velocity/stride hints, but the render path still does not behave like a proper buffered multiplayer replica. Remote actors and the shared cat are smoothed directly toward the latest published target with light prediction, so motion still reads as visible stepping instead of a continuous timeline the way Minecraft multiplayer does.

## Evidence

- `src/app/hooks/useSharedRoomPresence.ts` now publishes more often and includes motion fields, but still exposes only the latest remote snapshot to the renderer rather than a buffered snapshot history.
- `src/components/MinecraftPlayer.tsx` predicts a single forward target from the latest velocity and then lerps toward it, which still produces visible stepping under localhost retest.
- `src/components/room-view/RoomPetActor.tsx` follows the same style of direct smoothing for shared-pet replication, so the cat inherits the same snap-like presentation.
- User retest evidence: partner movement still feels snapping rather than smooth like Minecraft multiplayer, and the same complaint applies to the shared cat.

## Fix Direction

- Replace direct target smoothing with buffered snapshot interpolation and short-horizon dead reckoning for both partner and cat replicas.
- Keep locomotion animation driven from the same playback timeline so stride, heading, and position stay coherent.
- Add regression coverage for smoother replica playback and tune it against the user's explicit Minecraft-like feel target.
