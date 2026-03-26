# Phase 2: Live Presence and Co-op Consistency - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the shared room feel live for two people by adding lightweight partner presence, remote avatar rendering, join/leave/reconnect presence UX, and predictable concurrent edit behavior on top of the Phase 1 canonical shared-room backbone. This phase covers live presence transport and same-room consistency only; progression, rituals, memories, richer social behaviors, pets expansion, breakup stakes, and the production backend/auth path remain out of scope.

</domain>

<decisions>
## Implementation Decisions

### Presence Transport and Activity Sync
- **D-01:** Sync live `position + facing + activity state` in Phase 2.
- **D-02:** Remote partner movement should be interpolated rather than snapping between updates.
- **D-03:** Live presence should use a separate lightweight presence channel instead of piggybacking on canonical room document commits.
- **D-04:** If presence updates drop briefly, hold the remote avatar in place for a short grace period and then mark the partner as reconnecting.

### Remote Avatar Fidelity
- **D-05:** The remote partner should appear as the full Minecraft-style avatar rather than a stand-in marker.
- **D-06:** Remote avatar visuals should reflect movement, facing, and synced interaction poses such as sitting, lying, and using the PC.
- **D-07:** Use each player's current skin/profile appearance when available, with a safe fallback if not.
- **D-08:** Show a subtle visible name label for the partner avatar.

### Join, Leave, and Reconnect UX
- **D-09:** The local player can enter and use the room even if the partner is not currently present.
- **D-10:** Join, leave, and reconnect events should surface through subtle shared-room status updates rather than heavy popups or modals.
- **D-11:** If the partner disconnects, keep the room usable and show offline/reconnecting state instead of blocking editing or ejecting the player.
- **D-12:** When the partner reconnects, restore the remote avatar in-room and quietly confirm the reconnected state in the status layer.

### Concurrent Edit Behavior
- **D-13:** In Phase 2, the key guarantee is convergence on one canonical committed room state.
- **D-14:** If both partners try to edit the same furniture item, use a soft item lock while one partner is actively editing it.
- **D-15:** If both partners edit different items, allow those edits concurrently.
- **D-16:** Locked items should show a clear but lightweight busy state instead of silently failing or blocking the whole room.

### Development Bypass and Hidden Surfaces
- **D-17:** During development, auto-enter a dev shared room instead of showing the pairing/opening/invite flow.
- **D-18:** During development, hide the pairing/login/invite/opening screen.
- **D-19:** During development, hide the `Shared room` strip above the game because it is temporary and distracting while iterating.
- **D-20:** The pairing/opening flow and shared-room status surfaces still exist as real player-facing features and should remain available for the actual shipped build later.

### the agent's Discretion
- Exact presence payload shape, update cadence, and timeout/grace-period thresholds for the lightweight presence channel.
- Exact visual treatment for partner name labels, reconnecting indicators, and busy-item cues as long as they stay subtle.
- Exact dev-only toggle mechanism for auto-entering the shared room and hiding temporary player-facing surfaces.
- Whether presence transport lives in a dedicated hook/store module or as an extension adjacent to the existing shared-room runtime boundary.

</decisions>

<specifics>
## Specific Ideas

- The user wants the room to feel live through seeing the other partner moving and interacting, but richer social behaviors or emotes should wait for later phases.
- During development, the user does not want the login/pairing/sharing/opening screens or the shared-room strip above the game to keep appearing.
- Development should auto-enter a dev shared room for now, while keeping the real player-facing pairing/status flow intact for later.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product Scope and Phase Contract
- `.planning/PROJECT.md` - Brownfield product definition, active shared-room goals, and Phase 2 continuity from the completed shared-room backbone.
- `.planning/REQUIREMENTS.md` - Phase 2 requirement contract for `PRES-01`, `PRES-02`, and `PRES-03`.
- `.planning/ROADMAP.md` - Phase 2 goal, success criteria, and plan breakdown.
- `.planning/STATE.md` - Current project state and blockers that still affect live presence work.

