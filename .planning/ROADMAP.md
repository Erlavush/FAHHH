# Roadmap: Risk It All: Cozy Couple Room

## Milestones

- [x] **v1.0 Shared Room MVP** - Phases `1`, `2`, `3`, `3.1`, and `4` shipped on 2026-03-27. Archive: `.planning/milestones/v1.0-ROADMAP.md`
- [x] **v1.1 Online Foundation** - Phases `5`, `6`, `6.1`, `7`, `8`, `9`, `10`, and `11` shipped on 2026-03-29. Archive: `.planning/milestones/v1.1-ROADMAP.md`
- [ ] **v2.0 Surface & Content Depth** - Phases `12`, `13`, `14` on roadmap.

## Overview

Milestone v2.0 builds on the stable online foundation to give players significantly more control over their environment. This milestone focuses on "breaking the boundaries" of the starter room by adding global surface customization (wallpapers, flooring types), expanding placement to the ceiling and rooftops, and adding a large content wave through automated or bulk asset imports.

**Execution guardrail:** Every v2.0 phase must ship with `VERIFICATION.md` and automated tests for any new geometry or placement logic.

## Phases

### Phase 12: In-App Developer Engine Foundation
**Goal**: Build a visual dashboard in Developer Mode that utilizes Vite dev-server APIs to visually author, edit, and save content directly into the codebase without touching JSON/TS files manually.
**Depends on**: v1.1 Online Foundation
**Requirements**: [ENG-01, ENG-02]
**UI hint**: yes
**Success Criteria**:
  1. A custom local Vite plugin is created to safely write JSON data to local TS registries during development.
  2. The Developer Workspace contains a "Content Manager" tab to visually edit (and save) furniture data.
  3. Real-time updates push visual changes to UI state and save them back to the hard drive on demand.
**Plans**: 3 plans

Plans:
- [x] 12-01: Create the inAppEditorPlugin to expose local file-write endpoints during dev mode
- [x] 12-02: Build the Content Manager UI in the Developer Workspace for visual furniture editing
- [x] 12-03: Wire the UI to the local API to generate and overwrite `furnitureRegistry.ts` safely

### Phase 13: UI State Persistence & Workspace Layout Defaults
**Goal**: Persist customizable UI layouts (such as the bottom player dock and drag-and-drop windows) so user modifications survive browser restarts. Additionally, establish a system for hard-coding these preferred default layouts into the application source for new players.
**Depends on**: Phase 12
**Requirements**: [UI-10]
**UI hint**: yes
**Success Criteria**:
  1. The layout position of key UI elements (like the bottom dock) can be saved to persistent storage.
  2. Developers can easily capture the current placement values and define them as the standard application defaults.
  3. New users opening the game see the perfect layout exactly as defined by the developer.
**Plans**: 3 plans

Plans:
- [ ] 13-01: Implement persistent layout hooks for draggable/moveable HUD elements
- [ ] 13-02: Enhance the Developer Engine API to extract and save current layout coordinates to codebase defaults
- [ ] 13-03: Refactor the player dock and dialog views to consume the new unified layout system

### Phase 14: Content Volume Expansion
**Goal**: Increase the variety of furniture and decor through bulk asset curation and import.
**Depends on**: Phase 13
**Requirements**: [CONT-02, AP-01]
**Success Criteria**:
  1. At least 20+ new furniture items are added to the registry.
  2. Asset import pipeline is streamlined to allow faster additions in the future.
  3. The catalog remains performant and searchable with the increased volume.
**Plans**: 3 plans

Plans:
- [ ] 14-01: Streamline asset pipeline for bulk furniture imports
- [ ] 14-02: Import and curate a "Modern Minimalist" and "Vintage Cottage" furniture wave
- [ ] 14-03: Polish catalog UI for high-volume content (search, filtering improvements)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 12. In-App Developer Engine Foundation | v2.0 | 3/3 | Complete | 2026-03-29 |
| 13. UI State Persistence & Layout Defaults | v2.0 | 0/3 | Not started | - |
| 14. Content Volume Expansion | v2.0 | 0/3 | Not started | - |
