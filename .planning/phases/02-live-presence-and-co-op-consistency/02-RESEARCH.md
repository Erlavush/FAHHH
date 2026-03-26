# Phase 2: Live Presence and Co-op Consistency - Research

**Researched:** 2026-03-26
**Status:** Ready for UI spec / planning

## Objective

Determine how to implement Phase 2 in the current brownfield codebase so the shared room feels live for two people without regressing the Phase 1 authority model, the room-builder invariants, or the authoring-tool boundaries.

Phase 2 must satisfy:
- `PRES-01`
- `PRES-02`
- `PRES-03`

## Brownfield Facts That Shape The Plan

- Phase 1 already established the correct authority boundary: `src/app/hooks/useSharedRoomRuntime.ts` loads and commits one canonical shared-room document through `src/lib/sharedRoomStore.ts`, `src/lib/sharedRoomClient.ts`, and `scripts/sharedRoomDevPlugin.mjs`.
- `src/components/RoomView.tsx` already owns the live-room scene composition and currently renders exactly one local `MinecraftPlayer`.
- `src/components/room-view/useRoomViewInteractions.ts` already derives local activity state and pose data for `sit`, `lie`, and `use_pc`, but `src/app/types.ts` only exposes a lightweight `PlayerInteractionStatus` with `phase`, `label`, `interactionType`, and `furnitureId`.
- `src/components/MinecraftPlayer.tsx` already handles skin loading, movement smoothing, and interaction poses, but it mixes render concerns with local movement/collision behavior and currently only reports position, not facing.
- The development shared backend only exposes `create`, `join`, `load`, and `commit` room endpoints. It has no presence channel, no item-lock storage, and no reconnect/presence TTL logic yet.
- The Phase 1 dev backend increments `revision`, but `commitSharedRoomStateInDatabase()` does not enforce `expectedRevision`; tests intentionally assert last-write-wins behavior.
- `src/App.tsx` still decides when the entry shell, status strip, blocking overlay, and live room appear. There is no dev-only auto-enter bypass yet.

## Key Findings

### 1. Presence Needs A Separate Replaceable Boundary

The user explicitly chose:
- separate lightweight presence transport
- committed room edits stay canonical
- join/leave/reconnect status should be subtle

The current `SharedRoomStore` is a room-document boundary, not a live presence boundary. Reusing it for movement/activity would spam canonical room payloads and collapse Phase 2 back into Phase 1's persistence channel.

**Planning implication:**
Phase 2 should add a second replaceable boundary, for example:
- `SharedPresenceStore`
- `SharedPresenceSnapshot`
- `SharedEditLockStore` or equivalent lock methods on the presence store

That boundary should be independent from room-document commit APIs so the future production backend can replace it without rewriting `RoomState`.

### 2. The Current Runtime Does Not Yet Surface Everything Presence Needs

`PRES-01` requires avatar position and facing. The user also locked activity-state sync. The current runtime only exposes:
- local player position through `onPlayerPositionChange`
- simplified interaction status through `onInteractionStateChange`

It does **not** expose:
- live facing/yaw for the local player
- a reusable full local presence snapshot object
- interaction pose metadata in the shape a remote avatar can render directly

**Planning implication:**
Phase 2 needs a compact local-presence payload sourced from the room runtime, not inferred later from unrelated shell state.

Recommended minimum payload:
- `playerId`
- `displayName`
- `skinSrc` or appearance key
- `position`
- `facingY`
- `activity` (`idle`, `walking`, `sit`, `lie`, `use_pc`, `reconnecting`)
- interaction pose metadata when applicable
- `updatedAt` / monotonic sequence

### 3. `MinecraftPlayer` Is Reusable, But Not As-Is For Remote Presence

The current avatar component already provides:
- Minecraft-style skin rendering
- interaction poses
- movement smoothing

But it also currently:
- resolves movement against furniture collisions
- owns local actor stepping behavior
- emits local position every 100 ms

That is ideal for the local player, but remote presence is a read-only visual actor. A remote avatar should interpolate toward received presence snapshots, not become another source of authoritative room/player state.

**Planning implication:**
Phase 2 should either:
- split `MinecraftPlayer` into a presentational avatar layer plus local/remote controllers, or
- extend it with a clear local-vs-remote mode that disables local collision-driven state ownership for the remote actor

The important rule is that remote rendering must not feed movement authority back into the room shell.

### 4. Dev Auto-Enter Needs A Real Bootstrap Path, Not Just Hidden UI

