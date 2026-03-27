# Phase 05: Online Backend and Couple Ownership - Research

**Researched:** 2026-03-27
**Domain:** Hosted auth, couple ownership, canonical room persistence, and reconnect-safe browser entry
**Confidence:** HIGH

<user_constraints>
## User Constraints (from 05-CONTEXT.md and active project rules)

### Locked Decisions

### Authentication and Identity Recovery
- **D-01:** Ship Google sign-in as the only v1.1 auth path.
- **D-02:** Backend auth identity becomes canonical; browser-local profile/session data is convenience cache only.
- **D-03:** If the account is already paired, later visits should skip first-time linking and load the existing room automatically.

### Couple Pairing and Ownership Enforcement
- **D-04:** Pairing stays code-based and exclusive: one account per one couple room, and one couple room has exactly two members.
- **D-05:** Either partner can generate/share a code, and either partner can enter the other partner's code.
- **D-06:** First-time pairing requires both authenticated partners to be on the linking screen and both explicitly confirm before the room is finalized.
- **D-07:** Third-user joins, duplicate claims, stale sessions, and replayed link attempts must be rejected by hosted rules, not client-only checks.

### Room Bootstrap and Returning Entry
- **D-08:** First hosted pair starts from a fresh starter room; no dev/local room import.
- **D-09:** The starter shared cat is seeded as part of first canonical room creation.
- **D-10:** After pairing, either partner can enter immediately even if the other partner is offline.

### Hosted Backend Shape
- **D-11:** Recommended backend stack is Firebase, with Vercel only hosting the frontend shell.
- **D-12:** Firebase Auth owns Google sign-in.
- **D-13:** Cloud Firestore owns the canonical room document and durable gameplay state.
- **D-14:** Firebase Realtime Database owns ephemeral presence and linking-screen coordination state.
- **D-15:** Keep the current adapter seam; do not spread backend-specific code through the room shell.

### Brownfield Compatibility
- **D-16:** Dev file-backed room data is disposable.
- **D-17:** Preserve `ownedFurniture` versus placed `furniture`, anchor-based surface decor, four-wall support, committed-edit sync, and the player/developer shell split.
- **D-18:** Preview Studio and Mob Lab remain separate authoring tools and must not move into hosted couple-room state.

### the agent's Discretion
- Exact Firestore and Realtime Database document/path layout.
- Exact trusted mutation vehicle for finalizing the first pair link.
- Exact linking, waiting, expired, and recovery copy.
- Exact invite-code TTL and recovery wording.

### Deferred Ideas (OUT OF SCOPE)
- Email magic links, passkeys, guest-to-claim flows, or broader provider support.
- Offline shadow sync or full local-first outage recovery.
- Many-room, public, or social graph models beyond one exclusive couple room.
- Importing legacy dev/local room data into the hosted backend.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAIR-02 | Couple can authenticate or reclaim their shared room identity across browsers and devices using the selected backend/auth flow. | Use Firebase Auth Google sign-in, map authenticated `uid` to the existing shared profile shape, and add a hosted ownership bootstrap lookup that resolves the paired room before `App.tsx` loads canonical room state. |
| PAIR-03 | Room membership and ownership enforcement prevent third users or stale clients from silently claiming or corrupting a couple's room. | Model ownership as explicit membership documents plus one pending-link handshake, and finalize pair creation through one transaction/trusted mutation instead of client-only room joins. |
| ROOM-04 | Shared-room documents, presence, progression, memories, and pet state sync through the hosted backend instead of the dev file-backed store. | Keep Firestore for canonical room documents and Realtime Database for ephemeral presence and lock state while preserving the `SharedRoomStore` and `SharedPresenceStore` seams. |
| ROOM-05 | Both partners can leave and re-enter their room from different browsers or devices without losing room identity or committed shared state. | Load paired-room bootstrap state from auth identity on every visit, cache room metadata only as convenience, and keep the current canonical reload-on-open behavior through the hosted adapters. |
</phase_requirements>

