---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: online-foundation
status: in_progress
stopped_at: Phase 11 executed and verified; Phase 10 10-02 remains next for execution
last_updated: "2026-03-29T14:30:00+08:00"
last_activity: 2026-03-29 -- Synchronized public and internal documentation with the latest v1.1 features (online foundation, drawer navigation, Pacman integration)
progress:
  total_phases: 8
  completed_phases: 5
  total_plans: 24
  completed_plans: 16
  percent: 67
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-28)

**Core value:** Two partners can build and maintain a room that feels shared, earned, and emotionally meaningful.
**Current focus:** Phase 10 - better-cats-variant-import

## Current Position

Phase: 10
Plan: 10-02 ready
Status: Phase 10 Better Cats variant import remains in progress; quick task QT-13 replaced the desk PC Runner app with a Pacman desktop integration while preserving legacy progression compatibility.
Last activity: 2026-03-29 -- Synchronized public and internal documentation with the latest v1.1 features (online foundation, drawer navigation, Pacman integration)

Progress: [#######---] 67%

## Performance Metrics

**Velocity:**

- Total plans completed: 16
- Average duration: 0.6 session per completed plan
- Total execution time: 9 sessions

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 05 | 3/3 | 3 sessions | 1.0 session |
| 06 | 3/3 | 2 sessions | 0.7 session |
| 06.1 | 3/3 | 1 session | 0.3 session |
| 07 | 0/3 | - | - |
| 08 | 0/3 | - | - |
| 09 | 3/3 | 1 session | 0.3 session |
| 10 | 1/3 | 1 session | 1.0 session |
| 11 | 3/3 | 1 session | 0.3 session |

**Recent Trend:**

- Latest completed phase: Phase 11 Player Shell Inventory, Shop, and Pet Care Overhaul
- Trend: Phase 11 completed with split warm drawer surfaces and direct care shortcuts, while Phase 10 still retains the Better Cats runtime and adoption follow-up work.

## Milestone Scope

- Milestone: `v1.1 Online Foundation`
- Goal: Move the shared-room MVP onto a real backend/auth foundation while deepening rituals, personalization, content breadth, showcase readability, curated cat-variant depth, and player-shell readability.
- Roadmap phases: `5`, `6`, `6.1`, `7`, `8`, `9`, `10`, `11`
- Planning guardrail: every phase must produce `VERIFICATION.md`

## Quick Tasks Completed

| ID | Title | Result |
|----|-------|--------|
| QT-01 | Perfected Cat AI and Animation Overhaul | Unified user-verified GLB coefficients with energetic, long-distance species-specific AI and grounded idle logic. |
| QT-02 | Fix synchronization loop and JSON corruption | Eliminated infinite commit loops, fixed FPS drops during placement, and added atomic singleton persistence. |
| QT-03 | UI Refactor and Minecraft Clock | Moved player-facing UI to `src/components/ui/` and implemented a top-center Minecraft-style digital clock. |
| QT-04 | Bottom-Center Player Dock Polish | Reworked the bottom-center player dock into a cohesive warm HUD bar with clearer stats, integrated status messaging, and less awkward primary-action framing. |
| QT-05 | AMOLED Player Theme and CSS Modularization | Rethemed the player-facing shell to high-contrast black and white, modularized the UI CSS, and aligned the HUD, overlays, and inventory drawer with the digital clock. |
| QT-06 | Compact Mobile-Friendly Player Dock Sizing | Reduced the bottom-center dock footprint on desktop, tightened bottom offsets, and compressed the mobile layout so the HUD stays readable without dominating small screens. |
| QT-07 | Collapsible Companion Side Panel | Turned the top-right companion card into a slide-out panel with a side-tab toggle so it can stay off-screen until needed. |
| QT-08 | Showcase Cat Sanctuary Loop | Added a multi-cat local roster, smarter cat behaviors, care rewards, and player-shell summaries for the March 28 demo build. |
| QT-09 | Clock-Themed Bottom HUD Overhaul | Rebuilt the bottom player HUD around the warm pixel-art clock theme using the supplied framed container and action/stat icons. |
| QT-10 | Performance Audit and Runtime Optimization Pass | Reduced clock-driven rerenders, localized room-stage updates, shared pet obstacle computation, and throttled heavy render quality in dense showcase scenes. |
| QT-11 | Deployable Showcase Runtime Mode | Added an explicit VITE_APP_MODE=showcase build path that seeds the local sandbox from the current localhost Chrome snapshot and disables hosted/dev shared-room entry for public demos. |
| QT-12 | Showcase Vercel Production Fix | Switched runtime mode detection to a static Vite env access so production bundles keep VITE_APP_MODE=showcase and no longer fall back to the local dev room flow. |
| QT-13 | Desk PC Pacman Integration | Replaced the desktop Runner app with a Pacman app, added legacy `pc_runner` progression migration, and verified the updated minigame shell with tests plus a production build. |
| 260329-jyj | Document Synchronization (v1.1) | Updated public and internal documentation to accurately reflect the Firebase foundation, Phase 11 UI overhauls, and Pacman integration. |

## Milestone Archive

- Latest shipped roadmap archive: `.planning/milestones/v1.0-ROADMAP.md`
- Latest shipped requirements archive: `.planning/milestones/v1.0-REQUIREMENTS.md`
- Latest shipped audit archive: `.planning/milestones/v1.0-MILESTONE-AUDIT.md`
- Milestone history: `.planning/MILESTONES.md`
- Retrospective: `.planning/RETROSPECTIVE.md`

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Initialization: Treat this repo as brownfield and preserve the solo sandbox as validated foundation.
- Shared-room runtime: gate the live room behind invite-based create/join and canonical room load.
- Shared persistence: commit only confirmed shared-room changes first and keep drag previews local-only.
- Phase 2: use a separate lightweight presence channel plus soft same-item locks, while dev builds auto-enter a shared room and hide temporary pairing/status surfaces.
- [Phase 02]: Presence transport stays outside canonical room commits - Phase 02 now publishes movement, facing, and pose through a separate shared presence store/client path so live avatar updates never mutate shared room revisions.
- [Phase 02]: MinecraftPlayer supports a remote read-only render mode - The shared avatar rig now renders the partner directly in RoomView without giving the remote actor collision or movement authority back into the local room runtime.
- [Phase 02]: Development builds auto-enter one deterministic shared room - Dev bypass now bootstraps `dev-shared-room` directly and keeps the temporary pairing/status chrome hidden during iteration.
- [Phase 02]: Partner waiting and reconnecting UX is presence-freshness-driven - Shipped builds use live presence freshness rather than room commits to show waiting, joined, reconnecting, returned, and together states.
- [Phase 02]: Same-item shared edits use TTL soft locks - Lock ownership now lives beside presence transport instead of inside canonical room documents.
- [Phase 02]: Stale same-item edits recover through canonical reload - The runtime now reloads the authoritative room when local lock assumptions go stale instead of preserving a drifting draft.
- [Phase 03.1]: Player and developer shells are separate runtime views - The shipped room HUD now lives in Player View while Dev Panel, diagnostics, Preview Studio, and Mob Lab stay behind a persisted developer workspace.
- [Phase 03.1]: Secondary room actions moved out of the shipped HUD - Refresh room state, grid snap, and skin import now live in the player room-details sheet instead of the always-visible toolbar.
- [Phase 03.1]: Preview Studio and Mob Lab are embedded developer workbench surfaces - Authoring tools no longer float over the player shell and instead render inside the developer workspace stage.
- [Phase 04]: Shared frame memories and the shared cat live beside RoomState in the canonical shared-room document - Personalization state now persists canonically without changing furniture ownership or placement invariants.
- [Phase 04]: Wall frames and the shared companion are shipped player-shell features, not developer tools - The player view now owns the memory dialog, shared companion adoption copy, and breakup danger zone while authoring surfaces stay developer-only.
- [Phase 04]: Breakup reset uses one pure mutation helper through the normal shared-room commit path - Resetting the relationship state now preserves room identity and membership while rebuilding the starter baseline safely after conflicts.
- [Milestone v1.0]: Milestone archive proceeds despite audit gaps - Feature work on HEAD is stable, so missing phase verification artifacts are carried as explicit process debt instead of reopening shipped scope.
- [Milestone v1.1]: Phase numbering continues from 5 and every phase must emit `VERIFICATION.md` - the next milestone needs online foundation work without repeating the v1.0 audit gap.
- [Phase 05]: Firebase Auth now owns canonical player identity while browser-local session data is convenience cache only.
- [Phase 05]: Hosted room ownership and canonical room data live in Firestore while live presence, edit locks, and pending-link presence live in Realtime Database.
- [Phase 05]: First-time couple linking requires both authenticated partners on the linking screen plus explicit confirmation before the starter room is created.
- [Phase 05]: Paired members re-enter their room automatically on later visits, and room entry remains available even if the partner is offline.
- [Phase 05]: Hosted-unavailable and local-dev fallback are explicit player-shell states, so localhost verification cannot silently masquerade as Firebase auth success.
- [Phase 05]: Stale reconnecting presence now degrades into partner-away after a bounded timeout, with stale dev presence pruned on read.
- [Phase 05]: Shared cat motion, richer remote locomotion, and bed-slot identity travel through the ephemeral presence channel instead of canonical room revisions.
- [Phase 05]: Passive canonical updates still need a better refresh/subscription path for first-time shared-pet adoption visibility on the non-authoritative browser.
- [Phase 05]: Current remote actor playback is improved but still not smooth enough to meet the desired Minecraft-like multiplayer feel.
- [Phase 05]: Bed slot identity exists, but the actual bed offsets and lie pose geometry still overlap visually.
- [Phase 09]: The March 28 showcase focuses on a local-first cat sanctuary loop while preserving the Firebase and couple foundation for future co-care work.
- [Phase 09]: UI polish is parallel-owned, so this phase exposes stable gameplay callbacks and labels without trying to own the broader shell redesign.
- [Phase 10]: Curated Better Cats variants should ride the existing GLB actor and local cat runtime instead of creating per-breed gameplay code paths.
- [Phase 11]: Player-facing inventory, shop, and pet-care surfaces should share the warm clock/HUD language while separating commerce, owned inventory, and care actions inside one drawer contract.
- [Phase 11]: The player shell should route drawer navigation through explicit `Inventory`, `Shop`, and `Pet Care` modes rather than adding extra always-visible HUD buttons.
- [Phase 11]: Shared-room Pet Care remains informational inside the drawer while the sandbox local-cat roster keeps direct care controls.
- [Showcase Deploy]: Public demo builds use an explicit `VITE_APP_MODE=showcase` path that seeds the sandbox from a repo-owned snapshot and hard-disables hosted/dev shared-room bootstrap work.

### Roadmap Evolution

- Phase 03.1 inserted after Phase 03: UI Overhaul and Developer-Player View Split (URGENT)
- Phase 03.1 completed: Player shell and developer workspace split is now the live runtime baseline.
- Phase 04 completed: Shared memories, one canonical shared cat, and breakup stakes now close the v1 emotional loop.
- Milestone v1.0 archived: roadmap and requirements moved to `.planning/milestones/`.
- Milestone v1.1 opened: phases `5`-`8` planned for online foundation, loop depth, personalization depth, and content expansion.
- Phase 05 completed: Google-auth couple ownership, hosted room and presence adapters, mutual link confirmation, and automatic paired-room re-entry are now the active baseline.
- Phase 05 gap closure completed: hosted fallback truth, calmer partner-away status, shared cat live sync, smoother remote locomotion, and occupancy-aware bed slots are patched into the online baseline.
- Phase 05 UAT retest partial: localhost confirms partner-away recovery, but shared-pet adoption visibility, remote motion smoothness, and bed pose separation still need a second gap-closure pass.
- Phase 06 planned: Together Days progression, retro desk-PC app variety, Cozy Rest, and shell surfacing are split into three executable plans.
- Phase 06 completed: Together Days, the retro desk-PC suite, Cozy Rest, and the matching shell updates are now part of the online baseline.
- Phase 06.1 inserted after Phase 06: Codebase modularization and oversized-file decomposition (URGENT).
- Phase 06.1 completed: shared progression, shared room runtime, and App shell orchestration now live behind focused modules with passing regression coverage.
- Phase 09 completed: Showcase Cat Sanctuary now ships as a local-first demo slice with multi-cat persistence, readable behaviors, care rewards, and shell surfacing.
- Phase 10 execution started: 10-01 now ships a repo-owned Better Cats variant manifest, imported coat assets, and a built-in preset library for Mob Lab and later runtime wiring.
- Phase 11 completed: player shell inventory, shop, and pet care now live in warm HUD-aligned drawer surfaces with a shared-room-safe care fallback and direct shell shortcuts.

### Pending Todos

- [x] [RT-01] [Implement Rooftop and Ceiling Support](file:///z:/FAHHHH/.planning/todos/room-architecture/implement-rooftop-surface.md)
- [x] [RT-02] [Create Ceiling Furniture Set](file:///z:/FAHHHH/.planning/todos/furniture-system/ceiling-furniture-set.md)
- [ ] [SC-01] [Implement Global Surface Customization](file:///z:/FAHHHH/.planning/todos/surface-customization/global-surface-customization.md)
- [ ] [RA-01] [Implement Unrestricted Vertical Placement](file:///z:/FAHHHH/.planning/todos/room-architecture/vertical-placement-freedom.md)
- [ ] [RA-02] [Balcony / Garden Exterior Surface](file:///z:/FAHHHH/.planning/todos/room-architecture/balcony-garden-exterior-surface.md)
- [x] [RA-03] [Maintain Shadows for Occluded Walls and Roofs](file:///z:/FAHHHH/.planning/todos/room-architecture/maintain-shadows-for-occluded-surfaces.md)
- [ ] [NV-01] [Implement Player and Pet Pathfinding](file:///z:/FAHHHH/.planning/todos/navigation/player-and-pet-pathfinding.md)
- [ ] [PS-01] [Import more cat variants](file:///z:/FAHHHH/.planning/todos/pet-system/import-better-cat-variants.md)
- [ ] [PS-02] [Enhanced Cat Animations (Sit, Lick, Sleep)](file:///z:/FAHHHH/.planning/todos/pet-system/cat-animations-depth.md)
- [ ] [LS-01] [Interactive Radio / Media Player](file:///z:/FAHHHH/.planning/todos/lifestyle-system/interactive-radio-media-player.md)
- [ ] [LS-02] [Shared TV / Cinema Sync](file:///z:/FAHHHH/.planning/todos/lifestyle-system/shared-tv-cinema-sync.md)
- [ ] [LS-03] [Shared Wardrobe / Skin Editor](file:///z:/FAHHHH/.planning/todos/lifestyle-system/shared-wardrobe-skin-editor.md)
- [ ] [FS-01] [Functional Kitchen Interaction](file:///z:/FAHHHH/.planning/todos/furniture-system/functional-kitchen-interaction.md)
- [ ] [AV-01] [Co-op Poses (High-five, Hug)](file:///z:/FAHHHH/.planning/todos/avatar-system/co-op-poses-interactions.md)
- [ ] [AP-01] [Bulk mod asset import](file:///z:/FAHHHH/.planning/todos/asset-pipeline/bulk-mod-asset-import.md)

### Blockers/Concerns

- Phase 06.1 closed the urgent oversized-file debt by modularizing `src/App.tsx`, `src/app/hooks/useSharedRoomRuntime.ts`, `src/lib/sharedProgression.ts`, and the shared-room runtime regression coverage under the CODE-01 guardrail.
- Hosted mode now depends on valid `VITE_SHARED_BACKEND=firebase` and Firebase env values in deployment; when those are missing, the runtime surfaces hosted-unavailable instead of silently entering the local/dev path.
- Phase 7 now depends on Phase 06.1 completing without regressing the player/developer shell split or the canonical versus ephemeral state boundary.
- Phase 09 intentionally lands on the local showcase path first; hosted shared-room remains future-compatible but does not need full multi-cat expansion before the demo.
- Phase 10 depends on adding a Better Cats texture/material seam to `GlbMobPreviewActor.tsx`; today the actor still does not honor preset-driven coat textures.
- Phase 11 shipped without adding new bottom-HUD clutter; future shell expansion should continue routing through internal drawer navigation unless later testing proves otherwise.
- v1.0 still carries missing `VERIFICATION.md` artifacts for Phases `2`, `3.1`, and `4`, but Phase 5 now establishes the mandatory verification baseline for v1.1.
- `src/lib/devLocalState.ts` still rejects persisted `wall_front` and `wall_right` placement surfaces on the legacy sandbox path; shared-room runtime bypasses that gap today, but the validator remains stale.

## Session Continuity

Last session: 2026-03-28T05:08:48.5964329+08:00
Stopped at: Phase 11 executed and verified; execute 10-02 next
Resume file: .planning/phases/10-better-cats-variant-import/10-02-PLAN.md




