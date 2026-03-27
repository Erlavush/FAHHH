---
status: diagnosed
phase: 05-online-backend-and-couple-ownership
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md]
started: 2026-03-27T06:02:07.0341121Z
updated: 2026-03-27T06:18:32.4406812Z
---

## Current Test

[testing paused - 1 item outstanding]

## Tests

### 1. Hosted Sign-In Entry
expected: Open the app in hosted mode while signed out. You should land on the player-facing entry shell, see a `Continue with Google` button before any pair-code controls, and you should not be dropped directly into the room.
result: issue
reported: "Well basically this is what is happening especially i run nom run dev. I go to localhost:5173. Then it will let me go directly to the game. Then also i opened a different browser and then enter the localhost, now that player is now in the world too! with a nametag Player. Now i also closed that Player browser not it always say Reconnecting at the top. Its kind of annoying its still there, I want the top notif to like be gone and just put a single text or a label that partner is not online or something and not always saying reconnecting. Describe what is happening to this experience"
severity: major

### 2. Mutual Couple Linking
expected: Sign in with two accounts. Either partner can enter the other partner's code, but the link should stay pending until both signed-in users are on the linking screen and explicitly confirm the couple room.
result: blocked
blocked_by: prior-phase
reason: "Currently, i havent tested that yet because when i open the other chrome browser in the same localhost, it treats me as a different player and it directly enters me in the game with the original localhost browser where my player is. I didnt see the part where two accounts can enter the other partner's code. That process isnt yet tested or shown in my run right now. So I can't say if that's actually real or not"

### 3. Starter Room Bootstrap
expected: After the first successful mutual link, both accounts should enter the same default starter room and the shared starter cat should already be present.
result: pass

### 4. Automatic Paired Re-Entry
expected: After a couple room already exists, signing back in with either paired account from the same or another browser should skip linking and automatically reopen that existing room.
result: pass

### 5. Partner-Offline Room Entry
expected: If only one paired partner signs in while the other stays offline, the signed-in partner should still enter the existing room instead of getting blocked at linking, and the room should reflect that the partner is away rather than missing permanently.
result: issue
reported: "yes it does, although the Reconnecting thingy above the game in the top right is always there"
severity: minor

### 6. Hosted State Persistence
expected: Make a committed shared-room change in the paired room, then refresh or load the room from the other paired browser. The same room identity and committed shared state should still be there instead of resetting to a fresh room.
result: pass

### 7. Shared Cat Cross-Client Sync
expected: When both paired players are in the same room, the shared cat should appear in a consistent location and behavior state on both clients instead of diverging per browser.
result: issue
reported: "also i noticed the cat behavior or like the location of the cat isnt synced with the other player."
severity: major

### 8. Remote Player Movement Presentation
expected: When one partner walks around the room, the other client should show that partner moving with readable walking presentation rather than snapping forward in small teleport-like increments.
result: issue
reported: "When i move the player to another location, the view of the other player is like the other player is teleporting small increments - like it doesnt have walking animation, it just snap in a location forwardly. But the player can see each other what is going on."
severity: minor

### 9. Shared Bed Side Assignment
expected: If both partners use the same bed, each avatar should occupy a separate side of the bed instead of overlapping in the exact same lying position.
result: issue
reported: "ALso in the bed, if both are sleeping, they will be in the exact spot lying so they are overriding each other and not supposedly be on side by side so maybe the bed is the issue here."
severity: minor

## Summary

total: 9
passed: 3
issues: 5
pending: 0
skipped: 0
blocked: 1

## Gaps

- truth: "Open the app in hosted mode while signed out. You should land on the player-facing entry shell, see a `Continue with Google` button before any pair-code controls, and you should not be dropped directly into the room."
  status: failed
  reason: "User reported: Well basically this is what is happening especially i run nom run dev. I go to localhost:5173. Then it will let me go directly to the game. Then also i opened a different browser and then enter the localhost, now that player is now in the world too! with a nametag Player. Now i also closed that Player browser not it always say Reconnecting at the top. Its kind of annoying its still there, I want the top notif to like be gone and just put a single text or a label that partner is not online or something and not always saying reconnecting. Describe what is happening to this experience"
  severity: major
  test: 1
  root_cause: "Local dev fell back to the legacy dev shared-room runtime instead of the hosted Firebase path. `getSharedBackendMode()` only returns `firebase` when `VITE_SHARED_BACKEND=firebase` and every required `VITE_FIREBASE_*` value is present; otherwise the app selects the dev clients and `useSharedRoomRuntime` auto-enables `devBypassActive`, which bootstraps `dev-shared-room` directly into the room."
  artifacts:
    - path: "src/lib/sharedBackendConfig.ts"
      issue: "Backend mode silently falls back to `dev` when Firebase env config is absent."
    - path: "src/app/hooks/useSharedRoomRuntime.ts"
      issue: "When hosted flow is inactive, dev bypass auto-enters the shared room instead of surfacing hosted sign-in requirements."
    - path: "src/lib/sharedRoomClient.ts"
      issue: "Client factory binds to the dev API adapter whenever backend mode is not `firebase`."
    - path: "src/lib/sharedPresenceClient.ts"
      issue: "Presence also binds to the dev adapter, so the UAT session never exercised hosted presence or pair-link flows."
  missing:
    - "Surface explicit backend-mode state in the player shell so hosted UAT cannot silently run on the dev fallback path."
    - "Add a deterministic dev switch to disable auto-bootstrap when Phase 5 hosted entry needs manual verification."
    - "Add regression coverage for fallback copy or blocking behavior when Firebase is requested but not configured."
  debug_session: ".planning/debug/phase-05-hosted-entry-falls-back-to-dev.md"
