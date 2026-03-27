---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Online Foundation
status: ready_to_plan
stopped_at: Phase 5 UAT retest partial; follow-up gap plans ready
last_updated: "2026-03-27T07:12:43.3007994Z"
last_activity: 2026-03-27
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 12
  completed_plans: 3
  percent: 25
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-27)

**Core value:** Two partners can build and maintain a room that feels shared, earned, and emotionally meaningful.
**Current focus:** Phase 6 - Ritual Variety and Earn Loop Expansion

## Current Position

Phase: 6 (Ritual Variety and Earn Loop Expansion) - READY
Plan: 0 of 3
Status: Ready to plan
Last activity: 2026-03-27

Progress: [##--------] 25%

## Performance Metrics

**Velocity:**

- Total plans completed: 3
- Average duration: 1 session per completed plan
- Total execution time: -

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 05 | 3/3 | 3 sessions | 1.0 session |
| 06 | 0/3 | - | - |
| 07 | 0/3 | - | - |
| 08 | 0/3 | - | - |

**Recent Trend:**

- Latest completed phase: Phase 5 Online Backend and Couple Ownership
- Trend: Online foundation established; Phase 6 is next

## Milestone Scope

- Milestone: `v1.1 Online Foundation`
- Goal: Move the shared-room MVP onto a real backend/auth foundation while deepening rituals, personalization, and content breadth.
- Planned phases: `5`, `6`, `7`, `8`
- Planning guardrail: every phase must produce `VERIFICATION.md`

## Quick Tasks Completed

| ID | Title | Result |
|----|-------|--------|
| QT-01 | Perfected Cat AI and Animation Overhaul | Unified user-verified GLB coefficients with energetic, long-distance species-specific AI and grounded idle logic. |
| QT-02 | Fix synchronization loop and JSON corruption | Eliminated infinite commit loops, fixed FPS drops during placement, and added atomic singleton persistence. |

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

### Roadmap Evolution

- Phase 03.1 inserted after Phase 03: UI Overhaul and Developer-Player View Split (URGENT)
- Phase 03.1 completed: Player shell and developer workspace split is now the live runtime baseline.
- Phase 04 completed: Shared memories, one canonical shared cat, and breakup stakes now close the v1 emotional loop.
- Milestone v1.0 archived: roadmap and requirements moved to `.planning/milestones/`.
- Milestone v1.1 opened: phases `5`-`8` planned for online foundation, loop depth, personalization depth, and content expansion.
- Phase 05 completed: Google-auth couple ownership, hosted room and presence adapters, mutual link confirmation, and automatic paired-room re-entry are now the active baseline.
- Phase 05 gap closure completed: hosted fallback truth, calmer partner-away status, shared cat live sync, smoother remote locomotion, and occupancy-aware bed slots are patched into the online baseline.
- Phase 05 UAT retest partial: localhost confirms partner-away recovery, but shared-pet adoption visibility, remote motion smoothness, and bed pose separation still need a second gap-closure pass.

### Pending Todos

- [ ] [RT-01] [Implement Rooftop and Ceiling Support](file:///z:/FAHHHH/.planning/todos/room-architecture/implement-rooftop-surface.md)
- [ ] [RT-02] [Create Ceiling Furniture Set](file:///z:/FAHHHH/.planning/todos/furniture-system/ceiling-furniture-set.md)
- [ ] [SC-01] [Implement Global Surface Customization](file:///z:/FAHHHH/.planning/todos/surface-customization/global-surface-customization.md)
- [ ] [RA-01] [Implement Unrestricted Vertical Placement](file:///z:/FAHHHH/.planning/todos/room-architecture/vertical-placement-freedom.md)
- [ ] [RA-02] [Balcony / Garden Exterior Surface](file:///z:/FAHHHH/.planning/todos/room-architecture/balcony-garden-exterior-surface.md)
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

- Hosted mode now depends on valid `VITE_SHARED_BACKEND=firebase` and Firebase env values in deployment; when those are missing, the runtime surfaces hosted-unavailable instead of silently entering the local/dev path.
- Phase 6 must extend the new hosted runtime without regressing the player/developer shell split or the canonical versus ephemeral state boundary.
- v1.0 still carries missing `VERIFICATION.md` artifacts for Phases `2`, `3.1`, and `4`, but Phase 5 now establishes the mandatory verification baseline for v1.1.
- `src/lib/devLocalState.ts` still rejects persisted `wall_front` and `wall_right` placement surfaces on the legacy sandbox path; shared-room runtime bypasses that gap today, but the validator remains stale.

## Session Continuity

Last session: 2026-03-27T13:55:53.4074934+08:00
Stopped at: Phase 5 completed and verified
Resume file: .planning/ROADMAP.md
