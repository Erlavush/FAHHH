# Phase 11: Player Shell Inventory, Shop, and Pet Care Overhaul - Research

**Researched:** 2026-03-28
**Domain:** Player-shell drawer overhaul for inventory, shopping, and pet care
**Confidence:** HIGH

<user_constraints>
## User Constraints (from active planning state and request)

### Locked Decisions
- **D-01:** The next new phase must overhaul the inventory and shop UI so it fits the bottom HUD and digital cat clock.
- **D-02:** `Inventory`, `Shop`, and the pets caring system must be clearly separated.
- **D-03:** The warm bottom HUD and cat clock are the active player-shell visual source of truth.
- **D-04:** Shared-room foundations, authoring boundaries, and current room/pet domain rules must stay intact.
- **D-05:** The phase should solve the player-shell UX problem without bloating the persistent HUD.

### Deferred / Out of Scope
- Rewriting the room, economy, or cat-care domain rules.
- Turning Preview Studio or Mob Lab into player-facing room features.
- Expanding shared-room mode into a hosted multi-cat care system.
- Adding multiple new always-visible bottom-dock buttons unless execution proves one is necessary.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SHELL-01 | Player-facing inventory, shop, and pet-care surfaces use the same warm clock-themed visual language as the bottom HUD and digital cat clock while separating owned inventory, purchasing/adoption, and care flows into distinct views. | Use one drawer with explicit modes, section components, and HUD-aligned theme tokens rather than one mixed AMOLED panel. |

</phase_requirements>

## Summary

The current codebase already has the behavior needed for this phase, but not the shell architecture or visual language. `InventoryPanel.tsx` already owns the right actions for stored furniture, furniture buying, cat adoption, and cat care, yet it presents all of them inside one long mixed panel. That means the most valuable work is not new domain logic. It is a player-shell split and retheme.

The strongest implementation path is to keep one drawer entry point and add explicit internal modes. `AppPlayerView.tsx` already mounts the drawer through `drawer={catalogOpen ? inventoryPanelNode : null}` and `PlayerActionDock.tsx` already keeps the bottom HUD compact. That makes a single drawer with top-level `Inventory`, `Shop`, and `Pet Care` modes a better fit than adding multiple new dock buttons. The dock stays readable, while the drawer becomes properly organized.

The visual mismatch is concrete in the current CSS. `player-hud-dock.css` uses warm brown surfaces, cream labels, amber highlights, and heavy wood-toned shadows. `minecraft-clock.css` uses cream and amber display lighting over a themed clock frame. By contrast, `player-inventory-panel.css` still uses black/white gradients and stark white pills. Phase 11 should align the drawer to the HUD and clock palette by extending the shell theme with warm drawer-specific tokens rather than layering a third, unrelated style language on top.

The safest structural move is to split `InventoryPanel.tsx` into a small shell coordinator plus dedicated section components. `PlayerInventorySection` can own stored furniture and placement actions, `PlayerShopSection` can own furniture buying and cat adoption, and `PlayerPetCareSection` can own active/stored cat management. That keeps the callback surface stable while shrinking the mixed JSX footprint and making future UI polish safer.

The shared-room boundary must remain honest. The current drawer already branches on `petCatalogMode === "shared_room"`, and shared-room runtime still follows a single shared companion model. The new split drawer should preserve that truth. `Pet Care` may become a shared-companion info state there, but it must not expose the sandbox's local multi-cat care controls.

**Primary recommendation:** execute Phase 11 in three waves. First, add an explicit drawer mode contract through App and shell selectors. Second, split the current panel into dedicated section components and retheme the drawer to the warm HUD/clock palette. Third, wire care-specific entry points and shared-room-safe fallbacks, then run the full test suite and production build.

## Current UI Audit

### What the code already does well
- `InventoryPanel.tsx` already separates furniture inventory, furniture shop, cat shop, active cats, and stored cats at the data and callback layer.
- `shellViewModel.ts` already exposes cat-care counts and labels that can drive a dedicated `Pet Care` shortcut.
- `PlayerActionDock.tsx` already gives the player a stable single entry into the drawer without crowding the HUD.
- `PlayerCompanionCard.tsx` already has the right emotional/contextual location for care-needed nudges.

