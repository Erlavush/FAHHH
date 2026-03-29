# Quick Task 260329-jyj: Update documentation for latest game features - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Task Boundary

Update the documentation (Markdown files) to reflect the latest state of the game, specifically covering features implemented in Milestone v1.1 that are currently undocumented or inaccurately described.

</domain>

<decisions>
## Implementation Decisions

### Target Documents
- Update both the public `docs/` directory and the internal `.planning/codebase/` directory to ensure consistency across the project.

### Feature Coverage
- Perform a "Full Sweep" update. This includes major architectural gaps like the **Firebase/Shared Room** integration (Phase 5/06.1) which current docs erroneously describe as "not active," as well as recent UI/Gameplay updates such as the **Phase 11 Inventory/Shop/Pet Care drawer** and the **Pacman minigame integration** (QT-13).

### Documentation Depth
- Maintain a **High-level** functional overview for these updates. Focus on what the systems do and how they are structured at a high level, rather than deep-diving into individual hooks or implementation details.

### Claude's Discretion
- Identify and update other minor feature discrepancies discovered during the documentation sweep (e.g., Showcase Mode, Better Cats variants).

</decisions>

<specifics>
## Specific Ideas

- Correct the statement in `docs/ARCHITECTURE.md` regarding Firebase/Shared Room status.
- Add sections for the new Player Shell Inventory, Shop, and Pet Care drawer.
- Update PC minigame documentation to reflect the Pacman integration.
- Ensure `STATE.md` references and `ROADMAP.md` status align with the new documentation.

</specifics>

<canonical_refs>
## Canonical References

- `.planning/STATE.md`: Source of truth for completed phases and tasks.
- `.planning/ROADMAP.md`: Source of truth for phase goals and current status.
- `docs/ARCHITECTURE.md`: Primary technical overview (needs correction).
- `.planning/codebase/ARCHITECTURE.md`: Refreshed technical overview.

</canonical_refs>
