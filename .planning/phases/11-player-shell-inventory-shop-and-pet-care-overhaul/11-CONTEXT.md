# Phase 11: Player Shell Inventory, Shop, and Pet Care Overhaul - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning
**Source:** User-requested follow-up after the warm bottom HUD overhaul, digital cat clock rollout, and current player-drawer audit

<domain>
## Phase Boundary

Phase 11 builds directly on the shipped bottom HUD, digital cat clock, and the current local cat-care loop.
Its job is to turn the current mixed inventory drawer into a player-facing shell that clearly separates `Inventory`, `Shop`, and `Pet Care`, while making the drawer feel like the same family as the warm bottom HUD and cat clock.

Success boundary:
- The drawer no longer mixes owned furniture, cat adoption, active cat care, and stored-cat management into one long generic scroll surface.
- The player-facing commerce and care surfaces use the same warm framed wood, cream, and amber language as `PlayerActionDock` and `MinecraftClock`, not the current AMOLED black-and-white drawer treatment.
- `Inventory` stays focused on owned/stored furniture and placement-ready actions, `Shop` stays focused on buying/adoption, and `Pet Care` becomes the dedicated surface for active/stored cat management and feed/pet/play actions.
- Shared-room single-companion behavior, Preview Studio, and Mob Lab remain separate from this player-shell overhaul.

</domain>

<decisions>
## Implementation Decisions

### Locked Decisions
- **D-01:** This phase follows the user's explicit request to overhaul the inventory/shop UI so it perfectly fits the bottom UI and digital cat clock theme.
- **D-02:** Split the player-facing drawer into three explicit surfaces: `Inventory`, `Shop`, and `Pet Care`.
- **D-03:** `Inventory` is for owned/stored furniture and placement-ready actions. It is not the place for buying or active pet-care controls.
- **D-04:** `Shop` is for furniture purchases and cat adoption entries. It is not the place for active pet-care controls.
- **D-05:** `Pet Care` is a separate management surface for active cats, stored cats, care-needed status, and `feed` / `pet` / `play` / `store` / `activate` actions.
- **D-06:** Keep the bottom HUD compact. Prefer a single drawer entry point with clear internal mode switching over adding multiple new always-visible dock buttons by default.
- **D-07:** The bottom HUD and digital cat clock are the active player-shell visual source of truth: warm framed surfaces, amber and cream highlights, wood and brass tones, and restrained pixel-display accents.
- **D-08:** Preserve current runtime boundaries: `ownedFurniture` versus placed `furniture`, local cat roster and care state versus purchase/adoption catalog, shared-room single-companion behavior, and Preview Studio / Mob Lab authoring separation.
- **D-09:** Shared-room mode may keep its current single shared companion limit. This phase is a player-shell UI overhaul, not a shared pet-system expansion.
- **D-10:** Developer-only authoring actions such as `Open Studio` and `Open Mob Lab` remain dev-gated and must not become primary player-shell affordances.
- **D-11:** Mobile and desktop both matter. The split surfaces must still work inside the current drawer or sheet shell without hiding the room or overcrowding the HUD.