### What is fighting the desired result today
- One component is doing too much presentation work at once.
- The drawer theme still looks like an older AMOLED shell, not like the newer warm HUD and cat clock.
- Shop and care use nearly identical card treatment, which weakens the sense of purpose.
- There is no explicit drawer navigation contract, so the player has to scan the whole panel to understand where care ends and commerce begins.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React + TypeScript | current repo stack | Player-shell state and drawer component split | Already powers the room shell and current drawer path. |
| Existing custom CSS files | repo-local | Drawer retheme and mode styling | The repo already owns the shell styling and should not add a new UI framework here. |
| Existing app-shell selectors | repo-local | Drawer labels, status copy, and care-needed routing | `shellViewModel.ts` already centralizes player-shell text. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest + jsdom | declared in repo | Drawer mode and component regression tests | Use for new tab/section rendering coverage. |
| Existing player-shell theme files | repo-local | Shared warm palette and spacing rules | Extend instead of creating unrelated CSS islands. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| One drawer with explicit modes | Multiple new dock buttons | Clutters the bottom HUD and fights the compact shell goal. |
| Split section components | Keep one giant `InventoryPanel.tsx` | Harder to theme, reason about, and test. |
| Warm drawer tokens tied to HUD/clock palette | Keep or slightly tweak the AMOLED drawer | Does not satisfy the user's request for visual alignment. |
| Shared-room-safe info state for pet care | Pretend local multi-cat controls work in shared-room mode | Misrepresents the runtime boundary and invites regressions. |

## Architecture Patterns

### Pattern 1: One drawer, explicit mode contract
**What:** Introduce an app-level `PlayerDrawerMode = "inventory" | "shop" | "pet_care"` and keep the existing drawer mount point.
**When to use:** At the start of the phase.
**Why:** Separates purpose without adding HUD clutter.

**Recommendation:** Thread `playerDrawerMode` through `App.tsx`, `AppPlayerView.tsx`, and the drawer component so later UI work has a stable contract.

### Pattern 2: Split panel shell from section content
**What:** Turn `InventoryPanel.tsx` into a small coordinator and move content into dedicated section components.
**When to use:** Before the visual rewrite.
**Why:** Makes the mode split explicit and reduces future UI risk.

**Recommendation:** Create exact section components for `Inventory`, `Shop`, and `Pet Care` rather than keeping one mixed render tree.

### Pattern 3: Theme by token, not by scattered overrides
**What:** Add warm drawer-specific CSS variables aligned to the existing HUD and clock tones.
**When to use:** During the styling wave.
**Why:** Keeps the drawer visually consistent and easier to maintain.

**Recommendation:** Extend `player-shell-theme.css` or the drawer CSS with a small set of warm tokens rather than hard-coding one-off colors across every selector.

### Pattern 4: Route care urgency into the dedicated surface
**What:** When cats need care, give the player a shortcut into `Pet Care` rather than showing care actions all over the shell.
**When to use:** Final UX wiring.
**Why:** Keeps the drawer modes meaningful and prevents the companion card from turning into a control panel.

**Recommendation:** Use one secondary shortcut such as `Open Pet Care` from the companion shell or room details, not a second full dock button.

### Pattern 5: Keep shared-room pet care honest
**What:** Preserve the shared-room single-companion constraint in the split drawer.
**When to use:** During final wiring and tests.
**Why:** Shared-room runtime does not currently have the sandbox's local multi-cat care model.

**Recommendation:** Render an informational shared-companion state in `Pet Care` for shared-room mode instead of local roster controls.

## Runtime State Inventory

| Area | Current State | Required Phase 11 Action |
|------|---------------|--------------------------|
| `src/components/ui/InventoryPanel.tsx` | One mixed drawer surface owns inventory, shop, adoption, and care UI. | Split into a shell coordinator plus dedicated surface components. |
| `src/components/ui/player-inventory-panel.css` | Uses black/white AMOLED styling. | Replace with warm drawer tokens aligned to the HUD and clock. |
| `src/app/shellViewModel.ts` | Exposes cat-care counts and labels, but no drawer-mode contract. | Add drawer tab metadata and care-routing copy. |
| `src/App.tsx` / `src/app/components/AppPlayerView.tsx` | Open and close the drawer, but do not track a mode. | Add `playerDrawerMode` so the split surfaces are first-class. |
| `src/components/ui/PlayerActionDock.tsx` | Already provides one compact drawer entry point. | Keep it compact; use the same entry point rather than multiplying buttons. |
| `petCatalogMode === "shared_room"` path | Keeps shared-room pet flow on its own limited contract. | Preserve that boundary in the split drawer. |

