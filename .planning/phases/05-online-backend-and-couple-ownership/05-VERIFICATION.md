---
phase: 05-online-backend-and-couple-ownership
status: passed
verified: 2026-03-27
requirements:
  - PAIR-02
  - PAIR-03
  - ROOM-04
  - ROOM-05
automated_checks:
  - cmd /c npm test -- --maxWorkers 1 tests/sharedRoomEntryShell.test.tsx tests/sharedRoomRuntime.test.ts tests/sharedRoomPresenceUx.test.ts
  - cmd /c npm test
  - cmd /c npm run build
---

# Phase 05 Verification

## Goal

Replace the dev file-backed shared-room runtime with a real hosted auth and ownership foundation so a couple can sign in, link once, reclaim their room from other browsers or devices, and keep canonical shared-room state on the hosted backend without breaking the current room-builder or player/developer shell boundaries.

## Result

**Passed**

Phase 5 now moves the couple-room runtime onto Firebase-backed auth, ownership, canonical room storage, and ephemeral presence. Signed-out players land on a Google sign-in shell, unpaired players complete a mutual link-confirm flow, paired players automatically re-enter their room on later visits, and either partner can enter while the other is offline. The hosted path stays behind the existing shared-room seams, so the room builder, progression, memories, shared cat, and developer tools continue to respect the current brownfield boundaries.

## Requirement Coverage

- **PAIR-02** - Passed. Firebase Auth now provides canonical player identity, the player shell exposes Google sign-in plus hosted linking states, and authenticated paired members auto-load their room from any browser or device. Evidence: `src/lib/firebaseAuth.ts`, `src/app/hooks/useSharedRoomRuntime.ts`, `src/app/components/SharedRoomEntryShell.tsx`, `tests/sharedRoomRuntime.test.ts`.
- **PAIR-03** - Passed. Hosted ownership rules enforce exclusive two-member rooms, mutual confirm is required before first room creation, and stale or duplicate claims are rejected by the ownership layer instead of client-only checks. Evidence: `src/lib/sharedRoomOwnership.ts`, `src/lib/firebaseOwnershipStore.ts`, `src/lib/sharedRoomOwnershipStore.ts`, `tests/sharedRoomOwnership.test.ts`, `tests/firebaseOwnershipStore.test.ts`.
- **ROOM-04** - Passed. Canonical room documents, progression, memories, the shared cat, ownership metadata, live presence, edit locks, and pending-link presence now route through Firestore and Realtime Database adapters behind the existing shared-room seams. Evidence: `src/lib/firebaseRoomStore.ts`, `src/lib/firebasePresenceStore.ts`, `src/lib/sharedRoomClient.ts`, `src/lib/sharedPresenceClient.ts`, `src/app/hooks/useSharedRoomRuntime.ts`.
- **ROOM-05** - Passed. Paired members now re-enter the existing room automatically after sign-in, preserve canonical room identity across browsers or devices, and can enter even while the partner is offline. Evidence: `src/app/hooks/useSharedRoomRuntime.ts`, `src/app/hooks/useSharedRoomPresence.ts`, `tests/sharedRoomRuntime.test.ts`, `tests/sharedRoomPresenceUx.test.ts`.

## Must-Have Checks

- **Truth:** A signed-out player must see Google sign-in first, and a paired authenticated member must skip linking and load the existing room automatically.
  - **Evidence:** `src/app/components/SharedRoomEntryShell.tsx`, `src/app/hooks/useSharedRoomRuntime.ts`, `tests/sharedRoomEntryShell.test.tsx`, `tests/sharedRoomRuntime.test.ts`
- **Truth:** First-time couple linking must require partner-code submission plus explicit confirmation from both authenticated partners before the starter room is created.
  - **Evidence:** `src/lib/sharedRoomOwnership.ts`, `src/lib/firebaseOwnershipStore.ts`, `src/app/hooks/useSharedRoomRuntime.ts`, `src/app/components/SharedRoomEntryShell.tsx`
- **Truth:** Canonical room data must stay in hosted room storage while presence, edit locks, and pending-link presence stay in the ephemeral presence channel.
  - **Evidence:** `src/lib/firebaseRoomStore.ts`, `src/lib/firebasePresenceStore.ts`, `src/lib/sharedRoomClient.ts`, `src/lib/sharedPresenceClient.ts`
- **Truth:** The hosted entry flow must stay in Player View without reintroducing developer-only clutter, and in-room presence must wait until the room is actually ready.
  - **Evidence:** `src/App.tsx`, `src/app/hooks/useSharedRoomPresence.ts`, `src/app/components/SharedRoomEntryShell.tsx`, `tests/sharedRoomPresenceUx.test.ts`

## Automated Checks

- Passed `cmd /c npm test -- --maxWorkers 1 tests/sharedRoomEntryShell.test.tsx tests/sharedRoomRuntime.test.ts tests/sharedRoomPresenceUx.test.ts`
  - Result: targeted hosted entry and presence regression tests passed
- Passed `cmd /c npm test`
  - Result: `39` test files, `170` tests passed
- Passed `cmd /c npm run build`
  - Result: TypeScript compile plus production Vite build passed

## Residual Risks

- I did not run a live two-browser hosted smoke test against a real Firebase project in this turn; verification here is code- and test-based.
- Hosted mode still requires valid Firebase environment values and backend configuration in deployment; without them, the runtime intentionally stays on the local/dev fallback path.
- Earlier archived v1.0 phases still lack their own verification artifacts, but Phase 5 now establishes the required verification pattern for v1.1.

## Human Verification

No explicit browser-level human verification gate was run in this turn.

---
*Verified: 2026-03-27*
