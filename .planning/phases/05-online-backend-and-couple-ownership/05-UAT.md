---
status: partial
phase: 05-online-backend-and-couple-ownership
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md, 05-04-SUMMARY.md, 05-05-SUMMARY.md, 05-06-SUMMARY.md]
started: 2026-03-27T06:02:07.0341121Z
updated: 2026-03-27T15:12:43.3007994+08:00
---

## Current Test

[testing paused - 5 items outstanding]

## Tests

### 1. Hosted Sign-In Entry
expected: Open the app in hosted mode while signed out. You should land on the player-facing entry shell, see a `Continue with Google` button before any pair-code controls, and you should not be dropped directly into the room.
result: blocked
blocked_by: prior-phase
reason: "Current localhost session is still on the local dev fallback path rather than hosted Firebase mode, so the Google sign-in entry shell could not be retested."
previous_result: issue
previous_reported: "Well basically this is what is happening especially i run nom run dev. I go to localhost:5173. Then it will let me go directly to the game. Then also i opened a different browser and then enter the localhost, now that player is now in the world too! with a nametag Player. Now i also closed that Player browser not it always say Reconnecting at the top. Its kind of annoying its still there, I want the top notif to like be gone and just put a single text or a label that partner is not online or something and not always saying reconnecting. Describe what is happening to this experience"
previous_severity: major

### 2. Mutual Couple Linking
expected: Sign in with two accounts. Either partner can enter the other partner's code, but the link should stay pending until both signed-in users are on the linking screen and explicitly confirm the couple room.
result: blocked
blocked_by: prior-phase
reason: "Current localhost session is still on the local dev fallback path rather than hosted Firebase mode, so the Google sign-in and mutual-linking flow could not be retested."
previous_reason: "Currently, i havent tested that yet because when i open the other chrome browser in the same localhost, it treats me as a different player and it directly enters me in the game with the original localhost browser where my player is. I didnt see the part where two accounts can enter the other partner's code. That process isnt yet tested or shown in my run right now. So I can't say if that's actually real or not"

### 3. Starter Room Bootstrap
expected: After the first successful mutual link, both accounts should enter the same default starter room and the shared starter cat should already be present.
result: pass

### 4. Automatic Paired Re-Entry
expected: After a couple room already exists, signing back in with either paired account from the same or another browser should skip linking and automatically reopen that existing room.
result: pass

### 5. Partner-Offline Room Entry
expected: If only one paired partner signs in while the other stays offline, the signed-in partner should still enter the existing room instead of getting blocked at linking, and the room should reflect that the partner is away rather than missing permanently.
result: pass
previous_result: issue
previous_reported: "yes it does, although the Reconnecting thingy above the game in the top right is always there"
previous_severity: minor
retested: 2026-03-27T15:08:00+08:00

### 6. Hosted State Persistence
expected: Make a committed shared-room change in the paired room, then refresh or load the room from the other paired browser. The same room identity and committed shared state should still be there instead of resetting to a fresh room.
result: pass

### 7. Shared Cat Cross-Client Sync
expected: When both paired players are in the same room, the shared cat should appear in a consistent location and behavior state on both clients instead of diverging per browser.
result: issue
reported: "The cat adoption is weird. I tried to open two browser. So both are now in the same room directly. Then there is no cat initally. Now in the one browser, i tried to adopt cat then it spawns the cat in that room. But in the other browser which is the other player, there is no cat showing, then i tried to open the inventory and click adopt cat, now both cats are now sync, but the first one to adopt the cat - its animation is walking but its buggy and like teleporting kind of and not smooth. the same thing as player movement, its not smooth when you are seeing your partner movement and the pet."
severity: major
retested: 2026-03-27T15:12:00+08:00
previous_reported: "also i noticed the cat behavior or like the location of the cat isnt synced with the other player."