### the agent's Discretion
- Exact drawer navigation model (segmented tabs, plaque buttons, or a compact rail) as long as the three surfaces remain explicit.
- Whether the drawer remembers the last-open tab or always defaults to `Inventory`, as long as the default behavior stays predictable.
- Whether `Shop` keeps furniture and cat adoption in one surface with internal subsections or uses an additional internal filter, as long as it remains separate from `Inventory` and `Pet Care`.
- Exact player-facing copy for tabs, helper text, and empty states, as long as it stays cozy, non-technical, and aligned with the existing player shell.
- Whether care-needed shortcuts live in the companion card, room details sheet, or drawer header, as long as they route to the dedicated `Pet Care` surface.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope and planning truth
- `AGENTS.md`
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/TESTING.md`
- `.planning/codebase/CONCERNS.md`
- `docs/AI_HANDOFF.md`
- `docs/CODEBASE_MAP.md`
- `docs/ARCHITECTURE.md`

### Active player-shell and drawer seams
- `src/App.tsx`
- `src/app/components/AppPlayerView.tsx`
- `src/app/hooks/useAppShellCallbacks.ts`
- `src/app/shellViewModel.ts`
- `src/app/types.ts`
- `src/components/ui/InventoryPanel.tsx`
- `src/components/ui/player-inventory-panel.css`
- `src/components/ui/PlayerActionDock.tsx`
- `src/components/ui/player-hud-dock.css`
- `src/components/ui/MinecraftClock.tsx`
- `src/components/ui/minecraft-clock.css`
- `src/components/ui/player-shell-theme.css`
- `src/components/ui/player-shell-layout.css`
- `src/components/ui/PlayerCompanionCard.tsx`

### Gameplay and state boundaries this phase must preserve
- `src/app/hooks/useAppRoomActions.ts`
- `src/lib/catCare.ts`
- `src/lib/pets.ts`
- `src/lib/economy.ts`
- `src/lib/roomState.ts`
- `src/lib/devLocalState.ts`

### Verification anchors
- `tests/shellViewModel.test.ts`
- `tests/catCare.test.ts`
- `tests/pets.test.ts`
- `tests/devLocalState.test.ts`
- `tests/sharedRoomEntryShell.test.tsx`

</canonical_refs>

<code_context>
## Existing Code Insights

### What already helps this phase
- `InventoryPanel.tsx` already has the right behavioral callbacks for buying furniture, placing stored furniture, adopting cats, caring for cats, and moving cats between active and stored states.
- `shellViewModel.ts` already exposes cat-care counts and status copy that can route the player toward a dedicated `Pet Care` surface without inventing new domain state.
- `AppPlayerView.tsx` already renders the drawer as a single player-shell surface, so the phase can stay inside the current room shell rather than introducing a second modal stack.
- `PlayerActionDock.tsx` and `MinecraftClock.tsx` already define a warm, themed player-shell language that the drawer should follow.
- `petCatalogMode === "shared_room"` already keeps shared-room pet behavior on its own limited path, which makes the shared-room safety boundary explicit.

### What is missing today
- `InventoryPanel.tsx` mixes four responsibilities in one scroll surface: cat inventory/care, cat adoption, furniture inventory, and furniture shop.
- `player-inventory-panel.css` still uses dark neutral gradients, white pills, and a generic AMOLED drawer treatment that clashes with the warm bottom HUD and cat clock.
- The drawer has no explicit information architecture beyond section headings, so `Inventory`, `Shop`, and `Pet Care` are visually present but not clearly separated as player-shell modes.
- There is no direct player-shell shortcut into a dedicated `Pet Care` surface when cats need attention.

### Integration guidance
- Keep this phase on the player shell. Do not turn it into a domain rewrite or a new pet-system rules phase.
- Preserve existing callbacks and state boundaries; reorganize and restyle their presentation rather than re-inventing economy, room, or pet data structures.
- Use the existing inventory drawer seam as the main entry point so the bottom HUD stays readable and compact.
- Shared-room mode must stay honest: no fake local multi-cat care controls on the hosted single-companion path.

</code_context>

<specifics>
## Specific Ideas

- Use a framed drawer header with a warm wallet chip and three explicit top-level tabs: `Inventory`, `Shop`, and `Pet Care`.
- Move active and stored cat management into `Pet Care` so care-needed actions stop competing with buying furniture.
- Keep furniture inventory and `Place` / `Sell` actions together inside `Inventory` so the room-building path is faster to scan.
- Let `Shop` own both furniture purchases and cat adoption cards, with the option for internal subsections if the list gets long.
- Reuse the current warm HUD palette and clock highlights through CSS variables rather than bolting on a second unrelated theme.

</specifics>

<deferred>
## Deferred Ideas

- Adding extra persistent dock buttons for `Shop` or `Pet Care`.
- Shared-room multi-cat care or deeper hosted pet management.
- New cat-care rules, new economy rules, or new shop pricing rules.
- Folding Preview Studio or Mob Lab into the player shell.
- Broader shell redesign outside the inventory/shop/pet-care drawer scope.

</deferred>

---
*Phase: 11-player-shell-inventory-shop-and-pet-care-overhaul*
*Context gathered: 2026-03-28*
