# Phase 3: Shared Progression and Ritual Loop - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 03-shared-progression-and-ritual-loop
**Areas discussed:** Wallet and progression ownership, Daily ritual shape, Ritual timing and streak recovery, Progression UI surfaces, Persistence boundary

---

## Wallet and progression ownership

| Option | Description | Selected |
|--------|-------------|----------|
| Personal coins + shared room inventory | Each partner earns and spends their own coins and levels up personally; purchased room items still become couple-owned. | ✓ |
| Shared room wallet + separate levels | Keep one shared coin pool for spending and track only level personally. | |
| Personal ritual bonuses only | Keep room spending on shared coins and use personal progression only for XP or ritual bonuses. | |

**User's choice:** Personal coins + shared room inventory
**Notes:** Recommended default auto-selected while advancing from `$gsd-next` in non-interactive mode. This satisfies `PROG-01` directly without reopening the shared ownership split from Phase 1.

---

## Daily ritual shape

| Option | Description | Selected |
|--------|-------------|----------|
| Desk-PC daily check-in | Reuse the existing desk PC loop so both partners contribute one short daily completion. | ✓ |
| New standalone room ritual object | Add a new in-room interaction surface just for the ritual. | |
| Login-only streak touch | Advance the ritual from simple room entry with no activity completion. | |

**User's choice:** Desk-PC daily check-in
**Notes:** Recommended default auto-selected. It proves one daily couple loop with the least new surface area and matches the Phase 3 plan to connect desk-PC rewards.

---

## Ritual timing and streak recovery

| Option | Description | Selected |
|--------|-------------|----------|
| Canonical room day + async contributions | One couple-owned day boundary; partners can finish their two contributions at different times; a missed day resets the streak. | ✓ |
| Same-session simultaneous ritual | Both partners must be online together and finish the ritual in the same session. | |
| Per-player local midnights | Each client tracks the ritual on its own local calendar day. | |

**User's choice:** Canonical room day + async contributions
**Notes:** Recommended default auto-selected. This is the least brittle reconnect-safe rule and avoids timezone drift between partners.

---

## Progression UI surfaces

| Option | Description | Selected |
|--------|-------------|----------|
| Toolbar + status strip + PC results | Keep feedback in the shell players already use instead of a separate dashboard. | ✓ |
| Separate progression panel | Add a dedicated overview panel for level, streak, and ritual data. | |
| Debug/dev-only surface first | Land the data model first and keep progression UI mostly hidden. | |

**User's choice:** Toolbar + status strip + PC results
**Notes:** Recommended default auto-selected. This follows the room-first shell pattern and the Phase 3 pitfall guidance to keep ritual feedback visible.

---

## Persistence boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Extend the authoritative shared-room document | Personal and couple progression load and reload with the canonical room and commit through the shared-room store boundary. | ✓ |
| Separate local progression save | Keep progression in browser-local persistence and only sync room decor. | |
| Presence-derived ritual state | Treat ritual completion as ephemeral partner-status data. | |

**User's choice:** Extend the authoritative shared-room document
**Notes:** Recommended default auto-selected. This preserves the established authority model and avoids desync between progression and room state.

## the agent's Discretion

- XP curve and level thresholds
- Ritual bonus values
- Exact migration math from `sharedCoins`
- Exact chip and progress-bar presentation

## Deferred Ideas

- Multiple ritual variants after the first daily loop is stable
- Additional minigames beyond the desk PC
- Broader quest-log or shared-room-growth systems
