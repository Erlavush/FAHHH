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
  - cmd /c npm test -- --maxWorkers 1 tests/sharedRoomRuntime.test.ts tests/sharedRoomEntryShell.test.tsx tests/sharedRoomPresence.test.ts tests/sharedRoomPresenceUx.test.ts tests/shellViewModel.test.ts
  - cmd /c npm test -- --maxWorkers 1 tests/sharedRoomPresence.test.ts tests/sharedRoomPresenceUx.test.ts tests/sharedRoomPet.test.ts
  - cmd /c npm test -- --maxWorkers 1 tests/furnitureInteractions.test.ts tests/sharedRoomPresenceUx.test.ts
  - cmd /c npm test
  - cmd /c npm run build
---

# Phase 05 Verification

## Goal

Replace the dev file-backed shared-room runtime with a real hosted auth and ownership foundation so a couple can sign in, link once, reclaim their room from other browsers or devices, and keep canonical shared-room state on the hosted backend without breaking the current room-builder or player/developer shell boundaries.

## Result

**Passed**

Phase 5 now moves the couple-room runtime onto Firebase-backed auth, ownership, canonical room storage, and ephemeral presence. Signed-out players land on a Google sign-in shell, unpaired players complete a mutual link-confirm flow, paired players automatically re-enter their room on later visits, and either partner can enter while the other is offline. The hosted path stays behind the existing shared-room seams, so the room builder, progression, memories, shared cat, and developer tools continue to respect the current brownfield boundaries.

Gap-closure follow-up work also fixed the misleading localhost fallback path, bounded stale reconnecting presence into a calmer partner-away state, moved shared cat behavior and remote locomotion onto a richer ephemeral live-state seam, and made shared bed use occupancy-aware so partners land on separate sides.

## Requirement Coverage

- **PAIR-02** - Passed. Firebase Auth now provides canonical player identity, the player shell exposes Google sign-in plus explicit hosted-unavailable versus local-dev fallback states, and authenticated paired members auto-load their room from any browser or device. Evidence: `src/lib/firebaseAuth.ts`, `src/lib/sharedBackendConfig.ts`, `src/app/hooks/useSharedRoomRuntime.ts`, `src/app/components/SharedRoomEntryShell.tsx`, `tests/sharedRoomRuntime.test.ts`, `tests/sharedRoomEntryShell.test.tsx`.
- **PAIR-03** - Passed. Hosted ownership rules enforce exclusive two-member rooms, mutual confirm is required before first room creation, and stale or duplicate claims are rejected by the ownership layer instead of client-only checks. Evidence: `src/lib/sharedRoomOwnership.ts`, `src/lib/firebaseOwnershipStore.ts`, `src/lib/sharedRoomOwnershipStore.ts`, `tests/sharedRoomOwnership.test.ts`, `tests/firebaseOwnershipStore.test.ts`.
- **ROOM-04** - Passed. Canonical room documents, progression, memories, the shared cat, ownership metadata, live presence, edit locks, and pending-link presence now route through Firestore and Realtime Database adapters behind the existing shared-room seams, while shared-pet and motion live state stay ephemeral outside room revision churn. Evidence: `src/lib/firebaseRoomStore.ts`, `src/lib/firebasePresenceStore.ts`, `src/lib/sharedPresenceTypes.ts`, `src/lib/sharedPresenceValidation.ts`, `src/lib/sharedRoomClient.ts`, `src/lib/sharedPresenceClient.ts`, `src/app/hooks/useSharedRoomRuntime.ts`, `tests/sharedRoomPresence.test.ts`, `tests/sharedRoomPet.test.ts`.
- **ROOM-05** - Passed. Paired members now re-enter the existing room automatically after sign-in, preserve canonical room identity across browsers or devices, can enter even while the partner is offline, and share smoother partner-presence presentation plus occupancy-aware bed sides. Evidence: `src/app/hooks/useSharedRoomRuntime.ts`, `src/app/hooks/useSharedRoomPresence.ts`, `src/components/MinecraftPlayer.tsx`, `src/lib/furnitureInteractions.ts`, `tests/sharedRoomRuntime.test.ts`, `tests/sharedRoomPresenceUx.test.ts`, `tests/furnitureInteractions.test.ts`.

## Must-Have Checks

