# Phase 05 Debug: Shared Cat Diverges Across Clients

## Symptom

The shared cat still fails in two ways:

- A newly adopted cat does not appear on the passive browser immediately; the second browser only sees it after that client performs its own adopt interaction or otherwise forces a refresh.
- Once both browsers do show the cat, its movement still looks buggy, teleport-like, and not truly shared.

## Root Cause

There are two related failures in two different seams:

1. Canonical cat adoption is not surfaced immediately to the passive browser. The room runtime loads the shared room canon once and then mostly relies on explicit reloads, commits, or conflict recovery, so a partner who did not initiate the adoption can stay on a stale `sharedPet === null` snapshot even though the canonical room now contains the cat.
2. After the cat exists on both clients, its live motion is still reconstructed too loosely. Even with the newer shared-pet live state channel, the actor still behaves like a locally smoothed replica instead of one authoritative shared actor with buffered motion playback.

## Evidence

- `src/App.tsx` renders the shared cat from `sharedRoomRuntime.runtimeSnapshot?.sharedPet`, so the passive browser needs its canonical room snapshot refreshed before it can even instantiate the cat actor.
- `src/app/hooks/useSharedRoomRuntime.ts` loads and reloads the shared room on bootstrap, manual reload, or commit/conflict paths, but it does not maintain a passive canonical-room subscription or poll that would notice a partner's new `sharedPet` record immediately.
- `src/components/room-view/RoomPetActor.tsx` still smooths toward replicated live state each frame rather than replaying from a buffered authoritative timeline, so the cat reads as jittery/teleporting under live sync.
- User retest evidence: first adoption on browser A did not show on browser B until browser B also clicked adopt, and the cat still looked buggy and teleport-like after both browsers displayed it.

## Fix Direction

- Add a passive canonical refresh path for shared-pet creation so the non-authoritative browser learns about a newly adopted cat without needing a local interaction.
- Keep the cat's canonical existence in the room document, but drive visible cat motion from a stronger authoritative live-state playback path.
- Add regression coverage for both first-adoption visibility and cross-client cat motion consistency.