### 8. Remote Player Movement Presentation
expected: When one partner walks around the room, the other client should show that partner moving with readable walking presentation rather than snapping forward in small teleport-like increments.
result: issue
reported: "it does snapping. its not smooth like you can see in minecraft mutliplayer localhost (I want like its actually smooth like how minecraft multiplayer actually works, optimized also) How can you even adapt that mechanics. Both the cat and your partner in the player's view is so snapping and not smooth really"
severity: minor
retested: 2026-03-27T15:11:08.7581261+08:00
previous_reported: "When i move the player to another location, the view of the other player is like the other player is teleporting small increments - like it doesnt have walking animation, it just snap in a location forwardly. But the player can see each other what is going on."

### 9. Shared Bed Side Assignment
expected: If both partners use the same bed, each avatar should occupy a separate side of the bed instead of overlapping in the exact same lying position.
result: issue
reported: "slighty not yet perfect, they still overlap as you can see in the image"
severity: minor
retested: 2026-03-27T15:12:43.3007994+08:00
previous_reported: "ALso in the bed, if both are sleeping, they will be in the exact spot lying so they are overriding each other and not supposedly be on side by side so maybe the bed is the issue here."

## Summary

total: 9
passed: 4
issues: 3
pending: 0
skipped: 0
blocked: 2

## Fixes Implemented After UAT

- **Tests 1 and 5:** `src/lib/sharedBackendConfig.ts`, `src/app/hooks/useSharedRoomRuntime.ts`, `src/app/hooks/useSharedRoomPresence.ts`, `src/app/components/SharedRoomEntryShell.tsx`, `src/app/shellViewModel.ts`, and `scripts/sharedRoomDevPlugin.mjs` now expose explicit hosted-unavailable and local-dev fallback states, prune stale dev presence, and degrade long reconnects into `Partner away`.
- **Tests 7 and 8:** `src/lib/sharedPresenceTypes.ts`, `src/lib/firebasePresenceStore.ts`, `src/app/hooks/useSharedRoomPresence.ts`, `src/components/MinecraftPlayer.tsx`, `src/components/RoomView.tsx`, and `src/components/room-view/RoomPetActor.tsx` now publish richer ephemeral motion plus shared-pet live state so remote avatars and the cat no longer rely on separate local simulations.
- **Test 9:** `src/lib/furnitureInteractions.ts` and `src/components/room-view/useRoomViewInteractions.ts` now assign bed slots by occupancy and preserve the chosen `slotId` through shared presence.

## Retest Notes

- 2026-03-27T15:03:00+08:00 - Test 1 retest could not run because the current localhost session is still on the local dev fallback path rather than hosted Firebase mode.
- 2026-03-27T15:05:00+08:00 - Test 2 retest could not run because the current localhost session is still on the local dev fallback path rather than hosted Firebase mode.
- 2026-03-27T15:08:00+08:00 - Test 5 retest passed on localhost; the room stayed usable with the partner offline and the companion state no longer blocked entry.
- 2026-03-27T15:12:00+08:00 - Test 7 retest still fails: first-time cat adoption did not appear on the second browser until that browser also triggered adopt, and the shared cat motion still reads as buggy teleporting rather than smooth sync.
- 2026-03-27T15:11:08.7581261+08:00 - Test 8 retest still fails: partner movement is still visibly snapping, and the user reports the cat suffers the same non-smooth teleport-like motion.
- 2026-03-27T15:12:43.3007994+08:00 - Test 9 retest still fails: bed-side assignment improved but the avatars still overlap visually instead of landing cleanly side by side.

## Gaps