The user wants development builds to:
- skip the pairing/opening/invite flow
- hide the shared-room strip above the game
- auto-enter a dev shared room

Hiding `SharedRoomEntryShell` alone is not enough. On a fresh dev session, `useSharedRoomRuntime` still needs an actual room/session before the app can render the live room.

**Planning implication:**
Phase 2 needs a deterministic dev bootstrap flow, not only a CSS/UI hide.

Recommended dev-only behavior:
- gated behind `import.meta.env.DEV` plus an explicit override if needed
- auto-create or auto-join one predictable dev shared room when no session exists
- preserve the real player-facing shell components for non-dev / shipped builds

Because two dev clients still need to land in the same room, the bootstrap should prefer an `ensure-dev-room` flow over creating a brand-new random invite on every browser.

### 5. Join/Leave/Reconnect Should Come From Presence TTL, Not Room Commits

Phase 1 already gives reliable canonical room reloads. Phase 2's join/leave/reconnect UX is different: it is about whether the partner is currently live in the room.

The dev backend currently has no notion of:
- heartbeat freshness
- disconnected presence
- reconnect grace windows

**Planning implication:**
Join/leave/reconnect should derive from a small presence record with timestamps, not from the room document itself.

Recommended model:
- client upserts presence on an interval while active
- clients read partner presence on a lightweight polling interval
- if the partner snapshot is fresh, render live
- after a short grace window, keep the avatar frozen briefly
- after TTL expiry, mark the partner `reconnecting` / offline in the subtle status layer

This matches the user's choice: hold briefly, then mark reconnecting.

### 6. Soft Same-Item Locks Belong At The Editor Session Boundary

The current room editor already has the right session boundaries:
- `selectFurnitureForEditing`
- `beginNewFurnitureEditing`
- `finishFurnitureEditingSession`
- confirm, cancel, store flows in `useRoomFurnitureEditor.ts`

That means Phase 2 does **not** need whole-room locking. It needs per-item edit ownership attached to the existing local draft lifecycle.

**Planning implication:**
Same-item lock acquire/release should happen around editor selection/draft lifecycle, while different items stay editable concurrently.

Recommended lock behavior:
- acquire soft lock when a player starts editing a furniture item
- refresh lock while the draft is active
- release on confirm, cancel, store, deselect, disconnect, or TTL expiry
- surface busy state in furniture hover/select UI and status copy

This fits the user's lock choices without changing the canonical room document model.

### 7. Phase 2 Still Needs A Stronger Convergence Protocol Than Blind Commits

Phase 1 intentionally accepted last-write-wins. The dev backend tests assert that behavior. For Phase 2, the user still chose canonical convergence as the primary guarantee, but same-item conflicts should be reduced through soft locks and clearer resync behavior.

The current gap is important:
- the client sends `expectedRevision`
- the dev backend ignores it

That is acceptable for Phase 1, but it means Phase 2 cannot pretend revision checks already protect conflict behavior.

**Planning implication:**
Phase 2 planning should keep canonical room commits simple, but explicitly add:
- item-lock checks before local draft entry and/or commit
- canonical reload after rejected or stale actions
- clear client-side resync path when local assumptions are stale

The plan does **not** need full merge logic. It does need an honest, explicit "lock or reload" path instead of relying on a fake revision guard.

### 8. The Existing Dev Backend Can Support Phase 2, But Only If It Grows New Collections

The `.data/shared-room-dev-db.json` file currently stores:
- `profiles`
- `invites`
- `rooms`

Phase 2 can stay inside the same development-only backend if it adds separate data collections instead of overloading the room document.

Recommended additions:
- `presenceByRoom`
- `locksByRoom`

Possible endpoints:
- `/api/dev/shared-room/dev-bootstrap`
- `/api/dev/shared-room/presence/upsert`
- `/api/dev/shared-room/presence/room/{roomId}`
- `/api/dev/shared-room/presence/leave`
- `/api/dev/shared-room/locks/acquire`
- `/api/dev/shared-room/locks/release`

The exact transport can stay simple. Polling is acceptable for the dev backend as long as the payloads stay small and separate from full room commits.

## Recommended Technical Direction

### Recommended Runtime Shape

Use three adjacent boundaries:

1. `canonical shared room`
   - existing `SharedRoomStore`
   - room contents and shared coins
   - authoritative committed result

2. `live presence channel`
   - player position, facing, activity, appearance, freshness timestamps
   - separate polling/heartbeat path
   - no full `RoomState` payloads

3. `soft edit locks`
   - per-furniture lock ownership + expiry
   - same-item conflict prevention
   - separate from room document persistence

