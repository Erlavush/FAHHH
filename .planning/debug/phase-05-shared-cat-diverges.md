# Phase 05 Debug: Shared Cat Diverges Across Clients

## Symptom

Both players can see the cat, but the cat's behavior and location drift apart between browsers.

## Root Cause

The shared room only stores the cat's starter spawn position. After that, each browser runs its own local pet wandering simulation with local refs, local random targets, and local frame timing, so the cat's motion immediately diverges per client.

## Evidence

- `src/lib/sharedRoomPet.ts:6-35` only stores and rehydrates `spawnPosition`; there is no live pet motion state.
- `src/components/room-view/RoomPetActor.tsx:48-58` initializes local target and motion refs from spawn.
- `src/components/room-view/RoomPetActor.tsx:57-148` updates pet movement entirely inside `useFrame()` with no shared persistence or broadcast path.

## Fix Direction

- Introduce an authoritative shared pet motion state or ephemeral pet-sync channel.
- Drive both clients from the same pet target/behavior state instead of local-only wandering.
- Add cross-client pet sync verification.