- truth: "When both paired players are in the same room, the shared cat should appear in a consistent location and behavior state on both clients instead of diverging per browser."
  status: failed
  reason: "User reported: The cat adoption is weird. I tried to open two browser. So both are now in the same room directly. Then there is no cat initally. Now in the one browser, i tried to adopt cat then it spawns the cat in that room. But in the other browser which is the other player, there is no cat showing, then i tried to open the inventory and click adopt cat, now both cats are now sync, but the first one to adopt the cat - its animation is walking but its buggy and like teleporting kind of and not smooth. the same thing as player movement, its not smooth when you are seeing your partner movement and the pet."
  severity: major
  test: 7
  retested: 2026-03-27T15:12:00+08:00
  root_cause: "The shared pet contract only persists a starter `spawnPosition`, but `RoomPetActor` simulates wandering locally in `useFrame()` with per-client refs and local delta time. Because no live pet motion state is published or committed after spawn, each browser quickly diverges."
  artifacts:
    - path: "src/lib/sharedRoomPet.ts"
      issue: "Shared pet records only expose static spawn metadata, not live motion or behavior state."
    - path: "src/components/room-view/RoomPetActor.tsx"
      issue: "Pet wandering, target picking, and motion are simulated locally per client with no sync channel."
  missing:
    - "Propagate first-time cat adoption immediately to the other browser instead of requiring a second local adopt trigger."
    - "Define a shared live-pet state channel or authoritative pet simulation so both clients render the same cat location and behavior."
    - "Add regression coverage for cross-client pet adoption visibility plus pet position and behavior consistency."
  debug_session: ".planning/debug/phase-05-shared-cat-diverges.md"
- truth: "When one partner walks around the room, the other client should show that partner moving with readable walking presentation rather than snapping forward in small teleport-like increments."
  status: failed
  reason: "User reported: it does snapping. its not smooth like you can see in minecraft mutliplayer localhost (I want like its actually smooth like how minecraft multiplayer actually works, optimized also) How can you even adapt that mechanics. Both the cat and your partner in the player's view is so snapping and not smooth really"
  severity: minor
  test: 8
  retested: 2026-03-27T15:11:08.7581261+08:00
  root_cause: "Remote presence is sampled sparsely and lacks motion intent. The presence hook publishes every 500 ms and polls every 1000 ms, `SharedPresenceSnapshot` carries only position/facing/activity, and the remote `MinecraftPlayer` simply lerps to each new target position. That combination produces visible snap-forward movement and weak locomotion presentation."
  artifacts:
    - path: "src/app/hooks/useSharedRoomPresence.ts"
      issue: "Presence publish/poll cadence is too sparse for smooth partner locomotion."
    - path: "src/lib/sharedPresenceTypes.ts"
      issue: "Presence snapshots do not include velocity, interpolation timestamps, or animation phase."
    - path: "src/components/RoomView.tsx"
      issue: "Remote actors receive only the latest target position and facing values."
    - path: "src/components/MinecraftPlayer.tsx"
      issue: "Remote mode interpolates directly toward each new target without buffered motion state."
  missing:
    - "Add buffered/interpolated remote movement inputs or higher-frequency transport for partner locomotion."
    - "Carry enough remote motion state to drive readable walking animation between presence updates."
    - "Tune the motion path toward a smoother Minecraft-multiplayer-style feel without regressing performance."
    - "Add browser-level regression coverage for remote movement smoothness."
  debug_session: ".planning/debug/phase-05-remote-avatar-snaps.md"
- truth: "If both partners use the same bed, each avatar should occupy a separate side of the bed instead of overlapping in the exact same lying position."
  status: failed
  reason: "User reported: slighty not yet perfect, they still overlap as you can see in the image"
  severity: minor
  test: 9
  retested: 2026-03-27T15:12:43.3007994+08:00
  root_cause: "The bed definition already has primary and secondary lie offsets, but the runtime always resolves a bed interaction through `getFurnitureInteractionTarget()`, which returns only the first target from `getFurnitureInteractionTargets()`. Both partners therefore claim the same lie slot and pose."
  artifacts:
    - path: "src/lib/furnitureRegistry.ts"
      issue: "Bed exposes both primary and secondary interaction offsets, but they are not selected dynamically."
    - path: "src/lib/furnitureInteractions.ts"
      issue: "`getFurnitureInteractionTarget()` discards the secondary bed target and always returns slot zero."
  missing:
    - "Finish bed interaction slot assignment so the two lie poses are visually separated, not just logically distinct."
    - "Propagate the chosen lie slot through shared presence so remote avatars mirror the same side."
    - "Add regression coverage for two-partner bed interactions."
  debug_session: ".planning/debug/phase-05-bed-side-overlap.md"
