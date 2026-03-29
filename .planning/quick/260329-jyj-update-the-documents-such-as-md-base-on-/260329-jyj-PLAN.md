# Quick Task 260329-jyj: Update documentation for latest game features - Plan

**Goal:** Synchronize public and internal documentation with the latest game features, including the Firebase shared-room architecture, Phase 11 UI overhaul, and Pacman integration.

<must_haves>
- [x] `docs/GAME_OVERVIEW.md` reflects current "Implemented" status (Firebase, memories, breakup, etc.)
- [x] `docs/ARCHITECTURE.md` corrected to show Firebase/Shared Room as the active baseline
- [x] `.planning/codebase/ARCHITECTURE.md` updated with Phase 11 UI drawer patterns and Pacman integration
- [x] `README.md` updated with latest feature summary
- [x] `STATE.md` updated to reflect documentation is now synchronized
</must_haves>

## Tasks

### 1. Update Public Documentation
- **Files:** `docs/GAME_OVERVIEW.md`, `docs/ARCHITECTURE.md`, `README.md`
- **Action:**
    - `GAME_OVERVIEW.md`: Move shared-room sync, partner presence, memories, and breakup reset from "Still missing" to "Implemented now." Update "Current Product Status" to reflect the move to a hosted online foundation.
    - `ARCHITECTURE.md`: Remove the "repo no longer carries active Firebase" disclaimer. Add high-level overview of `useSharedRoomRuntime` and the Firebase/Firestore/RTDB split.
    - `README.md`: Update the feature list to include the latest v1.1 additions (Inventory drawer, Pacman, Shared Cats).
- **Verify:** Documents correctly describe the current state mentioned in `STATE.md`.
- **Done:** Public docs synchronized.

### 2. Update Internal Planning Documentation
- **Files:** `.planning/codebase/ARCHITECTURE.md`, `.planning/STATE.md`, `.planning/ROADMAP.md`
- **Action:**
    - `.planning/codebase/ARCHITECTURE.md`: Update the "App Shell" and "Data Flow" sections to include the Phase 11 drawer navigation and the Pacman minigame integration (replacing PC Runner). Mention the `VITE_APP_MODE=showcase` build path.
    - `.planning/STATE.md`: Update "Current Position" or "Decisions" to note that the documentation has been synchronized with the latest v1.1 features.
    - `.planning/ROADMAP.md`: Ensure the milestone status and phase descriptions align with the updated documentation.
- **Verify:** Internal docs accurately reflect the technical baseline as of March 29, 2026.
- **Done:** Internal planning docs synchronized.
