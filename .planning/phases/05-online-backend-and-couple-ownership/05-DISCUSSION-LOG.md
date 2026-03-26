# Phase 5: Online Backend and Couple Ownership - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 5-Online Backend and Couple Ownership
**Areas discussed:** authentication and sign-in, couple pairing handshake, room re-entry and migration, hosted backend selection

---

## Authentication and Sign-In

| Option | Description | Selected |
|--------|-------------|----------|
| Google only | Ship Google sign-in as the only auth path for v1.1 and keep reclaim flow simple | x |
| Google + email magic link | Add a second sign-in/recovery path in Phase 5 | |
| Guest-first then claim | Keep anonymous entry and let users attach identity later | |

**User's choice:** Google only, using the recommended default.
**Notes:** The user described a browser flow where both partners hit the same site and sign in through Google/email. The recommended default was to keep v1.1 on Google sign-in only so room reclaim across browsers/devices is simple and the phase stays focused on real backend ownership instead of auth-surface sprawl.

---

## Couple Pairing Handshake

| Option | Description | Selected |
|--------|-------------|----------|
| Passive screen presence only | If both users happen to be on the linking screen, code entry alone can complete the pair | |
| Mutual confirm handshake | One partner enters the other's code, both authenticated partners stay on the linking screen, and both explicitly confirm before the couple room finalizes | x |
| Immediate one-sided claim | One valid code entry immediately binds the two accounts | |

**User's choice:** Mutual confirm handshake, using the recommended default.
**Notes:** The user wanted either partner's code to work, but also wanted the first link to succeed only when both partners are actively on the linking screen. The recommendation tightened that into an explicit two-party confirmation so the initial couple-room claim is not accidental or silently hijacked by a stale session.

---

## Room Re-entry and Migration

| Option | Description | Selected |
|--------|-------------|----------|
| Enter immediately after pairing is established | On later logins, a single signed-in partner loads the existing room even if the other is offline | x |
| Wait in a lobby until both are online | Future room entry requires both partners to be present | |
| Import old dev/local room into hosted backend | Carry forward browser/dev state into the first real online room | |
| Start fresh hosted room | The first successful hosted pair creates a new starter room and ignores disposable dev/local room history | x |

**User's choice:** Enter immediately after pairing is established, and start fresh for the hosted room, both using the recommended defaults.
**Notes:** This preserves the earlier shared-room decision that the room stays usable while the partner is away, while also honoring the original Phase 1 decision that the dev file-backed room is disposable once the real backend arrives. The hosted starter room should seed the default shared cat at creation time.

---

## Hosted Backend Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Firebase Auth + Firestore + Realtime Database | Use Firebase Auth for Google sign-in, Firestore for canonical room state, and Realtime Database for ephemeral link/presence coordination | x |
| Supabase-first stack | Use Supabase Auth, Postgres, and Realtime instead | |
| Vercel-only persistence | Host the frontend and try to treat Vercel as the main world database layer | |

**User's choice:** Firebase Auth + Firestore + Realtime Database, using the recommended default.
**Notes:** The user asked directly whether Firebase is the right database direction for a Vercel-hosted browser game. The recommendation was yes: keep Vercel as frontend hosting, move canonical room state into Firestore, keep ephemeral presence/linking state in Realtime Database, and preserve the existing `SharedRoomStore` boundary so the brownfield room runtime does not become backend-specific.

---

## the agent's Discretion

- Exact Firebase schema layout for room documents, user membership, pending link requests, and presence records.
- Exact secure backend mechanism for completing the mutual link and rejecting stale/third-user claims.
- Exact invite-code TTL, linking copy, and recovery-state wording.

## Deferred Ideas

- Email magic links, passkeys, or guest-to-claim auth expansion after the Google-first baseline works.
- Offline/local shadow sync behavior during outages.
- Importing dev/local room history into the new hosted backend.

