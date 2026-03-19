# Full Development Roadmap

## Status Legend
- `Done`: already implemented or completed by this documentation pass.
- `In Progress`: actively represented by current sandbox systems but still needs polish or unification.
- `Future`: planned, not yet fully implemented.

## Current Baseline
### Status: Done
- Local solo sandbox is the active product.
- Registry-driven furniture system exists.
- Starter room exists.
- Floor, wall, and surface decor placement exist.
- Local persistence exists.
- Current interactions exist:
  - sit
  - sleep
  - use PC

Acceptance:
- the user can open the app, decorate the room, interact with furniture, refresh, and keep progress locally.

## Phase 0: Documentation Baseline
### Status: Done
- Create:
  - `GAME_OVERVIEW.md`
  - `CURRENT_SYSTEMS.md`
  - `ARCHITECTURE.md`
  - `DIAGRAMS.md`
  - `AI_HANDOFF.md`
  - `ROADMAP.md`
- Mark systems as `implemented now`, `legacy / future skeleton`, or `planned next`.
- Provide diagrams and glossary for teammate + AI handoff.

Acceptance:
- a new teammate can identify current runtime truth and future modules without hidden context.

## Phase 1: Core System Stabilization
### Status: In Progress
- Finish current interaction polish:
  - sit
  - sleep
  - use_pc
- Eliminate remaining drag, hover, selection, and camera-input edge cases.
- Normalize imported asset pivots, offsets, and block-fit footprints.
- Make editing behavior consistent across floor, wall, and surface decor.
- Add undo/redo for builder actions.

Acceptance:
- all current furniture can be edited reliably without interaction ambiguity.
- imported assets match block scale and do not require per-object hacks for routine placement.

## Phase 2: Content + Interaction Completion
### Status: Future
- Complete the starter room into a polished cozy default room.
- Add more wall decor, surface decor, floor variants, and appliances.
- Finalize V1 interaction set:
  - sit
  - sleep
  - use_pc
  - fridge open/inspect
  - lamp toggle
- Add visual states and ambient object feedback.

Acceptance:
- the room feels like a full lived-in space, not only a placement sandbox.

## Phase 3: UX / Mobile / Builder Polish
### Status: Future
- Make building usable on touch devices.
- Refine catalog, overlays, selection bubble, and bottom dock for smaller screens.
- Add explicit blocked-placement hints and onboarding guidance.
- Add duplicate, lock, and stronger delete/remove flows.
- Make the builder feel consistent and production-like.

Acceptance:
- decorating is comfortable on both desktop and touch-focused devices.

## Phase 4: Save Schema + Data Model Unification
### Status: Future
- Unify local sandbox room data with the eventual backend room data.
- Replace legacy backend type drift with the current registry/room model.
- Version the shared placement schema explicitly.
- Keep migration behavior safe for older local states.

Acceptance:
- local save and future backend save use one canonical room data model.

## Phase 5: Themes / Cosmetics / Progression
### Status: Future
- Add room themes and visual variants.
- Keep Minecraft-skin-compatible avatar import as a first-class feature.
- Add cosmetic progression only.
- Track unlocked furniture, variants, and themes.
- Keep economy, quests, and broad life-sim systems out of V1.

Acceptance:
- users can personalize the room meaningfully without introducing an economy-heavy design.

## Phase 6: Auth + Pairing + Shared Room Backend
### Status: Future
- Re-enable Google auth.
- Re-enable invite-code pairing.
- Map one couple to one shared room.
- Separate local dev sandbox mode from shared-room mode.
- Reconnect Firebase to the current room model, not the old legacy shape.

Acceptance:
- two users can pair and load one shared room based on the current canonical room schema.

## Phase 7: Live Sync + Partner Presence Beta
### Status: Future
- Sync confirmed furniture placement changes, rotations, and deletions.
- Add live partner avatar and presence state.
- Use simple conflict handling:
  - last confirmed placement wins
- Restore reconnect behavior and room restoration.

Acceptance:
- both players can see the same room and each other's presence reliably.

## Phase 8: V1 Polish + Release
### Status: Future
- Performance pass for desktop and lower-end web devices.
- Accessibility and usability pass.
- Better onboarding for both sandbox and shared-room flows.
- Error handling, reconnect safety, save integrity, and deployment checklist.
- Final QA on scale, collisions, input feel, and sync behavior.

Acceptance:
- the game is stable, understandable, responsive, and release-ready for a V1 scope centered on one polished shared room.

## Roadmap Defaults
- Final product remains a cozy couple room game.
- One polished shared room is the V1 home scope.
- Local solo sandbox remains the active development mode until the backend is reconnected cleanly.
- Every future system must preserve world scale and block-relative placement rules.