### Prior Phase Decisions and Verified Baseline
- `.planning/phases/01-shared-room-backbone/01-CONTEXT.md` - Locked Phase 1 authority, pairing, reconnect, and committed-edit decisions that Phase 2 must build on.
- `.planning/phases/01-shared-room-backbone/01-VERIFICATION.md` - Verified Phase 1 behaviors that must remain true while presence is added.

### Brownfield Architecture and Risks
- `.planning/codebase/ARCHITECTURE.md` - Current shared-room runtime layering and app-shell ownership.
- `.planning/codebase/STRUCTURE.md` - Source-tree ownership for app-shell, room-view, and shared-room files.
- `.planning/codebase/TESTING.md` - Existing test patterns and where Phase 2 regressions should land.
- `.planning/codebase/CONCERNS.md` - Current risks around the dev shared backend, stale sandbox validator, and lack of end-to-end presence coverage.

### Runtime Truth and Guardrails
- `docs/AI_HANDOFF.md` - Current runtime truth, room-schema guardrails, and shared-room implementation boundaries.
- `docs/ARCHITECTURE.md` - Active architecture and the requirement to extend the current room model instead of reviving the removed backend path.
- `docs/CURRENT_SYSTEMS.md` - Current room runtime systems and what Phase 2 must preserve while layering presence.

### Core Code Boundaries
- `src/App.tsx` - App-shell shared-room bootstrap, canonical room adoption, status surfaces, and current development bypass touchpoints.
- `src/app/hooks/useSharedRoomRuntime.ts` - Current shared-room load/reload/commit authority boundary.
- `src/components/RoomView.tsx` - Main live room composition and existing player/render orchestration.
- `src/components/MinecraftPlayer.tsx` - Reusable avatar renderer and pose behavior for both local and remote players.
- `src/components/room-view/useRoomViewInteractions.ts` - Current interaction/activity pose state and player interaction lifecycle.
- `src/lib/sharedRoomTypes.ts` - Shared-room member/session identity data already available to anchor partner presence.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/MinecraftPlayer.tsx`: Already provides the full Minecraft-style avatar renderer and interaction pose behavior that can be reused for a remote partner.
- `src/components/room-view/useRoomViewInteractions.ts`: Already derives activity state and pose data for sitting, lying, and PC use, which Phase 2 can map into presence updates.
- `src/components/RoomView.tsx`: Already owns the live room scene composition and is the natural place to add a remote partner actor.
- `src/app/hooks/useSharedRoomRuntime.ts`: Already handles canonical room bootstrap, reload, and shared-room status messages; Phase 2 can extend or pair with this for presence-related shell state.
- `src/app/components/SharedRoomStatusStrip.tsx`: Existing subtle status surface for join/leave/reconnect messaging, even if hidden during development.

### Established Patterns
- The app already distinguishes canonical committed room state from local transient editor state; presence should follow the same separation and avoid spamming full room documents.
- The room runtime already tracks player position, facing, and interaction state locally through `App.tsx`, `RoomView.tsx`, and `useRoomViewInteractions.ts`.
- Phase 1 established canonical room reload on reconnect and last-save-wins committed room edits; Phase 2 presence must not undermine that authority model.
- App-shell and room-view responsibilities are already split; new presence code should fit that boundary rather than collapsing everything back into one giant coordinator.

### Integration Points
- `src/App.tsx` is the natural place to bootstrap a dev-only auto-enter path and hide temporary pairing/status surfaces during development.
- `src/components/RoomView.tsx` plus `src/components/MinecraftPlayer.tsx` are the main integration points for rendering and updating the remote partner avatar.
- A new lightweight presence transport can live beside the current shared-room runtime/store path without changing the canonical room document contract.
- Shared-item lock and busy-state behavior will need to connect the editor/runtime layer with the shared-room status UI and committed edit path.

</code_context>

<deferred>
## Deferred Ideas

- Richer social/emote presence beyond movement, facing, and activity state.
- Production backend/auth replacement for the dev shared-room store.
- Progression, rituals, memories, pets expansion, and breakup/reset systems.
- Any heavier UI treatment for join/leave/reconnect beyond subtle shared-room status messaging.

</deferred>

---

*Phase: 02-live-presence-and-co-op-consistency*
*Context gathered: 2026-03-26*
