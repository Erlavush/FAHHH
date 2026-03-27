# Phase 5: Online Backend and Couple Ownership - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the dev file-backed shared-room runtime with a real online backend and authenticated couple ownership flow that preserves the current one-couple/one-room contract across browsers and devices. This phase covers sign-in, first-time couple linking, room reclaim/re-entry, hosted canonical room persistence, and hosted presence/progression sync. It does not add new rituals, new activities, richer pet gameplay, or content expansion.

</domain>

<decisions>
## Implementation Decisions

### Authentication and Identity Recovery
- **D-01:** Phase 5 should ship with Google sign-in as the only player auth path for v1.1. Email/password, magic-link, guest, and social-provider expansion are deferred.
- **D-02:** Backend auth identity becomes the canonical player identity. The current browser-local shared profile/session state becomes a convenience cache only and must not remain the source of truth for room ownership.
- **D-03:** If a signed-in account is already paired to a couple room, the app should skip the first-time linking flow and load that existing room automatically on later visits from any browser or device.

### Couple Pairing and Ownership Enforcement
- **D-04:** Pairing remains code-based and exclusive: one account can belong to only one couple room, and one couple room can have exactly two members.
- **D-05:** Either partner can generate and share a link code, and either partner can enter the other partner's code. The flow should not privilege a permanent "owner" account beyond the existing two-member room contract.
- **D-06:** First-time pairing requires both authenticated partners to be actively present on the linking screen and to explicitly confirm the pending link before it finalizes. Entering a code alone is not enough to silently bind accounts.
- **D-07:** Third-user joins, duplicate claims, stale sessions, and replayed link attempts must be rejected by hosted ownership rules rather than relying on client-only checks.

### Room Bootstrap and Returning Entry
- **D-08:** The first successful couple link should create one fresh hosted starter room rather than trying to import or merge prior dev/local rooms.
- **D-09:** That first hosted starter room should seed the default shared cat as part of canonical room creation, so both partners enter a meaningful baseline immediately.
- **D-10:** After a couple is paired, either partner can enter the room immediately even if the other partner is offline. Presence continues to signal "waiting", "joined", and reconnect states without blocking room entry.

### Hosted Backend Shape
- **D-11:** The recommended Phase 5 backend stack is Firebase, with Vercel only hosting the frontend shell.
- **D-12:** Firebase Auth should own Google sign-in and account identity.
- **D-13:** Cloud Firestore should own the canonical couple room document and related durable gameplay state: room layout, progression, memories, pet state, membership metadata, and reclaim metadata.
- **D-14:** Firebase Realtime Database should own ephemeral live state such as linking-screen presence, online/offline presence, and any similar short-lived coordination signals. Ephemeral presence must stay separate from canonical room revisions.
- **D-15:** The app should keep the current `SharedRoomStore`-style boundary and swap the backing adapter, not push Firebase-specific logic directly through the entire room shell.

### Migration and Brownfield Compatibility
- **D-16:** Dev file-backed room data is disposable. Phase 5 does not need a one-time migration from the local/dev shared-room store into the hosted backend.
- **D-17:** The existing room-builder invariants stay intact: preserve `ownedFurniture` versus placed `furniture`, anchor-based surface decor, four-wall support, committed-edit sync, and the current player/developer shell split.
- **D-18:** Preview Studio and Mob Lab remain explicit authoring tools with separate persistence. Hosted couple-room state must not absorb Mob Lab presets, Preview Studio work, or developer-workspace UI settings.

### the agent's Discretion
- Exact hosted schema and collection layout for users, couple rooms, pending pair links, and presence records.
- Exact secure mutation vehicle for first-time link finalization and ownership enforcement, as long as it is server-trusted and not a client-only claim.
- Exact linking-screen copy and state progression for pending, waiting, confirm, success, expired, and already-paired cases.
- Exact invite-code format, TTL, and reclaim/recovery wording as long as they respect the exclusive one-couple/one-room rule.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product Scope and Phase Contract
- `.planning/PROJECT.md` - v1.1 milestone goal, active backend/auth requirement, and non-negotiable brownfield constraints.
- `.planning/REQUIREMENTS.md` - Phase 5 contract for `PAIR-02`, `PAIR-03`, `ROOM-04`, and `ROOM-05`.
- `.planning/ROADMAP.md` - Phase 5 goal, success criteria, and plan breakdown.
- `.planning/STATE.md` - Current milestone state, continuity notes from v1.0, and the current Phase 05 handoff point.

### Prior Phase Decisions That Still Bind Phase 5
- `.planning/phases/01-shared-room-backbone/01-CONTEXT.md` - Invite-code pairing, exclusive one-couple room contract, committed-edit sync, and the original decision that the dev store is disposable once the real backend lands.
- `.planning/phases/02-live-presence-and-co-op-consistency/02-CONTEXT.md` - Presence must stay separate from canonical room commits, room entry remains usable while the partner is away, and same-item concurrency keeps canonical reload authority.
- `.planning/phases/03-shared-progression-and-ritual-loop/03-CONTEXT.md` - Canonical progression already lives inside the shared room document and must move to hosted authority with the room.
- `.planning/phases/03.1-ui-overhaul-and-developer-player-view-split/03.1-UI-SPEC.md` - Player shell versus developer workspace boundary that Phase 5 login/linking/re-entry surfaces must preserve.
- `.planning/phases/04-memories-pets-and-breakup-stakes/04-CONTEXT.md` - Shared memories, shared cat, and breakup reset already live inside the canonical room document and must remain server-backed without leaking authoring state into gameplay.

