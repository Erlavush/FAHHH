# Phase 2: Live Presence and Co-op Consistency - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `02-CONTEXT.md`; this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 02-live-presence-and-co-op-consistency
**Areas discussed:** Presence transport, Remote avatar fidelity, Join/leave/reconnect UX, Concurrent edit behavior, Development bypass

---

## Presence Transport

| Option | Description | Selected |
|--------|-------------|----------|
| Position + facing only | Lightweight movement/facing sync only | |
| Position + facing + activity state | Sync movement, look direction, and interaction/activity state | x |
| Full rich presence | Position, facing, activity, emotes, and finer-grained social state | |

**User's choice:** Position + facing + activity state.
**Notes:** Richer social presence belongs to later phases.

| Option | Description | Selected |
|--------|-------------|----------|
| Interpolated live movement | Smooth remote motion between updates | x |
| Discrete position hops | Snap between updates | |
| Mostly event-based presence | Prioritize enter/leave/activity over live movement | |

**User's choice:** Interpolated live movement.
**Notes:** Remote partner should feel alive rather than jittery.

| Option | Description | Selected |
|--------|-------------|----------|
| Separate lightweight presence channel | Presence transport separate from canonical room commits | x |
| Reuse room document updates | Put presence into the canonical room payload | |
| Occasional presence snapshots | Lower-frequency, rougher liveness | |

**User's choice:** Separate lightweight presence channel.
**Notes:** Avoid spamming full room payloads.

| Option | Description | Selected |
|--------|-------------|----------|
| Hold briefly, then mark reconnecting | Short grace period before showing reconnect state | x |
| Disappear immediately | Remove partner instantly when updates stop | |
| Freeze indefinitely | Leave partner frozen until data returns | |

**User's choice:** Hold briefly, then mark reconnecting.
**Notes:** Keeps brief packet loss from feeling too abrupt without pretending the partner is still live forever.

---

## Remote Avatar Fidelity

| Option | Description | Selected |
|--------|-------------|----------|
| Full Minecraft-style avatar | Reuse the current player/avatar presentation | x |
| Simplified avatar stand-in | Lighter representation | |
| Minimal marker only | Marker instead of full character | |

**User's choice:** Full Minecraft-style avatar.
**Notes:** The partner should feel like a real person in the room.

| Option | Description | Selected |
|--------|-------------|----------|
| Movement + facing + interaction poses | Reflect walk/idle and pose changes such as sitting/PC use | x |
| Movement only | Full avatar, but no synced activity pose | |
| Movement + idle only | Minimal behavior state beyond movement | |

**User's choice:** Movement + facing + interaction poses.
**Notes:** Presence should include sitting, lying, and desk-PC use.

| Option | Description | Selected |
|--------|-------------|----------|
| Use each player's skin/profile look if available | Personalize the remote avatar from player identity | x |
| One default shared avatar look | Shared default visual | |
| Host avatar only | One full look, one simplified | |

**User's choice:** Use each player's current skin/profile when available.
**Notes:** Keep a safe fallback when no custom appearance exists.

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle label | Always show a small name label | x |
| No label | Normal play has no visible label | |
| Hover/nearby label only | Reveal label contextually | |

**User's choice:** Subtle visible label.
**Notes:** Readability matters more than polishing this away for now.

---

## Join / Leave / Reconnect UX

| Option | Description | Selected |
|--------|-------------|----------|
| Enter room normally, show partner status | Room stays usable even if partner is absent | x |
| Block until both are present | Don't enter until both players are online | |
| No explicit partner status | Minimal UX, no clear partner state | |

**User's choice:** Enter room normally and show partner status.
**Notes:** Avoid blocking normal play.

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle status strip updates | Lightweight join/leave/reconnect signals | x |
| Toast notifications | Short transient notifications | |
| Big modal/banner interruptions | Heavy attention-grabbing UI | |

**User's choice:** Subtle status-strip updates.
**Notes:** Presence feedback should stay quiet.

| Option | Description | Selected |
|--------|-------------|----------|
| Keep room usable, show offline/reconnecting | Continue playing while partner state updates | x |
| Disable editing until both are back | Lock down editing on disconnect | |
| Kick both back to pairing | Eject users on disconnect | |

**User's choice:** Keep the room usable and show offline/reconnecting.
**Notes:** Partner disconnect should not break solo-in-room play.

| Option | Description | Selected |
|--------|-------------|----------|
| Remote avatar returns + subtle reconnected state | Quiet recovery when partner comes back | x |
| Force noticeable reload/rejoin moment | Stronger reconnect event | |
| No explicit reconnected feedback | Minimal visibility | |

**User's choice:** Remote avatar returns and the status layer quietly confirms reconnect.
**Notes:** Reconnect should feel smooth rather than disruptive.

---

## Concurrent Edit Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Canonical final room state matters most | Guarantee convergence on one committed result | x |
| Try to preserve both edits whenever possible | Add more merge logic when edits don't conflict | |
| One editor dominates | Effectively single-editor behavior | |

**User's choice:** Canonical final room state matters most.
**Notes:** Convergence matters more than preserving every local draft.

| Option | Description | Selected |
|--------|-------------|----------|
| Soft item lock while editing | Same item is temporarily busy for the other partner | x |
| No lock, canonical result decides | Let same-item edits race | |
| Whole-room lock while editing | One partner edits, other waits | |

**User's choice:** Soft item lock while editing.
**Notes:** Same-item conflicts should be prevented without locking the whole room.

| Option | Description | Selected |
|--------|-------------|----------|
| Allow concurrent editing of different items | Different items can be edited in parallel | x |
| Serialize commits one at a time | Only one commit flow at a time | |
| One active editor at all times | Single-editor mode | |

**User's choice:** Allow concurrent editing of different items.
**Notes:** Collaboration should still feel real when edits do not directly conflict.

| Option | Description | Selected |
|--------|-------------|----------|
| Clear but lightweight busy state | Show the item is currently being edited by the partner | x |
| Silent block | Prevent interaction without explanation | |
| Large warning/modal | Heavy interruption for lock state | |

**User's choice:** Clear but lightweight busy state.
**Notes:** Busy items must be understandable without noisy UX.

---

## Development Bypass

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-enter dev shared room | Skip pairing/opening UI entirely during development | x |
| Hide-only | Keep flow logic but only hide the screens visually | |

**User's choice:** Auto-enter dev shared room.
**Notes:** The user explicitly does not want the temporary login/pairing/sharing/opening flow or the shared-room strip above the game to appear during active development because they are annoying right now.

## the agent's Discretion

- Presence payload shape, cadence, and timeout thresholds
- Exact subtle UI treatment for labels, reconnecting state, and busy-item indicators
- Exact dev-only toggle/config mechanism for auto-enter and hidden surfaces

## Deferred Ideas

- Rich emotes and broader social presence states
- Production backend/auth for deployable shared-room networking
- Progression, rituals, memories, pets expansion, and breakup/reset behavior
