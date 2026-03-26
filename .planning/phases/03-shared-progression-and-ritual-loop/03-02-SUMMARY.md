---
phase: 03-shared-progression-and-ritual-loop
plan: 02
subsystem: progression-loop
tags: [progression, ritual, desk-pc, economy]
requires:
  - phase: 03-01
    provides: canonical progression schema and shell surfaces
provides:
  - personal wallet spend and refund helpers
  - desk-PC reward to progression wiring
  - first daily ritual and streak bonus flow
affects: [phase-03, desk-pc, inventory, shared-economy]
tech-stack:
  added: []
  patterns:
    - pure progression mutations
    - desk-PC ritual completion as authoritative shared-room write
requirements-completed:
  - PROG-01
  - PROG-02
  - RITL-01
completed: 2026-03-27
---

# Phase 03 Plan 02: Economy and Ritual Summary

## Accomplishments

- Routed shared-room furniture buy and sell flows through the active partner’s personal wallet instead of the old room-wide scalar.
- Wrapped desk-PC completion in pure progression helpers so every run grants personal coins/XP, records a same-day ritual contribution once, and awards the shared daily bonus only when the second partner completes the room day.
- Extended the desk-PC result surface with ritual, bonus, and streak rows so the room-facing UI explains whether a run only saved a check-in or completed the daily ritual.

## Implementation Commits

- `cecb297` - Phase 3 progression, ritual, runtime, and UI implementation
- `4c1f1f8` - Shared-room follow-up that keeps the pet shop out of the shared progression path until Phase 4

## Notes

- Desk-PC XP now tracks `rewardCoins + 4` for the acting partner.
- The first completed ritual of a room day grants `+12` coins and `+16` XP to both partners and increments the shared streak once.

---
*Completed: 2026-03-27*
