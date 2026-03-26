# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 - Shared Room MVP

**Shipped:** 2026-03-27  
**Phases:** 5 | **Plans:** 15 | **Sessions:** 5 tracked phase work blocks

### What Was Built
- Canonical shared-room pairing, storage, and confirmed mutation flow on top of the existing room builder.
- Live partner presence, reconnect/status UX, same-item convergence, and in-room progression plus ritual systems.
- A room-first player shell separated from a developer workbench for Preview Studio, Mob Lab, diagnostics, and debug tools.
- Shared memories, one canonical shared cat, and an explicit breakup-reset flow that completes the MVP emotional loop.

### What Worked
- The refreshed brownfield map in `.planning/codebase/*` kept implementation decisions grounded in actual ownership and persistence boundaries.
- Atomic phase and plan commits plus `npm test` and `npm run build` gates kept the shared-room runtime stable while the data model grew.
- Explicit separation between player runtime surfaces and authoring tools prevented Preview Studio and Mob Lab from leaking further into shipped UI.

### What Was Inefficient
- Phase verification artifacts were not produced consistently, which turned completed work into audit debt at milestone closeout.
- Tooling around decimal phase parsing still treated Phase `3.1` as incomplete metadata even though the roadmap entry was correct.

### Patterns Established
- Canonical room commits should carry only confirmed shared state; presence, locks, camera/player transforms, and authoring persistence stay outside room revisions.
- Player-shell work and developer-workbench work should be planned as separate surfaces even when they share top-level runtime ownership.
- Destructive shared-room flows should use pure mutation helpers plus explicit confirmation UI.

### Key Lessons
1. Emit `VERIFICATION.md` as part of every phase closeout, otherwise milestone audits will orphan shipped requirements.
2. Insert shell cleanup phases early once debug tooling starts polluting the player experience; late cleanup costs more than the insertion overhead.

### Cost Observations
- Model mix: not instrumented in repo artifacts
- Sessions: 5 tracked phase work blocks across 2026-03-26 to 2026-03-27
- Notable: the brownfield-first approach let the team ship quickly, but documentation discipline became the limiting factor at milestone closeout.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 5 tracked blocks | 5 | Introduced milestone-scoped shared-room delivery on top of a brownfield solo sandbox |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 145 passing tests at archive time | Not measured | Not tracked |

### Top Lessons (Verified Across Milestones)

1. Brownfield mapping and explicit architectural boundaries keep fast milestone execution from turning into rewrites.
2. Milestone closure quality depends as much on documentation artifacts as on the runtime itself.
