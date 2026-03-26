# Codebase Concerns

**Analysis Date:** 2026-03-26

## Tech Debt

**Legacy backend placeholders still in the repo:**
- Issue: Firebase-shaped env vars, rules files, and the `firebase` dependency remain even though the active runtime is local-first
- Files: `.env.example`, `database.rules.json`, `firestore.rules`, `package.json`
- Why: the repo used to carry a different backend direction and still preserves the setup surface
- Impact: new work can easily assume there is an active backend path when there is not
- Fix approach: either wire the future shared-room backend intentionally or remove/archive the stale placeholders

**Large shell/orchestrator components still carry broad state surfaces:**
- Issue: `src/App.tsx` and `src/components/FurniturePreviewStudio.tsx` are still large coordinator files
- Why: major logic was extracted, but the top-level containers still own many responsibilities
- Impact: cross-cutting feature changes are easy to tangle, especially around preview studio and app-shell state
- Fix approach: continue extracting cohesive modules and selectors rather than adding more inline orchestration

## Known Bugs

**Front and right wall placements are not accepted by persisted sandbox validation:**
- Symptoms: the legacy sandbox persistence path can still reject or reset placements on `wall_front` and `wall_right` after reload
- Trigger: any saved room data that includes front/right wall furniture in `src/lib/devLocalState.ts`
- Workaround: Phase 1 shared-room persistence bypasses this validator, but the local sandbox path is still stale
- Root cause: `isValidPlacementSurface()` in `src/lib/devLocalState.ts` only accepts `floor`, `wall_back`, `wall_left`, and `surface`

## Security Considerations

**Client-only ownership and persistence:**
- Risk: Phase 1 shared-room ownership, invite codes, and coins are still fully client-editable through the dev file store
- Current mitigation: acceptable for the temporary development backend
- Recommendations: treat `ownerId`, invite codes, coins, and room state as untrusted once the real shared backend lands

**Mob preset import is local and user-supplied:**
- Risk: imported JSON can still carry unexpected asset paths or malformed-but-accepted content if future promotion paths become automated
- Current mitigation: structure validation in `src/lib/mobLabState.ts`
- Recommendations: keep explicit promotion boundaries and validate any future gameplay import path separately

## Performance Bottlenecks

**Top-level state fan-out through `src/App.tsx`:**
- Problem: one component owns many interactive state branches that feed the scene, toolbar, inventory, preview studio, and persistence
- Measurement: no repo-checked benchmark, but the codebase includes `PerformanceMonitor` and manual chunking to keep this manageable
- Cause: the app is still a single client-root experience
- Improvement path: avoid pushing new high-frequency state into `App.tsx` unless it truly spans the shell

## Fragile Areas

**Room editing stack:**
- Why fragile: behavior spans `src/components/room-view/useRoomFurnitureEditor.ts`, `useRoomViewBuilderGestures.ts`, `placementResolvers.ts`, `src/lib/furnitureCollision.ts`, and `src/lib/surfaceDecor.ts`
- Common failures: placement drift, wall-swap regressions, anchor breakage, or ownership mismatch after edits
- Safe modification: change pure domain helpers first, then room-view orchestration, then the scene layer
- Test coverage: good unit coverage, but no full browser-driven editor test

**Persistence normalization:**
- Why fragile: invalid persisted state silently falls back to default or normalized state
- Common failures: unexpected resets after schema changes, especially around room surfaces and preset revisions
- Safe modification: update validators and add regression tests whenever room or preset shapes change
- Test coverage: partial; `mobLabState` is tested directly, but `devLocalState` has no dedicated regression suite for all wall surfaces

## Scaling Limits

**Current runtime scope:**
- Current capacity: invite-based shared room backed by a dev-only file store plus browser-local shell settings and authoring persistence
- Limit: no production backend/auth, no live partner presence, no server trust boundary
- Symptoms at limit: two people can share canonical room contents in dev, but real multiplayer guarantees and authenticated room ownership do not exist yet
- Scaling path: replace the dev file store with a real authenticated backend while preserving the `SharedRoomStore` boundary

## Dependencies at Risk

**Manual chunk configuration in `vite.config.js`:**
- Risk: moving Mob Lab files or adding new heavy imported-model modules can silently break the intended bundle split
- Impact: larger initial bundle or unexpected runtime chunking regressions
- Migration plan: keep the chunk rules aligned with file moves, or centralize the chunk grouping logic further

**Unused Firebase dependency surface:**
- Risk: dead or misleading dependency footprint
- Impact: confusion during backend work and extra maintenance overhead
- Migration plan: either remove it or make it part of the future shared-room plan explicitly

## Missing Critical Features

**No real backend/auth beyond the dev shared-room store:**
- Problem: Phase 1 proves the canonical room flow locally, but it does not yet solve authenticated room ownership or deployable multi-user networking
- Current workaround: Vite middleware plus `.data/shared-room-dev-db.json`
- Blocks: production pairing, trustworthy coins/ownership, deployable multi-user room sync
- Implementation complexity: high

**No browser-driven end-to-end verification of the room flow:**
- Problem: current tests are strong on pure logic but do not validate the full play/build/persist UI loop
- Current workaround: manual testing in the running app
- Blocks: confident refactors of complex editor interactions and create/join/reload shared-room UX
- Implementation complexity: medium

## Test Coverage Gaps

**`devLocalState` persistence validation:**
- What's not tested: full round-trip acceptance of all four wall surfaces and related persisted room shapes
- Risk: front/right wall bugs slip through despite strong room-view unit coverage
- Priority: High
- Difficulty to test: Low to medium; add targeted localStorage round-trip tests

**Full editor and preview-studio workflows:**
- What's not tested: end-to-end room editing, preview studio usage, and reset/reload flows in a browser
- Risk: integration regressions can pass unit tests unnoticed
- Priority: High
- Difficulty to test: Medium; requires browser automation harness

---

*Concerns audit: 2026-03-26*
*Update as issues are fixed or new ones discovered*