## Summary

Phase 05 is not a room-builder rewrite. The codebase already has the right domain model, mutation boundaries, and shell split. The missing pieces are real identity, trusted couple ownership, and hosted persistence that survives browsers and devices. The planning goal is to replace the current dev-only file store and local profile/session assumptions without disturbing the existing room-state, progression, memory, pet, or developer-workspace boundaries.

The clean move is to split hosted concerns into three boundaries:

1. **Auth boundary:** Firebase Auth owns the canonical player identity, and the app adapts the authenticated user into the existing `SharedPlayerProfile` shape.
2. **Ownership/bootstrap boundary:** a new hosted ownership layer resolves whether the signed-in player needs linking, is in a pending link handshake, or is already paired to a room.
3. **Runtime data boundary:** Firestore persists the canonical room document, while Realtime Database carries ephemeral room presence, edit locks, and linking-screen presence.

That split fits the current architecture. `useSharedRoomRuntime` already expects one canonical room source and already knows how to adopt, reload, and commit it. `useSharedRoomPresence` already treats presence and locks as a separate transport. The room shell should keep depending on those boundaries, not on raw Firebase SDK calls.

The highest-risk area is first-time couple linking. The current dev flow allows client-only create/join against a file store. That is unacceptable once real accounts exist, because stale clients or a third signed-in user could claim a room unless membership is enforced transactionally. The right architecture is to treat the first pair link as one explicit two-party handshake with a pending-link record and one trusted finalization step that creates the starter room, the shared cat, and the membership records atomically.

No separate Phase 05 UI-SPEC is required to plan this well. The phase is backend-heavy, and the user decisions already lock the critical flow: Google sign-in, code entry, both partners present, explicit confirm, starter room plus cat, and automatic future re-entry. Planning should keep UI work tightly scoped to `SharedRoomEntryShell`, the blocking overlay, and runtime bootstrapping.

**Primary recommendation:** add Firebase Auth for Google sign-in, create a hosted ownership/bootstrap store that resolves `needs_linking` vs `pending_link` vs `paired_room`, implement Firestore and Realtime adapters behind the existing store seams, and then swap `SharedRoomEntryShell` plus `useSharedRoomRuntime` to the new auth-first flow without changing the underlying room-runtime invariants.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Firebase Auth | `firebase` 11.0.2 already installed | Google sign-in and browser/device identity reclaim | The dependency and env placeholders already exist in the repo, and the user explicitly wants Google-based browser login. |
| Cloud Firestore | Firebase platform | Canonical couple-owned room document and membership records | Firestore transactions are the right fit for one trusted two-member room and canonical document commits. |
| Firebase Realtime Database | Firebase platform | Presence, edit locks, and linking-screen presence | RTDB supports low-latency presence patterns such as connection state and `onDisconnect`, which match the existing split between canonical room data and ephemeral presence. |
| React + TypeScript + existing hooks | current stack | Auth/bootstrap shell and hosted adapter integration | The current app shell already owns entry, blocking, and runtime adoption flows. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Firebase emulator toggles | env-driven | Local development without forcing live-project writes | Use for local implementation and smoke tests once the Firebase adapters exist. |
| Vitest | 3.0.5 declared | Store, runtime, ownership-rule, and session cache regression coverage | Keep using focused unit and hook tests rather than inventing a new test harness. |
| Existing dev plugin | repo-local | Optional legacy fallback while the hosted path lands | Keep it as a local development escape hatch only if the adapter selection stays explicit. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Firebase Auth + Firestore + RTDB | Supabase Auth + Postgres + Realtime | Viable, but the repo already carries Firebase footprint and the user explicitly asked about Firebase for a Vercel-hosted browser game. |
| Firestore for canonical docs and RTDB for ephemeral state | One giant Firestore document for room + presence + locks | Simpler on paper, but it makes hot presence writes compete with canonical room commits and conflicts with the current architecture split. |
| Hosted ownership bootstrap store | Reusing `createRoom` / `joinRoom` directly from `SharedRoomStore` | Too shallow for auth-first linking, auto-reentry, and pending link states. |
| Vercel functions as the primary world database | Firebase as the actual persistence layer | Vercel is good frontend hosting but is the wrong canonical storage layer for room world state. |