## Common Pitfalls

### Pitfall 1: Solving the split with more HUD clutter
**What goes wrong:** The bottom dock becomes crowded with `Shop` and `Pet Care` buttons.
**How to avoid:** Keep one drawer entry and move the complexity into explicit drawer modes.

### Pitfall 2: Repainting the drawer without splitting the information architecture
**What goes wrong:** The drawer looks warmer but still feels confusing because all behaviors remain mixed.
**How to avoid:** Add mode switching and dedicated sections before or alongside the retheme.

### Pitfall 3: Breaking the shared-room boundary
**What goes wrong:** Shared-room mode incorrectly shows sandbox local multi-cat controls.
**How to avoid:** Treat shared-room `Pet Care` as a truthful shared-companion info surface unless runtime capabilities expand later.

### Pitfall 4: Letting authoring actions dominate the player shell
**What goes wrong:** `Open Studio` or `Open Mob Lab` become visible as primary player actions.
**How to avoid:** Keep authoring actions dev-only or quiet secondary affordances outside the shipped default path.

### Pitfall 5: Keeping the old drawer colors under new labels
**What goes wrong:** Tabs change, but the drawer still clashes with the warm HUD and clock.
**How to avoid:** Introduce explicit warm drawer theme tokens and reuse the HUD/clock palette intentionally.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shell split | Multiple new modal stacks or routes | Existing drawer mount in `AppPlayerView.tsx` | Lower risk and consistent with the current room shell. |
| Theme alignment | A second independent color system | Warm tokens derived from the bottom HUD and clock | Keeps the player shell coherent. |
| Shared-room pet care | Fake sandbox roster controls | Honest shared-companion fallback copy | Preserves runtime truth. |
| Component structure | One larger `InventoryPanel.tsx` | Section components plus a small coordinator | Easier to test and maintain. |

## Open Questions

1. **Should the drawer remember the last-open mode?**
   - Recommendation: optional. Defaulting to `Inventory` is acceptable if implementation complexity grows.

2. **Should `Shop` split furniture and cat adoption into sub-tabs?**
   - Recommendation: start with clear section headers inside one `Shop` surface, then add an internal filter only if the list becomes too noisy.

3. **Should there be a care shortcut outside the drawer?**
   - Recommendation: yes, but only one secondary shortcut such as `Open Pet Care` from the companion shell when care is needed.

## Sources

### Primary (HIGH confidence)
- `src/components/ui/InventoryPanel.tsx`
- `src/components/ui/player-inventory-panel.css`
- `src/components/ui/PlayerActionDock.tsx`
- `src/components/ui/player-hud-dock.css`
- `src/components/ui/MinecraftClock.tsx`
- `src/components/ui/minecraft-clock.css`
- `src/app/components/AppPlayerView.tsx`
- `src/app/shellViewModel.ts`
- `src/App.tsx`
- `src/app/hooks/useAppRoomActions.ts`
- `src/lib/catCare.ts`
- `src/lib/pets.ts`

### Secondary (MEDIUM confidence)
- `.planning/PROJECT.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/TESTING.md`
- `.planning/codebase/CONCERNS.md`
- `docs/AI_HANDOFF.md`
- `docs/CODEBASE_MAP.md`

## Metadata

**Confidence breakdown:**
- One drawer with explicit `Inventory` / `Shop` / `Pet Care` modes: HIGH
- Warm token-based retheme aligned to HUD and clock: HIGH
- Section component split over one giant panel: HIGH
- Shared-room safe pet-care fallback: HIGH
- Remembering the last-open drawer mode: MEDIUM

**Research date:** 2026-03-28
**Valid until:** 2026-03-29
