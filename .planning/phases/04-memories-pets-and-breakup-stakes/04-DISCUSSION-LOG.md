# Phase 4: Memories, Pets, and Breakup Stakes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 04-memories-pets-and-breakup-stakes
**Areas discussed:** Shared memory object, Curated shared-room pet, Breakup warning and reset scope

---

## Shared memory object

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse `wall_frame` as the memory object | Keep memory placement inside the existing wall-decor path and let the frame hold one image plus an optional caption. | X |
| Add a separate memory-only furniture type | Create a new object flow just for memories instead of using the existing frame path. | |
| Build a small memory gallery system | Let the room browse multiple photos instead of keeping the first memory slice to one framed artifact. | |

**User's choice:** Reuse `wall_frame` as the memory object
**Notes:** Recommended default auto-selected while continuing in non-interactive mode. This keeps the first memory feature room-first, preserves current placement rules, and avoids opening a gallery/content-management phase inside the jam MVP.

---

## Curated shared-room pet

| Option | Description | Selected |
|--------|-------------|----------|
| Promote one curated cat path | Use the existing `better_cat_glb` preset and current lightweight room-safe cat behavior as the first shared-room pet slice. | X |
| Promote the raccoon path first | Use the simpler raccoon preset as the initial live shared-room pet. | |
| Allow arbitrary Mob Lab preset promotion | Let couples bring any tuned Mob Lab preset directly into the shared-room runtime. | |

**User's choice:** Promote one curated cat path
**Notes:** Recommended default auto-selected while continuing in non-interactive mode. The cat path is already the most polished live-room pet slice, and it preserves the rule that Mob Lab remains the authoring source rather than becoming a direct gameplay import surface.

---

## Breakup warning and reset scope

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit danger-zone reset of shared relationship state | Explain the stakes before room commitment, repeat them in a danger-zone breakup flow, and reset the authoritative shared room back to a fresh baseline while preserving local authoring data. | X |
| Soft disconnect only | Let the relationship end without wiping the shared-room state. | |
| Full account wipe | Remove local profile, authoring, and other non-shared data along with the shared room. | |

**User's choice:** Explicit danger-zone reset of shared relationship state
**Notes:** Recommended default auto-selected while continuing in non-interactive mode. This matches the game's stated fantasy, satisfies the explicit-confirmation requirement, and keeps the destructive scope constrained to shared-room canonical data instead of collateral local tooling data.

## the agent's Discretion

- Exact image/caption storage mechanism for memory frames
- Exact copy and UI treatment for warnings, confirmations, and reset aftermath
- Exact pet spawn/home rules and any optional pet naming support
- Exact fresh-baseline starter contents after breakup reset

## Deferred Ideas

- Multi-photo galleries or scrapbook systems
- Arbitrary user-imported Mob Lab pets in the shared room
- Advanced pet needs, moods, or multi-pet simulation
- Post-breakup archives, exports, or relationship-history systems