**Installation:**
```bash
# No new package is strictly required; `firebase` is already declared.
# The plan should add env parsing and adapter wiring rather than a new service SDK.
```

## Architecture Patterns

### Recommended Project Structure
```text
src/
|-- app/components/
|   |-- SharedRoomEntryShell.tsx
|   `-- SharedRoomBlockingOverlay.tsx
|-- app/hooks/
|   |-- useSharedRoomRuntime.ts
|   `-- useSharedRoomPresence.ts
|-- lib/
|   |-- sharedBackendConfig.ts
|   |-- firebaseApp.ts
|   |-- firebaseAuth.ts
|   |-- firebaseRoomStore.ts
|   |-- firebaseOwnershipStore.ts
|   |-- firebasePresenceStore.ts
|   |-- sharedRoomOwnership.ts
|   |-- sharedRoomOwnershipStore.ts
|   |-- sharedRoomStore.ts
|   |-- sharedPresenceStore.ts
|   |-- sharedRoomSession.ts
|   `-- sharedRoomTypes.ts

tests/
|-- sharedRoomOwnership.test.ts
|-- sharedRoomStore.test.ts
|-- sharedRoomPresence.test.ts
|-- sharedRoomRuntime.test.ts
`-- sharedRoomSession.test.ts
```

### Pattern 1: Keep canonical room state in Firestore and ephemeral state in RTDB
**What:** Persist `roomState`, `progression`, `frameMemories`, `sharedPet`, membership metadata, and canonical revisioning in Firestore, while storing room presence, edit locks, and linking presence in Realtime Database.
**When to use:** For all hosted runtime data in Phase 05.
**Why:** The current codebase already separates committed room state from presence/locks. Preserve that split instead of merging transports.

### Pattern 2: Add an ownership/bootstrap store separate from the canonical room store
**What:** Introduce a `SharedRoomOwnershipStore` that resolves auth-first app entry states such as `needs_linking`, `pending_link`, and `paired_room`.
**When to use:** For sign-in, code entry, confirmation, and automatic future room lookup.
**Why:** The current `SharedRoomStore` is room-document oriented. Ownership bootstrap is a different concern and should not be forced through `createRoom` / `joinRoom` calls that assume local dev semantics.

### Pattern 3: Finalize first-time couple linking through one trusted mutation
**What:** Use one transaction or server-trusted mutation to validate both authenticated users, confirm both approvals, create the starter room, seed the shared cat, create membership records, and close the pending link.
**When to use:** Only when both users have confirmed the pending link.
**Why:** This is the requirement boundary for `PAIR-03`. Client-only membership creation is not trustworthy enough.

### Pattern 4: Treat local session state as a cache, not identity
**What:** Keep browser-local session data only for convenience fields such as last known room id, invite code, revision, or display-name hints.
**When to use:** On reloads and transitions between the entry shell and the live room.
**Why:** The canonical room owner must now be the authenticated Firebase user, not a locally generated UUID.

### Pattern 5: Reuse existing starter-room and pet helpers for first hosted room creation
**What:** Seed the first hosted room with `createSharedRoomSeed`, `createInitialSharedRoomProgression`, and `createSharedRoomPetRecord`, using the current default room baseline and cat runtime helpers.
**When to use:** At the trusted pair-finalization step.
**Why:** It preserves existing room-builder invariants and avoids inventing a new starter schema just because the backend changed.

