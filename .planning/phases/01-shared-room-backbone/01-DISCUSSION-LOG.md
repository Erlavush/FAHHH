# Phase 1: Shared Room Backbone - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `01-CONTEXT.md`; this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 01-shared-room-backbone
**Areas discussed:** Pairing flow, Solo-to-shared migration, Shared ownership policy, Authority and reconnect behavior

---

## Pairing Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Invite code flow | One partner creates a room and shares a short code or link | x |
| One partner identifier lookup | Invite by username or email | |
| Single shared room key | Both partners manually use the same key/secret | |
| Other | Custom variant | |

**User's choice:** Invite code / invite link flow.
**Notes:** User wants a lightweight pairing entry point that fits jam scope.

| Option | Description | Selected |
|--------|-------------|----------|
| Lightweight profile + invite | Persistent player id plus simple profile, then pair via code/link | x |
| Room-only guest identity | Identity created implicitly by joining a room | |
| Real account auth first | Full account auth before pairing | |
| Other | Custom variant | |

**User's choice:** Lightweight persistent profile.
**Notes:** Enough identity to support reconnects without forcing full auth product scope in Phase 1.

| Option | Description | Selected |
|--------|-------------|----------|
| One active partner only | Exactly one active partner and one shared room | x |
| Can leave and re-pair later | Normal unpair/re-pair path in Phase 1 | |
| Loose pairing | Flexible room membership from the start | |
| Other | Custom variant | |

**User's choice:** One active partner only.
**Notes:** Keeps the data model aligned with the one-couple-room fantasy.

| Option | Description | Selected |
|--------|-------------|----------|
| Shared room becomes the main room | After pairing, shared room is the default runtime path | x |
| Mode switch between solo and shared | Explicitly switch between room modes | |
| Shared room is a separate join-only session | Solo room remains the main app | |
| Other | Custom variant | |

**User's choice:** Shared room becomes the main runtime path.
**Notes:** The pair-first room is the actual product path.

---

## Solo-to-Shared Migration

| Option | Description | Selected |
|--------|-------------|----------|
| Creator's current local room | Promote current local room into the shared room | |
| Fresh starter room | Always begin from a clean default room | |
| Explicit choice at pairing time | Creator chooses import vs fresh | |
| Other | Custom variant | x |

**User's choice:** Custom variant.
**Notes:** There is no user-facing solo sandbox in the product. The current room only exists for development/testing. The real game starts with pairing into a shared room. For now the current room can act as a dev seed, but later the user will design the final default room.

| Option | Description | Selected |
|--------|-------------|----------|
| Starter-room snapshot file plus future backend | Seed new rooms from a committed room snapshot file | |
| File-backed local-only store | Use a file-backed local development store as the temporary database | x |
| Other | Custom variant | |

**User's choice:** File-backed local-only store.
**Notes:** The user explicitly asked for a designated file/store that captures room state during development, with a proper starter-room file coming later.

| Option | Description | Selected |
|--------|-------------|----------|
| Disposable dev data | Temp store is development-only and can be thrown away later | x |
| Manual export/import path | Carry dev room data forward intentionally | |
| Automatic migration | Future backend should ingest temp store directly | |
| Other | Custom variant | |

**User's choice:** Disposable dev data.
**Notes:** No migration burden should be added when the real backend arrives.

---

## Shared Ownership Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Couple-owned inventory | Shared inventory belongs to the couple/room | x |
| Partner-attributed ownership | Inventory still records which partner owns each item | |
| Mixed model | Some items shared, some personal | |
| Other | Custom variant | |

**User's choice:** Couple-owned inventory.
**Notes:** Strongest fit for the shared-room fantasy.

| Option | Description | Selected |
|--------|-------------|----------|
| Both partners can commit edits | Either partner can place/store/sell/remove | x |
| Host-led editing only | One partner edits, other mostly observes | |
| Role-based editing | Mixed permission model | |
| Other | Custom variant | |

**User's choice:** Both partners can commit edits.
**Notes:** Editing should be shared from Phase 1.

| Option | Description | Selected |
|--------|-------------|----------|
| Keep `ownedFurniture`, reinterpret it | Preserve ownership-vs-placement split but make it shared | x |
| Rename and reshape it now | Replace with new shared-inventory structure immediately | |
| Keep solo ownership fields too | Preserve per-player attribution even if unused | |
| Other | Custom variant | |

**User's choice:** Keep `ownedFurniture`, reinterpret it as shared room inventory.
**Notes:** Avoids unnecessary schema churn.

| Option | Description | Selected |
|--------|-------------|----------|
| Economy stays simple for now | Shared room state first, richer economy later | x |
| Immediate shared couple wallet | Add shared currency model in Phase 1 | |
| Immediate per-partner wallets | Keep separate player wallets despite shared inventory | |
| Other | Custom variant | |

**User's choice:** Keep economy simple for now.
**Notes:** Progression and richer economy should wait for later phases.

| Option | Description | Selected |
|--------|-------------|----------|
| Seeded and protected | Default room items include protected fixtures | |
| Seeded but fully editable | Default room items can be stored/sold/removed like normal | x |
| Mixed | Structural seeds protected, decor editable | |
| Other | Custom variant | |

**User's choice:** Seeded but fully editable.
**Notes:** The default room is an initial room state, not a protected fixture system.

---

## Authority and Reconnect Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Always load latest from shared store | Shared store is the authoritative room source | x |
| Prefer local cached state | Load local first and sync later | |
| Ask user which version to use | Manual mismatch choice on reconnect | |
| Other | Custom variant | |

**User's choice:** Always load the latest room from the shared store.
**Notes:** Local state should not outrank canonical room data.

| Option | Description | Selected |
|--------|-------------|----------|
| Committed room edits only | Sync place/store/sell/remove/confirm actions only | x |
| Whole room snapshot on any change | Save the whole room on every state change | |
| Live draft state too | Sync in-progress drag/draft behavior | |
| Other | Custom variant | |

**User's choice:** Sync committed room edits only.
**Notes:** Matches the existing room editor's committed-vs-working split and keeps transient drag state local.

| Option | Description | Selected |
|--------|-------------|----------|
| Last save wins | Later accepted commit becomes canonical and both clients reload | x |
| Temporary lock while saving | One player saves first and the other waits | |

**User's choice:** Last save wins.
**Notes:** User asked for a simpler prompt here; final decision is simple race handling for Phase 1 rather than locking.

## the agent's Discretion

- Temp file format and storage layout for the development-only shared backend
- Lightweight profile field shape
- Invite link vs code presentation details
- Resync/reload UI details

## Deferred Ideas

- Final curated starter-room design
- Real shared backend replacing the temporary file store
- Richer economy attribution and deeper conflict handling in later phases