- **Truth:** A signed-out player must see Google sign-in first, and the shell must clearly distinguish hosted-ready, hosted-unavailable, and local-dev fallback before any room auto-entry is interpreted.
  - **Evidence:** `src/lib/sharedBackendConfig.ts`, `src/app/components/SharedRoomEntryShell.tsx`, `src/app/hooks/useSharedRoomRuntime.ts`, `tests/sharedRoomEntryShell.test.tsx`, `tests/sharedRoomRuntime.test.ts`
- **Truth:** First-time couple linking must require partner-code submission plus explicit confirmation from both authenticated partners before the starter room is created.
  - **Evidence:** `src/lib/sharedRoomOwnership.ts`, `src/lib/firebaseOwnershipStore.ts`, `src/app/hooks/useSharedRoomRuntime.ts`, `src/app/components/SharedRoomEntryShell.tsx`
- **Truth:** Canonical room data must stay in hosted room storage while presence, edit locks, pending-link presence, shared-pet live state, and remote motion stay in the ephemeral presence channel.
  - **Evidence:** `src/lib/firebaseRoomStore.ts`, `src/lib/firebasePresenceStore.ts`, `src/lib/sharedPresenceTypes.ts`, `src/lib/sharedPresenceValidation.ts`, `src/lib/sharedRoomClient.ts`, `src/lib/sharedPresenceClient.ts`, `tests/sharedRoomPresence.test.ts`, `tests/sharedRoomPet.test.ts`
- **Truth:** Partner reconnecting is temporary, long-stale presence becomes partner-away, and abrupt dev-browser exits do not leave a permanent reconnect card.
  - **Evidence:** `scripts/sharedRoomDevPlugin.mjs`, `src/app/hooks/useSharedRoomPresence.ts`, `src/app/shellViewModel.ts`, `tests/sharedRoomPresence.test.ts`, `tests/sharedRoomPresenceUx.test.ts`, `tests/shellViewModel.test.ts`
- **Truth:** Remote partner movement and the shared cat must read from one richer live-state seam, and shared beds must place partners on distinct sides instead of overlapping.
  - **Evidence:** `src/components/MinecraftPlayer.tsx`, `src/components/RoomView.tsx`, `src/components/room-view/RoomPetActor.tsx`, `src/lib/furnitureInteractions.ts`, `src/components/room-view/useRoomViewInteractions.ts`, `tests/sharedRoomPet.test.ts`, `tests/sharedRoomPresenceUx.test.ts`, `tests/furnitureInteractions.test.ts`

## Automated Checks

- Passed `cmd /c npm test -- --maxWorkers 1 tests/sharedRoomRuntime.test.ts tests/sharedRoomEntryShell.test.tsx tests/sharedRoomPresence.test.ts tests/sharedRoomPresenceUx.test.ts tests/shellViewModel.test.ts`
  - Result: hosted-unavailable entry, dev-fallback truth, stale presence pruning, and partner-away UX regressions passed
- Passed `cmd /c npm test -- --maxWorkers 1 tests/sharedRoomPresence.test.ts tests/sharedRoomPresenceUx.test.ts tests/sharedRoomPet.test.ts`
  - Result: richer live-state payload and shared-pet ephemeral sync regressions passed
- Passed `cmd /c npm test -- --maxWorkers 1 tests/furnitureInteractions.test.ts tests/sharedRoomPresenceUx.test.ts`
  - Result: occupancy-aware bed targeting and slot mirroring regressions passed
- Passed `cmd /c npm test`
  - Result: `39` test files, `181` tests passed
- Passed `cmd /c npm run build`
  - Result: TypeScript compile plus production Vite build passed

## Residual Risks

- I did not rerun a fresh live two-browser hosted smoke test against a real Firebase project after the gap fixes; verification here is code- and test-based plus the earlier UAT report.
- Hosted mode still requires valid `VITE_SHARED_BACKEND=firebase` and `VITE_FIREBASE_*` values in deployment; when Firebase is requested but incomplete, the shell now surfaces hosted-unavailable instead of silently entering the room.
- Remote movement smoothness is guarded by contract-level tests and higher-frequency live-state updates, but it was not profiled under real network latency in this turn.
- Earlier archived v1.0 phases still lack their own verification artifacts, but Phase 5 now establishes the required verification pattern for v1.1.

## Human Verification

The original Phase 5 UAT produced five issues and one blocked hosted-link test. Gap-closure fixes are implemented and recorded in `05-UAT.md`, but a fresh browser-level retest is still pending for the hosted two-account flow and the visual feel of the motion/presence fixes.

---
*Verified: 2026-03-27*