### Pattern 6: Keep App and RoomView backend-agnostic through adapter factories
**What:** Select `firebase` versus `dev` adapters in one config-aware factory layer and inject those adapters into the existing runtime hooks.
**When to use:** For both canonical room data and presence data.
**Why:** `App.tsx` and `RoomView.tsx` should not learn Firestore documents, RTDB refs, or SDK-specific APIs.

### Recommended Sequencing
1. Define auth/bootstrap contracts and pure ownership rules first.
2. Implement Firebase-backed canonical room and presence adapters behind the existing store seams.
3. Swap the player entry flow and runtime bootstrap to Google sign-in, pending link confirm, and auto-reentry.

## Runtime State Inventory

| Area | Current State | Required Phase 05 Action |
|------|---------------|--------------------------|
| `src/lib/sharedRoomSession.ts` | Generates/stores local-only player identity and room session | Downgrade to convenience cache and stop treating it as canonical identity. |
| `src/app/hooks/useSharedRoomRuntime.ts` | Creates/joins/loads a room against the dev file-backed store | Add auth bootstrap, hosted ownership state, and hosted room adoption while preserving the same canonical room mutation semantics. |
| `src/app/hooks/useSharedRoomPresence.ts` | Publishes room presence and edit locks against the dev presence store | Point the same hook to RTDB-backed presence and edit-lock adapters. |
| `src/lib/sharedRoomClient.ts` | Calls `/api/dev/shared-room/*` endpoints | Replace or factory-wrap this with a Firebase-backed implementation. |
| `src/lib/sharedPresenceClient.ts` | Calls `/api/dev/shared-room/presence/*` and `/locks/*` endpoints | Replace or factory-wrap this with a Realtime Database-backed implementation. |
| `scripts/sharedRoomDevPlugin.mjs` | File-backed room, invite, presence, and lock backend | Treat as legacy fallback only; Phase 05 shipped path should no longer depend on it. |
| `src/app/components/SharedRoomEntryShell.tsx` | Local display name plus create/join code flow | Replace with Google sign-in, code submit, confirm link, waiting, and recovery states. |
| `src/App.tsx` | Shows entry shell when no room session exists | Change bootstrap to auth-first: signed-out, signed-in unpaired, pending link, paired room loading, paired room active. |

## Common Pitfalls

### Pitfall 1: Treating Firebase Auth as just another source for local profile ids
**What goes wrong:** Different browsers/devices still end up with different identities, so room reclaim fails.
**How to avoid:** Firebase `uid` must become the canonical `playerId` for hosted pairing and membership.

### Pitfall 2: Using Firestore for high-frequency presence and edit-lock churn
**What goes wrong:** Hot documents, noisy writes, and unnecessary coupling between room rendering and room authority.
**How to avoid:** Keep Firestore for canonical room and membership state, and move live presence/locks to RTDB.

### Pitfall 3: Finalizing pair links from the client without a trusted check
**What goes wrong:** Third users or stale tabs can steal or corrupt room ownership.
**How to avoid:** Finalize the first pair only through one transaction or trusted mutation that verifies both auth identities and membership emptiness.

### Pitfall 4: Trying to import dev/local room history automatically
**What goes wrong:** Hosted room creation inherits stale dev assumptions and mismatched identity semantics.
**How to avoid:** Start fresh from the canonical starter room; the dev file store is explicitly disposable.

### Pitfall 5: Putting Firebase SDK calls directly in `App.tsx`
**What goes wrong:** Auth, room data, presence, and UI state get tangled in the largest component in the repo.
**How to avoid:** Add `firebase*Store` and `firebaseAuth` boundaries and keep the shell using the existing hook/store pattern.