- truth: "When both paired players are in the same room, the shared cat should appear in a consistent location and behavior state on both clients instead of diverging per browser."
  status: failed
  reason: "User reported: also i noticed the cat behavior or like the location of the cat isnt synced with the other player."
  severity: major
  test: 7
  root_cause: "The shared pet contract only persists a starter `spawnPosition`, but `RoomPetActor` simulates wandering locally in `useFrame()` with per-client refs and local delta time. Because no live pet motion state is published or committed after spawn, each browser quickly diverges."
  artifacts:
    - path: "src/lib/sharedRoomPet.ts"
      issue: "Shared pet records only expose static spawn metadata, not live motion or behavior state."
    - path: "src/components/room-view/RoomPetActor.tsx"
      issue: "Pet wandering, target picking, and motion are simulated locally per client with no sync channel."
  missing:
    - "Define a shared live-pet state channel or authoritative pet simulation so both clients render the same cat location and behavior."
    - "Add regression coverage for cross-client pet position and behavior consistency."
  debug_session: ".planning/debug/phase-05-shared-cat-diverges.md"
- truth: "When one partner walks around the room, the other client should show that partner moving with readable walking presentation rather than snapping forward in small teleport-like increments."
  status: failed
  reason: "User reported: When i move the player to another location, the view of the other player is like the other player is teleporting small increments - like it doesnt have walking animation, it just snap in a location forwardly. But the player can see each other what is going on."
  severity: minor
  test: 8
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
    - "Add browser-level regression coverage for remote movement smoothness."
  debug_session: ".planning/debug/phase-05-remote-avatar-snaps.md"
- truth: "If both partners use the same bed, each avatar should occupy a separate side of the bed instead of overlapping in the exact same lying position."
  status: failed
  reason: "User reported: ALso in the bed, if both are sleeping, they will be in the exact spot lying so they are overriding each other and not supposedly be on side by side so maybe the bed is the issue here."
  severity: minor
  test: 9
  root_cause: "The bed definition already has primary and secondary lie offsets, but the runtime always resolves a bed interaction through `getFurnitureInteractionTarget()`, which returns only the first target from `getFurnitureInteractionTargets()`. Both partners therefore claim the same lie slot and pose."
  artifacts:
    - path: "src/lib/furnitureRegistry.ts"
      issue: "Bed exposes both primary and secondary interaction offsets, but they are not selected dynamically."
    - path: "src/lib/furnitureInteractions.ts"
      issue: "`getFurnitureInteractionTarget()` discards the secondary bed target and always returns slot zero."
  missing:
    - "Assign bed interaction slots based on current occupancy so each partner gets a stable side."
    - "Propagate the chosen lie slot through shared presence so remote avatars mirror the same side."
    - "Add regression coverage for two-partner bed interactions."
  debug_session: ".planning/debug/phase-05-bed-side-overlap.md"
- truth: "If only one paired partner signs in while the other stays offline, the signed-in partner should still enter the existing room instead of getting blocked at linking, and the room should reflect that the partner is away rather than missing permanently."
  status: failed
  reason: "User reported: yes it does, although the Reconnecting thingy above the game in the top right is always there"
  severity: minor
  test: 5
  root_cause: "Stale partner presence ages into `reconnecting` forever instead of degrading to an offline/waiting state. The dev presence store keeps old `presenceByRoom` entries until a client explicitly calls `leavePresence`, and `useSharedRoomPresence` maps any stale-but-still-present record to `Partner reconnecting`, which `shellViewModel` renders as the persistent `Reconnecting` companion card."
  artifacts:
    - path: "scripts/sharedRoomDevPlugin.mjs"
      issue: "Dev presence snapshots are loaded and returned without pruning stale presence records on read."
    - path: "src/app/hooks/useSharedRoomPresence.ts"
      issue: "Presence freshness returns `reconnecting` indefinitely for stale snapshots that were never removed."
    - path: "src/app/shellViewModel.ts"
      issue: "The player companion card maps `Partner reconnecting` to a persistent `Reconnecting` title and body."
  missing:
    - "Prune stale partner presence or degrade reconnecting to waiting/offline after a bounded timeout."
    - "Differentiate short reconnect transitions from long-term partner-away states in the player shell."
    - "Add coverage for closing a browser without an explicit leave event."
  debug_session: ".planning/debug/phase-05-presence-stuck-reconnecting.md"