### Recommended Dev-Only Presence Strategy

Given the current Vite middleware and file-backed database, the simplest credible Phase 2 approach is:
- publish local presence on a short interval
- poll room presence snapshots on a short interval
- interpolate the remote avatar between snapshots
- use timestamp freshness to derive `live`, `holding`, and `reconnecting`

This is less ambitious than websockets, but it fits the current dev backend and keeps the boundary replaceable.

### Recommended Dev Bypass Strategy

Keep the real create/join UI path in code, but add a dev-only bootstrap switch that:
- ensures a predictable dev room exists
- auto-enters it on startup
- suppresses the entry shell and shared-room status strip during development

The bypass should live in the app/runtime bootstrap path, not inside the room scene itself.

### Recommended RoomView Integration

Phase 2 should introduce a compact local presence snapshot produced near the room runtime and consumed by a new presence hook/store layer.

Likely integration points:
- `RoomView.tsx`: local transform/activity output + remote actor render
- `MinecraftPlayer.tsx`: reusable avatar visuals and pose behavior
- `useRoomViewInteractions.ts`: activity and interaction-pose source
- `App.tsx`: dev bypass and hidden temporary UI surfaces
- `useSharedRoomRuntime.ts`: keep canonical room authority; do not absorb live presence responsibilities unless they are purely shell-level status orchestration

## Planning Risks

### High Risk

- Trying to encode presence into the canonical room document instead of adding a separate channel
- Assuming `expectedRevision` already protects against conflicts when the dev backend currently ignores it
- Hiding the entry/status UI in development without adding a real auto-enter room bootstrap
- Reusing `MinecraftPlayer` for remote presence without separating local actor authority from remote rendering
- Failing to expose facing and full activity/pose state from the room runtime

### Medium Risk

- Letting presence or lock state bloat `src/App.tsx` instead of keeping a focused hook boundary
- Treating same-item lock state as permanent rather than TTL-based
- Coupling the dev polling cadence too tightly to the final production backend shape
- Letting busy-state UI become heavy-handed when the user asked for subtle feedback

### Low Risk

- Rendering a subtle remote name label once remote avatar state exists
- Reusing the existing status-strip surface for shipped reconnect/join messaging

## Test And Verification Implications

Phase 2 planning should include automated coverage for:

- presence payload validation and normalization
- presence TTL / reconnect-state derivation
- dev bootstrap behavior for auto-entered shared rooms
- remote presence interpolation helpers or snapshot reducers
- same-item lock acquire/release/expiry behavior
- different-item concurrency remaining allowed
- canonical reload/resync behavior when local lock assumptions or room revisions are stale

Existing test anchors to reuse:
- `tests/sharedRoomRuntime.test.ts`
- `tests/sharedRoomStore.test.ts`
- editor-oriented tests around the room-view hooks

The repo still lacks browser-driven multiplayer/E2E coverage, so Phase 2 should plan for strong hook/domain tests and leave true two-browser smoke validation as a manual verification item unless a browser harness is added.

## Recommended Plan Breakdown

The roadmap's three-plan split is still correct.

### Plan 02-01

Add the live presence transport and remote avatar path:
- local presence snapshot output
- presence store/client boundary
- dev backend presence collections/endpoints
- remote avatar render in the room

### Plan 02-02

Add session-state UX and the development bypass:
- join/leave/reconnect status handling
- reconnect grace + stale presence handling
- subtle shipped status surfaces
- dev auto-enter and hidden temporary shell/status UI

### Plan 02-03

Add concurrent-edit predictability:
- soft same-item locks
- busy-item cues
- canonical reload/resync behavior
- preserve different-item concurrency and committed-result convergence

## Recommended Planning Guardrails

- Keep `RoomState` and committed room authority untouched as the canonical shared-room payload.
- Add presence and lock channels beside the room document, not inside it.
- Expose facing and pose-ready activity state explicitly from the room runtime.
- Keep dev bypass behavior clearly development-only.
- Preserve `ownedFurniture`, surface decor anchoring, four-wall support, and authoring-tool persistence boundaries.
- Be honest about Phase 2 conflict behavior: reduce same-item races with soft locks, but do not pretend to solve full multiplayer merge semantics.

## Research Outcome

Phase 2 is research-ready and blocked only by the UI-spec gate before full planning.

The key implementation choice is to add a separate live presence + soft-lock boundary around the existing shared-room runtime, while using a deterministic dev bootstrap to skip the temporary pairing/status surfaces during development without deleting the real shipped UX path.