### Pitfall 6: Letting hosted room creation bypass the existing room seed helpers
**What goes wrong:** Ownership ids, placed furniture, or starter cat state drift from the already-tested room baseline.
**How to avoid:** Use `createSharedRoomSeed`, `createInitialSharedRoomProgression`, and `createSharedRoomPetRecord` for the first hosted room.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Browser auth | Custom password or token flow | Firebase Auth Google provider | The user explicitly wants Google sign-in, and the dependency is already present. |
| Canonical room sync | New room schema or second save path | Existing `SharedRoomDocument` plus hosted store adapter | Keeps Phase 3 and Phase 4 canonical data intact. |
| Presence | Polling Firestore room docs for online state | RTDB presence with `onDisconnect` and existing presence hook semantics | Matches the current architecture and the right data lifetime. |
| Couple linking | One-sided join/create button logic | Pending-link handshake plus trusted finalization | Satisfies the "both present and both confirm" user decision. |
| Starter room | Fresh bespoke server schema | Existing room seed and progression helpers | Reuses tested brownfield behavior and avoids hidden drift. |

## Open Questions

1. **Should first-time pair finalization use a Firestore transaction or a server-trusted callable/server endpoint?**
   - Recommendation: leave the exact mechanism open in planning, but require one trusted atomic finalization step. If security rules alone become awkward, use a small trusted function rather than weakening the ownership guarantee.

2. **Should Google sign-in prefer popup or redirect?**
   - Recommendation: default to popup on desktop browsers and keep redirect as a fallback path if popup restrictions surface during implementation.

3. **How should the app behave when Firebase config is missing in local development?**
   - Recommendation: keep one explicit backend mode toggle so local development can use emulators or fall back to the dev plugin deliberately, not accidentally.

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/phases/05-online-backend-and-couple-ownership/05-CONTEXT.md`
- `src/App.tsx`
- `src/app/hooks/useSharedRoomRuntime.ts`
- `src/app/hooks/useSharedRoomPresence.ts`
- `src/app/components/SharedRoomEntryShell.tsx`
- `src/lib/sharedRoomStore.ts`
- `src/lib/sharedPresenceStore.ts`
- `src/lib/sharedRoomClient.ts`
- `src/lib/sharedPresenceClient.ts`
- `src/lib/sharedRoomSession.ts`
- `src/lib/sharedRoomTypes.ts`
- `src/lib/sharedRoomValidation.ts`
- `src/lib/sharedRoomSeed.ts`
- `src/lib/sharedProgression.ts`
- `src/lib/sharedRoomPet.ts`
- `src/lib/petPathing.ts`
- `src/app/constants.ts`
- `scripts/sharedRoomDevPlugin.mjs`
- `tests/sharedRoomRuntime.test.ts`
- `tests/sharedRoomStore.test.ts`
- `tests/sharedRoomPresence.test.ts`
- `tests/sharedRoomSession.test.ts`

### External Official Docs (HIGH confidence)
- `https://firebase.google.com/docs/auth/web/google-signin` - Google sign-in flow for Firebase Auth web apps.
- `https://firebase.google.com/docs/firestore/manage-data/transactions` - Firestore transaction guidance for atomic multi-document updates.
- `https://firebase.google.com/docs/firestore/security/get-started` - Firestore security rules and `request.auth` access control model.
- `https://firebase.google.com/docs/database/web/offline-capabilities#section-connection-state` - Realtime Database connection state and `onDisconnect` presence support.
- `https://vercel.com/docs/functions/limitations` - Vercel serverless limitations, reinforcing that frontend hosting is separate from canonical world storage.

### Secondary (MEDIUM confidence)
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/TESTING.md`
- `.planning/codebase/CONCERNS.md`
- `.planning/codebase/INTEGRATIONS.md`
- `docs/AI_HANDOFF.md`
- `docs/ARCHITECTURE.md`
- `docs/CODEBASE_MAP.md`
- `docs/CURRENT_SYSTEMS.md`
- `docs/ROADMAP.md`
- `docs/MOB_LAB.md`

## Metadata

**Confidence breakdown:**
- Auth and ownership split: HIGH
- Firestore versus RTDB boundary: HIGH
- Trusted pair-finalization requirement: HIGH
- Exact local fallback mode: MEDIUM

**Research date:** 2026-03-27
**Valid until:** 2026-04-03