### Brownfield Architecture, Integrations, and Risks
- `.planning/codebase/ARCHITECTURE.md` - Active shell/runtime layering, `SharedRoomStore` boundary, and local persistence split that the hosted backend must preserve.
- `.planning/codebase/STRUCTURE.md` - Source ownership map for app-shell, shared-room, presence, and authoring modules.
- `.planning/codebase/TESTING.md` - Current Vitest patterns and the absence of browser-driven E2E coverage; Phase 5 planning should add targeted shared-room/auth/runtime tests.
- `.planning/codebase/CONCERNS.md` - Current backend/auth gap, server-trust risk, and reminder not to assume the old placeholder Firebase footprint is already wired.
- `.planning/codebase/INTEGRATIONS.md` - Confirms there is no active remote API today and that Firebase artifacts are placeholders rather than a working runtime.

### Runtime and Product Guardrails
- `docs/AI_HANDOFF.md` - Runtime truth, current brownfield guardrails, and the explicit warning not to restore the removed legacy backend path as a parallel runtime.
- `docs/ARCHITECTURE.md` - Active architecture boundary, app-shell ownership, and the rule to extend the current room model instead of replacing it wholesale.
- `docs/CURRENT_SYSTEMS.md` - Current persistence split, current missing shared backend/auth gap, and the existing room/runtime behaviors that Phase 5 must not regress.
- `docs/CODEBASE_MAP.md` - Fast navigation map for the app shell, shared-room, and runtime modules Phase 5 will touch.
- `docs/ROADMAP.md` - Existing project-level guidance to define the backend shape from `roomState.ts`, keep confirmed edits canonical first, and keep authoring boundaries explicit.
- `docs/MOB_LAB.md` - Explicit rule that Mob Lab remains an authoring tool and must not be silently merged into live gameplay persistence.

### Core Code Boundaries
- `src/app/hooks/useSharedRoomRuntime.ts` - Current create/join/load/reload/commit authority boundary that Phase 5 should keep while swapping the backing provider.
- `src/app/hooks/useSharedRoomPresence.ts` - Current live presence and edit-lock split, which should move to hosted ephemeral state without collapsing into canonical room writes.
- `src/lib/sharedRoomStore.ts` - Replaceable store interface that should stay the backend seam.
- `src/lib/sharedRoomClient.ts` - Current dev API-backed implementation of the store boundary.
- `src/lib/sharedRoomSession.ts` - Current browser-local profile/session implementation that Phase 5 should downgrade from canonical identity to client convenience state.
- `src/lib/sharedRoomTypes.ts` - Existing couple-room, member, invite, memory, pet, and session shapes that the hosted backend contract must extend rather than reinvent.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/hooks/useSharedRoomRuntime.ts`: already centralizes create/join/load/reload/commit orchestration, blocking states, and session adoption; Phase 5 should preserve this entry point and swap its backend implementation.
- `src/app/hooks/useSharedRoomPresence.ts`: already models presence and edit locks as a separate channel from canonical room state; this is the correct split to preserve on the hosted backend.
- `src/lib/sharedRoomStore.ts` plus `src/lib/sharedRoomClient.ts`: already provide a replaceable adapter seam, which is the safest insertion point for Firestore/Realtime-backed operations.
- `src/lib/sharedRoomSession.ts`: already holds lightweight client session state; planning can repurpose it for local convenience data after Firebase Auth becomes canonical.
- `src/lib/sharedRoomTypes.ts`: already defines room membership, invite code, frame memory, pet, and session structures that anchor the hosted schema.

### Established Patterns
- Canonical room data is authoritative and reloadable; presence, locks, player transforms, and authoring state are deliberately not part of room revisions.
- The app shell owns login-entry, blocking, and top-level room adoption flows, while `RoomView` remains focused on live room rendering and interactions.
- Shared progression, shared memories, and the shared cat already live in the canonical shared-room document; Phase 5 must migrate those existing semantics to hosted persistence rather than inventing parallel saves.
- Preview Studio, Mob Lab, world settings, and other developer-workspace state stay outside shared-room authority.

### Integration Points
- Replace the current `/api/dev/shared-room/*` and related dev presence adapters behind the existing client/store interfaces rather than changing `App.tsx` and `RoomView` to know about the chosen backend directly.
- Introduce hosted auth/bootstrap logic at the current shared-room entry boundary, then let the existing player shell auto-load the room once the authenticated membership lookup succeeds.
- Add a hosted pairing handshake path that can create a two-member room and starter baseline atomically, including the initial shared cat seed.
- Extend tests around shared-room runtime, session, store, and validation so hosted identity, couple membership enforcement, and reconnect behavior are covered before later ritual/content phases build on them.

</code_context>

<specifics>
## Specific Ideas

- The desired player flow is: both partners open the same website, sign in with Google, arrive at a linking screen, and use either partner's code to form the couple room.
- The initial link should feel mutual rather than unilateral: both sides are visibly in the linking state before the room becomes real, then both enter the same starter room.
- First successful link should feel complete immediately by spawning the couple into a default room with the shared starter cat already present.
- Future logins should feel automatic: if the auth account is already paired, skip linking and load the room tied to that account.
- Recommended deployment split is Vercel for the frontend and Firebase for auth plus hosted state, rather than trying to use Vercel itself as the long-term world database.

</specifics>

<deferred>
## Deferred Ideas

- Additional auth providers, email magic links, guest-to-claim flows, or passkey expansion beyond Google sign-in.
- Offline shadow-edit or local-first resync behavior when the hosted backend is unreachable.
- Any many-room, public, or friend-list style relationship model beyond one exclusive couple room.
- Importing legacy dev/local room data into the hosted backend.

</deferred>

---

*Phase: 05-online-backend-and-couple-ownership*
*Context gathered: 2026-03-27*
