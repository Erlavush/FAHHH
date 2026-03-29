# Project Milestones: Risk It All: Cozy Couple Room

## v1.0 Shared Room MVP (Shipped: 2026-03-27)

**Delivered:** A jam-ready shared couple-room MVP on the current local/dev stack with canonical shared rooms, live partner presence, progression, a player-first shell, shared memories, one shared cat, and breakup-reset stakes.

**Phases completed:** 1-4 plus inserted `03.1` (15 plans total)

**Key accomplishments:**
- Turned the solo sandbox into an invite-based canonical shared room without breaking existing room-builder invariants.
- Added live partner presence, join/reconnect status, and predictable convergence for near-simultaneous edits.
- Shipped personal wallets and XP, shared streaks, and the first daily ritual directly inside the room runtime.
- Split the shipped player shell from the developer workspace while keeping Preview Studio and Mob Lab explicit authoring tools.
- Added shared wall-frame memories, one canonical shared cat, and an explicit breakup-reset flow.

**Stats:**
- 5 phases, 15 plans, 45 task-sized execution steps
- 2 calendar days from start to ship (2026-03-26 -> 2026-03-27)

**Known gaps accepted at ship:**
- The milestone audit remained `gaps_found` because Phases `2`, `3.1`, and `4` lacked `VERIFICATION.md`.
- Production backend/auth is still deferred; the shipped MVP runs on the dev file-backed shared-room store.

---

## v1.1 Online Foundation (Shipped: 2026-03-29)

**Delivered:** A multi-player online foundation with real authentication, hosted persistence, deep personalization systems, and a polished player shell.

**Phases completed:** 5, 6, 6.1, 7, 8, 9, 10, 11 (24 plans total)

**Key accomplishments:**
- Moved from dev-only files to a real Firebase foundation (Google Auth, Firestore sync, Realtime Database presence).
- Modularized the codebase, reducing critical monoliths under the 1000-line guardrail.
- Expanded personalization from single items to multi-entry rosters (multi-cat pets, memory albums).
- Established a coin-based economy driven by rituals (desk-PC apps) and pet care.
- Shipped a centralized theme registry and per-room content unlock system.
- Completely overhauled the player drawer into distinct, warm, clock-themed sections for Inventory, Shop, and Pet Care.
- Provided a dedicated showcase build path for public static-deployment demos.

**Stats:**
- 8 phases, 24 plans, 72+ task-sized execution steps
- 100% verification rate (all 8 phases have `VERIFICATION.md`)
- 3 calendar days from start to ship (2026-03-27 -> 2026-03-29)

**Known gaps accepted at ship:**
- None. v1.1 satisfied all intended requirements and audit guardrails.

**What's next:** Milestone v2.0 - Surface & Content Depth (Global material customization, Ceiling/Rooftop placement, and bulk asset imports).
